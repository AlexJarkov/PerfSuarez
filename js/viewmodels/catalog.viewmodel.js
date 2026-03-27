(function (App) {
    function buildControls(definitions) {
        return definitions.filter(definition => (
            document.querySelector(definition.inputEl) &&
            document.querySelector(definition.prevEl) &&
            document.querySelector(definition.nextEl) &&
            document.querySelector(definition.statusEl)
        ));
    }

    function initCatalogPage(options) {
        const grid = document.querySelector(options.gridSelector);
        if (!grid) {
            return;
        }

        const cards = Array.from(grid.querySelectorAll(options.itemSelector || '.decant'));
        const searchInput = document.querySelector(options.searchSelector);
        const categorySelect = options.categorySelector ? document.querySelector(options.categorySelector) : null;
        const brandSelect = options.brandSelector ? document.querySelector(options.brandSelector) : null;
        const stockToggle = options.stockSelector ? document.querySelector(options.stockSelector) : null;
        const newToggle = options.newSelector ? document.querySelector(options.newSelector) : null;
        const emptyState = options.emptySelector ? document.querySelector(options.emptySelector) : null;
        const controls = buildControls(options.paginationControls || []);

        if (options.lazySelector) {
            new App.views.catalog.LazyImages(options.lazySelector).init();
        }

        if (brandSelect && options.autoPopulateBrands) {
            App.models.catalog.collectBrandOptions(cards).forEach(entry => {
                const option = document.createElement('option');
                option.value = entry.value;
                option.textContent = entry.label;
                brandSelect.appendChild(option);
            });
        }

        const pager = controls.length ? new App.views.catalog.GridPaginator({
            gridEl: grid,
            itemSelector: options.itemSelector || '.decant',
            controls
        }) : null;

        if (options.pagerGlobalName && pager) {
            window[options.pagerGlobalName] = pager;
        }

        const applyFilters = (categoryOverride) => {
            const visible = App.models.catalog.filterCards(cards, {
                query: (searchInput?.value || '').trim().toLowerCase(),
                category: categoryOverride || (categorySelect?.value || 'all'),
                brand: brandSelect?.value || 'all',
                hideOutOfStock: !!stockToggle?.checked,
                onlyNew: !!newToggle?.checked,
                visibleDisplay: options.visibleDisplay || ''
            });

            if (emptyState) {
                if ('classList' in emptyState) {
                    emptyState.classList.toggle('show', visible === 0);
                }
                emptyState.style.display = visible === 0 ? 'block' : '';
            }

            pager?.refresh();
        };

        if (options.globalFilterName) {
            window[options.globalFilterName] = applyFilters;
        }

        if (options.whatsAppMessageBuilder) {
            grid.addEventListener('click', event => {
                const card = event.target.closest(options.itemSelector || '.decant');
                if (!card) {
                    return;
                }

                const name = card.getAttribute('data-name') || '';
                App.core.confirmAndOpenWhatsApp({
                    number: '78064327',
                    message: options.whatsAppMessageBuilder(name),
                    confirmationMessage: '¿Desea continuar a WhatsApp para realizar su consulta?'
                });
            });
        }

        searchInput?.addEventListener('input', () => applyFilters());
        categorySelect?.addEventListener('change', () => applyFilters());
        brandSelect?.addEventListener('change', () => applyFilters());
        stockToggle?.addEventListener('change', () => applyFilters());
        newToggle?.addEventListener('change', () => applyFilters());

        applyFilters();
    }

    App.viewmodels.catalog = {
        initCatalogPage
    };
})(window.PerfSuarez);
