(function (App) {
    "use strict";

    App.data = App.data || {};
    App.data.perfumes = App.data.perfumes || [];

    var DECANT_PRICE_RULES = {
        "10": 2 * 0.95,
        "15": 3 * 0.90,
        "30": 6 * 0.85
    };

    function roundDecantPriceUp(value) {
        return Math.ceil(value / 10) * 10;
    }

    function normalizeDecantPrices(preciosDecants) {
        if (!preciosDecants) {
            return preciosDecants;
        }

        var normalizedPrices = Object.assign({}, preciosDecants);
        var basePrice = Number(normalizedPrices["5"]);

        if (!Number.isFinite(basePrice)) {
            return normalizedPrices;
        }

        Object.keys(DECANT_PRICE_RULES).forEach(function (size) {
            var current = Number(normalizedPrices[size]);
            // Auto-calculate when the size is missing OR holds a non-positive
            // / invalid value (e.g. a placeholder 0), so a stray 0 in the data
            // never reaches the UI.
            if (Number.isFinite(current) && current > 0) {
                return;
            }

            normalizedPrices[size] = roundDecantPriceUp(basePrice * DECANT_PRICE_RULES[size]);
        });

        return normalizedPrices;
    }

    function ensureDecantPrices(perfumes) {
        perfumes.forEach(function (perfume) {
            if (!perfume || !perfume.precios_decants) {
                return;
            }

            perfume.precios_decants = normalizeDecantPrices(perfume.precios_decants);
        });
    }

    function loadPerfumes() {
        return fetch("js/data/perfumes.json")
            .then(function (response) {
                if (!response.ok) {
                    throw new Error("No se pudo cargar perfumes.json");
                }
                return response.json();
            })
            .then(function (perfumes) {
                if (!Array.isArray(perfumes)) {
                    throw new Error("perfumes.json debe contener un arreglo");
                }

                ensureDecantPrices(perfumes);
                App.data.perfumes = perfumes;
                return perfumes;
            })
            .catch(function (error) {
                console.error(error);
                App.data.perfumes = [];
                return App.data.perfumes;
            });
    }

    App.data.perfumesReady = loadPerfumes();
})(window.PerfSuarez);
