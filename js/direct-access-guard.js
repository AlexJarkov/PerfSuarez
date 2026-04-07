(function () {
    var disableShellRedirect = typeof window.DISABLE_SHELL_REDIRECT === 'boolean'
        ? window.DISABLE_SHELL_REDIRECT
        : !!(window.PerfSuarez && window.PerfSuarez.config && window.PerfSuarez.config.disableShellRedirect);
    var localhostHosts = {
        'localhost': true,
        '127.0.0.1': true,
        '0.0.0.0': true
    };
    var routeMap = {
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

    if (window.top !== window.self) {
        return;
    }

    if (disableShellRedirect || localhostHosts[window.location.hostname]) {
        return;
    }

    var pathname = window.location.pathname.replace(/\/+$/, '') || '/';
    if (pathname === '/' || pathname === '/index.html') {
        return;
    }

    var shellPath = routeMap[pathname];
    if (!shellPath) {
        return;
    }

    try {
        window.sessionStorage.setItem('spa-redirect', shellPath + window.location.search + window.location.hash);
    } catch (error) {
        // ignore storage failures
    }

    window.location.replace('/');
})();
