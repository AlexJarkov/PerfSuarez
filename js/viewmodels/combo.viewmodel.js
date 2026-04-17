(function (App) {
    function initComboBuilder() {
        const comboTypeSelect = document.getElementById('combo-type');
        const decantQuantitySelect = document.getElementById('decant-quantity');
        const decantQuantityContainer = document.getElementById('decant-quantity-container');
        const comboItemsContainer = document.getElementById('combo-items');
        const whatsappLink = document.getElementById('whatsapp-link');
        const cartButton = document.getElementById('cart-link');

        if (!comboTypeSelect || !decantQuantitySelect || !comboItemsContainer || !whatsappLink) {
            return;
        }

        const state = {
            productos: { perfumes: [], decants: [] }
        };

        function closeOtherDropdowns(current) {
            document.querySelectorAll('.dropdown').forEach(dropdown => {
                if (dropdown !== current) {
                    dropdown.classList.remove('show');
                    const comboItem = dropdown.closest('.combo-item');
                    const trigger = comboItem?.querySelector('.dropdown-toggle');
                    if (comboItem) comboItem.style.zIndex = '';
                    if (trigger) trigger.setAttribute('aria-expanded', 'false');
                }
            });
        }

        function updateWhatsAppState(selectedCount) {
            const required = comboTypeSelect.value === 'decants' ? parseInt(decantQuantitySelect.value, 10) : 3;
            whatsappLink.classList.toggle('disabled', selectedCount < required);
            cartButton?.classList.toggle('disabled', selectedCount < required);
        }

        function buildSelectionSummary() {
            let total = 0;
            let originalTotal = 0;
            let selected = 0;
            const isDecants = comboTypeSelect.value === 'decants';
            const quantity = isDecants ? parseInt(decantQuantitySelect.value, 10) : 0;
            const extraDiscount = isDecants ? ({ 5: 0, 6: 2, 7: 4, 8: 6, 9: 8, 10: 10 }[quantity] || 0) : 0;
            const items = [];

            document.querySelectorAll('.combo-item').forEach(item => {
                const nameElement = item.querySelector('[id^="perfumes-nombre"], [id^="decants-nombre"]');
                const selector = item.querySelector('.size-selector');
                const name = nameElement?.textContent;
                if (!name || !selector?.value) {
                    return;
                }

                const priceData = JSON.parse(selector.value);
                const product = JSON.parse(selector.dataset.producto || '{}');

                if (product.tipo === 'decants') {
                    const discountedPrice = priceData.precio * (1 - ((10 + extraDiscount) / 100));
                    originalTotal += priceData.precio;
                    total += discountedPrice;
                    selected += 1;
                    items.push({
                        name: name,
                        size: priceData.tamano,
                        basePrice: priceData.precio,
                        finalPrice: discountedPrice,
                        tipo: 'decants'
                    });
                    return;
                }

                if (typeof priceData.comboPrecio === 'number') {
                    originalTotal += priceData.precio;
                    total += priceData.comboPrecio;
                    selected += 1;
                    items.push({
                        name: name,
                        size: priceData.tamano,
                        basePrice: priceData.precio,
                        finalPrice: priceData.comboPrecio,
                        tipo: 'perfumes'
                    });
                }
            });

            return {
                isDecants: isDecants,
                items: items,
                originalTotal: originalTotal,
                savings: originalTotal - total,
                selected: selected,
                total: total
            };
        }

        function updateWhatsAppLink(summary) {
            const total = summary.total;
            const isDecants = summary.isDecants;
            let message = `¡Hola! Quiero armar mi combo de ${isDecants ? 'decants' : 'perfumes'}:\n\n`;

            summary.items.forEach(item => {
                message += `➤ ${item.name} (${item.size}ml)\n`;
            });

            message += `\nTotal: ${App.models.combo.MONEDA_LOCAL} ${total.toFixed(2)}`;
            whatsappLink.href = `https://wa.me/78064327?text=${encodeURIComponent(message)}`;
        }

        function updateTotal() {
            const summary = buildSelectionSummary();

            document.getElementById('total-price').textContent = summary.total.toFixed(2);
            document.getElementById('total-price-currency').textContent = App.models.combo.MONEDA_LOCAL;
            document.getElementById('savings').textContent = `Estás ahorrando: ${App.models.combo.MONEDA_LOCAL} ${summary.savings.toFixed(2)}`;

            updateWhatsAppState(summary.selected);
            updateWhatsAppLink(summary);
        }

        function selectProduct(type, index, product, container) {
            container.classList.add('selected');
            container.classList.remove('combo-item--empty');
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
            dropdown.innerHTML = `
                <input type="text" class="dropdown-search" placeholder="Buscar...">
                <div class="dropdown-items-grid">${products.map((product, itemIndex) => `
                <div class="dropdown-item-combo" data-index="${itemIndex}">
                    <img src="${product.imagen}" alt="${product.nombre}" class="dropdown-product-image">
                    <div class="dropdown-product-info">
                        <p class="dropdown-product-name">${product.nombre}</p>
                    </div>
                </div>
            `).join('')}</div>
            `;

            dropdown.addEventListener('click', event => event.stopPropagation());

            const searchInput = dropdown.querySelector('.dropdown-search');
            searchInput.addEventListener('click', event => event.stopPropagation());
            searchInput.addEventListener('input', () => {
                const query = searchInput.value.toLowerCase();
                dropdown.querySelectorAll('.dropdown-item-combo').forEach(item => {
                    const name = item.querySelector('.dropdown-product-name').textContent.toLowerCase();
                    item.style.display = name.includes(query) ? '' : 'none';
                });
            });

            dropdown.querySelectorAll('.dropdown-item-combo').forEach(item => {
                item.addEventListener('click', () => {
                    const product = products[item.dataset.index];
                    const comboItem = item.closest('.combo-item');
                    selectProduct(type, index, product, comboItem);
                    dropdown.classList.remove('show');
                    comboItem.style.zIndex = '';
                    comboItem.querySelector('.dropdown-toggle')?.setAttribute('aria-expanded', 'false');
                });
            });
        }

        function bindDropdown(item) {
            const button = item.querySelector('.dropdown-toggle');
            const dropdown = item.querySelector('.dropdown');
            button.setAttribute('aria-expanded', 'false');
            button.addEventListener('click', event => {
                event.stopPropagation();
                const isOpening = !dropdown.classList.contains('show');
                closeOtherDropdowns(isOpening ? dropdown : null);
                dropdown.classList.toggle('show', isOpening);
                button.setAttribute('aria-expanded', String(isOpening));
                if (isOpening) {
                    item.style.zIndex = '10';
                    const searchInput = dropdown.querySelector('.dropdown-search');
                    if (searchInput) {
                        searchInput.value = '';
                        dropdown.querySelectorAll('.dropdown-item-combo').forEach(el => el.style.display = '');
                        window.requestAnimationFrame(() => searchInput.focus());
                    }
                } else {
                    item.style.zIndex = '';
                }
            });
        }

        function handleViewportChange() {
            closeOtherDropdowns(null);
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

            updateTotal();
        }

        Promise.all([
            App.models.combo.getProductsFromData('perfumes'),
            App.models.combo.getProductsFromData('decants')
        ])
            .then(([perfumes, decants]) => {
                state.productos.perfumes = perfumes;
                state.productos.decants = decants;
                renderItems();
            })
            .catch(error => console.error('Error inicializando combos:', error));

        comboTypeSelect.addEventListener('change', renderItems);
        decantQuantitySelect.addEventListener('change', renderItems);
        cartButton?.addEventListener('click', function () {
            if (cartButton.classList.contains('disabled') || !App.models.cart) {
                return;
            }

            const summary = buildSelectionSummary();
            const item = App.models.cart.createComboItem(summary);
            if (!item) {
                return;
            }

            App.models.cart.addItem(item);
            App.viewmodels.cart?.openCart();
        });
        window.addEventListener('orientationchange', handleViewportChange);
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                closeOtherDropdowns(null);
            }
        });
        document.addEventListener('click', () => closeOtherDropdowns(null));
    }

    App.viewmodels.combo = {
        initComboBuilder
    };
})(window.PerfSuarez);
