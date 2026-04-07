(function (App) {
    function searchPerfumes(query) {
        if (!App.data || !App.data.perfumes) return [];
        var q = query.toLowerCase().trim();
        if (!q) return [];
        return App.data.perfumes.filter(function (p) {
            if (p.nombre_interno && p.nombre_interno.toLowerCase().includes(q)) return true;
            if (p.marca && p.marca.toLowerCase().includes(q)) return true;
            if (p.nombre && p.nombre.toLowerCase().includes(q)) return true;
            if (p.tags && p.tags.some(function (t) { return t.toLowerCase().includes(q); })) return true;
            if (p.notas && p.notas.generales && p.notas.generales.some(function (n) { return n.toLowerCase().includes(q); })) return true;
            return false;
        });
    }

    App.models.search = {
        searchPerfumes
    };
})(window.PerfSuarez);
