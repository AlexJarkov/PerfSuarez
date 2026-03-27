(function (App) {
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
        initHomeActions
    };
})(window.PerfSuarez);
