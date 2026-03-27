(function (App) {
    function initVelasPage() {
        const grid = document.getElementById('vela-grid');
        if (!grid) {
            return;
        }

        const cards = Array.from(grid.querySelectorAll('.decant'));
        const searchInput = document.getElementById('vela-search');
        const stockFilter = document.getElementById('stock-filter');
        const newFilter = document.getElementById('new-filter');
        const noResults = document.getElementById('no-results-message');

        const pager = new App.views.catalog.GridPaginator({
            gridEl: grid,
            itemSelector: '.decant',
            controls: [
                { inputEl: '#page-size-input-velas', prevEl: '#page-prev-velas', nextEl: '#page-next-velas', statusEl: '#page-status-velas' },
                { inputEl: '#page-size-input-bottom-velas', prevEl: '#page-prev-bottom-velas', nextEl: '#page-next-bottom-velas', statusEl: '#page-status-bottom-velas' }
            ]
        });

        const isOutOfStock = card => card.dataset.stock === 'out' || card.classList.contains('sin-stock') || card.querySelector('.badge.out-of-stock, .etiqueta.fuera-de-stock');
        const isNewArrival = card => card.dataset.new === 'true' || card.classList.contains('nueva') || card.querySelector('.badge.novedad, .etiqueta.novedad');

        const applyFilters = () => {
            const query = (searchInput?.value || '').trim().toLowerCase();
            let visibleCount = 0;

            cards.forEach(card => {
                const name = (card.dataset.name || '').toLowerCase();
                const shouldShow = (!query || name.includes(query)) &&
                    (!(stockFilter?.checked) || !isOutOfStock(card)) &&
                    (!(newFilter?.checked) || isNewArrival(card));

                card.style.display = shouldShow ? '' : 'none';
                if (shouldShow) {
                    visibleCount += 1;
                }
            });

            noResults?.classList.toggle('show', visibleCount === 0);
            pager.page = 1;
            pager.refresh();
        };

        cards.forEach(card => {
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
            const openCard = () => App.core.confirmAndOpenWhatsApp({
                number: '78064327',
                message: `Hola! Quisiera saber si tienen disponible la vela ${card.dataset.name || ''}.`,
                confirmationMessage: '¿Desea continuar a WhatsApp para realizar su consulta?'
            });

            card.addEventListener('click', openCard);
            card.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openCard();
                }
            });
        });

        searchInput?.addEventListener('input', applyFilters);
        stockFilter?.addEventListener('change', applyFilters);
        newFilter?.addEventListener('change', applyFilters);
        applyFilters();
    }

    App.viewmodels.velas = {
        initVelasPage
    };
})(window.PerfSuarez);
