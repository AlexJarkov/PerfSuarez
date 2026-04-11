# PerfSuarez-Catalogo

Catálogo estático de Perfumería Suárez construido en HTML, CSS y JavaScript vanilla.

La versión actual ya no es una simple landing con una sola grilla. El proyecto funciona como una mini app estática con:

- shell principal tipo SPA en `index.html`
- navegación horizontal por paneles embebidos en `iframe`
- rutas amigables (`/perfumes`, `/decants`, `/armarcombo`, etc.)
- includes dinámicos para `header`, `footer` y dock de navegación
- búsqueda interna
- detalle de perfume
- carrito persistido en `localStorage`
- páginas promocionales como `Mystery Box`, `Velas` y `Contacto`

## Estado actual

- Stack: HTML + CSS + JS sin framework
- Build step: no existe
- Backend: no requerido para operar el catálogo
- Datos de producto: `js/data/perfumes-data.js`
- Persistencia local: `localStorage` y `sessionStorage`
- Producción: sitio estático con soporte a rutas shell

## Arquitectura

### 1. Shell principal

La entrada principal es [index.html](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/index.html). Esa página monta:

- `header.html` por include
- un `swipe-track` con paneles embebidos
- `catalog-nav.html` por include

Paneles principales:

- `catalogo.html`
- `perfumes.html`
- `decants.html`
- `armarcombo.html`
- `mysterybox.html`

Panel auxiliar:

- `search.html`
- `perfume.html`
- también se soportan `velas.html` y `contacto.html` como rutas auxiliares

La shell y el ruteo viven principalmente en:

- [js/core/app.js](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/js/core/app.js)
- [js/viewmodels/shell.viewmodel.js](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/js/viewmodels/shell.viewmodel.js)
- [js/views/shell.view.js](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/js/views/shell.view.js)
- [js/direct-access-guard.js](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/js/direct-access-guard.js)

### 2. Includes dinámicos

El header, footer y dock inferior no están hardcodeados en cada página. Se cargan con fetch desde:

- [js/include.js](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/js/include.js)
- [js/viewmodels/include.viewmodel.js](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/js/viewmodels/include.viewmodel.js)
- [js/views/include.view.js](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/js/views/include.view.js)

Esto además reescribe rutas relativas de `src`, `href` y `form[action]` para que funcionen tanto dentro de la shell como fuera de ella.

### 3. Navegación

Hay dos modos de navegación:

- dentro de la shell, usando `catalogShellNavigate`
- acceso directo a páginas HTML, que luego redirige a la shell en producción

El comportamiento está gobernado por:

- `window.DISABLE_SHELL_REDIRECT` en [js/runtime-config.js](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/js/runtime-config.js)
- [js/direct-access-guard.js](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/js/direct-access-guard.js)

En local (`localhost`, `127.0.0.1`, `0.0.0.0`) la shell redirect se desactiva automáticamente para facilitar desarrollo.

## Páginas principales

### Inicio

- archivo: [catalogo.html](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/catalogo.html)
- propósito: home del catálogo dentro de la shell
- contiene buscador principal y accesos rápidos a secciones

Lógica:

- [js/viewmodels/home.viewmodel.js](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/js/viewmodels/home.viewmodel.js)

### Perfumes

- archivo: [perfumes.html](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/perfumes.html)
- muestra catálogo de perfumes completos
- usa render dinámico desde el dataset

Lógica compartida:

- [js/viewmodels/catalog-renderer.js](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/js/viewmodels/catalog-renderer.js)
- [js/viewmodels/catalog.viewmodel.js](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/js/viewmodels/catalog.viewmodel.js)
- [js/models/catalog.model.js](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/js/models/catalog.model.js)

### Decants

- archivo: [decants.html](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/decants.html)
- similar a perfumes, pero usando imágenes y precios de decants

### Búsqueda

- archivo: [search.html](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/search.html)
- muestra resultados a partir del parámetro `?q=`
- soporta filtros por marca, género, estilo, stock y novedad

