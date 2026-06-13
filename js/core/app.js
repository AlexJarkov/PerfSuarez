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
        function runWhenDataReady() {
            const dataReady = PerfSuarez.data && PerfSuarez.data.perfumesReady;
            if (dataReady && typeof dataReady.then === 'function') {
                dataReady.then(callback, callback);
                return;
            }

            callback();
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', runWhenDataReady, { once: true });
            return;
        }

        runWhenDataReady();
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

    const SEARCH_ALIASES = [
        [/\bj\s*p\s*g\b/g, ' jean paul gaultier '],
        [/\bjpg\b/g, ' jean paul gaultier '],
        [/\bysl\b/g, ' yves saint laurent '],
        [/\bd\s*&\s*g\b/g, ' dolce gabbana '],
        [/\bd\s+y\s+g\b/g, ' dolce gabbana '],
        [/\bd\s+g\b/g, ' dolce gabbana '],
        [/\bdg\b/g, ' dolce gabbana '],
        [/\bch\b/g, ' carolina herrera '],
        [/\bmnt\s*blanc\b/g, ' montblanc '],
        [/\bmont\s+blanc\b/g, ' montblanc '],
        [/\bpaco\s+rabane\b/g, ' rabanne '],
        [/\bpaco\b/g, ' rabanne '],
        [/\bswy\b/g, ' stronger with you ']
    ];

    function normalizeSearchText(value) {
        let text = String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/&/g, ' y ');

        SEARCH_ALIASES.forEach(([pattern, replacement]) => {
            text = text.replace(pattern, replacement);
        });

        return text
            .replace(/[^a-z0-9]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function tokenizeSearchText(value) {
        const normalized = normalizeSearchText(value);
        return normalized ? normalized.split(' ').filter(Boolean) : [];
    }

    function levenshteinDistance(a, b) {
        if (a === b) {
            return 0;
        }
        if (!a) {
            return b.length;
        }
        if (!b) {
            return a.length;
        }

        const previous = new Array(b.length + 1);
        const current = new Array(b.length + 1);

        for (let i = 0; i <= b.length; i += 1) {
            previous[i] = i;
        }

        for (let i = 1; i <= a.length; i += 1) {
            current[0] = i;
            for (let j = 1; j <= b.length; j += 1) {
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                current[j] = Math.min(
                    current[j - 1] + 1,
                    previous[j] + 1,
                    previous[j - 1] + cost
                );
            }

            for (let j = 0; j <= b.length; j += 1) {
                previous[j] = current[j];
            }
        }

        return previous[b.length];
    }

    function maxTokenDistance(token) {
        if (token.length <= 2) {
            return 0;
        }
        if (token.length <= 5) {
            return 1;
        }
        return 2;
    }

    function scoreToken(token, targetText, targetTokens) {
        if (!token) {
            return 0;
        }

        if (targetTokens.indexOf(token) >= 0) {
            return 12 + token.length;
        }
        if (targetText.indexOf(token) >= 0) {
            return 9 + token.length;
        }
        if (token.length >= 4 && targetTokens.some(targetToken => targetToken.indexOf(token) >= 0 || token.indexOf(targetToken) >= 0)) {
            return 6 + token.length;
        }

        const maxDistance = maxTokenDistance(token);
        if (!maxDistance) {
            return 0;
        }

        let bestDistance = Infinity;
        targetTokens.forEach(targetToken => {
            if (Math.abs(targetToken.length - token.length) > maxDistance) {
                return;
            }
            bestDistance = Math.min(bestDistance, levenshteinDistance(token, targetToken));
        });

        if (bestDistance <= maxDistance) {
            return 5 + token.length - bestDistance;
        }

        return 0;
    }

    function scoreSearchMatch(query, target) {
        const queryText = normalizeSearchText(query);
        if (!queryText) {
            return 0;
        }

        const targetText = normalizeSearchText(target);
        if (!targetText) {
            return 0;
        }

        if (targetText.indexOf(queryText) >= 0) {
            return 100 + queryText.length;
        }

        const queryTokens = tokenizeSearchText(queryText);
        const targetTokens = tokenizeSearchText(targetText);
        let matched = 0;
        let score = 0;

        queryTokens.forEach(token => {
            const tokenScore = scoreToken(token, targetText, targetTokens);
            if (tokenScore > 0) {
                matched += 1;
                score += tokenScore;
            }
        });

        if (!matched) {
            return 0;
        }

        const requiredMatches = queryTokens.length <= 2 ? queryTokens.length : Math.ceil(queryTokens.length * 0.65);
        return matched >= requiredMatches ? score + (matched * 3) : 0;
    }

    PerfSuarez.core.search = {
        normalizeText: normalizeSearchText,
        scoreMatch: scoreSearchMatch,
        matches: function matches(query, target) {
            return scoreSearchMatch(query, target) > 0;
        }
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

    PerfSuarez.core.navigateToCuadroDetail = function navigateToCuadroDetail(id) {
        PerfSuarez.core.rememberReturnRoute(PerfSuarez.core.getCurrentShellRoute());
        return PerfSuarez.core.navigateToShell('perfume.html?id=' + encodeURIComponent(id) + '&tipo=cuadro');
    };

    PerfSuarez.core.navigateToSearch = function navigateToSearch(query) {
        return PerfSuarez.core.navigateToShell('search.html?q=' + encodeURIComponent(query));
    };

    window.PerfSuarez = PerfSuarez;
})(window);
