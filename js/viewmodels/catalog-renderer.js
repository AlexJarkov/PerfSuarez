(function (App) {
    'use strict';

    const BEST_SELLER_RANKS = {
        'sauvage-eau-de-parfum-dior': 1,
        'myslf-yves-saint-laurent': 2,
        'myslf-eau-de-parfum-yves-saint-laurent': 3,
        'khamrah-lattafa': 4,
        'liquid-brun-french-avenue': 5,
        'bleu-de-chanel-eau-de-toilette-chanel': 6,
        'bleu-de-chanel-parfum-chanel': 7,
        'donna-born-in-roma-intense-valentino': 8,
        'stronger-with-you-intensely-emporio-armani': 9,
        'khamrah-qahwa-lattafa': 10,
        'imagination-louis-vuitton': 11,
        'le-male-elixir-jean-paul-gaultier': 12,
        'le-male-le-parfum-jean-paul-gaultier': 13,
        'angel-s-share-kilian': 14,
        'y-eau-de-parfum-yves-saint-laurent': 15,
        'y-edp-yves-saint-laurent': 16,
        'xj-1861-naxos-xerjoff': 17,
        'club-de-nuit-intense-armaf': 18,
        'by-the-fireplace-maison-margiela': 19,
        'le-beau-le-parfum-jean-paul-gaultier': 20,
        'myslf-le-parfum-yves-saint-laurent': 21,
        'jazz-club-maison-margiela': 22,
        'althair-parfums-de-marly': 23,
        'bianco-latte-giardini-di-toscana': 24,
        'uomo-born-in-roma-intense-valentino': 25,
        'eclaire-lattafa': 26,
        'aventus-creed': 27,
        '9pm-afnan': 28,
        'baccarat-rouge-540-extrait-maison-francis-kurkdjian': 29,
        'sauvage-eau-de-toilette-dior': 30,
        'sauvage-elixir-dior': 31,
        'sauvage-parfum-dior': 32,
        'sauvage-eau-forte-dior': 33,
        'good-girl-eau-de-parfum-carolina-herrera': 34,
        'la-bomba-carolina-herrera': 35,
        'libre-le-parfum-yves-saint-laurent': 36,
        'libre-l-absolu-platine-parfum-yves-saint-laurent': 37,
        'libre-eau-de-toilette-yves-saint-laurent': 38,
        'libre-edt-yves-saint-laurent': 39,
        'dior-homme-intense-dior': 40,
        'le-male-elixir-absolu-jean-paul-gaultier': 41,
        'ombre-leather-tom-ford': 42,
        'cherry-smoke-tom-ford': 43,
        'narcotic-delight-initio-parfums-prives': 44,
        'layton-parfums-de-marly': 45,
        'erba-pura-xerjoff': 46,
        'erba-gold-xerjoff': 47,
        'khamrah-desodorante-lattafa': 48,
        'asad-lattafa': 49,
        'yara-lattafa': 50,
        'bade-e-al-oud-oud-for-glory-lattafa': 51,
        'asad-bourbon-lattafa': 52,
        'asad-elixir-lattafa': 53,
        'eclaire-banoffi-lattafa': 54,
        'eclaire-pistache-lattafa': 55,
        'yara-candy-lattafa': 56,
        'yara-elixir-lattafa': 57,
        'yara-moi-lattafa': 58,
        'yara-tous-lattafa': 59,
        'fakhar-black-lattafa': 60,
        'turathi-blue-afnan': 61,
        '9pm-elixir-afnan': 62,
        '9pm-rebel-afnan': 63,
        'hawas-for-him-rasasi': 64,
        'hawas-ice-rasasi': 65,
        'hawas-ice-for-him-rasasi': 66,
        'hawas-black-rasasi': 67,
        'hawas-fire-rasasi': 68,
        'hawas-tropical-rasasi': 69,
        'le-beau-paradise-garden-jean-paul-gaultier': 70,
        'ultra-male-jean-paul-gaultier': 71,
        'invictus-victory-elixir-rabanne': 72,
        'one-million-eau-de-toilette-rabanne': 73,
        'one-million-edt-rabanne': 74,
        'one-million-parfum-rabanne': 75,
        'phantom-parfum-rabanne': 76,
        'acqua-di-gio-parfum-giorgio-armani': 77,
        'aqcua-di-gio-parfum-giorgio-armani': 78,
        'acqua-di-gio-profondo-giorgio-armani': 79,
        'aqcua-di-gio-profondo-giorgio-armani': 80,
        'acqua-di-gio-eau-de-parfum-giorgio-armani': 81,
        'my-way-eau-de-parfum-giorgio-armani': 82,
        'gentleman-society-givenchy': 83,
        'gentleman-society-ambree-givenchy': 84,
        'gentleman-society-extreme-givenchy': 85,
        'gentleman-reserve-privee-givenchy': 86,
        'terre-d-hermes-eau-de-toilette-hermes': 87,
        'santal-33-le-labo': 88,
        'light-blue-dolce-gabbana': 89,
        'light-blue-pour-homme-dolce-gabbana': 90,
        'the-one-dolce-gabbana': 91,
        'the-one-pour-homme-eau-de-parfum-dolce-gabbana': 92,
        'spicebomb-extreme-viktor-rolf': 93,
        'spicebomb-eau-de-toilette-viktor-rolf': 94,
        'eros-eau-de-parfum-versace': 95,
        'eros-eau-de-toilette-versace': 96,
        'pour-homme-dylan-blue-versace': 97,
        'black-orchid-tom-ford': 98,
        'lost-cherry-tom-ford': 99,
        'bitter-peach-tom-ford': 100
    };

    function buildTagsHtml(perfume, mode) {
        const parts = [];
        const inStock = mode === 'perfumes' ? perfume.en_stock_completos : perfume.en_stock_decants;

        if (!inStock) {
            parts.push('<span class="etiqueta fuera-de-stock">Fuera de stock</span>');
        }
        if (perfume.etiqueta === 'novedad') {
            parts.push('<span class="etiqueta novedad">Nuevo</span>');
        }
        if (perfume.etiqueta === 'a-pedido') {
            parts.push('<span class="etiqueta a-pedido">A Pedido</span>');
        }

        return parts.length ? `<div class="etiquetas">${parts.join('')}</div>` : '';
    }

    function buildPriceHtml(perfume, mode) {
        if (mode === 'perfumes') {
            const inStock = perfume.en_stock_completos;
            if (!inStock || !perfume.precio_completo) return '';
            const mlPart = perfume.precio_completo.ml != null ? `${perfume.precio_completo.ml} <strong>ml - </strong>` : '';
            return `<p class="price-label">${mlPart}${perfume.precio_completo.precio} Bs</p>`;
        }

        // decants
        const inStock = perfume.en_stock_decants;
        if (!inStock || !perfume.precios_decants) return '';

        const sizes = Object.keys(perfume.precios_decants)
            .map(Number)
            .sort((a, b) => a - b);

        return sizes
            .map(s => `<p class="price-label">${s} <strong>ml - </strong>${perfume.precios_decants[s]} Bs</p>`)
            .join('');
    }

    function getImage(perfume, mode) {
        if (mode === 'perfumes') {
            return perfume.image_miniatura || perfume.image_miniatura_decant || 'imagenes/image.webp';
        }
        return perfume.image_miniatura_decant || perfume.image_miniatura || 'imagenes/image.webp';
    }

    function getSortName(perfume) {
        return perfume.nombre_interno || `${perfume.marca || ''} ${perfume.nombre || ''}`.trim();
    }

    function getSortPrice(perfume, mode) {
        if (mode === 'perfumes') {
            return Number(perfume.precio_completo && perfume.precio_completo.precio);
        }

        if (!perfume.precios_decants) {
            return Number.NaN;
        }

        const prices = Object.keys(perfume.precios_decants)
            .map(size => Number(perfume.precios_decants[size]))
            .filter(Number.isFinite);

        return prices.length ? Math.min(...prices) : Number.NaN;
    }

    function getBestSellerRank(perfume, hypeIndex) {
        return Object.prototype.hasOwnProperty.call(BEST_SELLER_RANKS, perfume.id)
            ? BEST_SELLER_RANKS[perfume.id]
            : 1000 + hypeIndex;
    }

    function compareCardsByName(a, b, direction) {
        const result = (a.dataset.sortName || '').localeCompare(b.dataset.sortName || '', 'es', { sensitivity: 'base' });
        return direction === 'desc' ? -result : result;
    }

    function compareCardsByBestSeller(a, b) {
        const rankDiff = Number(a.dataset.bestSellerRank) - Number(b.dataset.bestSellerRank);
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
            return compareCardsByBestSeller(a, b);
        });

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
        const viewButtonHtml = mode === 'perfumes' || mode === 'decants'
            ? '<button class="card-view-btn" type="button">Ver</button>'
            : '';
        const sortPrice = getSortPrice(perfume, mode);
        const priceAttr = Number.isFinite(sortPrice) ? String(sortPrice) : '';
        const bestSellerRank = getBestSellerRank(perfume, hypeIndex);

        return `<div class="decant" data-name="${perfume.nombre_interno}" data-tags="${tags}" data-id="${perfume.id}" data-hype-index="${hypeIndex}" data-best-seller-rank="${bestSellerRank}" data-sort-name="${getSortName(perfume)}" data-sort-price="${priceAttr}">
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
            return true;
        });

        // Filter: for perfumes mode, only include items that have precio_completo OR were listed as perfumes (have image_miniatura)
        const filtered = perfumes.filter(p => {
            if (mode === 'perfumes') return p.image_miniatura !== null;
            if (mode === 'decants') return p.image_miniatura_decant !== null || p.precios_decants !== null;
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
        sortCards: sortCards
    };
})(window.PerfSuarez);
