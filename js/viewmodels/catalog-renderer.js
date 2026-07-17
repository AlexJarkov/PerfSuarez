(function (App) {
    'use strict';

    function buildTagsHtml(perfume, mode) {
        const parts = [];
        const inStock = mode === 'perfumes'
            ? perfume.en_stock_completos
            : mode === 'cuadros'
                ? true
                : perfume.en_stock_decants;

        if (!inStock) {
            parts.push('<span class="etiqueta fuera-de-stock">Fuera de stock</span>');
        }
        if (isOnSale(perfume, mode)) {
            parts.push('<span class="etiqueta oferta">Oferta</span>');
        }
        if (perfume.etiqueta === 'novedad') {
            parts.push('<span class="etiqueta novedad">Nuevo</span>');
        }
        if (perfume.etiqueta === 'a-pedido') {
            parts.push('<span class="etiqueta a-pedido">A Pedido</span>');
        }

        return parts.length ? `<div class="etiquetas">${parts.join('')}</div>` : '';
    }

    // Una entrada de precio en oferta válida: bandera activa, precio de oferta
    // presente y estrictamente menor que el original.
    function ofertaValida(perfume, original, oferta) {
        return !!perfume.oferta
            && oferta != null && oferta !== ''
            && Number(oferta) > 0 && Number(oferta) < Number(original);
    }

    // Renderiza un precio: si está en oferta, original tachado + precio rebajado.
    function priceValueHtml(perfume, original, oferta) {
        if (ofertaValida(perfume, original, oferta)) {
            return `<span class="price-old">${original} Bs</span> <span class="price-sale">${oferta} Bs</span>`;
        }
        return `${original} Bs`;
    }

    function buildPriceHtml(perfume, mode) {
        if (mode === 'cuadros') {
            if (perfume.precio_cuadro == null) return '';
            return `<p class="price-label">Cuadro - ${perfume.precio_cuadro} Bs</p>`;
        }

        if (mode === 'perfumes') {
            const inStock = perfume.en_stock_completos;
            if (!inStock || !perfume.precio_completo) return '';
            const entries = Array.isArray(perfume.precio_completo) ? perfume.precio_completo : [perfume.precio_completo];
            return entries.map(e => {
                const mlPart = e.ml != null ? `${e.ml} <strong>ml - </strong>` : '';
                const cls = ofertaValida(perfume, e.precio, e.precio_oferta) ? 'price-label price-label--oferta' : 'price-label';
                return `<p class="${cls}">${mlPart}${priceValueHtml(perfume, e.precio, e.precio_oferta)}</p>`;
            }).join('');
        }

        // decants
        const inStock = perfume.en_stock_decants;
        if (!inStock || !perfume.precios_decants) return '';

        const ofertas = perfume.precios_decants_oferta || {};
        const sizes = Object.keys(perfume.precios_decants)
            .map(Number)
            .sort((a, b) => a - b);

        return sizes
            .map(s => {
                const original = perfume.precios_decants[s];
                const oferta = ofertas[s];
                const cls = ofertaValida(perfume, original, oferta) ? 'price-label price-label--oferta' : 'price-label';
                return `<p class="${cls}">${s} <strong>ml - </strong>${priceValueHtml(perfume, original, oferta)}</p>`;
            })
            .join('');
    }

    // ¿La entrada está en oferta para el modo actual? (perfumes => completos;
    // decants => decants; cuadros => nunca).
    function isOnSale(perfume, mode) {
        if (!perfume.oferta) return false;
        if (mode === 'decants') {
            const o = perfume.precios_decants_oferta;
            const dec = perfume.precios_decants || {};
            return !!o && Object.keys(o).some(s => ofertaValida(perfume, dec[s], o[s]));
        }
        if (mode === 'perfumes') {
            if (!perfume.precio_completo) return false;
            const entries = Array.isArray(perfume.precio_completo) ? perfume.precio_completo : [perfume.precio_completo];
            return entries.some(e => e && ofertaValida(perfume, e.precio, e.precio_oferta));
        }
        return false;
    }

    function getImage(perfume, mode) {
        if (mode === 'cuadros') {
            // Prefer the dedicated cuadro photo; fall back to the full-bottle catalog photo.
            return perfume.image_cuadro || perfume.image_miniatura || perfume.image_miniatura_decant || 'imagenes/image.webp';
        }
        if (mode === 'perfumes') {
            return perfume.image_miniatura || perfume.image_miniatura_decant || 'imagenes/image.webp';
        }
        return perfume.image_miniatura_decant || perfume.image_miniatura || 'imagenes/image.webp';
    }

    function getSortName(perfume) {
        return perfume.nombre_interno || `${perfume.marca || ''} ${perfume.nombre || ''}`.trim();
    }

    function getSortPrice(perfume, mode) {
        if (mode === 'cuadros') {
            const value = Number(perfume.precio_cuadro);
            return Number.isFinite(value) ? value : Number.NaN;
        }

        if (mode === 'perfumes') {
            if (!perfume.precio_completo) return Number.NaN;
            const entries = Array.isArray(perfume.precio_completo) ? perfume.precio_completo : [perfume.precio_completo];
            const prices = entries.map(e => Number(e.precio)).filter(Number.isFinite);
            return prices.length ? Math.min(...prices) : Number.NaN;
        }

        if (!perfume.precios_decants) {
            return Number.NaN;
        }

        const prices = Object.keys(perfume.precios_decants)
            .map(size => Number(perfume.precios_decants[size]))
            .filter(Number.isFinite);

        return prices.length ? Math.min(...prices) : Number.NaN;
    }

    function getHypeRank(perfume, fallbackIndex) {
        // El ERP es la fuente de verdad del orden: si el API envía `orden`, se usa.
        if (perfume.orden != null && Number.isFinite(Number(perfume.orden))) {
            return Number(perfume.orden);
        }
        // Fallback (modo estático sin ERP): mapa curado (js/data/hype-ranks.json,
        // cargado por perfumes-data.js) y, por último, orden de aparición.
        const hypeRanks = (App.data && App.data.hypeRanks) || {};
        return Object.prototype.hasOwnProperty.call(hypeRanks, perfume.id)
            ? hypeRanks[perfume.id]
            : 1000 + fallbackIndex;
    }

    function compareCardsByName(a, b, direction) {
        const result = (a.dataset.sortName || '').localeCompare(b.dataset.sortName || '', 'es', { sensitivity: 'base' });
        return direction === 'desc' ? -result : result;
    }

    function compareCardsByHype(a, b) {
        const rankDiff = Number(a.dataset.hypeRank) - Number(b.dataset.hypeRank);
        if (rankDiff !== 0) return rankDiff;
        return Number(a.dataset.hypeIndex) - Number(b.dataset.hypeIndex);
    }

    function compareCardsByPrice(a, b, direction) {
        const aPrice = Number(a.dataset.sortPrice);
        const bPrice = Number(b.dataset.sortPrice);
        const aHasPrice = Number.isFinite(aPrice);
        const bHasPrice = Number.isFinite(bPrice);

        if (aHasPrice && bHasPrice) {
            return direction === 'desc' ? bPrice - aPrice : aPrice - bPrice;
        }
        if (aHasPrice) return -1;
        if (bHasPrice) return 1;
        return compareCardsByName(a, b, 'asc');
    }

    function sortCards(cards, sortValue, gridEl) {
        const sorted = cards.slice().sort((a, b) => {
            if (sortValue === 'name-asc') return compareCardsByName(a, b, 'asc');
            if (sortValue === 'name-desc') return compareCardsByName(a, b, 'desc');
            if (sortValue === 'price-asc') return compareCardsByPrice(a, b, 'asc');
            if (sortValue === 'price-desc') return compareCardsByPrice(a, b, 'desc');
            return compareCardsByHype(a, b);
        });

        if (gridEl) {
            sorted.forEach(card => gridEl.appendChild(card));
        }

        return sorted;
    }

    function getCardSearchText(card) {
        return [
            card.dataset.name,
            card.dataset.tags,
            card.dataset.brand,
            card.textContent
        ].join(' ');
    }

    // Ordena por relevancia de búsqueda cuando hay término y el orden activo es
    // el predeterminado ("Más deseados"). Las mejores coincidencias (marca/nombre
    // exactos) quedan arriba; ante empate se respeta el orden del ERP (hype/orden).
    // Con un orden explícito (nombre/precio) o sin término, delega en sortCards.
    function sortCardsForQuery(cards, query, sortValue, gridEl) {
        const q = App.core.search.normalizeText(query || '');
        const useRelevance = q && (!sortValue || sortValue === 'hype');
        if (!useRelevance) {
            return sortCards(cards, sortValue, gridEl);
        }

        const sorted = cards.slice()
            .map((card, index) => ({ card, index, score: App.core.search.scoreMatch(q, getCardSearchText(card)) }))
            .sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                return compareCardsByHype(a.card, b.card);
            })
            .map(entry => entry.card);

        if (gridEl) {
            sorted.forEach(card => gridEl.appendChild(card));
        }

        return sorted;
    }

    function renderCard(perfume, mode, hypeIndex) {
        const img = getImage(perfume, mode);
        const tags = perfume.tags.join(' ');
        const priceHtml = buildPriceHtml(perfume, mode);
        const tagsHtml = buildTagsHtml(perfume, mode);
        const viewButtonHtml = mode === 'perfumes' || mode === 'decants' || mode === 'cuadros'
            ? '<button class="card-view-btn" type="button">Ver</button>'
            : '';
        const sortPrice = getSortPrice(perfume, mode);
        const priceAttr = Number.isFinite(sortPrice) ? String(sortPrice) : '';
        const hypeRank = getHypeRank(perfume, hypeIndex);
        const onSale = isOnSale(perfume, mode) ? '1' : '0';

        return `<div class="decant" data-name="${perfume.nombre_interno}" data-tags="${tags}" data-id="${perfume.id}" data-hype-index="${hypeIndex}" data-hype-rank="${hypeRank}" data-sort-name="${getSortName(perfume)}" data-sort-price="${priceAttr}" data-on-sale="${onSale}">
            <img src="${img}" alt="${perfume.nombre}" loading="lazy" decoding="async">
            <h3><strong>${perfume.marca}</strong></h3>
            <p>${perfume.nombre}</p>
            ${priceHtml}
            ${tagsHtml}
            ${viewButtonHtml}
        </div>`;
    }

    function renderCatalog(gridEl, mode) {
        if (!App.data || !App.data.perfumes) return [];

        const perfumes = App.data.perfumes.filter(p => {
            if (mode === 'perfumes') return p.precio_completo !== null || p.en_stock_completos === false;
            if (mode === 'decants') return p.precios_decants !== null || p.en_stock_decants === false;
            if (mode === 'cuadros') return p.precio_cuadro != null;
            return true;
        });

        // Filter: for perfumes mode, only include items that have precio_completo OR were listed as perfumes (have image_miniatura)
        const filtered = perfumes.filter(p => {
            if (mode === 'perfumes') return p.image_miniatura !== null;
            if (mode === 'decants') return p.image_miniatura_decant !== null || p.precios_decants !== null;
            if (mode === 'cuadros') return p.precio_cuadro != null;
            return true;
        });

        gridEl.innerHTML = filtered.map((p, index) => renderCard(p, mode, index)).join('');
        return Array.from(gridEl.querySelectorAll('.decant'));
    }

    function bindCardNavigation(gridEl) {
        gridEl.addEventListener('click', function (event) {
            var card = event.target.closest('.decant');
            if (!card) return;
            var id = card.getAttribute('data-id');
            if (id) {
                App.core.navigateToProductDetail(id);
            }
        });
    }

    App.viewmodels = App.viewmodels || {};
    App.viewmodels.catalogRenderer = {
        renderCatalog: renderCatalog,
        bindCardNavigation: bindCardNavigation,
        sortCards: sortCards,
        sortCardsForQuery: sortCardsForQuery
    };
})(window.PerfSuarez);
