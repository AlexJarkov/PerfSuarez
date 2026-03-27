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

    App.views.shell = {
        updateMeta
    };
})(window.PerfSuarez);
