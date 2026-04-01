(function (App) {
    function initComboBuilder() {
        const comboTypeSelect = document.getElementById('combo-type');
        const decantQuantitySelect = document.getElementById('decant-quantity');
        const decantQuantityContainer = document.getElementById('decant-quantity-container');
        const comboItemsContainer = document.getElementById('combo-items');
        const whatsappLink = document.getElementById('whatsapp-link');

        if (!comboTypeSelect || !decantQuantitySelect || !comboItemsContainer || !whatsappLink) {
            return;
        }

        const state = {
            productos: { perfumes: [], decants: [] },
            configuracionCombos: {}
        };

        function closeOtherDropdowns(current) {
            document.querySelectorAll('.dropdown').forEach(dropdown => {
                if (dropdown !== current) {
                    dropdown.classList.remove('show');
                }
            });
        }

        function updateWhatsAppState(selectedCount) {
            const required = comboTypeSelect.value === 'decants' ? parseInt(decantQuantitySelect.value, 10) : 3;
            whatsappLink.classList.toggle('disabled', selectedCount < required);
        }

        function updateWhatsAppLink(total, isDecants) {
            let message = `¡Hola! Quiero armar mi combo de ${isDecants ? 'decants' : 'perfumes'}:\n\n`;

            document.querySelectorAll('.combo-item').forEach(item => {
                const nameElement = item.querySelector('[id^="perfumes-nombre"], [id^="decants-nombre"]');
                const selector = item.querySelector('.size-selector');
                const name = nameElement?.textContent;
                if (!name || !selector?.value) {
                    return;
                }

                const priceData = JSON.parse(selector.value);
                const product = JSON.parse(selector.dataset.producto || '{}');
                let line = `➤ ${name} (${priceData.tamano}ml`;
                if (product.tipo === 'perfumes' && product.skuBase) {
                    line += ` - ${product.skuBase}`;
                }
                message += `${line})\n`;
            });

            message += `\nTotal: ${App.models.combo.MONEDA_LOCAL} ${total.toFixed(2)}`;
            whatsappLink.href = `https://wa.me/78064327?text=${encodeURIComponent(message)}`;
        }

        function updateTotal() {
            let total = 0;
            let originalTotal = 0;
            let selected = 0;
            const isDecants = comboTypeSelect.value === 'decants';
            const quantity = isDecants ? parseInt(decantQuantitySelect.value, 10) : 0;
            const extraDiscount = isDecants ? ({ 5: 0, 6: 2, 7: 4, 8: 6, 9: 8, 10: 10 }[quantity] || 0) : 0;

            document.querySelectorAll('.size-selector').forEach(selector => {
                if (!selector.value) {
                    return;
                }

                const priceData = JSON.parse(selector.value);
                const product = JSON.parse(selector.dataset.producto || '{}');

                if (product.tipo === 'decants') {
                    const discountedPrice = priceData.precio * (1 - ((10 + extraDiscount) / 100));
                    originalTotal += priceData.precio;
                    total += discountedPrice;
                    selected += 1;
                    return;
                }

                if (typeof priceData.comboPrecio === 'number') {
                    originalTotal += priceData.precio;
                    total += priceData.comboPrecio;
                    selected += 1;
                }
            });

            document.getElementById('total-price').textContent = total.toFixed(2);
            document.getElementById('total-price-currency').textContent = App.models.combo.MONEDA_LOCAL;
            document.getElementById('savings').textContent = `Estás ahorrando: ${App.models.combo.MONEDA_LOCAL} ${(originalTotal - total).toFixed(2)}`;

            updateWhatsAppState(selected);
            updateWhatsAppLink(total, isDecants);
        }

        function selectProduct(type, index, product, container) {
            container.classList.add('selected');
            setTimeout(() => container.classList.remove('selected'), 600);
            container.querySelector(`#${type}-nombre-${index}`).textContent = product.nombre;
            container.querySelector(`#${type}-imagen-${index}`).src = product.imagen;
            container.querySelector('.size-selector-container')?.remove();

            const selector = document.createElement('select');
            selector.className = 'size-selector';

            product.precios.forEach(price => {
                const option = document.createElement('option');
                option.value = JSON.stringify(price);
                option.textContent = `${price.tamano}ml - ${price.moneda} ${price.precio}`;
                selector.appendChild(option);
            });

            selector.dataset.producto = JSON.stringify({
                nombre: product.nombre,
                tipo: product.tipo,
                skuBase: product.skuBase
            });
            selector.addEventListener('change', updateTotal);

            const wrapper = document.createElement('div');
            wrapper.className = 'size-selector-container';
            wrapper.appendChild(selector);
            container.querySelector('.combo-selection').appendChild(wrapper);
            updateTotal();
        }

        function populateDropdown(type, index, dropdown) {
            const products = type === 'perfumes' ? state.productos.perfumes : state.productos.decants;
            dropdown.innerHTML = products.map((product, itemIndex) => `
                <div class="dropdown-item-combo" data-index="${itemIndex}">
                    <img src="${product.imagen}" alt="${product.nombre}" class="dropdown-product-image">
                    <div class="dropdown-product-info">
                        <p class="dropdown-product-name">${product.nombre}</p>
                    </div>
                </div>
            `).join('');

            dropdown.querySelectorAll('.dropdown-item-combo').forEach(item => {
                item.addEventListener('click', () => {
                    const product = products[item.dataset.index];
                    const comboItem = item.closest('.combo-item');
                    selectProduct(type, index, product, comboItem);
                    dropdown.classList.remove('show');
                });
            });
        }

        function bindDropdown(item) {
            const button = item.querySelector('.dropdown-toggle');
            const dropdown = item.querySelector('.dropdown');
            button.addEventListener('click', event => {
                event.stopPropagation();
                dropdown.classList.toggle('show');
                closeOtherDropdowns(dropdown);
            });
        }

        function handleResize() {
            comboItemsContainer.style.gridTemplateColumns = window.innerWidth < 768 ? '1fr' : 'repeat(auto-fill, minmax(250px, 1fr))';
        }

        function renderItems() {
            comboItemsContainer.innerHTML = '';
            const type = comboTypeSelect.value;
            const quantity = type === 'decants' ? parseInt(decantQuantitySelect.value, 10) : 3;

            decantQuantityContainer.classList.toggle('hidden', type !== 'decants');

            for (let index = 0; index < quantity; index += 1) {
                const item = App.views.combo.createComboItem(type, index);
                const dropdown = item.querySelector('.dropdown');
                populateDropdown(type, index, dropdown);
                bindDropdown(item);
                comboItemsContainer.appendChild(item);
            }

            handleResize();
            updateTotal();
        }

        App.models.combo.fetchComboConfig('PRECIOS NUEVOS.csv')
            .then(config => {
                state.configuracionCombos = config;
                const fetcher = App.models.combo.getProductsFromData || App.models.combo.fetchProducts;
                return Promise.all([
                    fetcher('perfumes', state.configuracionCombos),
                    fetcher('decants', state.configuracionCombos)
                ]);
            })
            .then(([perfumes, decants]) => {
                state.productos.perfumes = perfumes;
                state.productos.decants = decants;
                renderItems();
            })
            .catch(error => console.error('Error inicializando combos:', error));

        comboTypeSelect.addEventListener('change', renderItems);
        decantQuantitySelect.addEventListener('change', renderItems);
        window.addEventListener('resize', handleResize);
        document.addEventListener('click', () => closeOtherDropdowns(null));
    }

    App.viewmodels.combo = {
        initComboBuilder
    };
})(window.PerfSuarez);
