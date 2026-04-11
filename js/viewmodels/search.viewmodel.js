(function (App) {
    function initHeaderSearchToggle() {
        var searchTrigger = document.getElementById('mobile-search-trigger');
        var searchLayer = document.querySelector('.header-search-layer');
        var searchPanel = document.getElementById('header-search-panel');
        var searchClose = document.getElementById('header-search-close');
        var searchInput = document.getElementById('search-input');
        var searchForm = document.getElementById('search-form');

        if (!searchTrigger || !searchPanel || searchTrigger.dataset.searchReady === 'true') return;
        searchTrigger.dataset.searchReady = 'true';

        function isMobileViewport() {
            return window.innerWidth <= 960;
        }

        function setSearchState(isOpen) {
            var mobileOpen = isOpen && isMobileViewport();
            searchPanel.classList.toggle('is-open', isOpen);
            searchLayer && searchLayer.classList.toggle('is-open', mobileOpen);
            searchPanel.setAttribute('aria-hidden', String(!isOpen));
            searchTrigger.setAttribute('aria-expanded', String(isOpen));
            document.body.classList.toggle('mobile-search-open', mobileOpen);

            if (isOpen && searchInput) {
                window.requestAnimationFrame(function () {
                    searchInput.focus();
                });
            }
        }

        searchTrigger.addEventListener('click', function () {
            setSearchState(!searchPanel.classList.contains('is-open'));
        });

        searchClose && searchClose.addEventListener('click', function () {
            setSearchState(false);
        });

        searchLayer && searchLayer.addEventListener('click', function (event) {
            if (!searchPanel.classList.contains('is-open')) {
                return;
            }

            if (searchPanel.contains(event.target) || searchTrigger.contains(event.target)) {
                return;
            }

            setSearchState(false);
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && searchPanel.classList.contains('is-open')) {
                setSearchState(false);
            }
        });

        document.addEventListener('click', function (event) {
            if (!searchPanel.classList.contains('is-open')) {
                return;
            }

            if (searchPanel.contains(event.target) || searchTrigger.contains(event.target)) {
                return;
            }

            if (searchLayer && searchLayer.contains(event.target)) {
                return;
            }

            setSearchState(false);
        });

        window.addEventListener('resize', function () {
            var mobileOpen = searchPanel.classList.contains('is-open') && isMobileViewport();
            searchLayer && searchLayer.classList.toggle('is-open', mobileOpen);
            document.body.classList.toggle('mobile-search-open', mobileOpen);
        });

        if (!searchForm || searchForm.dataset.searchShellReady === 'true') {
            return;
        }

        searchForm.dataset.searchShellReady = 'true';
        searchForm.addEventListener('submit', function (event) {
            var input = searchForm.querySelector('input[name="q"]');
            var query = input ? input.value.trim() : '';
            if (!query) {
                event.preventDefault();
                input && input.focus();
                return;
            }

            event.preventDefault();
            setSearchState(false);
            App.core.navigateToSearch(query);
        });
    }

    function buildTagsHtml(perfume) {
        var parts = [];
        var inStock = perfume.en_stock_completos || perfume.en_stock_decants;
        if (!inStock) parts.push('<span class="etiqueta fuera-de-stock">Fuera de stock</span>');
        if (perfume.etiqueta === 'novedad') parts.push('<span class="etiqueta novedad">Nuevo</span>');
        if (perfume.etiqueta === 'a-pedido') parts.push('<span class="etiqueta a-pedido">A Pedido</span>');
        return parts.length ? '<div class="etiquetas">' + parts.join('') + '</div>' : '';
    }

    function buildCardNode(perfume) {
        var img = perfume.image_miniatura || perfume.image_miniatura_decant || 'imagenes/image.webp';

        var card = document.createElement('div');
        card.className = 'decant search-result-card';
        card.setAttribute('data-id', perfume.id);
        card.setAttribute('data-name', perfume.nombre_interno);
        card.setAttribute('data-tags', perfume.tags.join(' '));
        card.setAttribute('data-brand', perfume.marca.toLowerCase());

        card.innerHTML = ''
            + '<div class="search-card-img-wrap">'
            +   '<img src="' + img + '" alt="' + perfume.nombre + '" loading="lazy" decoding="async">'
            + '</div>'
            + '<h3><strong>' + perfume.marca + '</strong></h3>'
            + '<p>' + perfume.nombre + '</p>'
            + buildTagsHtml(perfume);

        card.addEventListener('click', function (e) {
            App.core.navigateToProductDetail(perfume.id);
        });

        return card;
    }

    function initSearchResultsPage() {
        var queryEl = document.getElementById('search-query');
        var grid = document.getElementById('search-grid');
        if (!queryEl || !grid) return;

        var query = (new URLSearchParams(window.location.search).get('q') || '').trim();
        queryEl.textContent = query || '—';

        var results = query ? App.models.search.searchPerfumes(query) : [];
        var countEl = document.getElementById('search-count');

        if (!results.length) {
            if (countEl) countEl.textContent = query ? '0 resultados' : 'Ingresá un término en el buscador.';
            var empty = document.getElementById('no-results-message');
            if (empty) empty.classList.add('show');
            return;
        }

        if (countEl) countEl.textContent = results.length + ' resultado' + (results.length !== 1 ? 's' : '');

        // Build all cards
        var cards = results.map(function (perfume) {
            var card = buildCardNode(perfume);
            grid.appendChild(card);
            return card;
        });

        // Populate brand dropdown from results
        var brandSelect = document.getElementById('search-brand');
        if (brandSelect) {
            var brandMap = new Map();
            cards.forEach(function (card) {
                var slug = card.dataset.brand;
                var label = card.querySelector('h3 strong');
                var display = label ? label.textContent.trim() : '';
                if (slug && display && !brandMap.has(slug)) brandMap.set(slug, display);
            });
            Array.from(brandMap.entries())
                .sort(function (a, b) { return a[1].localeCompare(b[1], 'es', { sensitivity: 'base' }); })
                .forEach(function (entry) {
                    var opt = document.createElement('option');
                    opt.value = entry[0];
                    opt.textContent = entry[1];
                    brandSelect.appendChild(opt);
                });
        }

        // Filter state
        var activeGender = 'all';
        var activeStyle = 'all';

        function applyFilters() {
            var brand = brandSelect ? brandSelect.value : 'all';
            var hideOut = !!(document.getElementById('stock-filter') && document.getElementById('stock-filter').checked);
            var onlyNew = !!(document.getElementById('new-filter') && document.getElementById('new-filter').checked);
            var onlyCombo = !!(document.getElementById('combo-filter') && document.getElementById('combo-filter').checked);

            var visible = 0;
            cards.forEach(function (card) {
                var tags = (card.dataset.tags || '').toLowerCase();
                var cardBrand = (card.dataset.brand || '').toLowerCase();
                var hasOutBadge = !!card.querySelector('.etiqueta.fuera-de-stock');
                var hasNewBadge = !!card.querySelector('.etiqueta.novedad');
                var matchesGender = activeGender === 'all' || tags.includes(activeGender);
                var matchesStyle = activeStyle === 'all'
                    || (activeStyle === 'diseñador' ? (!tags.includes('nicho') && !tags.includes('arabes')) : tags.includes(activeStyle));
                var matchesBrand = brand === 'all' || cardBrand.includes(brand);
                var matchesStock = !hideOut || !hasOutBadge;
                var matchesNew = !onlyNew || hasNewBadge;

                var show = matchesGender && matchesStyle && matchesBrand && matchesStock && matchesNew;
                card.style.display = show ? '' : 'none';
                if (show) visible++;
            });

            var emptyState = document.getElementById('no-results-message');
            if (emptyState) emptyState.classList.toggle('show', visible === 0);
            if (countEl) countEl.textContent = visible + ' resultado' + (visible !== 1 ? 's' : '');
        }

        // Wire up controls
        if (brandSelect) brandSelect.addEventListener('change', applyFilters);
        ['stock-filter', 'new-filter', 'combo-filter'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.addEventListener('change', applyFilters);
        });

        document.querySelectorAll('#gender-chips .gender-chip').forEach(function (chip) {
            chip.addEventListener('click', function () {
                document.querySelectorAll('#gender-chips .gender-chip').forEach(function (c) { c.classList.remove('active'); });
                chip.classList.add('active');
                activeGender = chip.dataset.gender;
                applyFilters();
            });
        });

        document.querySelectorAll('#style-chips .style-chip').forEach(function (chip) {
            chip.addEventListener('click', function () {
                document.querySelectorAll('#style-chips .style-chip').forEach(function (c) { c.classList.remove('active'); });
                chip.classList.add('active');
                activeStyle = chip.dataset.style;
                applyFilters();
            });
        });

        applyFilters();
    }

    App.viewmodels.search = {
        initHeaderSearchToggle,
        initSearchResultsPage
    };
})(window.PerfSuarez);
