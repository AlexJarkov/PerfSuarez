(function (window) {
    const PerfSuarez = window.PerfSuarez || {
        core: {},
        config: {},
        models: {},
        views: {},
        viewmodels: {},
        state: {}
    };

    const localhostHosts = new Set(['localhost', '127.0.0.1', '0.0.0.0']);
    const directRouteMap = {
        '/catalogo': '/',
        '/catalogo.html': '/',
        '/perfumes': '/perfumes',
        '/perfumes.html': '/perfumes',
        '/decants': '/decants',
        '/decants.html': '/decants',
        '/armarcombo': '/armarcombo',
        '/armarcombo.html': '/armarcombo',
        '/mysterybox': '/mysterybox',
        '/mysterybox.html': '/mysterybox',
        '/relojes': '/relojes',
        '/relojes.html': '/relojes',
        '/velas': '/velas',
        '/velas.html': '/velas',
        '/contacto': '/contacto',
        '/contacto.html': '/contacto',
        '/search': '/search',
        '/search.html': '/search',
        '/perfume': '/perfume',
        '/perfume.html': '/perfume'
    };

    if (typeof window.DISABLE_SHELL_REDIRECT === 'boolean') {
        PerfSuarez.config.disableShellRedirect = window.DISABLE_SHELL_REDIRECT;
    } else if (typeof PerfSuarez.config.disableShellRedirect !== 'boolean') {
        PerfSuarez.config.disableShellRedirect = false;
    }

    PerfSuarez.core.onReady = function onReady(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback, { once: true });
            return;
        }
        callback();
    };

    PerfSuarez.core.normalizeRoutePath = function normalizeRoutePath(path) {
        if (!path) {
            return '/index.html';
        }

        let normalized = path.replace(/\/+/g, '/');
        normalized = normalized.replace(/(\.html)\/+$/i, '$1');
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

    PerfSuarez.core.resolvePath = function resolvePath(value, baseHref) {
        if (!value) {
            return '';
        }

        if (/^(?:[a-z]+:)?\/\//i.test(value) || value.startsWith('#') || value.startsWith('mailto:') || value.startsWith('tel:') || value.startsWith('javascript:')) {
            return value;
        }

        try {
            return new URL(value, baseHref || window.location.href).href;
        } catch (error) {
            return value;
        }
    };

    PerfSuarez.core.openWhatsApp = function openWhatsApp(number, message, target) {
        const url = `https://wa.me/${number}/?text=${encodeURIComponent(message)}`;
        window.open(url, target || '_blank', 'noopener');
        return url;
    };

    PerfSuarez.core.confirmAndOpenWhatsApp = function confirmAndOpenWhatsApp(options) {
        const confirmation = window.confirm(options.confirmationMessage);
        if (!confirmation) {
            return false;
        }

        PerfSuarez.core.openWhatsApp(options.number, options.message, options.target);
        return true;
    };

    PerfSuarez.core.isLocalEnvironment = function isLocalEnvironment() {
        return localhostHosts.has(window.location.hostname);
    };

    PerfSuarez.core.isShellRedirectDisabled = function isShellRedirectDisabled() {
        return PerfSuarez.config.disableShellRedirect || PerfSuarez.core.isLocalEnvironment();
    };

    PerfSuarez.core.toShellRoute = function toShellRoute(target) {
        const url = new URL(target, window.location.href);
        const normalizedPath = url.pathname.replace(/\/+$/, '') || '/';
        const mappedPath = directRouteMap[normalizedPath] || normalizedPath;
        if (mappedPath === '/index.html') {
            return '/' + (url.search || '');
        }
        return mappedPath + (url.search || '') + (url.hash || '');
    };

    PerfSuarez.core.redirectToShell = function redirectToShell(target) {
        const shellRoute = PerfSuarez.core.toShellRoute(target);
        try {
            window.sessionStorage.setItem('spa-redirect', shellRoute);
        } catch (error) {
            // ignore storage failures
        }
        window.location.replace('/');
        return true;
    };

    PerfSuarez.core.getShellNavigator = function getShellNavigator() {
        if (typeof window.catalogShellNavigate === 'function') {
            return window.catalogShellNavigate;
        }
        if (window.parent && window.parent !== window && typeof window.parent.catalogShellNavigate === 'function') {
            return window.parent.catalogShellNavigate;
        }
        return null;
    };

    PerfSuarez.core.navigateToShell = function navigateToShell(target) {
        const navigator = PerfSuarez.core.getShellNavigator();
        if (navigator && navigator(target)) {
            return true;
        }
        if (!PerfSuarez.core.isShellRedirectDisabled()) {
            return PerfSuarez.core.redirectToShell(target);
        }
        window.location.href = target;
        return true;
    };

    const RETURN_ROUTE_KEY = 'perf-suarez-return-route';

    PerfSuarez.core.getCurrentShellRoute = function getCurrentShellRoute() {
        try {
            const sourceWindow = window.parent && window.parent !== window ? window.parent : window;
            return `${sourceWindow.location.pathname}${sourceWindow.location.search}${sourceWindow.location.hash}`;
        } catch (error) {
            return `${window.location.pathname}${window.location.search}${window.location.hash}`;
        }
    };

    PerfSuarez.core.rememberReturnRoute = function rememberReturnRoute(route) {
        if (!route) {
            return;
        }

        try {
            const url = new URL(route, window.location.origin);
            const normalized = PerfSuarez.core.normalizeRoutePath(url.pathname);
            if (normalized === '/perfume.html') {
                return;
            }
            window.sessionStorage.setItem(RETURN_ROUTE_KEY, `${url.pathname}${url.search}${url.hash}`);
        } catch (error) {
            // ignore malformed routes
        }
    };

    PerfSuarez.core.getRememberedReturnRoute = function getRememberedReturnRoute() {
        try {
            const route = window.sessionStorage.getItem(RETURN_ROUTE_KEY);
            if (!route) {
                return 'catalogo.html';
            }

            const url = new URL(route, window.location.origin);
            const normalized = PerfSuarez.core.normalizeRoutePath(url.pathname);
            return normalized === '/perfume.html' ? 'catalogo.html' : `${url.pathname.replace(/^\//, '')}${url.search}${url.hash}`;
        } catch (error) {
            return 'catalogo.html';
        }
    };

    PerfSuarez.core.navigateBackToCatalog = function navigateBackToCatalog() {
        return PerfSuarez.core.navigateToShell(PerfSuarez.core.getRememberedReturnRoute());
    };

    PerfSuarez.core.navigateToProductDetail = function navigateToProductDetail(id) {
        PerfSuarez.core.rememberReturnRoute(PerfSuarez.core.getCurrentShellRoute());
        return PerfSuarez.core.navigateToShell('perfume.html?id=' + encodeURIComponent(id));
    };

    PerfSuarez.core.navigateToSearch = function navigateToSearch(query) {
        return PerfSuarez.core.navigateToShell('search.html?q=' + encodeURIComponent(query));
    };

    window.PerfSuarez = PerfSuarez;
})(window);
