document.addEventListener('DOMContentLoaded', () => {
    const comboTypeSelect = document.getElementById('combo-type');
    const decantQuantitySelect = document.getElementById('decant-quantity');
    const decantQuantityContainer = document.getElementById('decant-quantity-container');
    const comboItemsContainer = document.getElementById('combo-items');
    const whatsappLink = document.getElementById('whatsapp-link');

    const MONEDA_LOCAL = 'Bs';
    const PRECIO_REGEX = /(\d+)ml.*?(\d+\.?\d*)Bs/i;
    const CSV_COMBOS_PATH = 'PRECIOS NUEVOS.csv';

    let productos = {
        perfumes: [],
        decants: []
    };
    let configuracionCombos = {};

    // Cargar productos inicialmente
    inicializarCombos();

    async function inicializarCombos() {
        try {
            await cargarConfiguracionCombos();
            await cargarProductos();
        } catch (error) {
            console.error('Error inicializando combos:', error);
        }
    }

    async function cargarProductos() {
        try {
            productos.perfumes = await obtenerProductos('perfumes');
            productos.decants = await obtenerProductos('decants');
            actualizarInterfaz();
        } catch (error) {
            console.error('Error cargando productos:', error);
        }
    }

    function obtenerDatosPrecio(parrafo) {
        if (!parrafo) {
            return null;
        }

        const texto = parrafo.textContent.replace(/\s+/g, '');
        const match = texto.match(PRECIO_REGEX);

        if (!match) {
            console.log('No se pudo leer el precio para:', texto);
            return null;
        }

        return {
            tamaño: parseInt(match[1], 10),
            precio: parseFloat(match[2]),
            moneda: MONEDA_LOCAL
        };
    }

    async function cargarConfiguracionCombos() {
        try {
            const respuesta = await fetch(CSV_COMBOS_PATH);
            const texto = await respuesta.text();
            configuracionCombos = parsearConfiguracionCombos(texto);
        } catch (error) {
            console.error('No se pudo cargar PRECIOS NUEVOS.csv:', error);
            configuracionCombos = {};
        }
    }

    function parsearConfiguracionCombos(contenido) {
        const resultado = {};
        if (!contenido) {
            return resultado;
        }

        // Normalizar saltos de linea para soportar CR, LF y CRLF
        const lineas = contenido.replace(/\r\n?/g, '\n').split('\n').filter(linea => linea.trim().length > 0);
        if (lineas.length === 0) {
            return resultado;
        }

        const encabezados = lineas.shift().replace(/^\ufeff/, '').split(';').map(encabezado => encabezado.trim());

        lineas.forEach(linea => {
            const valores = linea.split(';');
            const registro = {};
            encabezados.forEach((encabezado, indice) => {
                registro[encabezado] = (valores[indice] || '').trim();
            });

            const nombre = registro['Nombre'];
            if (!nombre) {
                return;
            }

            const entrada = resultado[nombre] || { tamanos: {}, precioPorDefecto: null };

            [1, 2].forEach(idx => {
                const aprobado = (registro[`Aprobado${idx}`] || '').toUpperCase() === 'APROBADO';
                const ml = registro[`ML${idx}`];
                const precioTexto = (registro[`Precio${idx}`] || '').replace(',', '.');
                if (!aprobado) {
                    return;
                }

                const precio = parseFloat(precioTexto);
                if (Number.isNaN(precio)) {
                    return;
                }

                if (ml) {
                    const tamano = parseInt(ml, 10);
                    if (!Number.isNaN(tamano)) {
                        entrada.tamanos[tamano] = precio;
                    }
                } else if (entrada.precioPorDefecto === null) {
                    entrada.precioPorDefecto = precio;
                }
            });

            if (Object.keys(entrada.tamanos).length > 0 || entrada.precioPorDefecto !== null) {
                resultado[nombre] = entrada;
            }
        });

        return resultado;
    }

    function obtenerPrecioCombo(nombre, tamano) {
        const entrada = configuracionCombos[nombre];
        if (!entrada) {
            return null;
        }

        if (typeof entrada.tamanos?.[tamano] === 'number') {
            return entrada.tamanos[tamano];
        }

        return typeof entrada.precioPorDefecto === 'number'
            ? entrada.precioPorDefecto
            : null;
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
                        const configPerfume = configuracionCombos[elemento.dataset.name];
                        if (!configPerfume) {
                            return false;
                        }
                    }

                    return true;
                })
                .map(elemento => {
                    const esPerfume = tipo === 'perfumes';
                    const skuBase = esPerfume ? elemento.dataset.sku : null;
                    const nombreProducto = elemento.dataset.name;

                    return {
                        skuBase: skuBase,
                        nombre: nombreProducto,
                        imagen: elemento.querySelector('img').src,
                        precios: Array.from(elemento.querySelectorAll('p'))
                            .map(p => {
                                const datosPrecio = obtenerDatosPrecio(p);
                                if (!datosPrecio) {
                                    return null;
                                }

                                const comboPrecio = esPerfume
                                    ? obtenerPrecioCombo(nombreProducto, datosPrecio.tamaño)
                                    : null;

                                if (esPerfume && typeof comboPrecio !== 'number') {
                                    return null;
                                }

                                return {
                                    sku: p.dataset.sku || 'DECANT',
                                    tamaño: datosPrecio.tamaño,
                                    precio: datosPrecio.precio,
                                    moneda: datosPrecio.moneda,
                                    comboPrecio: comboPrecio
                                };
                            })
                            .filter(Boolean)
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
                tamaño: precio.tamaño,
                comboPrecio: precio.comboPrecio ?? null
            });
            opcion.textContent = `${precio.tamaño}ml - ${precio.moneda} ${precio.precio}`;
            selector.appendChild(opcion);
        });

        // Almacenar datos base del producto
        selector.dataset.producto = JSON.stringify({
            nombre: producto.nombre,
            tipo: producto.tipo,
            skuBase: producto.skuBase
        });

        const container = document.createElement('div');
        container.className = 'size-selector-container';
        container.appendChild(selector);
        contenedor.querySelector('.combo-selection').appendChild(container);

        selector.addEventListener('change', actualizarTotal);
        actualizarTotal();
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
                    const precioCombo = precioData.comboPrecio;

                    if (typeof precioCombo === 'number') {
                        originalTotal += precioData.precio;
                        total += precioCombo;
                        productosSeleccionados++;
                    }
                }
            }
        });

        const ahorro = originalTotal - total;
        const moneda = MONEDA_LOCAL;

        document.getElementById('total-price').textContent = total.toFixed(2);
        document.getElementById('total-price-currency').textContent = moneda;
        document.getElementById('savings').textContent =
            `Estás ahorrando: ${moneda} ${ahorro.toFixed(2)}`;

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
        const moneda = MONEDA_LOCAL;
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
