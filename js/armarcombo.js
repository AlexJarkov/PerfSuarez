document.addEventListener('DOMContentLoaded', () => {
    const comboTypeSelect = document.getElementById('combo-type');
    const decantQuantitySelect = document.getElementById('decant-quantity');
    const decantQuantityContainer = document.getElementById('decant-quantity-container');
    const comboItemsContainer = document.getElementById('combo-items');
    const whatsappLink = document.getElementById('whatsapp-link');

    const SKUS_PERMITIDOS = [
        "PERF-029", 
        "PERF-030", 
        "PERF-031", 
        "PERF-032", 
        "PERF-033", 
        "PERF-034", 
        "PERF-036", 
        "PERF-037", 
        "PERF-039", 
        "PERF-046", 
        "PERF-047", 
        "PERF-050", 
        "PERF-051", 
        "PERF-052", 
        "PERF-053", 
        "PERF-054", 
        "PERF-055", 
        "PERF-056", 
        "PERF-057", 
        "PERF-058", 
        "PERF-059", 
        "PERF-060", 
        "PERF-061", 
        "PERF-062", 
    ];
    
    const TAMANOS_PERMITIDOS = {
        "PERF-029": [100, 200], 
        "PERF-030": [100, 200], 
        "PERF-031": [100], 
        "PERF-032": [100],
        "PERF-033": [100],
        "PERF-034": [100], 
        "PERF-036": [100], 
        "PERF-037": [100],
        "PERF-039": [100],
        "PERF-046": [100, 150], 
        "PERF-047": [100, 150], 
        "PERF-050": [100], 
        "PERF-051": [100], 
        "PERF-052": [100], 
        "PERF-053": [100], 
        "PERF-054": [100], 
        "PERF-055": [100], 
        "PERF-056": [100], 
        "PERF-057": [100],
        "PERF-058": [100],
        "PERF-059": [100],
        "PERF-060": [100],
        "PERF-061": [105],
        "PERF-062": [105],
    };

    const PRECIOS_COMBOS = {
        "PERF-029-100": 91.00, 
        "PERF-029-200": 128.00, 
        "PERF-030-100": 103.00, 
        "PERF-030-200": 154.00, 
        "PERF-031-100": 121.00, 
        "PERF-032-100": 121.00, 
        "PERF-033-100": 96.00, 
        "PERF-034-100": 91.00, 
        "PERF-037-100": 93.00, 
        "PERF-037-100": 116.00, 
        "PERF-039-100": 121.00, 
        "PERF-046-100": 138.00, 
        "PERF-046-150": 203.00, 
        "PERF-047-100": 138.00, 
        "PERF-047-150": 203.00, 
        "PERF-050-100": 69.00, 
        "PERF-051-100": 67.00, 
        "PERF-052-100": 82.00, 
        "PERF-053-100": 82.00, 
        "PERF-054-100": 65.00, 
        "PERF-055-100": 73.00, 
        "PERF-056-100": 54.00, 
        "PERF-057-100": 73.00, 
        "PERF-058-100": 71.00,
        "PERF-059-100": 70.00,
        "PERF-060-100": 104.00, 
        "PERF-061-105": 73.00, 
        "PERF-062-105": 85.00, 
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
                    if (tipo === 'perfumes') {
                        const skuDiv = elemento.dataset.sku;
                        return tieneStock && SKUS_PERMITIDOS.includes(skuDiv);
                    }
                    return tieneStock;
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
                moneda: precio.moneda
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
            { nombre: 'Waka', imagen: 'imagenes/waka.webp' },
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
            const descuentos = {5:0, 6:2, 7:4, 8:6, 9:8, 10:10};
            descuentoExtra = descuentos[cantidadDecants] || 0;
        }
    
        document.querySelectorAll('.size-selector').forEach(selector => {
            if (selector.value) {
                const precioData = JSON.parse(selector.value);
                const producto = JSON.parse(selector.dataset.producto);
                
                if (producto.tipo === 'decants') {
                    const descuentoTotal = 10 + descuentoExtra;
                    const precioDescontado = precioData.precio * (1 - descuentoTotal/100);
                    
                    originalTotal += precioData.precio;
                    total += precioDescontado;
                    productosSeleccionados++;
                } else {
                    const precioCombo = PRECIOS_COMBOS[precioData.sku];
                    
                    if (precioCombo) {
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
    
        document.querySelectorAll('.combo-item').forEach((item, indice) => {
            const nombre = item.querySelector('[id$="-nombre"]')?.textContent;
            const selector = item.querySelector('.size-selector');
            
            if (nombre && selector && selector.value) {
                const precioData = JSON.parse(selector.value);
                const producto = JSON.parse(selector.dataset.producto);
                
                // Diferenciar entre perfumes y decants
                if (producto.tipo === 'perfumes') {
                    mensaje += `➤ ${nombre} (${precioData.tamaño}ml - ${producto.skuBase})\n`;
                } else {
                    mensaje += `➤ ${nombre} (${precioData.tamaño}ml)\n`;
                }
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