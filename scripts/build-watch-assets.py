#!/usr/bin/env python3
"""Convierte los assets fuente de Suarez Watches a WebP + manifiesto de geometria.

La carpeta fuente (`Suarez W/`) trae 453 archivos .svg que en realidad son PNG
en base64 envueltos en SVG, con un canvas de 1440x810 y las piezas colocadas en
posiciones inconsistentes entre si. Este script:

  1. Rasteriza cada .svg con `rsvg-convert` a 1440px de ancho.
  2. Mide la geometria real de la pieza (bbox alfa, apertura interior, pivote,
     componentes conexos) para que la UI pueda normalizarla.
  3. Recorta al bbox y exporta WebP (dos ordenes de magnitud mas liviano).
  4. Emite `js/data/relojes-manifest.json` y hojas de contacto de revision.

Es una herramienta local de una sola pasada: la carpeta fuente esta en
.gitignore y solo se versionan los WebP y el manifiesto.

Requisitos: rsvg-convert (MacPorts/Homebrew), Pillow, numpy, scipy.

Uso:
    python3 scripts/build-watch-assets.py [--only 1-15] [--jobs 8] [--no-sheets]
"""

from __future__ import annotations

import argparse
import json
import math
import shutil
import subprocess
import sys
import tempfile
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = ROOT / "Suarez W"
OUTPUT_DIR = ROOT / "imagenes" / "relojes"
MANIFEST_PATH = ROOT / "js" / "data" / "relojes-manifest.json"
SHEET_DIR = ROOT / "temp" / "revision-relojes"

RENDER_WIDTH = 1440
ALPHA_THRESHOLD = 40
WEBP_QUALITY = 88
# Un componente conexo menor a esto es ruido de compresion, no una pieza.
MIN_COMPONENT_AREA = 3000
# Las agujas mas angostas que esto son segunderos; el resto son horas/minutos.
THIN_HAND_MAX_WIDTH = 96

# Rangos de IDs -> categoria y familia. Derivado de la revision visual de las
# 453 imagenes; ver la tabla de inventario en el plan.
RANGES = [
    (1, 15, "caja", "caja"),
    (16, 75, "bisel", "bisel"),
    (76, 89, "correa", "cuero-liso"),
    (90, 112, "correa", "cuero-textura"),
    (113, 124, "brazalete", "metal"),
    (125, 144, "broche", "desplegable"),
    (145, 148, "broche", "hebilla"),
    (149, 151, "corona", "corona"),
    (152, 163, "indice", "arabigo"),
    (164, 175, "indice", "arabigo"),
    (176, 187, "indice", "arabigo"),
    (188, 193, "indice", "barra"),
    (194, 205, "indice", "romano"),
    (206, 217, "indice", "romano"),
    (218, 229, "indice", "romano"),
    (230, 241, "indice", "indico"),
    (242, 253, "indice", "indico"),
    (254, 265, "indice", "indico"),
    (266, 271, "indice", "barra"),
    (272, 306, "dial", "dial"),
    (307, 342, "aguja", "aguja"),
    (343, 378, "aguja", "aguja"),
    (379, 414, "aguja", "aguja"),
    (415, 453, "aguja", "aguja"),
]

# Las piezas circulares se anclan por su apertura interior; las agujas por el
# anillo del pivote. El resto se ancla por el bbox.
APERTURE_CATEGORIES = {"caja", "bisel"}
PIVOT_CATEGORIES = {"aguja"}
COMPONENT_CATEGORIES = {"correa"}


def classify(asset_id: int) -> tuple[str, str, int]:
    """Devuelve (categoria, familia, indice dentro del rango) para un id."""
    for start, end, category, family in RANGES:
        if start <= asset_id <= end:
            return category, family, asset_id - start
    return "desconocido", "desconocido", 0


def render_svg(svg_path: Path, png_path: Path) -> bool:
    """Rasteriza un .svg. Devuelve False si el archivo esta corrupto."""
    result = subprocess.run(
        ["rsvg-convert", "-w", str(RENDER_WIDTH), str(svg_path), "-o", str(png_path)],
        capture_output=True,
    )
    return result.returncode == 0 and png_path.exists()


