(function (App) {
    'use strict';

    function initCuadros() {
        const grid = document.getElementById('cuadro-grid');
        if (!grid) return;

        const cards = App.viewmodels.catalogRenderer.renderCatalog(grid, 'cuadros');

        grid.addEventListener('click', function (event) {
            const card = event.target.closest('.decant');
            if (!card) return;
            const id = card.getAttribute('data-id');
            if (id) App.core.navigateToCuadroDetail(id);
        });

        new App.views.catalog.LazyImages('.cuadro-grid img').init();

        const brandSelect = document.getElementById('cuadro-brand');
        if (brandSelect && cards.length) {
            const brandMap = new Map();
            cards.forEach(card => {
                const strong = card.querySelector('h3 strong');
                const display = strong ? strong.textContent.trim() : '';
                if (!display) return;
                const slug = display.toLowerCase();
                card.dataset.brand = slug;
                if (!brandMap.has(slug)) brandMap.set(slug, display);
            });
            Array.from(brandMap.entries())
                .sort((a, b) => a[1].localeCompare(b[1], 'es', { sensitivity: 'base' }))
                .forEach(([slug, display]) => {
                    const opt = document.createElement('option');
                    opt.value = slug;
                    opt.textContent = display;
                    brandSelect.appendChild(opt);
                });
        }

        const searchInput = document.getElementById('cuadro-search');
        const sortSelect = document.getElementById('cuadro-sort');
        const emptyState = document.getElementById('no-results-message');
        let orderedCards = cards;

        function applyFilters() {
            const q = App.core.search.normalizeText(searchInput ? searchInput.value : '');
            const brand = App.core.search.normalizeText(brandSelect ? brandSelect.value : 'all');
            orderedCards = App.viewmodels.catalogRenderer.sortCards(orderedCards, sortSelect ? sortSelect.value : 'hype', grid);
            let visible = 0;

            orderedCards.forEach(card => {
                const brandText = App.core.search.normalizeText(card.dataset.brand || card.querySelector('h3')?.textContent || '');
                const searchText = [
                    card.dataset.name,
                    card.dataset.tags,
                    card.dataset.brand,
                    card.textContent
                ].join(' ');

                const matchesSearch = !q || App.core.search.matches(q, searchText);
                const matchesBrand = brand === 'all' || brandText === brand || App.core.search.matches(brand, searchText);

                const show = matchesSearch && matchesBrand;
                card.style.display = show ? '' : 'none';
                if (show) visible++;
            });

            emptyState?.classList.toggle('show', visible === 0);
        }

        window.filterPerfumes = applyFilters;

        searchInput?.addEventListener('input', applyFilters);
        brandSelect?.addEventListener('change', applyFilters);
        sortSelect?.addEventListener('change', applyFilters);

        applyFilters();
    }

    App.viewmodels.cuadros = { initCuadros };
    App.core.onReady(initCuadros);
})(window.PerfSuarez);
