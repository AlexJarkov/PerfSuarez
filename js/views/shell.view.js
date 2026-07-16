(function (App) {
    function updateMeta(meta) {
        if (!meta) {
            return;
        }

        document.title = meta.title;
        document.querySelector('meta[name="description"]')?.setAttribute('content', meta.description);
        document.querySelector('meta[property="og:title"]')?.setAttribute('content', meta.title);
        document.querySelector('meta[property="og:description"]')?.setAttribute('content', meta.description);
        document.querySelector('meta[property="og:url"]')?.setAttribute('content', `https://perfumeriasuarez.com/${meta.slug}`);
        document.querySelector('link[rel="canonical"]')?.setAttribute('href', `https://perfumeriasuarez.com/${meta.slug}`);
        document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', meta.title);
        document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', meta.description);
    }

    // Corre `fn` cuando el navegador esté libre (o tras un timeout corto como
    // fallback), para no competir por red/CPU con la carga del panel activo.
    function schedulePreload(fn) {
        if (typeof window.requestIdleCallback === 'function') {
            window.requestIdleCallback(fn, { timeout: 1500 });
        } else {
            window.setTimeout(fn, 300);
        }
    }

    App.views.shell = {
        updateMeta,
        schedulePreload
    };
})(window.PerfSuarez);
