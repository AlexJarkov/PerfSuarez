# WEB-MEJORAS.md — Instrucciones de mejora para perfumeriasuarez.com

> **Destinatario:** Claude Code  
> **Fuente:** Revisión interna de UI/UX documentada en `Perfumeria.pdf`  
> **Fecha:** Marzo 2026  
> **Alcance:** Solo sección "Página web" del PDF (Instagram y TikTok excluidos de este archivo)  
> **Metodología:** Cada ítem incluye el problema observado, la ubicación en el código y la acción requerida. Prioridad marcada como 🔴 crítico / 🟡 importante / 🟢 mejora.

---

## CONTEXTO GENERAL

El sitio `perfumeriasuarez.com` es una SPA (Single Page Application). Las secciones principales son:
- **Inicio** (home con botones de acción rápida)
- **Perfumes** (catálogo con filtros)
- **Decants** (selector de decants)
- **Mystery Box** (landing de producto)
- **Combos y Sets**

Antes de modificar cualquier componente, ejecutar:
```bash
grep -r "carousel\|pagination-dots\|swiper-pagination" src/ --include="*.vue" --include="*.jsx" --include="*.tsx" --include="*.js"
```
para localizar el componente afectado por cada ítem.

---

## SECCIÓN 1 — HOME (Inicio)

### 1.1 — Puntos de paginación del carrusel sin función en desktop 🟡

**Problema observado:** En vista de escritorio, los puntos de paginación del carrusel de la sección hero/inicio aparecen visibles pero no tienen ninguna utilidad funcional ni estética justificada.

**En móvil:** No aparecen. Se ve bien.

**Acción requerida:**
```
Localizar el componente del carrusel principal (probablemente usa Swiper.js o un componente propio).
Si los puntos de paginación (pagination dots) no tienen función de navegación activa en desktop,
ocultarlos con CSS responsivo:

@media (min-width: 768px) {
  .swiper-pagination,
  [class*="pagination-dots"],
  [class*="carousel-dots"] {
    display: none !important;
  }
}

Si los puntos SÍ tienen función prevista (navegar entre slides), asegurarse de que sean
interactivos y visualmente coherentes con la identidad de marca. De lo contrario, eliminarlos
del markup en la vista desktop directamente desde el componente.
```

---

## SECCIÓN 2 — CATÁLOGO DE PERFUMES

### 2.1 — Grid de perfumes: demasiados productos en móvil 🟡

**Problema observado:** En móvil, la vista de catálogo muestra múltiples perfumes por fila, resultando visualmente saturada. La persona que revisó recomienda mostrar **un solo perfume destacado con su explicación** en móvil, o al menos reducir a 1 columna con tarjeta más amplia.

**En desktop:** Se ve bien con el grid actual. Se sugiere reducir a **3 perfumes por fila** (en lugar de 4) para dar más contexto visual a cada producto.

**Acción requerida:**
```
En el componente de grid de perfumes (probablemente PerfumeGrid.vue / ProductGrid o similar):

— Desktop (≥1024px): cambiar grid-template-columns a repeat(3, 1fr) si actualmente es 4.
— Tablet (768px–1023px): repeat(2, 1fr)
— Móvil (<768px): repeat(1, 1fr)

Adicionalmente, en móvil expandir la tarjeta de producto para incluir:
  - Imagen más grande
  - Nombre de perfume
  - Descripción breve (2-3 líneas) visible directamente en la tarjeta, sin necesidad de abrir detalle
  - Precio y botón de acción
```

### 2.2 — Descripciones de perfumes: falta información accesible para no-expertos 🟡

**Problema observado:** Las descripciones actuales asumen conocimiento previo de perfumería. Hay clientes que no conocen términos como "notas de apertura", "fougère", "oud", etc.

**Acción requerida:**
```
En el componente de tarjeta de perfume (ProductCard o PerfumeCard):

Añadir al menos los siguientes campos visibles sin necesidad de abrir el detalle:
  - Ocasión de uso (ej: "Ideal para noche / salidas formales")
  - Familia olfativa en lenguaje simple (ej: "Dulce y cálido", "Fresco y limpio")
  - Intensidad (ej: "Larga duración", "Ligero")

Si los datos ya existen en el backend, mapearlos al template.
Si no existen, añadir estos campos al modelo de producto y poblarlos desde el panel de administración.
```

