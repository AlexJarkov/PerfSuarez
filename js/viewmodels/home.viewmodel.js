(function (App) {
    function initHomeSearch() {
        const searchForm = document.querySelector('.home-search');
        const searchInput = document.getElementById('home-search-input');
        if (!searchForm || !searchInput || searchForm.dataset.ready === 'true') {
            return;
        }

        searchForm.dataset.ready = 'true';

        searchForm.addEventListener('submit', event => {
            const query = searchInput.value.trim();
            if (!query) {
                event.preventDefault();
                searchInput.focus();
                return;
            }

            event.preventDefault();
            searchInput.value = query;
            App.core.navigateToSearch(query);
        });
    }

    function initHomeActions() {
        const actions = document.querySelectorAll('.home-action[data-shell-target]');
        if (!actions.length) {
            return;
        }

        actions.forEach(action => {
            action.addEventListener('click', event => {
                const target = action.dataset.shellTarget;
                if (!target) {
                    return;
                }

                const parentNav = window.parent && window.parent !== window && window.parent.catalogShellNavigate;
                if (typeof parentNav === 'function' && parentNav(target)) {
                    event.preventDefault();
                }
            });
        });
    }

    App.viewmodels.home = {
        initHomeSearch,
        initHomeActions
    };

    App.core.onReady(initHomeSearch);
    App.core.onReady(initHomeActions);
})(window.PerfSuarez);