Lógica:

- [js/models/search.model.js](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/js/models/search.model.js)
- [js/viewmodels/search.viewmodel.js](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/js/viewmodels/search.viewmodel.js)
- [js/search.js](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/js/search.js)

### Detalle de perfume

- archivo: [perfume.html](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/perfume.html)
- usa `?id=` para resolver un perfume del dataset
- renderiza galería, notas, precios, tamaños y CTA de carrito / WhatsApp
- el botón de volver usa la ruta recordada por la shell, no `history.back()` del iframe

### Arma Tu Combo

- archivo: [armarcombo.html](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/armarcombo.html)
- permite construir:
  - combo de perfumes completos
  - set de decants
- calcula ahorro, total y CTA a WhatsApp
- puede añadir el combo armado al carrito

Lógica:

- [js/models/combo.model.js](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/js/models/combo.model.js)
- [js/views/combo.view.js](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/js/views/combo.view.js)
- [js/viewmodels/combo.viewmodel.js](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/js/viewmodels/combo.viewmodel.js)
- [js/armarcombo.js](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/js/armarcombo.js)

Nota:

- el builder actual usa `css/pages/armarcombo.css`
- `css/legacy/combo-builder.css` quedó como legado y no debe reintroducirse al bundle global salvo que se migre explícitamente

### Mystery Box

- archivo: [mysterybox.html](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/mysterybox.html)
- landing promocional con CTA directo y alta al carrito
- la selección randomizada se genera desde el modelo del carrito

### Velas y Contacto

- archivos:
  - [velas.html](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/velas.html)
  - [contacto.html](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/contacto.html)
- son vistas auxiliares fuera del set principal de paneles

## Header, búsqueda global y carrito

El header se define en [header.html](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/header.html) e incluye:

- navegación superior
- buscador global
- acceso al carrito
- CTA de asesoría

Lógica relevante:

- [js/viewmodels/common.viewmodel.js](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/js/viewmodels/common.viewmodel.js)
- [js/viewmodels/search.viewmodel.js](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/js/viewmodels/search.viewmodel.js)
- [js/scripts.js](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/js/scripts.js)

El carrito:

- persiste en `localStorage`
- comparte estado entre shell y páginas embebidas
- construye mensajes de WhatsApp
- soporta items de perfume, combo y mystery box

Storage actual:

- `perf-suarez-cart-v1`
- `perf-suarez-return-route`
- `spa-redirect`

## Estructura del proyecto

```text
PerfSuarez-Catalogo/
├── index.html
├── catalogo.html
├── perfumes.html
├── decants.html
├── armarcombo.html
├── mysterybox.html
├── search.html
├── perfume.html
├── velas.html
├── contacto.html
├── header.html
├── footer.html
├── catalog-nav.html
├── css/
│   ├── base/
│   ├── components/
│   ├── layout/
│   ├── legacy/
│   ├── pages/
│   └── styles.css
├── js/
│   ├── core/
│   ├── data/
│   ├── models/
│   ├── views/
│   ├── viewmodels/
│   └── *.js
├── imagenes/
├── manifest.json
├── robots.txt
├── sitemap.xml
└── 404.html
```

## CSS

Entrada principal:

- [css/styles.css](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/css/styles.css)

Capas:

- base: tokens, documento, tipografía
- layout: header y footer
- components: dock del catálogo
- pages: estilos específicos por vista
- legacy: utilidades y estilos heredados que todavía existen en repo

Archivos importantes:

- [css/base/document.css](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/css/base/document.css)
- [css/layout/header.css](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/css/layout/header.css)
- [css/pages/swipe-hub.css](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/css/pages/swipe-hub.css)
- [css/pages/catalog-home.css](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/css/pages/catalog-home.css)
- [css/pages/catalog-shared.css](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/css/pages/catalog-shared.css)
- [css/pages/armarcombo.css](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/css/pages/armarcombo.css)
- [css/pages/perfume-detail.css](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/css/pages/perfume-detail.css)

