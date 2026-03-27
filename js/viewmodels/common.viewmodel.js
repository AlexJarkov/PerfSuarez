(function (App) {
    function initCatalogNav(navEl) {
        return App.views.common.setupCatalogNav(navEl);
    }

    function initGlobalUi() {
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

        const shouldAutoShell = !document.body.classList.contains('home-hub') && !document.body.classList.contains('swipe-hub');
        if (shouldAutoShell) {
            document.querySelectorAll('main').forEach(main => {
                if (!main.classList.contains('page-shell')) {
                    main.classList.add('page-shell');
                }
            });
        }
    }

    App.viewmodels.common = {
        initCatalogNav,
        initGlobalUi
    };
})(window.PerfSuarez);
