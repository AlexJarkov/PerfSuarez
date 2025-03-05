document.addEventListener('DOMContentLoaded', () => {
    const comboTypeSelect = document.getElementById('combo-type');
    const decantQuantitySelect = document.getElementById('decant-quantity');
    const decantQuantityContainer = document.getElementById('decant-quantity-container');
    const comboItemsContainer = document.getElementById('combo-items');
    const whatsappLink = document.getElementById('whatsapp-link');
    
    // Configuración de seguridad
    const CRYPTO_KEY = 'TuClaveSuperSecreta'; // ¡CAMBIAR ESTO!
    const costosCifrados = {
        "PERF-001": "7a57416a6f6d",
        "PERF-002": "7a58416a6f6d",
        "PERF-003": "7a59416a6f6d"
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
            
            return Array.from(doc.querySelectorAll('.producto')).map(elemento => ({
                sku: elemento.dataset.sku,
                nombre: elemento.dataset.nombre,
                imagen: elemento.querySelector('img').src,
                precios: Array.from(elemento.querySelectorAll('p'))
                    .filter(p => p.textContent.match(/(\d+)\s*ml\s*-\s*([\d.]+)/))
                    .map(p => {
                        const match = p.textContent.match(/(\d+)\s*ml\s*-\s*([\d.]+)/);
                        return {
                            tamaño: parseInt(match[1]),
                            precio: parseFloat(match[2])
                        };
                    }).sort((a, b) => a.tamaño - b.tamaño),
                etiquetas: elemento.dataset.etiquetas || ''
            }));
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
                ? await obtenerPerfumesFiltrados() 
                : productos.decants;

            dropdown.innerHTML = productosFiltrados.map(producto => `
                <div class="dropdown-item-combo" data-sku="${producto.sku}">
                    <img src="${producto.imagen}" alt="${producto.nombre}" class="dropdown-product-image">
                    <div class="dropdown-product-info">
                        <p class="dropdown-product-name">${producto.nombre}</p>
                        <p class="dropdown-product-prices">
                            ${producto.precios.map(p => `${p.tamaño}ml - ${tipo === 'decants' ? 'Bs' : '$'}${p.precio}`).join(' • ')}
                        </p>
                    </div>
                </div>
            `).join('');

            dropdown.querySelectorAll('.dropdown-item-combo').forEach(item => {
                item.addEventListener('click', (e) => {
                    const sku = item.dataset.sku;
                    const producto = productosFiltrados.find(p => p.sku === sku);
                    seleccionarProducto(tipo, indice, producto, item.closest('.combo-item'));
                });
            });

        } catch (error) {
            console.error('Error poblando dropdown:', error);
            dropdown.innerHTML = '<div class="dropdown-error">Error cargando productos</div>';
        }
    }

    async function obtenerPerfumesFiltrados() {
        return (await productos.perfumes).filter(producto => {
            const cifrado = costosCifrados[producto.sku];
            if (!cifrado) return false;
            
            const costo = descifrarCosto(cifrado);
            if (!costo) return false;
            
            const precioMinimo = (costo + 50) * 1.354;
            return producto.precios[0].precio > precioMinimo;
        });
    }

    function descifrarCosto(cifrado) {
        try {
            const textoCifrado = atob(cifrado);
            return parseFloat(
                textoCifrado.split('')
                    .map((char, i) => 
                        String.fromCharCode(char.charCodeAt(0) ^ 
                        CRYPTO_KEY.charCodeAt(i % CRYPTO_KEY.length))
                    ).join('')
            );
        } catch (error) {
            console.error('Error descifrando:', error);
            return null;
        }
    }

    function seleccionarProducto(tipo, indice, producto, contenedor) {
        contenedor.querySelector(`#${tipo}-nombre-${indice}`).textContent = producto.nombre;
        contenedor.querySelector(`#${tipo}-imagen-${indice}`).src = producto.imagen;

        const selectorTamano = document.createElement('select');
        selectorTamano.className = 'size-selector';
        producto.precios.forEach(precio => {
            const opcion = document.createElement('option');
            opcion.value = precio.precio;
            opcion.textContent = `${precio.tamaño}ml - ${tipo === 'decants' ? 'Bs' : '$'}${precio.precio}`;
            selectorTamano.appendChild(opcion);
        });

        contenedor.querySelector('.size-selector-container')?.remove();
        contenedor.querySelector('.combo-selection').appendChild(selectorTamano);
        selectorTamano.addEventListener('change', actualizarTotal);
        
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
        let productosSeleccionados = 0;

        document.querySelectorAll('.combo-item').forEach(item => {
            const selector = item.querySelector('.size-selector');
            if (selector) {
                total += parseFloat(selector.value);
                productosSeleccionados++;
            }
        });

        document.getElementById('total-price').textContent = total.toFixed(2);
        actualizarBotonWhatsApp(productosSeleccionados);
        actualizarEnlaceWhatsApp(total);
    }

    function actualizarBotonWhatsApp(seleccionados) {
        const requeridos = comboTypeSelect.value === 'decants' 
            ? parseInt(decantQuantitySelect.value)
            : 3;

        whatsappLink.classList.toggle('disabled', seleccionados < requeridos);
    }

    function actualizarEnlaceWhatsApp(total) {
        const tipo = comboTypeSelect.value;
        const moneda = tipo === 'decants' ? 'Bs' : '$';
        let mensaje = `¡Hola! Quiero armar mi combo de ${tipo}:\n\n`;

        document.querySelectorAll('.combo-item').forEach((item, indice) => {
            const nombre = item.querySelector('[id$="-nombre"]')?.textContent;
            const tamano = item.querySelector('.size-selector')?.selectedOptions[0]?.textContent;
            
            if (nombre) {
                mensaje += `➤ ${nombre}${tamano ? ` (${tamano})` : ''}\n`;
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