def alpha_mask(image: Image.Image) -> np.ndarray:
    return np.array(image)[:, :, 3] > ALPHA_THRESHOLD


def interior_holes(mask: np.ndarray) -> list[dict]:
    """Regiones transparentes encerradas por la pieza, de mayor a menor.

    Se descartan las que tocan el borde del canvas porque esas son el fondo.
    """
    labels, count = ndimage.label(~mask)
    if count == 0:
        return []

    on_border = set(labels[0, :]) | set(labels[-1, :]) | set(labels[:, 0]) | set(labels[:, -1])
    holes = []
    for index in range(1, count + 1):
        if index in on_border:
            continue
        ys, xs = np.nonzero(labels == index)
        area = int(len(xs))
        if area < 50:
            continue
        holes.append(
            {
                "cx": round(float(xs.mean()), 2),
                "cy": round(float(ys.mean()), 2),
                "r": round(math.sqrt(area / math.pi), 2),
                "area": area,
            }
        )

    holes.sort(key=lambda hole: hole["area"], reverse=True)
    return holes


def connected_components(mask: np.ndarray) -> list[dict]:
    """Partes separadas de la pieza, ordenadas de izquierda a derecha.

    Las correas texturizadas vienen como dos tiras lado a lado (la mitad corta
    va arriba de la caja y la larga abajo), asi que la UI necesita saber donde
    empieza y termina cada una.
    """
    closed = ndimage.binary_closing(mask, np.ones((9, 9)))
    labels, count = ndimage.label(closed)
    components = []
    for index in range(1, count + 1):
        ys, xs = np.nonzero(labels == index)
        if len(xs) < MIN_COMPONENT_AREA:
            continue
        components.append(
            {
                "x0": int(xs.min()),
                "y0": int(ys.min()),
                "x1": int(xs.max()),
                "y1": int(ys.max()),
                "area": int(len(xs)),
            }
        )

    components.sort(key=lambda component: component["x0"])
    return components


def mean_rgb(image: Image.Image, mask: np.ndarray) -> list[int]:
    pixels = np.array(image).astype(float)[:, :, :3][mask]
    if pixels.size == 0:
        return [0, 0, 0]
    return [int(round(value)) for value in pixels.mean(axis=0)]


def finish_from_rgb(rgb: list[int]) -> str:
    """Etiqueta el acabado metalico a partir del color promedio.

    Las agujas y los indices vienen en familias de acabado (oro, plata,
    gunmetal, rojo) que no estan declaradas en ningun lado, solo en el pixel.
    """
    red, green, blue = rgb
    brightness = (red + green + blue) / 3
    if red > green * 1.45 and red > blue * 1.6:
        return "rojo"
    if red > blue * 1.25 and green > blue * 1.1:
        return "oro"
    if brightness < 130:
        return "gunmetal"
    return "plata"


