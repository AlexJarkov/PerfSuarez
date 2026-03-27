(function (App) {
    function normalizeRelativePath(value) {
        if (!value) {
            return '';
        }

        if (/^(?:[a-z]+:)?\/\//i.test(value) || value.startsWith('#') || value.startsWith('mailto:') || value.startsWith('tel:') || value.startsWith('javascript:')) {
            return value;
        }

        let normalized = value.trim().replace(/\\/g, '/');
        normalized = normalized.replace(/^\/+/g, '');
        normalized = normalized.replace(/^(\.\/)+/, '');
        while (normalized.startsWith('../')) {
            normalized = normalized.substring(3);
        }
        return normalized;
    }

    function rewriteAssetPaths(root, baseUrl) {
        const updateAttribute = (selector, attribute) => {
            root.querySelectorAll(selector).forEach(node => {
                const original = node.getAttribute(attribute);
                const absolute = App.core.resolvePath(normalizeRelativePath(original), baseUrl);
                if (absolute && absolute !== original) {
                    node.setAttribute(attribute, absolute);
                }
            });
        };

        updateAttribute('[src]', 'src');
        updateAttribute('[href]', 'href');
        updateAttribute('form[action]', 'action');
    }

    function executeInlineScripts(root, baseUrl) {
        root.querySelectorAll('script').forEach(script => {
            const newScript = document.createElement('script');
            const src = script.getAttribute('src');

            if (src) {
                newScript.src = App.core.resolvePath(normalizeRelativePath(src), baseUrl);
            } else {
                newScript.textContent = script.textContent;
            }

            document.body.appendChild(newScript);
            script.remove();
        });
    }

    App.views.include = {
        executeInlineScripts,
        normalizeRelativePath,
        rewriteAssetPaths
    };
})(window.PerfSuarez);
