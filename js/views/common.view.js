(function (App) {
    function setupCatalogNav(navEl) {
        if (!navEl || navEl.dataset.catalogNavReady === 'true') {
            return navEl?.catalogNavApi;
        }

        navEl.dataset.catalogNavReady = 'true';
        document.body.classList.add('catalog-nav-visible');
        const links = Array.from(navEl.querySelectorAll('.catalog-dock__link'));

        function getLinkPath(link) {
            const targetValue = link?.dataset.target || link?.getAttribute('href');
            if (!targetValue) {
                return null;
            }

            try {
                return App.core.normalizeRoutePath(new URL(targetValue, window.location.href).pathname);
            } catch (error) {
                return App.core.normalizeRoutePath(targetValue);
            }
        }

        function setActiveByPath(path) {
            const normalized = App.core.normalizeRoutePath(path);
            let matched = false;

            links.forEach(link => {
                const linkPath = getLinkPath(link);
                const isActive = linkPath === normalized;
                link.classList.toggle('is-active', isActive);
                if (isActive) {
                    link.setAttribute('aria-current', 'page');
                    matched = true;
                } else {
                    link.removeAttribute('aria-current');
                }
            });

            if (!matched) {
                links.forEach(link => link.classList.remove('is-active'));
            }
        }

        navEl.addEventListener('keydown', event => {
            if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) {
                return;
            }

            event.preventDefault();
            const current = document.activeElement;
            const index = links.indexOf(current);
            let nextIndex = index;

            if (event.key === 'ArrowRight') {
                nextIndex = (index + 1) % links.length;
            } else if (event.key === 'ArrowLeft') {
                nextIndex = (index - 1 + links.length) % links.length;
            } else if (event.key === 'Home') {
                nextIndex = 0;
            } else if (event.key === 'End') {
                nextIndex = links.length - 1;
            }

            links[nextIndex]?.focus();
        });

        setActiveByPath(window.location.pathname);

        const api = {
            setActiveByPath,
            setActiveByHref(href) {
                try {
                    setActiveByPath(new URL(href, window.location.href).pathname);
                } catch (error) {
                    // ignore invalid href
                }
            }
        };

        navEl.catalogNavApi = api;
        return api;
    }

    function setMenuState(menuToggle, menuPanel, overlay, isOpen) {
        menuPanel.classList.toggle('show', isOpen);
        menuToggle.classList.toggle('open', isOpen);
        menuToggle.setAttribute('aria-expanded', String(isOpen));
        overlay?.classList.toggle('show', isOpen);
        document.body.classList.toggle('nav-open', isOpen);
    }

    App.views.common = {
        setMenuState,
        setupCatalogNav
    };
})(window.PerfSuarez);
