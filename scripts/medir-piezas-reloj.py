#!/usr/bin/env python3
"""Agrega metadata de modelo y color al manifiesto de Suarez Watches.

`build-watch-assets.py` dejo cada .svg convertido a WebP con su geometria, pero
trata a cada archivo como una pieza suelta. En realidad los assets son pocos
modelos repetidos en varios colores: 147 agujas son 36 disenos en 4 acabados,
60 biseles son 8 disenos, 15 cajas son 5. Este script mide los WebP ya
generados y escribe en el manifiesto a que modelo pertenece cada pieza y de que
color es, para que la UI muestre una tarjeta por modelo con puntitos de color.

Mide ademas:
  - `luminancia` de los diales, que decide la tinta del logo y del fechador.
  - `asas` de las cajas, el ancho real entre las puntas de las asas, que es
    donde tiene que apoyar la correa.
  - `variante` de las barras: cada barra viene en version simple y doble; la
    doble es la que va a las 12.

La carpeta fuente `Suarez W/` ya no existe, asi que todo sale de los WebP
versionados. Es una herramienta local: se corre a mano y se commitea el
manifiesto resultante.

Requisitos: Pillow, numpy.

Uso:
    python3 scripts/medir-piezas-reloj.py [--no-sheets]
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
MANIFEST_PATH = ROOT / "js" / "data" / "relojes-manifest.json"
SHEET_DIR = ROOT / "temp" / "revision-relojes"

ALPHA_THRESHOLD = 40
# Un pixel cuenta para el color dominante solo si es bien opaco: los bordes
# antialiaseados arrastran el color del fondo y lavan la medicion.
OPAQUE_THRESHOLD = 200

# Modelos por categoria. Los tramos salen de la revision de los assets: la
# secuencia de colores dominantes se repite identica de tramo a tramo, que es
# la firma de "mismo diseno, otra pasada de color".
TRAMOS = {
    "caja": [(1, 3), (4, 6), (7, 9), (10, 12), (13, 15)],
    "bisel": [(16, 27), (28, 39), (40, 51), (52, 63), (64, 66), (67, 69), (70, 72), (73, 75)],
    "correa": [(76, 89), (90, 112)],
    "brazalete": [(113, 116), (117, 120), (121, 124)],
    # Solo los diales sin fechador: los que traen ventana se enganchan abajo al
    # dial gemelo que les corresponde.
    "dial": [(272, 277), (278, 278), (279, 283), (284, 288)],
}

# Los diales 289-306 son los mismos disenos pero con la ventana del fechador ya
# dibujada, en tres posiciones. No hay que dibujar ninguna ventana: alcanza con
# cambiar de asset. Cada bloque repite los mismos 5-6 disenos y el gemelo sin
# fecha se encuentra por parecido de imagen completa.
BLOQUES_FECHA = [(289, 294, "3"), (295, 300, "430"), (301, 306, "6")]
DIALES_SIN_FECHA = (272, 288)

# Los indices se agrupan por familia. Las barras son dos disenos distintos que
# el manifiesto original marco con la misma familia, asi que van por tramo.
TRAMOS_INDICE = [
    (152, 187, "arabigo"),
    (188, 193, "barra-solida"),
    (194, 229, "romano"),
    (230, 265, "indico"),
    (266, 271, "barra-marco"),
]

# Bloques de agujas por acabado. El primero es la referencia: cada aguja de los
# demas bloques se asigna al modelo cuya silueta coincide, en vez de asumir un
# paso fijo — el bloque rojo repite tres disenos y desalinea cualquier offset.
BLOQUE_AGUJA_REFERENCIA = (307, 342)
BLOQUES_AGUJA = [(343, 378), (379, 414), (415, 453)]

# Nombres por tono. Un promedio RGB contra una paleta fija falla feo: el verde
# oscuro del dial 275 cae mas cerca del negro que del verde. Se nombra por HSV,
# que separa primero cromatico de acromatico y recien despues el tono.
ACABADOS_METAL = {"oro": "Oro", "plata": "Plata", "gunmetal": "Gunmetal", "rojo": "Rojo"}

TONOS = [
    (15, "Rojo"),
    (38, "Naranja"),
    (52, "Amarillo"),
    (70, "Lima"),
    (150, "Verde"),
    (185, "Turquesa"),
    (205, "Celeste"),
    (250, "Azul"),
    (285, "Violeta"),
    (330, "Rosa"),
    (360, "Rojo"),
]


def abrir(pieza):
    return np.array(Image.open(ROOT / pieza["src"]).convert("RGBA")).astype(float)


def color_dominante(rgba, categoria=None):
    opaco = rgba[:, :, 3] > OPAQUE_THRESHOLD
    if not opaco.any():
        opaco = rgba[:, :, 3] > ALPHA_THRESHOLD
    if not opaco.any():
        return [0, 0, 0]

    if categoria == "caja":
        # Nueve de las quince cajas traen un bisel negro integrado que se come
        # el promedio: la caja 6 es dorada y da gris. Las asas de abajo son
        # metal puro, asi que el color de la caja se mide ahi.
        # El ultimo 10% queda en sombra y lava el tono; el ultimo 20% ya es
        # metal iluminado y sigue estando lejos del bisel.
        alto = rgba.shape[0]
        recorte = np.zeros_like(opaco)
        recorte[int(alto * 0.8):, :] = True
        if (opaco & recorte).any():
            opaco = opaco & recorte

    return [int(rgba[:, :, canal][opaco].mean()) for canal in range(3)]


def nombrar_color(rgb):
    maximo, minimo = max(rgb), min(rgb)
    valor = maximo / 255.0
    saturacion = 0.0 if maximo == 0 else (maximo - minimo) / maximo

    # Un gris oscuro casi siempre trae un resto de tinte que el tono amplifica:
    # el dial 288 es negro y da "turquesa" por tres puntos de diferencia entre
    # canales. Por debajo de medio tono, el poco croma que hay no es color.
    if saturacion < 0.05 or (saturacion < 0.12 and valor < 0.65):
        if valor < 0.22:
            return "Negro"
        if valor < 0.55:
            return "Gunmetal"
        if valor < 0.82:
            return "Plata"
        return "Blanco"

    rojo, verde, azul = (canal / 255.0 for canal in rgb)
    delta = maximo / 255.0 - minimo / 255.0
    if maximo == rgb[0]:
        tono = 60 * (((verde - azul) / delta) % 6)
    elif maximo == rgb[1]:
        tono = 60 * ((azul - rojo) / delta + 2)
    else:
        tono = 60 * ((rojo - verde) / delta + 4)

    nombre = next(etiqueta for limite, etiqueta in TONOS if tono <= limite)

    # Los metalicos son amarillos poco saturados; el resto de los tonos se
    # matiza por claridad para no repetir "Azul" cuatro veces en una fila.
    if nombre in ("Amarillo", "Naranja", "Lima") and saturacion < 0.55:
        if valor > 0.88 and saturacion < 0.16:
            return "Crema"
        return "Oro" if valor > 0.45 else "Bronce"
    if nombre == "Rojo" and valor > 0.8 and saturacion < 0.35:
        return "Rosa"
    if saturacion < 0.22:
        return f"{nombre} pálido"
    if nombre == "Naranja" and saturacion > 0.7 and valor < 0.72:
        return "Marrón"
    if valor < 0.35:
        return f"{nombre} oscuro"
    return nombre


def luminancia(rgb):
    return round(0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2], 1)


def silueta(rgba, lado=32):
    """Mascara alfa normalizada a un cuadrado, para comparar disenos entre si."""
    mask = (rgba[:, :, 3] > ALPHA_THRESHOLD).astype(np.uint8) * 255
    chica = Image.fromarray(mask).resize((lado, lado), Image.BILINEAR)
    return np.array(chica) > 127


def medir_asas(rgba):
    """Ancho entre las puntas de las asas, como fraccion del ancho de la caja.

    Es donde apoya la correa. Se mide un poco adentro de la punta porque la
    fila del extremo puede traer un solo pixel de antialias y dar casi cero.
    """
    mask = rgba[:, :, 3] > ALPHA_THRESHOLD
    alto, ancho = mask.shape
    filas = np.nonzero(mask.any(axis=1))[0]
    if not len(filas):
        return None

    adentro = max(2, int(alto * 0.02))

    def tramo(fila):
        xs = np.nonzero(mask[fila])[0]
        return (xs.max() - xs.min() + 1) / ancho if len(xs) else 0.0

    return {
        "anchoSuperior": round(tramo(filas[0] + adentro), 4),
        "anchoInferior": round(tramo(filas[-1] - adentro), 4),
    }


def variante_de_barra(rgba):
    """Una barra simple es un trazo; la doble son dos, y va a las 12."""
    mask = rgba[:, :, 3] > ALPHA_THRESHOLD
    fila = mask[mask.shape[0] // 2]
    tramos = 0
    previo = False
    for valor in fila:
        if valor and not previo:
            tramos += 1
        previo = valor
    return "doble" if tramos >= 2 else "simple"


def miniatura(pieza, lado=64):
    """Imagen chica compuesta sobre negro, con el alfa ya aplicado.

    Sirve para emparejar un dial con fechador contra su gemelo sin fechador:
    compara color y textura a la vez, que es lo unico que los distingue.
    """
    imagen = Image.open(ROOT / pieza["src"]).convert("RGBA").resize((lado, lado), Image.BILINEAR)
    datos = np.array(imagen).astype(float)
    return datos[:, :, :3] * (datos[:, :, 3:4] / 255.0)


def emparejar_fechadores(piezas):
    """Devuelve {id con fecha: (id sin fecha, posicion)} y los pares para revisar."""
    por_id = {pieza["id"]: pieza for pieza in piezas}
    desde, hasta = DIALES_SIN_FECHA
    sin_fecha = [por_id[i] for i in range(desde, hasta + 1) if i in por_id]
    minis = {pieza["id"]: miniatura(pieza) for pieza in sin_fecha}

    pares = {}
    reporte = []
    for desde, hasta, posicion in BLOQUES_FECHA:
        for asset_id in range(desde, hasta + 1):
            if asset_id not in por_id:
                continue
            propia = miniatura(por_id[asset_id])
            distancias = sorted(
                (float(np.abs(propia - minis[base["id"]]).mean()), base["id"])
                for base in sin_fecha
            )
            pares[asset_id] = (distancias[0][1], posicion)
            reporte.append((asset_id, distancias[0][1], posicion, round(distancias[0][0], 1), round(distancias[1][0], 1)))

    return pares, reporte


def modelo_por_tramos(categoria, asset_id):
    for indice, (desde, hasta) in enumerate(TRAMOS.get(categoria, [])):
        if desde <= asset_id <= hasta:
            return f"{categoria}-{indice + 1:02d}"
    return None


def modelo_de_indice(asset_id):
    for desde, hasta, nombre in TRAMOS_INDICE:
        if desde <= asset_id <= hasta:
            return f"indice-{nombre}"
    return None


def agrupar_agujas(piezas):
    """Asigna cada aguja al modelo cuya silueta coincide con la del bloque base.

    Las agujas son el caso mas grande (147 piezas) y el mas regular: los cuatro
    acabados dibujan exactamente el mismo diseno, asi que la mascara alfa los
    empareja sin ambiguedad.
    """
    por_id = {pieza["id"]: pieza for pieza in piezas}
    desde, hasta = BLOQUE_AGUJA_REFERENCIA
    referencia = [por_id[i] for i in range(desde, hasta + 1) if i in por_id]
    siluetas = {pieza["id"]: silueta(abrir(pieza)) for pieza in piezas if pieza["categoria"] == "aguja"}

    modelos = {}
    for indice, pieza in enumerate(referencia):
        modelos[pieza["id"]] = f"aguja-{indice + 1:02d}"

    sueltas = []
    for desde, hasta in BLOQUES_AGUJA:
        for asset_id in range(desde, hasta + 1):
            if asset_id not in por_id:
                continue
            propia = siluetas[asset_id]
            mejor = min(
                referencia,
                key=lambda base: float((propia != siluetas[base["id"]]).mean())
            )
            distancia = float((propia != siluetas[mejor["id"]]).mean())
            if distancia > 0.05:
                sueltas.append(asset_id)
                modelos[asset_id] = f"aguja-x{asset_id}"
            else:
                modelos[asset_id] = modelos[mejor["id"]]

    return modelos, sueltas


def hoja_de_contacto(categoria, grupos, destino, celda=110):
    """Una fila por modelo, una columna por color. Es lo que se mira para
    confirmar que los tramos estan bien cortados antes de commitear."""
    if not grupos:
        return
    columnas = max(len(piezas) for piezas in grupos.values())
    ancho = celda * columnas + 150
    alto = celda * len(grupos) + 30
    hoja = Image.new("RGB", (ancho, alto), (250, 248, 243))
    dibujo = ImageDraw.Draw(hoja)

    for fila, (modelo, piezas) in enumerate(sorted(grupos.items())):
        y = 25 + fila * celda
        dibujo.text((6, y + celda // 2), modelo, fill=(20, 20, 20))
        for columna, pieza in enumerate(piezas):
            imagen = Image.open(ROOT / pieza["src"]).convert("RGBA")
            imagen.thumbnail((celda - 12, celda - 12))
            x = 150 + columna * celda
            hoja.paste(imagen, (x, y), imagen)
            dibujo.text((x, y + celda - 12), str(pieza["id"]), fill=(90, 90, 90))

    dibujo.text((6, 6), f"{categoria}: {len(grupos)} modelos / {sum(len(v) for v in grupos.values())} piezas", fill=(20, 20, 20))
    hoja.save(destino)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--no-sheets", action="store_true", help="no generar hojas de contacto")
    args = parser.parse_args()

    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    piezas = manifest["piezas"]

    modelos_aguja, agujas_sueltas = agrupar_agujas(piezas)
    pares_fecha, reporte_fecha = emparejar_fechadores(piezas)
    por_id = {pieza["id"]: pieza for pieza in piezas}

    for pieza in piezas:
        categoria = pieza["categoria"]
        rgba = abrir(pieza)
        rgb = color_dominante(rgba, categoria)
        pieza["color"] = {"rgb": rgb, "nombre": nombrar_color(rgb)}

        # Agujas e indices vienen en cuatro acabados metalicos y nada mas. El
        # nombre sale de ahi: promediar el color de cada glifo daria etiquetas
        # distintas para el "1" y el "8" del mismo juego.
        if categoria in ("aguja", "indice"):
            pieza["color"]["nombre"] = ACABADOS_METAL.get(pieza["acabado"], pieza["acabado"])

        if categoria == "aguja":
            pieza["modelo"] = modelos_aguja.get(pieza["id"], f"aguja-x{pieza['id']}")
        elif categoria == "indice":
            pieza["modelo"] = modelo_de_indice(pieza["id"]) or f"indice-{pieza['id']}"
            if pieza["familia"] == "barra":
                pieza["variante"] = variante_de_barra(rgba)
        elif categoria == "dial" and pieza["id"] in pares_fecha:
            gemelo, posicion = pares_fecha[pieza["id"]]
            pieza["fecha"] = posicion
            pieza["gemelo"] = gemelo
        else:
            pieza["modelo"] = modelo_por_tramos(categoria, pieza["id"]) or f"{categoria}-{pieza['id']}"

        if categoria == "dial":
            pieza["luminancia"] = luminancia(rgb)
            pieza.setdefault("fecha", "no")
        if categoria == "caja":
            asas = medir_asas(rgba)
            if asas:
                pieza["asas"] = asas

    # Dos piezas del mismo modelo pueden caer en el mismo nombre de color (dos
    # negros, dos nacares). Se numeran para que la etiqueta siga identificando
    # una sola pieza; el puntito ya se pinta con el RGB medido, que si difiere.
    # Los diales con fechador quedan afuera: heredan el nombre de su gemelo.
    por_modelo = {}
    for pieza in piezas:
        # Los gemelos con fechador heredan el nombre; agujas e indices repiten
        # el acabado a proposito (los 12 glifos de un juego son un solo color).
        if "gemelo" in pieza or pieza["categoria"] in ("aguja", "indice"):
            continue
        por_modelo.setdefault(pieza["modelo"], []).append(pieza)

    for grupo in por_modelo.values():
        vistos = {}
        for pieza in grupo:
            nombre = pieza["color"]["nombre"]
            vistos[nombre] = vistos.get(nombre, 0) + 1
            if vistos[nombre] > 1:
                pieza["color"]["nombre"] = f"{nombre} {vistos[nombre]}"

    # Un dial con fechador es el mismo dial de su gemelo con la ventana ya
    # dibujada: comparte modelo y color, y la UI los ofrece como una sola opcion.
    for asset_id, (gemelo, _) in pares_fecha.items():
        pieza = por_id[asset_id]
        base = por_id[gemelo]
        pieza["modelo"] = base["modelo"]
        pieza["color"] = dict(base["color"])

    manifest["medidoPor"] = "scripts/medir-piezas-reloj.py"
    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    grupos_por_categoria = {}
    for pieza in piezas:
        grupos_por_categoria.setdefault(pieza["categoria"], {}).setdefault(pieza["modelo"], []).append(pieza)

    print(f"Manifiesto actualizado: {len(piezas)} piezas")
    for categoria in sorted(grupos_por_categoria):
        grupos = grupos_por_categoria[categoria]
        print(f"  {categoria:10s} {len(grupos):3d} modelos / {sum(len(v) for v in grupos.values()):3d} piezas")
    if agujas_sueltas:
        print(f"  agujas sin modelo de referencia: {agujas_sueltas}")

    print("Fechadores (dial con ventana -> gemelo sin ventana):")
    for asset_id, gemelo, posicion, distancia, segunda in reporte_fecha:
        holgura = "" if segunda - distancia > 1.0 else "  <-- revisar, el 2do candidato esta cerca"
        print(f"  {asset_id} -> {gemelo} @{posicion}  d={distancia} (2do {segunda}){holgura}")

    if not args.no_sheets:
        SHEET_DIR.mkdir(parents=True, exist_ok=True)
        for categoria, grupos in grupos_por_categoria.items():
            destino = SHEET_DIR / f"modelos-{categoria}.png"
            hoja_de_contacto(categoria, grupos, destino)
            print(f"  hoja: {destino.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