---

## SECCIÓN 3 — MENÚ DE NAVEGACIÓN MÓVIL

### 3.1 — Menú hamburguesa: fondo transparente e ilegible en móvil 🔴

**Problema observado:** Al abrir el menú hamburguesa en móvil, el fondo es transparente, lo que hace que el texto del menú se superponga al contenido de la página y sea difícil de leer. Además, aparecen líneas de separación que aumentan la confusión visual.

**En desktop:** El menú es claro, bien organizado y fácil de acceder. No requiere cambios.

**Acción requerida:**
```
En el componente del menú móvil (MobileMenu, NavDrawer o similar):

1. Cambiar el fondo a opaco. Usar el color de fondo principal del sitio o un overlay sólido oscuro
   con opacidad ≥ 0.95. Ejemplo:
   background-color: rgba(255, 255, 255, 0.97); /* o el color de marca */
   backdrop-filter: blur(8px); /* opcional para efecto glass */

2. Eliminar las líneas decorativas que aparecen entre ítems si no aportan claridad.
   Si son bordes de separación, mantener solo un borde sutil (1px solid rgba(0,0,0,0.08)).

3. Asegurarse de que el z-index del menú sea suficientemente alto para cubrir todo el contenido:
   z-index: 9999;
```

### 3.2 — Menú móvil: no se cierra al seleccionar una opción 🔴

**Problema observado:** Cuando el usuario selecciona una opción del menú en móvil, el menú permanece abierto. El usuario no sabe si la navegación ocurrió o cómo cerrar el menú sin regresar.

**Acción requerida:**
```
En el componente del menú móvil, en cada ítem de navegación (NavItem, router-link, <a>):

Añadir un handler que cierre el menú al hacer click:

// Vue.js (ejemplo):
<router-link
  v-for="item in menuItems"
  :key="item.path"
  :to="item.path"
  @click="closeMenu"
>{{ item.label }}</router-link>

// donde closeMenu() cambia el estado del menú a cerrado:
const closeMenu = () => { isMenuOpen.value = false }

Si el estado del menú es global (Pinia/Vuex), hacer commit/dispatch del cierre desde el handler.
También añadir cierre al hacer click fuera del drawer (overlay click handler).
```

---

## SECCIÓN 4 — MYSTERY BOX

### 4.1 — Estructura narrativa de la página Mystery Box: orden incorrecto 🟡

**Problema observado:** La sección actual muestra el precio y "Envíos a todo Bolivia" antes de que el usuario entienda completamente qué es el producto. El flujo correcto es: emoción → comprensión → precio.

**Acción requerida:**
```
Reordenar los bloques de contenido en la página/componente MysteryBox en el siguiente orden:

1. Hero con título y descripción atractiva de qué es la Mystery Box
2. "CÓMO FUNCIONA" (pasos del proceso)
   — Incluir aquí la mención a "Envíos a todo Bolivia" como parte del paso de entrega
3. "VER QUÉ INCLUYE" → debe redirigir a una página/ruta separada con detalle completo
   (NO hacer scroll interno a la misma página)
4. Precio (al final, una vez el usuario ya está emocionado con la propuesta)

Eliminar el botón "Hablar con un asesor" de esta página específica. Ya existe en el resto del sitio
y su repetición genera fatiga visual. El CTA principal debe ser "Ver qué incluye" o "Quiero mi caja".
```

### 4.2 — "Ver qué incluye" debe navegar a página separada 🟡

**Problema observado:** El botón "Ver qué incluye" actualmente hace scroll hacia abajo en la misma página, lo que rompe la expectativa del usuario y no genera la sensación de "descubrir más".

**Acción requerida:**
```
Cambiar el comportamiento del botón/enlace "Ver qué incluye":

// Antes (scroll interno):
<a href="#mystery-incluye">Ver qué incluye</a>

// Después (navegación a ruta dedicada):
<router-link to="/mystery-box/detalle">Ver qué incluye</router-link>

Crear la ruta /mystery-box/detalle con un componente MysteryBoxDetalle.vue
que contenga la explicación completa del contenido, fotos de ejemplo, y testimonios.
```

