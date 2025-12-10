const normalizeRoutePath = (path) => {
    if (!path) {
        return '/index.html';
    }
    let normalized = path.replace(/\/+/g, '/');
    if (!normalized.startsWith('/')) {
        normalized = `/${normalized}`;
    }
    if (normalized === '/' || normalized === '') {
        return '/index.html';
    }
    if (normalized.endsWith('/')) {
        return `${normalized}index.html`;
    }
    return normalized;
};

window.initCatalogNav = function initCatalogNav(navEl) {
    if (!navEl || navEl.dataset.catalogNavReady === 'true') {
        return navEl?.catalogNavApi;
    }
    navEl.dataset.catalogNavReady = 'true';
    document.body.classList.add('catalog-nav-visible');

    const links = Array.from(navEl.querySelectorAll('.catalog-dock__link'));

    const getLinkPath = (link) => {
        if (!link) {
            return null;
        }
        const targetValue = link.dataset.target || link.getAttribute('href');
        if (!targetValue) {
            return null;
        }
        try {
            return normalizeRoutePath(new URL(targetValue, window.location.href).pathname);
        } catch (error) {
            return normalizeRoutePath(targetValue);
        }
    };

    const setActiveByPath = (path) => {
        const normalized = normalizeRoutePath(path);
        let matched = false;
        links.forEach(link => {
            const linkPath = getLinkPath(link);
            if (!linkPath) {
                link.classList.remove('is-active');
                link.removeAttribute('aria-current');
                return;
            }
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
    };

    setActiveByPath(window.location.pathname);

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

    const api = {
        setActiveByPath,
        setActiveByHref: (href) => {
            try {
                const normalized = normalizeRoutePath(new URL(href, window.location.href).pathname);
                setActiveByPath(normalized);
            } catch (error) {
                // ignore invalid hrefs
            }
        }
    };

    navEl.catalogNavApi = api;
    return api;
};


document.addEventListener('DOMContentLoaded', () => {

    const combos = document.querySelectorAll('.combo');

    combos.forEach(combo => {
        combo.addEventListener('click', (e) => {
            e.preventDefault();
            const whatsappNumber = combo.getAttribute('data-whatsapp');
            const nomCombo = combo.getAttribute('data-combo');
            const confirmation = confirm('¿Desea continuar a WhatsApp para realizar su consulta?');

            if (confirmation) {
                window.open(`https://wa.me/${whatsappNumber}/?text=Hola!%20Quisiera%20pedir%20el%20${nomCombo}!`, '_blank');
            }
        });
    });

});

document.addEventListener('DOMContentLoaded', () => {
    const perfumes = document.querySelectorAll('.perfume');

    // Añade un filtro basado en etiquetas
    const filterPerfumes = (tag) => {
        perfumes.forEach(perfume => {
            if (perfume.getAttribute('data-tags').includes(tag)) {
                perfume.style.display = 'block';
            } else {
                perfume.style.display = 'none';
            }
        });
    };

    // Ejemplo de uso del filtro
    // filterPerfumes('mas-vendido'); // Muestra solo los perfumes con la etiqueta "más vendido"
});

document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menu-toggle');
    const menuPanel = document.getElementById('menu');
    const overlay = document.getElementById('overlay');

    if (menuToggle && menuPanel) {
        const setMenuState = (isOpen) => {
            menuPanel.classList.toggle('show', isOpen);
            menuToggle.classList.toggle('open', isOpen);
            menuToggle.setAttribute('aria-expanded', String(isOpen));
            if (overlay) {
                overlay.classList.toggle('show', isOpen);
            }
            document.body.classList.toggle('nav-open', isOpen);
        };

        const toggleMenu = () => {
            const isOpen = !menuPanel.classList.contains('show');
            setMenuState(isOpen);
        };

        const closeMenu = () => {
            if (menuPanel.classList.contains('show')) {
                setMenuState(false);
            }
        };

        menuToggle.addEventListener('click', toggleMenu);

        if (overlay) {
            overlay.addEventListener('click', closeMenu);
        }

        menuPanel.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeMenu);
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeMenu();
            }
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 960) {
                setMenuState(false);
            }
        });
    }

    const navLinks = document.querySelectorAll('.nav-link');

    if (navLinks.length) {
        const currentPath = normalizeRoutePath(window.location.pathname);

        navLinks.forEach(link => {
            try {
                const linkPath = normalizeRoutePath(new URL(link.href, window.location.href).pathname);

                if (linkPath === currentPath) {
                    link.classList.add('is-active');
                    link.setAttribute('aria-current', 'page');
                }
            } catch (error) {
                // Ignore malformed URLs
            }
        });
    }

    const shouldAutoShell = !document.body.classList.contains('home-hub') && !document.body.classList.contains('swipe-hub');
    if (shouldAutoShell) {
        document.querySelectorAll('main').forEach(main => {
            if (!main.classList.contains('page-shell')) {
                main.classList.add('page-shell');
            }
        });
    }
});
