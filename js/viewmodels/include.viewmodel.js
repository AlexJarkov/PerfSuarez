(function (App) {
    function initIncludes() {
        const includes = document.querySelectorAll('[data-include]');
        if (!includes.length) {
            return;
        }

        const includeScript = document.currentScript || document.querySelector('script[src*="include.js"]');
        let baseUrl = `${window.location.origin}/`;

        if (includeScript) {
            const scriptUrl = new URL(includeScript.getAttribute('src'), window.location.href);
            baseUrl = new URL('..', scriptUrl).href;
        }

        includes.forEach(container => {
            const includePath = App.views.include.normalizeRelativePath(container.getAttribute('data-include'));
            const targetUrl = new URL(includePath, baseUrl).href;

            fetch(targetUrl)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Error ${response.status} al cargar ${targetUrl}`);
                    }
                    return response.text();
                })
                .then(html => {
                    container.innerHTML = html;
                    App.views.include.rewriteAssetPaths(container, baseUrl);
                    App.views.include.executeInlineScripts(container, baseUrl);
                    if (includePath.endsWith('header.html')) {
                        App.viewmodels.common.initGlobalUi();
                        App.viewmodels.search.initHeaderSearchToggle();
                        document.dispatchEvent(new CustomEvent('headerReady'));
                    }
                })
                .catch(error => console.error('Error loading include:', error));
        });
    }

    App.viewmodels.include = {
        initIncludes
    };
})(window.PerfSuarez);