def process_asset(asset_id: int) -> dict:
    svg_path = SOURCE_DIR / f"{asset_id}.svg"
    category, family, _ = classify(asset_id)

    with tempfile.TemporaryDirectory() as tmp:
        png_path = Path(tmp) / f"{asset_id}.png"
        if not render_svg(svg_path, png_path):
            return {"id": asset_id, "error": "render", "categoria": category}

        image = Image.open(png_path).convert("RGBA")
        mask = alpha_mask(image)

    if not mask.any():
        return {"id": asset_id, "error": "vacio", "categoria": category}

    ys, xs = np.nonzero(mask)
    x0, y0, x1, y1 = int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())
    width, height = x1 - x0 + 1, y1 - y0 + 1

    entry = {
        "id": asset_id,
        "categoria": category,
        "familia": family,
        "src": f"imagenes/relojes/{category}/{asset_id:03d}.webp",
        "w": width,
        "h": height,
        "acabado": finish_from_rgb(mean_rgb(image, mask)),
    }

    # Todas las coordenadas del manifiesto son relativas al recorte, porque eso
    # es lo que la UI carga como <img>.
    if category in APERTURE_CATEGORIES:
        holes = interior_holes(mask)
        if holes:
            entry["apertura"] = {
                "cx": round(holes[0]["cx"] - x0, 2),
                "cy": round(holes[0]["cy"] - y0, 2),
                "r": holes[0]["r"],
            }
        else:
            entry["warning"] = "sin-apertura"

    if category == "caja" and "apertura" in entry:
        # Radio del cuerpo circular medido hacia la izquierda desde el centro de
        # la apertura, a esa misma altura: es donde apoya el bisel. Se mide por
        # la izquierda porque la corona sobresale por la derecha.
        row = mask[int(round(holes[0]["cy"]))]
        entry["radioAsiento"] = round(float(holes[0]["cx"] - np.nonzero(row)[0].min()), 2)

    if category in PIVOT_CATEGORIES:
        # El pivote es el anillo del extremo inferior, no cualquier hueco: las
        # agujas tienen brillos y calados que tambien quedan encerrados.
        holes = [hole for hole in interior_holes(mask) if hole["cy"] > y0 + height * 0.6]
        if holes:
            pivot = max(holes, key=lambda hole: hole["area"])
            entry["pivote"] = {
                "cx": round(pivot["cx"] - x0, 2),
                "cy": round(pivot["cy"] - y0, 2),
                "r": pivot["r"],
            }
        else:
            # Sin anillo visible el pivote cae en la base de la pieza.
            entry["pivote"] = {"cx": round(width / 2, 2), "cy": round(height - 4, 2), "r": 4}
            entry["warning"] = "pivote-estimado"
        entry["slot"] = "segundero" if width <= THIN_HAND_MAX_WIDTH else "principal"
        entry["largo"] = round(entry["pivote"]["cy"], 2)

    if category == "dial":
        entry["radio"] = round((width + height) / 4, 2)

    output_path = OUTPUT_DIR / category / f"{asset_id:03d}.webp"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    image.crop((x0, y0, x1 + 1, y1 + 1)).save(
        output_path, "WEBP", quality=WEBP_QUALITY, method=6
    )
    entry["bytes"] = output_path.stat().st_size

    if category in COMPONENT_CATEGORIES:
        # Las correas texturizadas vienen como dos tiras lado a lado dentro de
        # una misma imagen. Se exportan separadas para que la UI las pueda
        # colocar arriba y abajo de la caja sin recortes en el cliente.
        components = connected_components(mask)
        parts = []
        if len(components) > 1:
            ordered = sorted(components, key=lambda item: item["y1"] - item["y0"])
            for role, component in zip(("superior", "inferior"), ordered):
                part_path = OUTPUT_DIR / category / f"{asset_id:03d}-{role[:3]}.webp"
                crop = image.crop(
                    (component["x0"], component["y0"], component["x1"] + 1, component["y1"] + 1)
                )
                crop.save(part_path, "WEBP", quality=WEBP_QUALITY, method=6)
                parts.append(
                    {
                        "rol": role,
                        "src": f"imagenes/relojes/{category}/{asset_id:03d}-{role[:3]}.webp",
                        "w": crop.width,
                        "h": crop.height,
                    }
                )
                entry["bytes"] += part_path.stat().st_size
        else:
            # Una sola tira: la UI la dibuja dos veces, la de arriba invertida.
            parts.append({"rol": "unica", "src": entry["src"], "w": width, "h": height})
        entry["partes"] = parts

    return entry


