(function (App) {
    function syncViewportHeight() {
        const viewport = window.visualViewport;
        const nextHeight = Math.round(viewport?.height || window.innerHeight || document.documentElement.clientHeight || 0);
        if (!nextHeight) {
            return;
        }

        document.documentElement.style.setProperty('--app-height', `${nextHeight}px`);
    }

    function syncEmbeddedHeaderOffset() {
        if (!(window.parent && window.parent !== window)) {
            document.documentElement.style.removeProperty('--shell-embed-top-offset');
            return;
        }

        try {
            const parentDoc = window.parent.document;
            const headerShell = parentDoc.querySelector('.header-shell');
            const siteHeader = parentDoc.querySelector('header.site-header');
            const headerRect = headerShell?.getBoundingClientRect() || siteHeader?.getBoundingClientRect();
            const headerBottom = Math.max(0, Math.round(headerRect?.bottom || 0));
            const offset = headerBottom ? headerBottom + 12 : 0;

            if (offset) {
                document.documentElement.style.setProperty('--shell-embed-top-offset', `${offset}px`);
            } else {
                document.documentElement.style.removeProperty('--shell-embed-top-offset');
            }
        } catch (error) {
            document.documentElement.style.removeProperty('--shell-embed-top-offset');
        }
    }

    function initCatalogNav(navEl) {
        return App.views.common.setupCatalogNav(navEl);
    }

    function initGlobalUi() {
        syncViewportHeight();
        syncEmbeddedHeaderOffset();
        document.body.classList.toggle('is-shell-embed', window.parent && window.parent !== window);

        const combos = document.querySelectorAll('.combo');
        combos.forEach(combo => {
            if (combo.dataset.comboReady === 'true') {
                return;
            }
            combo.dataset.comboReady = 'true';
            combo.addEventListener('click', event => {
                event.preventDefault();
                const whatsappNumber = combo.getAttribute('data-whatsapp');
                const comboName = combo.getAttribute('data-combo');
                App.core.confirmAndOpenWhatsApp({
                    number: whatsappNumber,
                    message: `Hola! Quisiera pedir el ${comboName}!`,
                    confirmationMessage: '¿Desea continuar a WhatsApp para realizar su consulta?'
                });
            });
        });

        const menuToggle = document.getElementById('menu-toggle');
        const menuPanel = document.getElementById('menu');
        const overlay = document.getElementById('overlay');

        if (menuToggle && menuPanel && menuToggle.dataset.menuReady !== 'true') {
            menuToggle.dataset.menuReady = 'true';
            const closeMenu = () => {
                if (menuPanel.classList.contains('show')) {
                    App.views.common.setMenuState(menuToggle, menuPanel, overlay, false);
                }
            };

            menuToggle.addEventListener('click', () => {
                const isOpen = !menuPanel.classList.contains('show');
                App.views.common.setMenuState(menuToggle, menuPanel, overlay, isOpen);
            });

            overlay?.addEventListener('click', closeMenu);
            menuPanel.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
            document.addEventListener('keydown', event => {
                if (event.key === 'Escape') {
                    closeMenu();
                }
            });
            window.addEventListener('resize', () => {
                if (window.innerWidth > 960) {
                    App.views.common.setMenuState(menuToggle, menuPanel, overlay, false);
                }
            });
        }

        const navLinks = document.querySelectorAll('.nav-link');
        const brandLinks = document.querySelectorAll('.brand');
        const currentPath = App.core.normalizeRoutePath(window.location.pathname);
        navLinks.forEach(link => {
            try {
                const linkPath = App.core.normalizeRoutePath(new URL(link.href, window.location.href).pathname);
                if (linkPath === currentPath) {
                    link.classList.add('is-active');
                    link.setAttribute('aria-current', 'page');
                }
            } catch (error) {
                // ignore malformed urls
            }
        });

        function bindShellLink(link) {
            if (!link || link.dataset.shellReady === 'true') {
                return;
            }

            link.dataset.shellReady = 'true';
            link.addEventListener('click', event => {
                const href = link.getAttribute('href');
                if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) {
                    return;
                }

                if (App.core.navigateToShell(href)) {
                    event.preventDefault();
                }
            });
        }

        navLinks.forEach(bindShellLink);
        brandLinks.forEach(bindShellLink);

        const shouldAutoShell = !document.body.classList.contains('home-hub') && !document.body.classList.contains('swipe-hub');
        if (shouldAutoShell) {
            document.querySelectorAll('main').forEach(main => {
                if (!main.classList.contains('page-shell')) {
                    main.classList.add('page-shell');
                }
            });
        }

        App.viewmodels.cart?.initCartUi();
    }

    window.addEventListener('resize', syncViewportHeight);
    window.addEventListener('orientationchange', syncViewportHeight);
    window.visualViewport?.addEventListener('resize', syncViewportHeight);
    window.visualViewport?.addEventListener('scroll', syncViewportHeight);
    window.addEventListener('resize', syncEmbeddedHeaderOffset);
    window.addEventListener('orientationchange', syncEmbeddedHeaderOffset);
    window.visualViewport?.addEventListener('resize', syncEmbeddedHeaderOffset);

    App.viewmodels.common = {
        initCatalogNav,
        initGlobalUi,
        syncViewportHeight,
        syncEmbeddedHeaderOffset
    };
})(window.PerfSuarez);