## JS

### Core

- [js/core/app.js](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/js/core/app.js)
  centraliza navegación, normalización de rutas, acceso a shell y helpers de WhatsApp

### Models

- `catalog.model.js`: filtros y metadata de cards
- `search.model.js`: búsqueda textual sobre dataset
- `combo.model.js`: armado de productos para combos

### Views / Viewmodels

- `shell.viewmodel.js`: navegación horizontal, history API, iframes, meta tags
- `common.viewmodel.js`: UI común, menú, estado de include, offset en embed
- `search.viewmodel.js`: dropdown de búsqueda del header y página de resultados
- `combo.viewmodel.js`: builder de combos
- `catalog.viewmodel.js`: filtros y paginación en grillas
- `catalog-renderer.js`: render inicial de cards desde `perfumes-data.js`

### Script transversal

- [js/scripts.js](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/js/scripts.js)
  contiene el modelo y la UI del carrito

## Dataset

El catálogo se alimenta desde:

- [js/data/perfumes-data.js](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/js/data/perfumes-data.js)

Ese archivo contiene:

- identificador del perfume
- nombre visible e interno
- marca
- tags
- imágenes de frasco y decant
- stock
- precios de completos
- precios de decants
- precios de combo cuando aplican
- notas olfativas

## Desarrollo local

Opciones simples:

1. abrir con Live Server en VS Code
2. usar un server estático
3. levantar `python3 -m http.server`
4. levantar `php -S localhost:8000`

Se recomienda usar servidor local en vez de abrir archivos con `file://` porque:

- hay includes por `fetch`
- hay reescritura de rutas
- hay assets y formularios internos

## Rutas y comportamiento en desarrollo

En local:

- puedes abrir `index.html` para probar la shell completa
- también puedes abrir páginas internas directamente sin redirección a `/`

En producción:

- páginas como `/perfumes.html` o `/armarcombo.html` redirigen a la shell principal
- el destino real se guarda en `sessionStorage` con `spa-redirect`

## Convenciones prácticas para tocar el repo

- mantener nuevas páginas dentro del patrón actual de `views` + `viewmodels` cuando aplique
- no mezclar CSS nuevo con CSS legacy si no es estrictamente necesario
- si una vista moderna ya tiene CSS propio en `css/pages/`, evitar redefinir sus selectores desde `css/legacy/`
- si agregas una nueva ruta shell, actualizar:
  - `js/core/app.js`
  - `js/direct-access-guard.js`
  - `js/viewmodels/shell.viewmodel.js`
  - metadatos SEO si corresponde

## Problemas recientes ya corregidos

Los fixes más recientes incorporados al repo incluyen:

- buscador web del header convertido a dropdown real
- eliminación del widget de búsqueda flotante permanente
- retorno correcto desde detalle de perfume al catálogo previo
- sincronización robusta del carrito entre shell e iframes
- limpieza del conflicto de scroll duplicado en `Arma Tu Combo` provocado por CSS legacy superpuesto

## Archivos que conviene revisar antes de cambios grandes

- [index.html](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/index.html)
- [header.html](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/header.html)
- [css/styles.css](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/css/styles.css)
- [js/core/app.js](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/js/core/app.js)
- [js/scripts.js](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/js/scripts.js)
- [js/viewmodels/shell.viewmodel.js](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/js/viewmodels/shell.viewmodel.js)
- [js/data/perfumes-data.js](/Users/alexjarkov/Documents/GitHub/PerfSuarez-Catalogo/js/data/perfumes-data.js)

## Git

Ramas que se han estado usando operativamente:

- `test`
- `master`

Si haces cambios que afecten shell, rutas, carrito o includes, conviene probar al menos:

- navegación entre paneles
- búsqueda global
- apertura de detalle
- volver al catálogo
- añadir al carrito desde perfume
- añadir combo
- añadir mystery box

