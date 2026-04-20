(function (App) {
    'use strict';

    const HYPE_RANKS = {
        'uomo-born-in-roma-intense-valentino': 1,
        'donna-born-in-roma-intense-valentino': 2,
        'born-in-roma-intense-valentino': 3,
        'uomo-born-in-roma-coral-fantasy-valentino': 4,
        'born-in-roma-coral-fantasy-valentino': 5,
        'uomo-born-in-roma-extradose-valentino': 6,
        'donna-born-in-roma-extradose-valentino': 7,
        'uomo-born-in-roma-green-stravaganza-valentino': 8,
        'donna-born-in-roma-green-stravaganza-valentino': 9,
        'uomo-born-in-roma-purple-melancholia-valentino': 10,
        'donna-born-in-roma-purple-melancholia-valentino': 11,
        'born-in-roma-purple-melancholia-valentino': 12,
        'uomo-born-in-roma-edt-valentino': 13,
        'odyssey-mandarin-sky-armaf': 14,
        'odyssey-mandarin-sky-elixir-armaf': 15,
        'hawas-ice-rasasi': 16,
        'hawas-ice-for-him-rasasi': 17,
        'megamare-orto-parisi': 18,
        'liquid-brun-french-avenue': 19,
        'khamrah-lattafa': 20,
        'khamrah-qahwa-lattafa': 21,
        'eclaire-lattafa': 22,
        'eclaire-banoffi-lattafa': 23,
        'eclaire-pistache-lattafa': 24,
        'yara-lattafa': 25,
        'yara-candy-lattafa': 26,
        'yara-elixir-lattafa': 27,
        'yara-moi-lattafa': 28,
        'yara-tous-lattafa': 29,
        'asad-lattafa': 30,
        'asad-bourbon-lattafa': 31,
        'asad-elixir-lattafa': 32,
        'bade-e-al-oud-oud-for-glory-lattafa': 33,
        'bade-e-al-oud-amethyst-lattafa': 34,
        'bade-e-al-oud-honor-and-glory-lattafa': 35,
        'bade-e-al-oud-noble-blush-lattafa': 36,
        'bade-e-al-oud-sublime-lattafa': 37,
        'fakhar-black-lattafa': 38,
        'fakhar-rose-lattafa': 39,
        'fakhar-extrait-lattafa': 40,
        'turathi-blue-afnan': 41,
        '9pm-afnan': 42,
        '9pm-elixir-afnan': 43,
        '9pm-rebel-afnan': 44,
        '9pm-night-out-afnan': 45,
        'amber-oud-gold-edition-al-haramain': 46,
        'amber-oud-acqua-dubai-al-haramain': 47,
        'hawas-for-him-rasasi': 48,
        'hawas-fire-rasasi': 49,
        'hawas-fire-for-him-rasasi': 50,
        'hawas-black-rasasi': 51,
        'hawas-black-for-him-rasasi': 52,
        'hawas-elixir-for-him-rasasi': 53,
        'hawas-tropical-rasasi': 54,
        'hawas-tropical-for-him-rasasi': 55,
        'hawas-kobra-rasasi': 56,
        'hawas-kobra-for-him-rasasi': 57,
        'hawas-malibu-rasasi': 58,
        'hawas-malibu-for-him-rasasi': 59,
        'hawas-verde-rasasi': 60,
        'hawas-verde-for-him-rasasi': 61,
        'le-male-elixir-jean-paul-gaultier': 62,
        'le-male-elixir-absolu-jean-paul-gaultier': 63,
        'le-male-le-parfum-jean-paul-gaultier': 64,
        'le-beau-le-parfum-jean-paul-gaultier': 65,
        'le-beau-paradise-garden-jean-paul-gaultier': 66,
        'ultra-male-jean-paul-gaultier': 67,
        'scandal-pour-homme-absolu-jean-paul-gaultier': 68,
        'scandal-absolu-jean-paul-gaultier': 69,
        'sauvage-elixir-dior': 70,
        'sauvage-eau-de-parfum-dior': 71,
        'sauvage-parfum-dior': 72,
        'sauvage-eau-de-toilette-dior': 73,
        'dior-homme-intense-dior': 74,
        'myslf-yves-saint-laurent': 75,
        'myslf-eau-de-parfum-yves-saint-laurent': 76,
        'myslf-le-parfum-yves-saint-laurent': 77,
        'y-eau-de-parfum-yves-saint-laurent': 78,
        'y-edp-yves-saint-laurent': 79,
        'y-edt-yves-saint-laurent': 80,
        'libre-le-parfum-yves-saint-laurent': 81,
        'libre-l-absolu-platine-parfum-yves-saint-laurent': 82,
        'ombre-leather-tom-ford': 83,
        'cherry-smoke-tom-ford': 84,
        'black-orchid-tom-ford': 85,
        'lost-cherry-tom-ford': 86,
        'angel-s-share-kilian': 87,
        'baccarat-rouge-540-extrait-maison-francis-kurkdjian': 88,
        'imagination-louis-vuitton': 89,
        'ombre-nomade-louis-vuitton': 90,
        'pacific-chill-louis-vuitton': 91,
        'santal-33-le-labo': 92,
        'erba-pura-xerjoff': 93,
        'erba-gold-xerjoff': 94,
        'xj-1861-naxos-xerjoff': 95,
        'narcotic-delight-initio-parfums-prives': 96,
        'layton-parfums-de-marly': 97,
        'althair-parfums-de-marly': 98,
        'by-the-fireplace-maison-margiela': 99,
        'jazz-club-maison-margiela': 100
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

    function getHypeRank(perfume, fallbackIndex) {
        return Object.prototype.hasOwnProperty.call(HYPE_RANKS, perfume.id)
            ? HYPE_RANKS[perfume.id]
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
        const hypeRank = getHypeRank(perfume, hypeIndex);

        return `<div class="decant" data-name="${perfume.nombre_interno}" data-tags="${tags}" data-id="${perfume.id}" data-hype-index="${hypeIndex}" data-hype-rank="${hypeRank}" data-sort-name="${getSortName(perfume)}" data-sort-price="${priceAttr}">
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
