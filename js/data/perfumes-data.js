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

    var MANIFEST_JSON = "js/data/images-manifest.json";
    // Set con las rutas de imagen que el catálogo YA tiene en su CDN.
    // null = manifiesto no disponible (se asume CDN para todo).
    var imageManifest = null;

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

    // Carga el manifiesto de imágenes del CDN del catálogo. Si falla, devuelve
    // null (se asume que toda imagen está en el CDN -> ruta relativa).
    function loadManifest() {
        return fetchJson(MANIFEST_JSON)
            .then(function (arr) { return Array.isArray(arr) ? new Set(arr) : null; })
            .catch(function () { return null; });
    }

    function erpImageUrl(rel) {
        return BASE_URL + "/acciones/catalogo_imagen.php?path=" +
            encodeURIComponent(rel.replace(/^imagenes\//, ""));
    }

    // Enfoque mixto: si la imagen está en el manifiesto del CDN, se usa su ruta
    // relativa (la sirve GitHub Pages); si NO está, se pide al ERP.
    function resolveImagePath(path) {
        if (!path || typeof path !== "string") return path;       // preserva null
        if (/^https?:\/\//i.test(path)) return path;              // ya es absoluta
        // NFC para que coincidan nombres acentuados con el manifiesto.
        var rel = path.replace(/^\/+/, "").normalize("NFC");
        if (!BASE_URL || !imageManifest || imageManifest.has(rel)) {
            return rel;                                            // está en el CDN
        }
        return erpImageUrl(rel);                                  // sólo lo nuevo va al ERP
    }

    function resolveImages(perfumes) {
        perfumes.forEach(function (p) {
            if (!p) return;
            if ("image_miniatura" in p) p.image_miniatura = resolveImagePath(p.image_miniatura);
            if ("image_miniatura_decant" in p) p.image_miniatura_decant = resolveImagePath(p.image_miniatura_decant);
            if ("image_cuadro" in p) p.image_cuadro = resolveImagePath(p.image_cuadro);
            if (Array.isArray(p.images_gallery)) {
                p.images_gallery = p.images_gallery.map(resolveImagePath);
            }
        });
        return perfumes;
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

        // El manifiesto se carga en paralelo (sólo se necesita si hay ERP).
        return Promise.all([source, BASE_URL ? loadManifest() : Promise.resolve(null)])
            .then(function (results) {
                var perfumes = results[0];
                imageManifest = results[1];
                ensureDecantPrices(perfumes);
                resolveImages(perfumes);
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
            resolveImages(data);
            return data;
        });
    };

    // Promesa única consumida por toda la app (App.core.onReady, loadAll, etc.).
    App.data.perfumesReady = loadPerfumes();
    App.data.loadAll = function loadAll() {
        return App.data.perfumesReady;
    };
})(window.PerfSuarez);