---

## SECCIÓN 5 — FILTROS DEL CATÁLOGO

### 5.1 — Layout de filtros: disposición vertical ineficiente 🟡

**Problema observado:** Los filtros de búsqueda están dispuestos verticalmente en ambas vistas. En desktop podrían estar en una fila horizontal, y en móvil hay demasiado espacio entre cada filtro.

**Acción requerida:**
```
En el componente de filtros (PerfumeFilters, FilterBar o similar):

— Desktop: disponer los filtros en una sola fila horizontal con flex-wrap o grid:
  display: flex;
  flex-direction: row;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;

— Móvil: reducir margin/padding entre filtros. El gap entre cada elemento no debe superar 8px.
  Revisar si hay margin-bottom excesivo en los elementos individuales del filtro.
```

### 5.2 — Integrar "Buscar Perfumes" y "Categoría" en un solo bloque 🟢

**Problema observado:** El campo de texto "Buscar Perfumes" y el selector "Categoría" son elementos separados que ocupan espacio innecesario. Unificarlos mejoraría la organización.

**Acción requerida:**
```
Evaluar la posibilidad de implementar un campo de búsqueda combinado con selector de categoría
integrado (similar a campos de búsqueda con prefijo/sufijo de Select):

Ejemplo de estructura:
[ 🔍 Introduce nombre, nota o marca... ] [ Categoría ▼ ]

Ambos dentro de un contenedor con borde compartido o agrupados visualmente como una unidad.
Si la implementación es compleja, como mínimo alinearlos en la misma fila horizontal en desktop.
```

### 5.3 — Renombrar checkbox "Ocultar perfumes fuera de stock" 🟢

**Problema observado:** El texto es demasiado largo y describe la acción de forma negativa.

**Acción requerida:**
```
Cambiar el label del checkbox:

// Antes:
"Ocultar perfumes fuera de stock"

// Después:
"Solo perfumes en stock"

Buscar en el componente de filtros: grep -r "fuera de stock" src/
```

### 5.4 — Añadir filtros adicionales pertinentes a producto de lujo 🟡

**Problema observado:** Los filtros actuales son básicos (categoría, marca, stock, nuevos). Para un catálogo de perfumería de lujo faltan filtros clave.

**Acción requerida:**
```
Añadir los siguientes filtros al componente FilterBar y conectarlos con la lógica de filtrado:

1. Rango de precio (slider dual: Bs mín — Bs máx)
2. Más vendidos / Populares (sort option)
3. En tendencia (sort/flag option, si existe ese campo en el modelo)
4. Género: Hombre / Mujer / Unisex (filter chips o radio group)

Para el rango de precio, si no existe un componente de slider, instalar:
npm install @vueuse/components
o usar un <input type="range"> dual nativo con CSS customizado.

Asegurarse de que cada nuevo filtro actualice la query reactivamente sin recargar la página.
```

---

## SECCIÓN 6 — DECANTS

### 6.1 — Primera fila de perfumes cortada en vista desktop 🔴

**Problema observado:** En la vista de escritorio del selector de Decants, la primera fila de perfumes queda cortada visualmente (overflow o padding insuficiente en el contenedor superior).

**Acción requerida:**
```
En el componente de Decants (DecantSelector, DecantPage o similar):

1. Inspeccionar el contenedor padre de la grilla de perfumes:
   - Verificar si hay overflow: hidden en algún ancestro que esté recortando el contenido
   - Verificar si hay padding-top insuficiente entre el encabezado y la primera fila

2. Ajustar:
   .decant-perfumes-grid {
     padding-top: 16px; /* o el valor que elimine el corte */
     overflow: visible;
   }

3. Si el corte es causado por un sticky header, añadir scroll-margin-top al contenedor:
   scroll-margin-top: 80px; /* altura del header */
```

### 6.2 — Organización visual de los decants: cada uno como imagen separada 🟡

