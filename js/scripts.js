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
        const normalizePath = (path) => {
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

        const currentPath = normalizePath(window.location.pathname);

        navLinks.forEach(link => {
            try {
                const linkPath = normalizePath(new URL(link.href, window.location.href).pathname);

                if (linkPath === currentPath) {
                    link.classList.add('is-active');
                    link.setAttribute('aria-current', 'page');
                }
            } catch (error) {
                // Ignore malformed URLs
            }
        });
    }

    document.querySelectorAll('main').forEach(main => {
        if (!main.classList.contains('page-shell')) {
            main.classList.add('page-shell');
        }
    });
});
