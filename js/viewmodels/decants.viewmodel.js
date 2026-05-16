(function (App) {
    'use strict';

    function initDecants() {
        const grid = document.getElementById('decant-grid');
        if (!grid) return;

        const cards = App.viewmodels.catalogRenderer.renderCatalog(grid, 'decants');
        App.viewmodels.catalogRenderer.bindCardNavigation(grid);

        new App.views.catalog.LazyImages('.perfume-grid img').init();

        const brandSelect = document.getElementById('decant-brand');
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

        const controls = [];
        if (document.querySelector('#page-size-input')) {
            controls.push({ inputEl: '#page-size-input', prevEl: '#page-prev', nextEl: '#page-next', statusEl: '#page-status' });
        }
        if (document.querySelector('#page-size-input-bottom')) {
            controls.push({ inputEl: '#page-size-input-bottom', prevEl: '#page-prev-bottom', nextEl: '#page-next-bottom', statusEl: '#page-status-bottom' });
        }
        const pager = controls.length ? new App.views.catalog.GridPaginator({ gridEl: grid, itemSelector: '.decant', controls }) : null;
        if (pager) window.decantsPager = pager;

        const searchInput = document.getElementById('decant-search');
        const sortSelect = document.getElementById('decant-sort');
        const stockToggle = document.getElementById('stock-filter');
        const newToggle = document.getElementById('new-filter');
        const emptyState = document.getElementById('no-results-message');
        let activeGender = 'all';
        let activeStyle = 'all';
        let orderedCards = cards;

        function applyFilters() {
            const q = App.core.search.normalizeText(searchInput ? searchInput.value : '');
            const brand = App.core.search.normalizeText(brandSelect ? brandSelect.value : 'all');
            const hideOut = !!(stockToggle && stockToggle.checked);
            const onlyNew = !!(newToggle && newToggle.checked);
            orderedCards = App.viewmodels.catalogRenderer.sortCards(orderedCards, sortSelect ? sortSelect.value : 'hype', grid);
            let visible = 0;

            orderedCards.forEach(card => {
                const tags = App.core.search.normalizeText(card.dataset.tags || '');
                const brandText = App.core.search.normalizeText(card.dataset.brand || card.querySelector('h3')?.textContent || '');
                const searchText = [
                    card.dataset.name,
                    card.dataset.tags,
                    card.dataset.brand,
                    card.textContent
                ].join(' ');
                const hasOutBadge = !!card.querySelector('.etiqueta.fuera-de-stock');
                const hasNewBadge = !!card.querySelector('.etiqueta.novedad');
                const normalizedGender = App.core.search.normalizeText(activeGender);
                const normalizedStyle = App.core.search.normalizeText(activeStyle);

                const matchesSearch = !q || App.core.search.matches(q, searchText);
                const matchesGender = activeGender === 'all' || tags.includes(normalizedGender);
                const matchesStyle = activeStyle === 'all'
                    || (normalizedStyle === 'disenador' ? (!tags.includes('nicho') && !tags.includes('arabes')) : tags.includes(normalizedStyle));
                const matchesBrand = brand === 'all' || brandText === brand || App.core.search.matches(brand, searchText);
                const matchesStock = !hideOut || !hasOutBadge;
                const matchesNew = !onlyNew || hasNewBadge;

                const show = matchesSearch && matchesGender && matchesStyle && matchesBrand && matchesStock && matchesNew;
                card.style.display = show ? '' : 'none';
                if (show) visible++;
            });

            emptyState?.classList.toggle('show', visible === 0);
            pager?.refresh();
        }

        window.filterPerfumes = applyFilters;

        searchInput?.addEventListener('input', applyFilters);
        brandSelect?.addEventListener('change', applyFilters);
        sortSelect?.addEventListener('change', () => {
            if (pager) pager.page = 1;
            applyFilters();
        });
        stockToggle?.addEventListener('change', applyFilters);
        newToggle?.addEventListener('change', applyFilters);

        document.querySelectorAll('#gender-chips .gender-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                document.querySelectorAll('#gender-chips .gender-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                activeGender = chip.dataset.gender;
                applyFilters();
            });
        });

        document.querySelectorAll('#style-chips .style-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                document.querySelectorAll('#style-chips .style-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                activeStyle = chip.dataset.style;
                applyFilters();
            });
        });

        applyFilters();
    }

    App.viewmodels.decants = { initDecants };
    App.core.onReady(initDecants);
})(window.PerfSuarez);
