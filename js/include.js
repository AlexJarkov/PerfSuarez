document.addEventListener('DOMContentLoaded', () => {
    const includes = document.querySelectorAll('[data-include]');
    if (!includes.length) {
        return;
    }

    const includeScript = document.currentScript || document.querySelector('script[src*="include.js"]');
    let baseUrl = window.location.origin + '/';

    if (includeScript) {
        const scriptUrl = new URL(includeScript.getAttribute('src'), window.location.href);
        baseUrl = new URL('..', scriptUrl).href;
    }

    const normalizeRelativePath = (value) => {
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
    };

    const toAbsoluteUrl = (value) => {
        if (!value) {
            return value;
        }
        if (/^(?:[a-z]+:)?\/\//i.test(value) || value.startsWith('#') || value.startsWith('mailto:') || value.startsWith('tel:') || value.startsWith('javascript:')) {
            return value;
        }

        const normalized = normalizeRelativePath(value);
        return new URL(normalized, baseUrl).href;
    };

    const rewriteAssetPaths = (root) => {
        const updateAttribute = (selector, attribute) => {
            root.querySelectorAll(selector).forEach(node => {
                const original = node.getAttribute(attribute);
                const absolute = toAbsoluteUrl(original);
                if (absolute && absolute !== original) {
                    node.setAttribute(attribute, absolute);
                }
            });
        };

        updateAttribute('[src]', 'src');
        updateAttribute('[href]', 'href');
        updateAttribute('form[action]', 'action');
    };

    const executeInlineScripts = (root) => {
        const scripts = root.querySelectorAll('script');
        scripts.forEach(script => {
            const newScript = document.createElement('script');
            const src = script.getAttribute('src');

            if (src) {
                newScript.src = toAbsoluteUrl(src);
            } else {
                newScript.textContent = script.textContent;
            }

            document.body.appendChild(newScript);
            script.remove();
        });
    };

    includes.forEach(container => {
        const includePath = normalizeRelativePath(container.getAttribute('data-include'));
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
                rewriteAssetPaths(container);
                executeInlineScripts(container);

                if (includePath.endsWith('header.html')) {
                    const menuToggle = document.getElementById('menu-toggle');
                    const menu = document.getElementById('menu');
                    let overlay = document.getElementById('overlay');

                    if (overlay && overlay.parentElement !== document.body) {
                        overlay.parentElement.removeChild(overlay);
                        document.body.appendChild(overlay);
                    }

                    if (menuToggle && menu && overlay) {
                        menuToggle.addEventListener('click', () => {
                            menu.classList.toggle('show');
                            overlay.classList.toggle('show');
                        });
                        overlay.addEventListener('click', () => {
                            menu.classList.remove('show');
                            overlay.classList.remove('show');
                        });
                    }
                }
            })
            .catch(error => console.error('Error loading include:', error));
    });
});