def build_review_sheets(entries: list[dict]) -> None:
    """Hojas de contacto por categoria para revisar los limites de grupo a ojo."""
    SHEET_DIR.mkdir(parents=True, exist_ok=True)
    by_category: dict[str, list[dict]] = {}
    for entry in entries:
        by_category.setdefault(entry["categoria"], []).append(entry)

    cell, columns = 190, 8
    for category, group in sorted(by_category.items()):
        group.sort(key=lambda entry: entry["id"])
        rows = (len(group) + columns - 1) // columns
        sheet = Image.new("RGB", (columns * cell, rows * cell), (255, 255, 255))
        for position, entry in enumerate(group):
            piece = Image.open(ROOT / entry["src"]).convert("RGBA")
            piece.thumbnail((cell - 10, cell - 26), Image.LANCZOS)

            tile = Image.new("RGBA", (cell, cell), (238, 238, 238, 255))
            draw = ImageDraw.Draw(tile)
            for x in range(0, cell, 13):
                for y in range(0, cell, 13):
                    if (x // 13 + y // 13) % 2:
                        draw.rectangle([x, y, x + 12, y + 12], fill=(208, 208, 208, 255))
            tile.alpha_composite(piece, ((cell - piece.width) // 2, 18 + (cell - 26 - piece.height) // 2))
            draw.rectangle([0, 0, cell - 1, cell - 1], outline=(90, 90, 90, 255))
            draw.rectangle([0, 0, cell - 1, 15], fill=(25, 25, 25, 255))
            draw.text((5, 3), f"#{entry['id']} {entry['familia']} {entry['acabado']}", fill=(255, 255, 255, 255))
            sheet.paste(tile, ((position % columns) * cell, (position // columns) * cell))

        sheet.save(SHEET_DIR / f"{category}.png")

    print(f"  hojas de revision -> {SHEET_DIR.relative_to(ROOT)}/")


def parse_range(value: str) -> list[int]:
    if "-" in value:
        start, end = value.split("-", 1)
        return list(range(int(start), int(end) + 1))
    return [int(value)]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--only", help="Procesar solo un id o rango, p.ej. 1-15")
    parser.add_argument("--jobs", type=int, default=8, help="Procesos en paralelo")
    parser.add_argument("--no-sheets", action="store_true", help="Omitir hojas de revision")
    args = parser.parse_args()

    if not SOURCE_DIR.is_dir():
        print(f"No existe la carpeta fuente: {SOURCE_DIR}", file=sys.stderr)
        return 1
    if shutil.which("rsvg-convert") is None:
        print("Falta rsvg-convert (port install librsvg / brew install librsvg)", file=sys.stderr)
        return 1

    if args.only:
        asset_ids = parse_range(args.only)
    else:
        asset_ids = sorted(int(path.stem) for path in SOURCE_DIR.glob("*.svg"))

    print(f"Procesando {len(asset_ids)} assets con {args.jobs} procesos...")
    with ProcessPoolExecutor(max_workers=args.jobs) as pool:
        results = list(pool.map(process_asset, asset_ids))

    entries = [entry for entry in results if "error" not in entry]
    failed = [entry for entry in results if "error" in entry]
    warned = [entry for entry in entries if "warning" in entry]

    omitidas = [{"id": entry["id"], "motivo": entry["error"]} for entry in failed]

    if args.only and MANIFEST_PATH.exists():
        # Una corrida parcial actualiza el manifiesto existente en vez de
        # reemplazarlo: si no, se perderian todas las piezas no procesadas.
        previo = json.loads(MANIFEST_PATH.read_text())
        procesados = set(asset_ids)
        entries = [p for p in previo.get("piezas", []) if p["id"] not in procesados] + entries
        omitidas = [o for o in previo.get("omitidas", []) if o["id"] not in procesados] + omitidas
        omitidas.sort(key=lambda item: item["id"])

    entries.sort(key=lambda entry: entry["id"])
    manifest = {
        "generadoPor": "scripts/build-watch-assets.py",
        "anchoRender": RENDER_WIDTH,
        "piezas": entries,
        "omitidas": omitidas,
    }
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")

    total_bytes = sum(entry["bytes"] for entry in entries)
    print(f"\n  {len(entries)} piezas exportadas -> {OUTPUT_DIR.relative_to(ROOT)}/")
    print(f"  {total_bytes / 1024 / 1024:.1f} MB en total")
    print(f"  manifiesto -> {MANIFEST_PATH.relative_to(ROOT)}")

    by_category: dict[str, int] = {}
    for entry in entries:
        by_category[entry["categoria"]] = by_category.get(entry["categoria"], 0) + 1
    print("\n  por categoria: " + ", ".join(f"{name} {count}" for name, count in sorted(by_category.items())))

    if warned:
        print(f"\n  {len(warned)} con geometria estimada:")
        for entry in warned:
            print(f"    #{entry['id']} ({entry['categoria']}) {entry['warning']}")

    if failed:
        print(f"\n  {len(failed)} omitidas por archivo corrupto:")
        for entry in failed:
            print(f"    #{entry['id']} ({entry['categoria']}) {entry['error']}")

    if not args.no_sheets:
        build_review_sheets(entries)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
