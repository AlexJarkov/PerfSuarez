(function (App) {
    function initComboBuilder() {
        const comboTypeSelect = document.getElementById('combo-type');
        const decantQuantitySelect = document.getElementById('decant-quantity');
        const decantQuantityContainer = document.getElementById('decant-quantity-container');
        const comboItemsContainer = document.getElementById('combo-items');
        const whatsappLink = document.getElementById('whatsapp-link');
        const cartButton = document.getElementById('cart-link');
        const shareButton = document.getElementById('combo-share');
        const codeOpenButton = document.getElementById('combo-code-open');
        const codeModal = document.getElementById('combo-code-modal');
        const codeBackdrop = document.getElementById('combo-code-backdrop');
        const codeInput = document.getElementById('combo-code-input');
        const codeApplyButton = document.getElementById('combo-code-apply');
        const codeCloseButton = document.getElementById('combo-code-close');
        const codeFeedback = document.getElementById('combo-code-feedback');
        const comboHint = document.getElementById('combo-wa-hint');
        const comboHintDefault = comboHint?.textContent || '';

        if (!comboTypeSelect || !decantQuantitySelect || !comboItemsContainer || !whatsappLink) {
            return;
        }

        // Por sesión (no localStorage): un combo a medio armar pertenece a la
        // visita, no debe reaparecer semanas después.
        const DRAFT_KEY = 'ps_combo_draft_v1';

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

        function requiredSlots() {
            return comboTypeSelect.value === 'decants' ? parseInt(decantQuantitySelect.value, 10) : 3;
        }

        function updateWhatsAppState(selectedCount) {
            const incomplete = selectedCount < requiredSlots();
            whatsappLink.classList.toggle('disabled', incomplete);
            cartButton?.classList.toggle('disabled', incomplete);
            shareButton?.classList.toggle('disabled', incomplete);
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
                        id: product.id,
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
                        id: product.id,
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
            saveDraft();
        }

        function selectProduct(type, index, product, container, preferredMl) {
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
                // Al restaurar un combo desde un código, el tamaño viene dado.
                if (preferredMl != null && price.tamano === preferredMl) {
                    option.selected = true;
                }
                selector.appendChild(option);
            });

            selector.dataset.producto = JSON.stringify({
                id: product.id,
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

        /* ---- Código de combo compartible ---------------------------------- */

        // El script inline de la página sincroniza chip/tab -> select; al
        // restaurar un combo hace falta el camino inverso.
        function syncControlsUi() {
            document.querySelectorAll('.combo-type-tab').forEach(tab => {
                tab.classList.toggle('active', tab.dataset.value === comboTypeSelect.value);
            });
            document.querySelectorAll('.quantity-chip').forEach(chip => {
                chip.classList.toggle('active', chip.dataset.value === decantQuantitySelect.value);
            });
        }

        /* Lee las ranuras en orden de DOM. A diferencia de
           buildSelectionSummary (que sólo devuelve lo elegido, para precios),
           acá los huecos importan: son la posición de lo que falta. */
        function readSlots() {
            return [...comboItemsContainer.querySelectorAll('.combo-item')].map(item => {
                const selector = item.querySelector('.size-selector');
                if (!selector?.value) {
                    return null;
                }
                const producto = JSON.parse(selector.dataset.producto || '{}');
                const precio = JSON.parse(selector.value);
                return producto.id ? { id: producto.id, ml: precio.tamano } : null;
            });
        }

        function currentTipo() {
            return comboTypeSelect.value === 'decants' ? 'decants' : 'perfumes';
        }

        function readDrafts() {
            try {
                return JSON.parse(window.sessionStorage.getItem(DRAFT_KEY) || '{}') || {};
            } catch (error) {
                return {};
            }
        }

        /* Se guarda un borrador por combinación tipo+cantidad (C3, D7, D10...),
           así alternar entre Combos y Sets —o cambiar la cantidad— no pisa lo
           que había armado en la otra. El valor es el propio código: una línea
           de texto en vez de volcar todo el estado. */
        function saveDraft() {
            const tipo = currentTipo();
            const header = App.models.comboCode.headerFor(tipo, requiredSlots());
            if (!header) {
                return;
            }

            const slots = readSlots();
            const drafts = readDrafts();

            if (slots.some(Boolean)) {
                const code = App.models.comboCode.encode(tipo, slots);
                if (!code) {
                    return;
                }
                drafts[header] = code;
            } else {
                delete drafts[header];
            }

            try {
                window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(drafts));
            } catch (error) {
                // Sin storage disponible: el combo simplemente no persiste.
            }
        }

        function restoreDraft() {
            const header = App.models.comboCode.headerFor(currentTipo(), requiredSlots());
            const code = header && readDrafts()[header];
            if (code) {
                fillSlotsFromCode(App.models.comboCode.decode(code));
            }
        }

        function getCurrentCode() {
            const summary = buildSelectionSummary();
            if (summary.selected < requiredSlots()) {
                return null;
            }

            return App.models.comboCode.encode(
                summary.isDecants ? 'decants' : 'perfumes',
                summary.items.map(item => ({ id: item.id, ml: item.size }))
            );
        }

        /* El armador corre dentro de un iframe del shell. Lo normal es que el
           shell le reenvíe el ?combo= en el src, pero si eso falla (una versión
           vieja del shell en caché, o una ruta que no lo propaga) el código
           igual está en la barra de direcciones del padre, que es same-origin. */
        function readSharedCode() {
            const own = new URLSearchParams(window.location.search)
                .get(App.models.comboCode.PARAM);
            if (own) {
                return own;
            }

            try {
                if (window.parent && window.parent !== window) {
                    return new URLSearchParams(window.parent.location.search)
                        .get(App.models.comboCode.PARAM);
                }
            } catch (error) {
                // Padre de otro origen: no hay nada que leer.
            }

            return null;
        }

        function getShareUrl(code) {
            const url = new URL('armarcombo.html', window.location.href);
            url.search = `?${App.models.comboCode.PARAM}=${encodeURIComponent(code)}`;
            return url.toString();
        }

        /* Devuelve { applied, message }. `applied` distingue el código ilegible
           (no se tocó nada, el combo actual sigue intacto) del código válido
           al que le faltan productos: ese sí se arma con lo que queda y avisa. */
        /* Llena las ranuras ya renderizadas a partir de un código decodificado.
           Devuelve los ids que no se pudieron colocar (agotados o fuera de
           combo). Las ranuras nulas son huecos de un borrador: se saltean. */
        function fillSlotsFromCode(decoded) {
            if (!decoded) {
                return [];
            }

            const products = state.productos[decoded.tipo] || [];
            const containers = comboItemsContainer.querySelectorAll('.combo-item');
            const missing = [];

            decoded.items.forEach((item, index) => {
                if (!item) {
                    return;
                }
                const product = products.find(candidate => candidate.id === item.id);
                const container = containers[index];
                if (!product || !container) {
                    missing.push(item.id);
                    return;
                }
                selectProduct(decoded.tipo, index, product, container, item.ml);
            });

            return missing;
        }

        function applyCode(rawCode) {
            const decoded = App.models.comboCode.decode(rawCode);
            if (!decoded) {
                return {
                    applied: false,
                    message: 'Ese código no corresponde a un combo válido. Revisá que esté completo.'
                };
            }

            comboTypeSelect.value = decoded.tipo;
            if (decoded.tipo === 'decants') {
                decantQuantitySelect.value = String(decoded.cantidad);
            }
            syncControlsUi();
            // Sin restaurar el borrador: el código explícito manda.
            renderItems(true);

            const missing = fillSlotsFromCode(decoded);
            if (missing.length) {
                return {
                    applied: true,
                    message: `Se armó el combo, pero ${missing.length === 1 ? 'un perfume ya no está disponible' : missing.length + ' perfumes ya no están disponibles'}. Elegí ${missing.length === 1 ? 'otro' : 'otros'} para completarlo.`
                };
            }

            return { applied: true, message: null };
        }

        // El texto bajo los CTA hace de aviso persistente: por defecto explica
        // que falta completar el combo, y se reemplaza cuando un código
        // compartido trae perfumes que ya no están disponibles.
        function setComboHint(message) {
            if (!comboHint) {
                return;
            }
            comboHint.textContent = message || comboHintDefault;
            comboHint.classList.toggle('is-warning', !!message);
        }

        function setCodeFeedback(message, isError) {
            if (!codeFeedback) {
                return;
            }
            codeFeedback.textContent = message || '';
            codeFeedback.classList.toggle('is-error', !!message && isError);
            codeFeedback.classList.toggle('is-visible', !!message);
        }

        function setCodeModalOpen(isOpen) {
            if (!codeModal) {
                return;
            }
            codeModal.classList.toggle('is-open', isOpen);
            codeBackdrop?.classList.toggle('is-open', isOpen);
            codeModal.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
            codeOpenButton?.setAttribute('aria-expanded', String(isOpen));

            if (isOpen) {
                setCodeFeedback('', false);
                if (codeInput) {
                    codeInput.value = '';
                    codeInput.focus();
                }
            } else {
                codeOpenButton?.focus();
            }
        }

        function handleCodeSubmit() {
            const code = App.models.comboCode.extractFromInput(codeInput?.value);
            if (!code) {
                setCodeFeedback('Pegá un código o un link de combo.', true);
                return;
            }

            const result = applyCode(code);
            if (!result.applied) {
                // El combo actual quedó intacto: dejamos el modal abierto con el motivo.
                setCodeFeedback(result.message, true);
                return;
            }

            setCodeModalOpen(false);
            // La advertencia va junto a los CTA, donde el usuario va a mirar
            // después de cerrar el modal.
            setComboHint(result.message);
            comboItemsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        function initShareButton() {
            if (!shareButton) {
                return;
            }

            // "Escritorio" en la práctica: Safari de macOS y Edge de Windows
            // exponen navigator.share aunque no sean móviles, así que el puntero
            // grueso es lo que distingue de verdad al dispositivo táctil.
            const canShare = typeof navigator.share === 'function'
                && window.matchMedia('(pointer: coarse)').matches;

            shareButton.textContent = canShare ? 'Compartir combo' : 'Copiar código';

            shareButton.addEventListener('click', async () => {
                if (shareButton.classList.contains('disabled')) {
                    return;
                }

                const code = getCurrentCode();
                if (!code) {
                    return;
                }

                if (canShare) {
                    try {
                        await navigator.share({
                            title: 'Mi combo — Perfumería Suárez',
                            text: 'Mirá el combo que armé en Perfumería Suárez:',
                            url: getShareUrl(code)
                        });
                    } catch (error) {
                        // El usuario canceló la hoja de compartir: no es un error.
                    }
                    return;
                }

                try {
                    await navigator.clipboard.writeText(code);
                    shareButton.textContent = '¡Copiado!';
                    shareButton.classList.add('is-copied');
                    window.setTimeout(() => {
                        shareButton.textContent = 'Copiar código';
                        shareButton.classList.remove('is-copied');
                    }, 2000);
                } catch (error) {
                    window.prompt('Copiá el código de tu combo:', code);
                }
            });
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
            searchInput.addEventListener('touchstart', event => event.stopPropagation());
            searchInput.addEventListener('input', () => {
                const query = App.core.search.normalizeText(searchInput.value);
                dropdown.querySelectorAll('.dropdown-item-combo').forEach(item => {
                    const product = products[item.dataset.index];
                    const text = [
                        product?.nombre,
                        product?.tipo,
                        product?.skuBase
                    ].join(' ');
                    item.style.display = !query || App.core.search.matches(query, text) ? '' : 'none';
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
                        searchInput.focus();
                    }
                } else {
                    item.style.zIndex = '';
                }
            });
        }

        function handleViewportChange() {
            closeOtherDropdowns(null);
        }

        function renderItems(skipRestore) {
            comboItemsContainer.innerHTML = '';
            setComboHint(null);
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

            // Restaurar ANTES de updateTotal: updateTotal guarda el borrador, y
            // con las ranuras recién creadas (vacías) lo borraría justo antes de
            // leerlo.
            if (!skipRestore) {
                restoreDraft();
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
                // Los tokens se calculan sobre el catálogo completo, no sobre
                // estas listas ya filtradas por tipo y stock.
                App.models.comboCode.buildTokenMap(App.data?.perfumes || []);
                renderItems();

                const sharedCode = readSharedCode();
                if (sharedCode) {
                    const result = applyCode(sharedCode);
                    if (result.message) {
                        setComboHint(result.applied ? result.message : null);
                        console.warn('[combo] código compartido:', result.message);
                    }
                }
            })
            .catch(error => console.error('Error inicializando combos:', error));

        initShareButton();
        codeOpenButton?.addEventListener('click', () => setCodeModalOpen(true));
        codeCloseButton?.addEventListener('click', () => setCodeModalOpen(false));
        codeBackdrop?.addEventListener('click', () => setCodeModalOpen(false));
        codeApplyButton?.addEventListener('click', handleCodeSubmit);
        codeInput?.addEventListener('keydown', event => {
            if (event.key === 'Enter') {
                event.preventDefault();
                handleCodeSubmit();
            }
        });

        // Envueltos a propósito: pasar renderItems directo le entrega el Event
        // como primer argumento, que caería en skipRestore y saltearía el
        // borrador guardado.
        comboTypeSelect.addEventListener('change', () => renderItems());
        decantQuantitySelect.addEventListener('change', () => renderItems());
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
            if (event.key !== 'Escape') {
                return;
            }
            if (codeModal?.classList.contains('is-open')) {
                setCodeModalOpen(false);
                return;
            }
            closeOtherDropdowns(null);
        });
        document.addEventListener('click', () => {
            if (document.activeElement && document.activeElement.classList.contains('dropdown-search')) return;
            closeOtherDropdowns(null);
        });
    }

    App.viewmodels.combo = {
        initComboBuilder
    };
})(window.PerfSuarez);
