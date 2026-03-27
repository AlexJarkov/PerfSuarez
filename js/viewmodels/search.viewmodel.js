(function (App) {
    const SEARCH_FILES = ['../decants.html', '../perfumes.html'];

    function initHeaderSearchToggle() {
        const searchIcon = document.getElementById('search-icon');
        const searchInput = document.getElementById('search-input');

        if (!searchIcon || !searchInput || searchIcon.dataset.searchReady === 'true') {
            return;
        }
        searchIcon.dataset.searchReady = 'true';

        searchIcon.addEventListener('click', event => {
            if (searchInput.value.trim()) {
                return;
            }

            event.preventDefault();
            searchInput.classList.toggle('active');
            searchInput.focus();
        });
    }

    function bindSearchResultClicks(root) {
        root.querySelectorAll('.decant').forEach(decant => {
            if (decant.dataset.searchClickReady === 'true') {
                return;
            }
            decant.dataset.searchClickReady = 'true';
            decant.addEventListener('click', () => {
                const name = decant.getAttribute('data-name') || '';
                App.core.confirmAndOpenWhatsApp({
                    number: '78064327',
                    message: `Hola! Quisiera saber si tienen disponible el decant del ${name}!`,
                    confirmationMessage: '¿Desea continuar a WhatsApp para realizar su consulta?'
                });
            });
        });
    }

    async function initSearchResultsPage() {
        const queryElement = document.getElementById('search-query');
        const decantsContainer = document.getElementById('decants');
        if (!queryElement || !decantsContainer) {
            return;
        }

        const query = (new URLSearchParams(window.location.search).get('q') || '').toLowerCase();
        App.views.search.renderSearchQuery(queryElement, query);

        const results = await App.models.search.searchPages(SEARCH_FILES, query);
        const decants = results.filter(result => result.type === 'decant').map(result => result.node);
        const perfumes = results.filter(result => result.type === 'perfume').map(result => result.node);
        const combined = decants.concat(perfumes);

        App.views.search.renderSearchResults(
            decantsContainer,
            combined,
            'Perdón pariente... No tenemos resultados que coincidan con tu búsqueda :(.'
        );

        bindSearchResultClicks(decantsContainer);
    }

    App.viewmodels.search = {
        initHeaderSearchToggle,
        initSearchResultsPage
    };
})(window.PerfSuarez);
