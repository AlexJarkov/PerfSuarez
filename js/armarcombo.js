document.addEventListener('DOMContentLoaded', () => {
    const comboTypeSelect = document.getElementById('combo-type');
    const decantQuantitySelect = document.getElementById('decant-quantity');
    const decantQuantityContainer = document.getElementById('decant-quantity-container');
    const comboItemsContainer = document.getElementById('combo-items');
    const whatsappLink = document.getElementById('whatsapp-link');

    const SKUS_PERMITIDOS = [
        "PERF-019",
        "PERF-094",
        "PERF-029",
        "PERF-052",
        "PERF-053",
        "PERF-076",
        "PERF-061",
        "PERF-062",
        "PERF-051",
        "PERF-075",
        "PERF-050",
        "PERF-022",
        "PERF-104",
        "PERF-101",
        "PERF-100",
        "PERF-065",
        "PERF-018",
        "PERF-017",
        "PERF-096",
        "PERF-045",
        "PERF-037",
        "PERF-039"
    ];

    const NOMBRES_PERMITIDOS = {
        "PERF-045": ["Kenzo Homme Intense"],
        "PERF-050": ["Lattafa Asad"]
    };

    const TAMANOS_PERMITIDOS = {
        "PERF-019": [125],
        "PERF-094": [125],
        "PERF-029": [100],
        "PERF-052": [100],
        "PERF-076": [100],
        "PERF-051": [100],
        "PERF-075": [100],
        "PERF-050": [100],
        "PERF-022": [100],
        "PERF-104": [100],
        "PERF-101": [100],
        "PERF-100": [100],
        "PERF-065": [100],
        "PERF-018": [100],
        "PERF-017": [100],
        "PERF-096": [110],
        "PERF-045": [110],
        "PERF-037": [100],
        "PERF-039": [100, 200]
    };

    const PRECIOS_COMBOS = {
        "PERF-019-125": 200.00,
        "PERF-094-125": 187.00,
        "PERF-029-100": 113.00,
        "PERF-052-100": 81.00,
        "PERF-076-100": 88.00,
        "PERF-051-100": 79.00,
        "PERF-075-100": 81.00,
        "PERF-050-100": 81.00,
        "PERF-022-100": 159.00,
        "PERF-104-110": 184.00,
        "PERF-101-100": 106.00,
        "PERF-100-100": 105.00,
        "PERF-065-100": 91.00,
        "PERF-018-100": 167.00,
        "PERF-017-100": 161.00,
        "PERF-096-110": 130.00,
        "PERF-045-110": 127.00,
        "PERF-037-100": 149.00,
        "PERF-039-100": 140.00,
    };

    let productos = {
        perfumes: [],
        decants: []
    };

    // Cargar productos inicialmente
    cargarProductos();

    async function cargarProductos() {
        try {
            productos.perfumes = await obtenerProductos('perfumes');
            productos.decants = await obtenerProductos('decants');
            actualizarInterfaz();
        } catch (error) {
            console.error('Error cargando productos:', error);
        }
    }

    async function obtenerProductos(tipo) {
        const archivo = `${tipo}.html`;
        try {
            const respuesta = await fetch(archivo);
            const texto = await respuesta.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(texto, 'text/html');

            return Array.from(doc.querySelectorAll('.decant'))
                .filter(elemento => {
                    const tieneStock = !elemento.querySelector('.etiquetas .fuera-de-stock');
                    if (!tieneStock) {
                        return false;
                    }

                    if (tipo === 'perfumes') {
                        const skuDiv = elemento.dataset.sku;
                        if (!SKUS_PERMITIDOS.includes(skuDiv)) {
                            return false;
                        }

                        const nombresPermitidos = NOMBRES_PERMITIDOS[skuDiv];
                        if (nombresPermitidos && !nombresPermitidos.includes(elemento.dataset.name)) {
                            return false;
                        }
                    }

                    return true;
                })
                .map(elemento => {
                    const esPerfume = tipo === 'perfumes';
                    const skuBase = esPerfume ? elemento.dataset.sku : null;

                    return {
                        skuBase: skuBase,
                        nombre: elemento.dataset.name,
                        imagen: elemento.querySelector('img').src,
                        precios: Array.from(elemento.querySelectorAll('p'))
                            .filter(p => {
                                // Limpiar texto y usar nueva regex
                                const texto = p.textContent.replace(/\s|<[^>]+>/g, '');
                                const match = texto.match(/(\d+)ml.*?(\d+\.?\d*)(Bs|\$)/i);

                                if (!match) {
                                    console.log('No match para:', texto);
                                    return false;
                                }

                                const tamaño = parseInt(match[1]);
                                return esPerfume
                                    ? TAMANOS_PERMITIDOS[skuBase]?.includes(tamaño)
                                    : true;
                            })
                            .map(p => {
                                const texto = p.textContent.replace(/\s|<[^>]+>/g, '');
                                const match = texto.match(/(\d+)ml.*?(\d+\.?\d*)(Bs|\$)/i);

                                return {
                                    sku: p.dataset.sku || 'DECANT',
                                    tamaño: parseInt(match[1]),
                                    precio: parseFloat(match[2]),
                                    moneda: match[3].toUpperCase()
                                };
                            })
                            .sort((a, b) => a.tamaño - b.tamaño),
                        tipo: tipo
                    };
                })
                .filter(producto => producto.precios.length > 0);
        } catch (error) {
            console.error(`Error cargando ${archivo}:`, error);
            return [];
        }
    }

    function manejarCambioTipo() {
        const tipo = comboTypeSelect.value;
        decantQuantityContainer.classList.toggle('hidden', tipo !== 'decants');
        actualizarInterfaz();
    }

    function actualizarInterfaz() {
        comboItemsContainer.querySelectorAll('.combo-item').forEach(item => {
            // Agregar efecto fade-out a items anteriores
            item.classList.add('fade-out');
            setTimeout(() => item.remove(), 400);
        });
        comboItemsContainer.innerHTML = '';
        const tipo = comboTypeSelect.value;
        const cantidad = tipo === 'decants'
            ? parseInt(decantQuantitySelect.value)
            : 3;

        for (let i = 0; i < cantidad; i++) {
            comboItemsContainer.appendChild(crearItemCombo(tipo, i));
        }

        if (tipo === 'perfumes') {
            comboItemsContainer.appendChild(crearSelectorRegalo());
        }

        manejarRedimension();
    }

    function crearItemCombo(tipo, indice) {
        const item = document.createElement('div');
        item.className = 'combo-item';
        item.innerHTML = `
            <div class="combo-selection">
                <img src="imagenes/image.webp" alt="${tipo}" id="${tipo}-imagen-${indice}">
                <h3>${tipo === 'perfumes' ? 'Perfume' : 'Decant'} ${indice + 1}</h3>
                <p id="${tipo}-nombre-${indice}"></p>
                <button class="dropdown-toggle">Seleccionar</button>
                <div class="dropdown" id="${tipo}-dropdown-${indice}"></div>
                <!-- Contenedor para el selector de tamaños -->
                <div class="size-selector-container" id="${tipo}-size-${indice}"></div>
            </div>
        `;

        const dropdown = item.querySelector('.dropdown');
        poblarDropdown(tipo, indice, dropdown);
        configurarEventosDropdown(item);
        return item;
    }

    async function poblarDropdown(tipo, indice, dropdown) {
        try {
            const productosFiltrados = tipo === 'perfumes'
                ? productos.perfumes
                : productos.decants;

            dropdown.innerHTML = productosFiltrados.map((producto, index) => `
        <div class="dropdown-item-combo" data-index="${index}">
            <img src="${producto.imagen}" alt="${producto.nombre}" class="dropdown-product-image">
            <div class="dropdown-product-info">
                <p class="dropdown-product-name">${producto.nombre}</p>
            </div>
        </div>
    `).join('');

            dropdown.querySelectorAll('.dropdown-item-combo').forEach(item => {
                item.addEventListener('click', (e) => {
                    const index = item.dataset.index;
                    const producto = productosFiltrados[index];
                    const comboItem = item.closest('.combo-item');

                    seleccionarProducto(tipo, indice, producto, comboItem);
                    dropdown.classList.remove('show');
                });
            });

        } catch (error) {
            console.error('Error poblando dropdown:', error);
            dropdown.innerHTML = '<div class="dropdown-error">Error cargando productos</div>';
        }
    }

    function crearSelectorTamanos(producto) {
        const contenedor = document.createElement('div');
        contenedor.className = 'size-selector-container';

        const selector = document.createElement('select');
        selector.className = 'size-selector';

        // Obtener tamaños permitidos para este SKU base
        const tamanosPermitidos = TAMANOS_PERMITIDOS[producto.skuBase] || [];

        producto.precios.forEach(precio => {
            // Verificar si el tamaño está permitido
            if (tamanosPermitidos.includes(precio.tamaño)) {
                const opcion = document.createElement('option');
                opcion.value = JSON.stringify({
                    sku: precio.sku,
                    precio: precio.precio,
                    tamaño: precio.tamaño,
                    moneda: precio.moneda
                });
                opcion.textContent = `${precio.tamaño}ml - ${precio.moneda}${precio.precio}`;
                selector.appendChild(opcion);
            }
        });

        // Manejar caso donde no hay tamaños válidos
        if (selector.options.length === 0) {
            const opcion = document.createElement('option');
            opcion.textContent = 'No disponible';
            opcion.disabled = true;
            selector.appendChild(opcion);
        }

        // Almacenar datos base del producto
        selector.dataset.producto = JSON.stringify({
            nombre: producto.nombre,
            skuBase: producto.skuBase,
            tipo: producto.tipo
        });

        contenedor.appendChild(selector);
        return contenedor;
    }

    function seleccionarProducto(tipo, indice, producto, contenedor) {
        contenedor.classList.add('selected');
        setTimeout(() => contenedor.classList.remove('selected'), 600);
        contenedor.querySelector(`#${tipo}-nombre-${indice}`).textContent = producto.nombre;
        contenedor.querySelector(`#${tipo}-imagen-${indice}`).src = producto.imagen;

        // Limpiar selectores anteriores
        contenedor.querySelector('.size-selector-container')?.remove();

        // Crear selector de tamaños
        const selector = document.createElement('select');
        selector.className = 'size-selector';

        producto.precios.forEach(precio => {
            const opcion = document.createElement('option');
            opcion.value = JSON.stringify({
                sku: precio.sku,
                precio: precio.precio,
                moneda: precio.moneda,
                tamaño: precio.tamaño
            });
            opcion.textContent = `${precio.tamaño}ml - ${precio.moneda}${precio.precio}`;
            selector.appendChild(opcion);
        });

        // Almacenar datos base del producto
        selector.dataset.producto = JSON.stringify({
            nombre: producto.nombre,
            tipo: producto.tipo,
            baseSKU: producto.baseSKU
        });

        const container = document.createElement('div');
        container.className = 'size-selector-container';
        container.appendChild(selector);
        contenedor.querySelector('.combo-selection').appendChild(container);

        selector.addEventListener('change', actualizarTotal);
        actualizarTotal();
    }


    function crearSelectorRegalo() {
        const regalos = [
            { nombre: 'Desodorante Khamrah', imagen: 'imagenes/fotos-catalogo/arabes/DESODORANTE KHAMRAH.jpg' },
            { nombre: 'Desodorante Yara', imagen: 'imagenes/fotos-catalogo/arabes/DESODORANTE YARA.webp' },
            { nombre: 'Vela aromática', imagen: 'imagenes/vela.jpg' }
        ];

        const item = document.createElement('div');
        item.className = 'combo-item';
        item.innerHTML = `
            <div class="combo-selection">
                <img src="imagenes/gift.jpg" alt="Regalo" id="regalo-imagen">
                <h3>Regalo</h3>
                <p id="regalo-nombre"></p>
                <button class="dropdown-toggle">Seleccionar Regalo</button>
                <div class="dropdown" id="regalo-dropdown"></div>
            </div>
        `;

        const dropdown = item.querySelector('.dropdown');
        regalos.forEach(regalo => {
            const elementoRegalo = document.createElement('div');
            elementoRegalo.className = 'dropdown-item';
            elementoRegalo.innerHTML = `
                <img src="${regalo.imagen}" alt="${regalo.nombre}">
                <p>${regalo.nombre}</p>
            `;
            elementoRegalo.onclick = () => {
                item.querySelector('#regalo-nombre').textContent = regalo.nombre;
                item.querySelector('#regalo-imagen').src = regalo.imagen;
            };
            dropdown.appendChild(elementoRegalo);
        });

        configurarEventosDropdown(item);
        return item;
    }

    function configurarEventosDropdown(contenedor) {
        const boton = contenedor.querySelector('.dropdown-toggle');
        const dropdown = contenedor.querySelector('.dropdown');

        boton.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
            cerrarOtrosDropdowns(dropdown);
        });
    }

    function cerrarOtrosDropdowns(actual) {
        document.querySelectorAll('.dropdown').forEach(d => {
            if (d !== actual) d.classList.remove('show');
        });
    }

    function actualizarTotal() {
        let total = 0;
        let originalTotal = 0;
        let productosSeleccionados = 0;
        const tipoCombo = comboTypeSelect.value;
        const esDecants = tipoCombo === 'decants';
        const cantidadDecants = esDecants ? parseInt(decantQuantitySelect.value) : 0;

        let descuentoExtra = 0;
        if (esDecants) {
            const descuentos = { 5: 0, 6: 2, 7: 4, 8: 6, 9: 8, 10: 10 };
            descuentoExtra = descuentos[cantidadDecants] || 0;
        }

        document.querySelectorAll('.size-selector').forEach(selector => {
            if (selector.value) {
                const precioData = JSON.parse(selector.value);
                const producto = JSON.parse(selector.dataset.producto);

                if (producto.tipo === 'decants') {
                    const descuentoTotal = 10 + descuentoExtra;
                    const precioDescontado = precioData.precio * (1 - descuentoTotal / 100);

                    originalTotal += precioData.precio;
                    total += precioDescontado;
                    productosSeleccionados++;
                } else {
                    const precioCombo = PRECIOS_COMBOS[precioData.sku];

                    if (typeof precioCombo === 'number') {
                        originalTotal += precioData.precio;
                        total += precioCombo;
                        productosSeleccionados++;
                    }
                }
            }
        });

        const ahorro = originalTotal - total;
        const moneda = esDecants ? 'Bs' : '$';

        document.getElementById('total-price').textContent = total.toFixed(2);
        document.getElementById('total-price-currency').textContent = moneda;
        document.getElementById('savings').textContent =
            `Estás ahorrando: ${moneda}${ahorro.toFixed(2)}`;

        actualizarBotonWhatsApp(productosSeleccionados);
        actualizarEnlaceWhatsApp(total, esDecants);
    }


    function actualizarBotonWhatsApp(seleccionados) {
        const requeridos = comboTypeSelect.value === 'decants'
            ? parseInt(decantQuantitySelect.value)
            : 3;

        whatsappLink.classList.toggle('disabled', seleccionados < requeridos);
    }

    function actualizarEnlaceWhatsApp(total, esDecants) {
        const moneda = esDecants ? 'Bs' : '$';
        let mensaje = `¡Hola! Quiero armar mi combo de ${esDecants ? 'decants' : 'perfumes'}:\n\n`;

        document.querySelectorAll('.combo-item').forEach((item) => {
            const nombreElement = item.querySelector('[id^="perfumes-nombre"], [id^="decants-nombre"]');
            const nombre = nombreElement?.textContent;
            const selector = item.querySelector('.size-selector');

            if (nombre && selector && selector.value) {
                const precioData = JSON.parse(selector.value);
                const producto = JSON.parse(selector.dataset.producto || '{}');

                // Obtener tamaño del selector (corregido)
                const tamaño = precioData.tamaño || precioData.tamano; // Usar alias si es necesario

                let linea = `➤ ${nombre} (${tamaño}ml`;
                if (producto.tipo === 'perfumes' && producto.skuBase) {
                    linea += ` - ${producto.skuBase}`;
                }
                mensaje += linea + ')\n';
            }
        });

        mensaje += `\nTotal: ${moneda} ${total.toFixed(2)}`;
        whatsappLink.href = `https://wa.me/78064327?text=${encodeURIComponent(mensaje)}`;
    }

    function manejarRedimension() {
        comboItemsContainer.style.gridTemplateColumns = window.innerWidth < 768
            ? '1fr'
            : 'repeat(auto-fill, minmax(250px, 1fr))';
    }

    // Event Listeners
    comboTypeSelect.addEventListener('change', manejarCambioTipo);
    decantQuantitySelect.addEventListener('change', actualizarInterfaz);
    window.addEventListener('resize', manejarRedimension);
    document.addEventListener('click', cerrarOtrosDropdowns.bind(null, null));

    // Inicialización
    manejarRedimension();
});