**Problema observado:** Cada opción de decant aparece como una imagen independiente sin contexto visual agrupado. Se ve fragmentado y poco profesional.

**Acción requerida:**
```
Rediseñar las tarjetas de decant para que tengan una presentación unificada:
- Fondo consistente por tarjeta (no imagen raw flotante)
- Nombre del perfume claramente visible
- Tamaño disponible (ml) y precio integrados en la tarjeta
- Un solo CTA por tarjeta, integrado visualmente (no botón azul genérico sobresaliente)

Considerar un layout tipo "product card" compacto con imagen centrada, información debajo
y botón de selección como overlay al hacer hover (desktop) o botón pequeño inline (móvil).
```

### 6.3 — Botón "Seleccionar" demasiado prominente 🟡

**Problema observado:** El botón azul "Seleccionar" ocupa demasiado espacio y rompe la estética de la página.

**Acción requerida:**
```
Opciones de implementación (elegir la más coherente con el diseño existente):

Opción A — Botón integrado en imagen (hover overlay):
  Al hacer hover sobre la tarjeta, mostrar un overlay con el botón de selección.
  En móvil (no hay hover), mostrar el botón pequeño debajo de la imagen.

Opción B — Botón secundario estilizado:
  Cambiar el estilo del botón de primary/filled a outlined o ghost:
  background: transparent;
  border: 1px solid #000; /* o color de marca */
  color: #000;
  font-size: 0.8rem;
  padding: 4px 12px;
```

### 6.4 — Añadir filtro de género en selector de Decants 🟢

**Problema observado:** No hay forma de filtrar decants por género (Hombre / Mujer / Ambos) antes de comenzar la selección.

**Acción requerida:**
```
Añadir un selector de género al inicio del flujo de Decants:

<div class="genero-selector">
  <button @click="setGenero('hombre')" :class="{active: genero === 'hombre'}">Hombre</button>
  <button @click="setGenero('mujer')" :class="{active: genero === 'mujer'}">Mujer</button>
  <button @click="setGenero('ambos')" :class="{active: genero === 'ambos'}">Ambos</button>
</div>

Filtrar la lista de perfumes disponibles para decant según el campo `gender` del modelo de producto.
```

### 6.5 — [EXTRA] Redirección a vista detallada al seleccionar perfume para decant 🟢

**Problema observado:** Al seleccionar un perfume para decant, el usuario no tiene suficiente contexto sobre el perfume elegido.

**Acción requerida:**
```
Al seleccionar un perfume en el flujo de Decants, antes de confirmar la selección,
mostrar un panel/modal/página con:
  - Imagen ampliada del perfume
  - Descripción completa
  - Notas olfativas en lenguaje simple
  - Sugerencia: "Combina bien con..." (máx. 2 perfumes relacionados)
  - Botón "Agregar a mi Decant" para confirmar

La sugerencia "Combina bien con" puede ser un campo estático por producto
o generado con lógica simple de familia olfativa compartida.
```

---

## NOTAS DE IMPLEMENTACIÓN PARA CLAUDE CODE

1. **No tocar la sección de Instagram ni TikTok** — esos cambios son responsabilidad del equipo de community management, no del frontend.

2. **Prioridad de ejecución recomendada:**
    - 🔴 Primero: 3.1, 3.2 (menú móvil), 6.1 (corte de primera fila)
    - 🟡 Segundo: 4.1, 4.2 (Mystery Box), 2.1, 5.4 (catálogo/filtros)
    - 🟢 Tercero: 2.2, 5.2, 5.3, 6.4, 6.5 (mejoras menores y extras)

3. **Antes de cada modificación**, localizar el componente exacto con:
   ```bash
   grep -r "[término clave]" src/ --include="*.vue" --include="*.jsx" --include="*.tsx" -l
   ```

4. **No hacer cambios de diseño en breakpoints existentes sin verificar** que no rompen otras secciones. Correr revisión visual en 375px, 768px y 1280px antes de commit.

5. **El PDF menciona mejoras de contenido** (descripciones más ricas, "combina con", etc.) que pueden requerir cambios en el modelo de datos además del frontend. Señalar al desarrollador backend los campos nuevos necesarios antes de implementar el template.