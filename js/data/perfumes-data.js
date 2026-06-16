(function (App) {
    "use strict";

    App.data = App.data || {};
    App.data.perfumes = App.data.perfumes || [];

    var DECANT_PRICE_RULES = {
        "10": 2 * 0.95,
        "15": 3 * 0.90,
        "30": 6 * 0.85
    };

    // URL base del ERP (fuente de verdad del catálogo). Vacío => fallback estático.
    var BASE_URL = (typeof window.CATALOG_BASE_URL === "string" ? window.CATALOG_BASE_URL : "")
        .trim().replace(/\/+$/, "");
    var API_PATH = "/acciones/catalogo_api.php";
    var STATIC_JSON = "js/data/perfumes.json";
    var PAGE_SIZE = 100;

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

    function apiUrl(page) {
        return BASE_URL + API_PATH + "?page=" + page + "&limit=" + PAGE_SIZE;
    }

    function fetchJson(url) {
        return fetch(url, { headers: { Accept: "application/json" } }).then(function (response) {
            if (!response.ok) {
                throw new Error("HTTP " + response.status + " en " + url);
            }
            return response.json();
        });
    }

    // Carga progresiva (lazy) desde el endpoint del ERP: trae la primera página y
    // luego el resto en paralelo. Acumula todo en App.data.perfumes.
    function loadFromEndpoint() {
        return fetchJson(apiUrl(1)).then(function (first) {
            if (!first || !Array.isArray(first.data)) {
                throw new Error("Respuesta inválida del endpoint");
            }

            var totalPages = Number(first.totalPages) || 1;
            var all = first.data.slice();

            if (totalPages <= 1) {
                return all;
            }

            var requests = [];
            for (var page = 2; page <= totalPages; page++) {
                requests.push(fetchJson(apiUrl(page)));
            }

            return Promise.all(requests).then(function (pages) {
                pages.forEach(function (payload) {
                    if (payload && Array.isArray(payload.data)) {
                        all = all.concat(payload.data);
                    }
                });
                return all;
            });
        }).then(function (all) {
            App.data.source = "erp";
            return all;
        });
    }

    function loadStatic() {
        return fetchJson(STATIC_JSON).then(function (perfumes) {
            if (!Array.isArray(perfumes)) {
                throw new Error("perfumes.json debe contener un arreglo");
            }
            App.data.source = "static";
            return perfumes;
        });
    }

    function loadPerfumes() {
        var source = BASE_URL
            ? loadFromEndpoint().catch(function (error) {
                console.warn("Catálogo: falló el endpoint del ERP, usando JSON estático.", error);
                return loadStatic();
            })
            : loadStatic();

        return source
            .then(function (perfumes) {
                ensureDecantPrices(perfumes);
                App.data.perfumes = perfumes;
                return perfumes;
            })
            .catch(function (error) {
                console.error(error);
                App.data.perfumes = [];
                App.data.source = "none";
                return App.data.perfumes;
            });
    }

    /**
     * Búsqueda server-side opcional contra el endpoint del ERP.
     * Devuelve una promesa con el arreglo de resultados (no muta App.data).
     * Si no hay BASE_URL, filtra localmente sobre App.data.perfumes.
     */
    App.data.searchRemote = function searchRemote(query, opts) {
        opts = opts || {};
        var limit = opts.limit || 60;
        if (!BASE_URL) {
            var q = String(query || "").toLowerCase();
            return Promise.resolve(App.data.perfumes.filter(function (p) {
                return JSON.stringify(p).toLowerCase().indexOf(q) >= 0;
            }).slice(0, limit));
        }
        var url = BASE_URL + API_PATH + "?page=1&limit=" + limit + "&q=" + encodeURIComponent(query || "");
        return fetchJson(url).then(function (payload) {
            var data = (payload && Array.isArray(payload.data)) ? payload.data : [];
            ensureDecantPrices(data);
            return data;
        });
    };

    // Promesa única consumida por toda la app (App.core.onReady, loadAll, etc.).
    App.data.perfumesReady = loadPerfumes();
    App.data.loadAll = function loadAll() {
        return App.data.perfumesReady;
    };
})(window.PerfSuarez);
