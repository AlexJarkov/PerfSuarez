(function (App) {
    function getNotesText(notes) {
        if (!notes) {
            return '';
        }

        return ['generales', 'salida', 'corazon', 'fondo']
            .reduce(function (parts, key) {
                return parts.concat(Array.isArray(notes[key]) ? notes[key] : []);
            }, [])
            .join(' ');
    }

    function getPerfumeSearchText(perfume) {
        return [
            perfume.id,
            perfume.nombre_interno,
            perfume.marca,
            perfume.nombre,
            Array.isArray(perfume.tags) ? perfume.tags.join(' ') : '',
            getNotesText(perfume.notas)
        ].join(' ');
    }

    function searchPerfumes(query) {
        if (!App.data || !App.data.perfumes) return [];
        var q = App.core.search.normalizeText(query);
        if (!q) return [];

        return App.data.perfumes
            .map(function (perfume, index) {
                var score = App.core.search.scoreMatch(q, getPerfumeSearchText(perfume));
                return { perfume: perfume, score: score, index: index };
            })
            .filter(function (entry) { return entry.score > 0; })
            .sort(function (a, b) {
                if (b.score !== a.score) return b.score - a.score;
                return a.index - b.index;
            })
            .map(function (entry) { return entry.perfume; });
    }

    App.models.search = {
        getPerfumeSearchText,
        searchPerfumes
    };
})(window.PerfSuarez);
