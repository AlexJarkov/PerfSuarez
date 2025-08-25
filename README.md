# Catálogo HTML — Perfumería Suárez

README específico para el **módulo de Catálogo (HTML/CSS/JS)** del proyecto. Este catálogo es una **landing navegable** que lista perfumes completos, decants, combos y “Arma tu Combo / Arma tu Combo de Decants”, con **búsqueda, filtros y grilla responsive**. No requiere backend para funcionar en modo estático, y puede integrarse al sistema PHP/MySQL cuando sea necesario.

---

## ✨ Features
- **Grilla responsive** (cards) con imágenes, nombre, marca, ml, precio y badges (nuevo, oferta, agotado).
- **Búsqueda** por texto (nombre, marca, notas, etiquetas).
- **Filtros** por tipo (Perfume, Decant, Combo), marca, rango de precio, disponibilidad.
- **Ordenamiento** por precio, nombre, más vendidos (si se provee el dato).
- **Combos**: tarjetas especiales para “Combos Personalizados” y **“Arma tu Combo de Decants”**.
- **Lazy loading** de imágenes y soporte **WebP/AVIF** con fallback.
- **Accesible** (HTML semántico, labels, contraste, focus visible) y **SEO-ready** (microdatos Product).
- **Sin dependencias** obligatorias; funciona en HTML/CSS/JS puro. (Opcional: Tailwind, Alpine/Vanilla).

---

## 🗂️ Estructura sugerida
```
catalogo/
├─ index.html            # Catálogo principal
├─ assets/
│  ├─ css/
│  │  └─ catalogo.css    # Estilos propios
│  ├─ img/               # Imágenes en .webp + fallback .jpg/.png
│  └─ icons/             # SVG/ico
└─ js/
   ├─ catalogo.js        # Lógica de filtros, búsqueda, ordenamiento
   └─ data/
      └─ productos.json  # (Opcional) Fuente de datos en JSON
```

> También podés incrustar el catálogo como sección dentro de tu `index.php` del sitio principal.

---

## ▶️ Uso local
1. Colocá la carpeta `catalogo/` en tu servidor o abrí **`catalogo/index.html`** directamente en el navegador.
2. Si usás `productos.json`, levantá un server local (Live Server, `php -S localhost:8000`, etc.) para evitar restricciones CORS.

---

## 🧱 Estructura de una tarjeta de producto (HTML)
```html
<article class="card" data-tipo="decant" data-marca="Dior" data-precio="120" data-stock="true">
  <picture>
    <source srcset="assets/img/dior-homme-intense.webp" type="image/webp">
    <img src="assets/img/dior-homme-intense.jpg" alt="Dior Homme Intense 10 ml" loading="lazy">
  </picture>
  <header>
    <h3 class="nombre">Dior Homme Intense</h3>
    <span class="marca">Dior</span>
  </header>
  <p class="ml">10 ml</p>
  <p class="precio">120 Bs</p>
  <ul class="badges">
    <li class="badge nuevo">Nuevo</li>
    <li class="badge oferta">-10%</li>
  </ul>
  <footer>
    <button class="btn-add" aria-label="Agregar al combo">Agregar</button>
  </footer>
</article>
```

> Recomendado: usar `data-*` para que `catalogo.js` pueda filtrar/ordenar sin recalcular texto.

---

## 🔎 Barra de búsqueda y filtros
- **Búsqueda**: coincide con `nombre`, `marca`, `notas`, `etiquetas`.
- **Filtros**:
  - `tipo`: `perfume | decant | combo`
  - `marca`: lista dinámica según datos
  - `precio`: slider o min/max
  - `stock`: solo disponibles
- **Orden**: `precio ASC/DSC`, `nombre A–Z/Z–A`, `popularidad` (si hay campo `ventas`).

El `catalogo.js` debería:
1. Leer los controles (input/checkbox/select).
2. Filtrar la **colección en memoria**.
3. Re-pintar la grilla con resultados (con `DocumentFragment` para performance).

---

## 🧩 JSON de productos (opcional)
Si preferís datos desacoplados, usá `js/data/productos.json` con este esquema:

```json
[
  {
    "id": 101,
    "nombre": "Dior Homme Intense",
    "marca": "Dior",
    "tipo": "decant",
    "ml": 10,
    "precio": 120,
    "stock": true,
    "notas": ["iris", "lavanda", "ámbar"],
    "etiquetas": ["elegante", "nocturno"],
    "imagenes": {
      "webp": "assets/img/dhi-10.webp",
      "fallback": "assets/img/dhi-10.jpg"
    },
    "popularidad": 87
  }
]
```

> Campos mínimos: `id`, `nombre`, `marca`, `tipo`, `precio`, `stock`.  
> Campos útiles para filtros: `ml`, `notas`, `etiquetas`, `popularidad`.

---

## 🧠 Arma tu Combo / Arma tu Combo de Decants
- Usa una **lista temporal (estado)** en `catalogo.js` para ir acumulando productos.
- Mostrar **contador** de ítems seleccionados y **suma parcial**.
- Validar reglas de negocio (p. ej., set de 3 o de 5 decants).
- Exportar selección como:
  - **QueryString** (`?combo=101x2,205x1,310x1`)
  - **`localStorage`** para retomarlo en `ventas/index.php`
  - **Payload JSON** listo para enviar a un endpoint PHP.

---

## 🧩 Integración con el backend (PHP)
- Para sincronizar stock/precios en vivo, exponer endpoint(s) JSON:
  - `GET /api/productos` → listado con cache-control
  - `GET /api/productos?tipo=decant&marca=Dior`
  - `POST /api/combo` → recibe la selección y retorna resumen/precio final
- Capa de seguridad: sanitizar parámetros, **CSRF** en POST, y límites de tasa si se publica.

---

## ♿ Accesibilidad
- HTML semántico (`<main>`, `<section>`, `<article>`, `<header>`, `<footer>`).
- `alt` descriptivo en imágenes y `aria-label` en botones/iconos.
- Focus visible y **contraste AA**.
- Tamaño de toque mínimo **44×44 px** en móviles.

---

## 🔍 SEO y Open Graph
- `<title>` + `<meta name="description">` por categoría/página.
- **Microdatos** Schema.org `Product` en cada card (precio, disponibilidad).
- Metas **OG/Twitter** para buena vista previa al compartir.

---

## ⚡ Performance
- **Imágenes** en WebP/AVIF, `loading="lazy"` y tamaños adecuados.
- `preconnect`/`dns-prefetch` si hay CDNs.
- Minificar CSS/JS (puede ser manual o script simple de build).

---

## 🧪 Pruebas rápidas
- Probar búsqueda/filtros con **>200** ítems para medir fluidez.
- Test en Safari iOS (WebKit) y Chrome/Edge (Chromium) para asegurar **paridad visual**.

---

## 🔧 Personalización rápida
- Colores y tipografías en `:root { --color-... }` dentro de `catalogo.css`.
- Cards modulares: clases `badge`, `agotado`, `oferta`.
- Toggle de **grid/lista** si se desea (añadir botón y CSS alterno).

---

## 🚀 Deploy
- Estático: subir `catalogo/` al hosting (InfinityFree) o a `/public` del proyecto.
- Con backend: montar endpoints bajo `/api` y apuntar `catalogo.js` a la URL base.

