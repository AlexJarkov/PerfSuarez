(function (App) {
    'use strict';

    const HYPE_RANKS = {
        // ─── NICHO ──────────────────────────────────────────────────────────────────
        'baccarat-rouge-540-extrait-maison-francis-kurkdjian': 1,
        'instant-crush-mancera': 2,
        'erba-pura-xerjoff': 3,
        'layton-parfums-de-marly': 4,
        'xj-1861-naxos-xerjoff': 5,
        'althair-parfums-de-marly': 6,
        'santal-33-le-labo': 7,
        'black-phantom-memento-mori-kilian': 8,
        'red-tobacco-mancera': 9,
        'erba-gold-xerjoff': 10,
        'cuoium-orto-parisi': 11,
        'megamare-orto-parisi': 12,
        'percival-parfums-de-marly': 13,
        'pegasus-parfums-de-marly': 14,
        'nomad-bond-no-9': 15,
        'chez-bond-bond-no-9': 16,
        'imagination-louis-vuitton': 17,
        'ombre-nomade-louis-vuitton': 18,
        'pacific-chill-louis-vuitton': 19,
        'city-of-stars-louis-vuitton': 20,
        'angel-s-share-kilian': 21,
        'aventus-creed': 22,
        'bianco-latte-giardini-di-toscana': 23,
        'arabians-tonka-montale': 24,
        'n-4-apres-l-amour-eau-de-parfum-thomas-kosmala': 25,
        'oud-for-greatness-initio-parfums-prives': 26,
        'torino21-xerjoff': 27,
        'alexandria-ii-xerjoff': 28,
        'herod-parfums-de-marly': 29,
        'cedrat-boise-mancera': 30,
        'layton-exclusif-parfums-de-marly': 31,
        'galloway-parfums-de-marly': 32,
        'narcotic-delight-initio-parfums-prives': 33,
        'coro-xerjoff': 34,
        'n-4-neon-thomas-kosmala': 35,
        'italian-leather-memo': 36,
        'tribeca-bond-no-9': 37,
        'summer-hammer-lorenzo-pazzaglia': 38,

        // ─── DISEÑADOR ──────────────────────────────────────────────────────────────
        'sauvage-elixir-dior': 200,
        'le-male-elixir-jean-paul-gaultier': 201,
        'stronger-with-you-intensely-emporio-armani': 202,
        'y-eau-de-parfum-yves-saint-laurent': 203,
        'y-edp-yves-saint-laurent': 203,
        'invictus-victory-elixir-rabanne': 204,
        'invictus-parfum-rabanne': 205,
        'bad-boy-cobalt-elixir-carolina-herrera': 206,
        'le-male-le-parfum-jean-paul-gaultier': 207,
        'uomo-born-in-roma-intense-valentino': 208,
        'sauvage-eau-de-parfum-dior': 209,
        'good-girl-eau-de-parfum-carolina-herrera': 210,
        'one-million-eau-de-toilette-rabanne': 211,
        'one-million-edt-rabanne': 211,
        'eros-eau-de-parfum-versace': 212,
        'bleu-de-chanel-parfum-chanel': 213,
        'acqua-di-gio-profondo-giorgio-armani': 214,
        'aqcua-di-gio-profondo-giorgio-armani': 214,
        'the-most-wanted-edp-intense-azzaro': 215,
        'myslf-eau-de-parfum-yves-saint-laurent': 216,
        'le-beau-le-parfum-jean-paul-gaultier': 217,
        'ultra-male-jean-paul-gaultier': 218,
        'by-the-fireplace-maison-margiela': 219,
        'ombre-leather-tom-ford': 220,
        'the-one-pour-homme-eau-de-parfum-dolce-gabbana': 221,
        'invictus-victory-rabanne': 222,
        '212-vip-men-carolina-herrera': 223,
        'acqua-di-gio-parfum-giorgio-armani': 224,
        'aqcua-di-gio-parfum-giorgio-armani': 224,
        'eros-eau-de-toilette-versace': 225,
        'libre-le-parfum-yves-saint-laurent': 226,
        'bleu-de-chanel-eau-de-toilette-chanel': 227,
        'explorer-montblanc': 228,
        'sauvage-eau-de-toilette-dior': 229,
        'sauvage-parfum-dior': 230,
        'dior-homme-intense-dior': 231,
        'le-beau-paradise-garden-jean-paul-gaultier': 232,
        'scandal-pour-homme-le-parfum-jean-paul-gaultier': 233,
        'scandal-pour-homme-intense-jean-paul-gaultier': 234,
        'one-million-lucky-rabanne': 235,
        'one-million-royal-rabanne': 236,
        'million-gold-elixir-rabanne': 237,
        'million-gold-rabanne': 238,
        'bad-boy-extreme-carolina-herrera': 239,
        'bad-boy-elixir-carolina-herrera': 240,
        'bad-boy-edt-carolina-herrera': 241,
        'very-good-girl-carolina-herrera': 242,
        'very-good-girl-eau-de-parfum-carolina-herrera': 243,
        'born-in-roma-intense-valentino': 244,
        'donna-born-in-roma-intense-valentino': 245,
        'uomo-born-in-roma-coral-fantasy-valentino': 246,
        'born-in-roma-coral-fantasy-valentino': 247,
        'stronger-with-you-parfum-emporio-armani': 248,
        'myslf-le-parfum-yves-saint-laurent': 249,
        'myslf-yves-saint-laurent': 250,
        'y-le-parfum-yves-saint-laurent': 251,
        'y-eau-de-parfum-intense-yves-saint-laurent': 252,
        'y-edp-intense-yves-saint-laurent': 252,
        'y-iced-cologne-yves-saint-laurent': 253,
        'black-opium-intense-yves-saint-laurent': 254,
        'lost-cherry-tom-ford': 254,
        'black-orchid-tom-ford': 255,
        'cherry-smoke-tom-ford': 256,
        'jazz-club-maison-margiela': 257,
        'luna-rossa-carbon-edt-prada': 258,
        'ck-one-calvin-klein': 259,
        'voyage-nautica': 260,
        'l12-12-blanc-lacoste': 261,
        'light-blue-pour-homme-eau-intense-dolce-gabbana': 262,
        'light-blue-pour-homme-dolce-gabbana': 263,
        'acqua-di-gio-eau-de-toilette-giorgio-armani': 264,
        'acqua-di-gio-eau-de-parfum-giorgio-armani': 265,
        'acqua-di-gio-profumo-giorgio-armani': 266,
        'armani-code-parfum-giorgio-armani': 267,
        'pour-homme-dylan-blue-versace': 268,
        'pour-homme-versace': 269,
        'eros-flame-versace': 270,
        'spicebomb-eau-de-toilette-viktor-rolf': 271,
        'spicebomb-extreme-viktor-rolf': 272,
        'wanted-by-night-azzaro': 272,
        'the-most-wanted-edt-intense-azzaro': 273,
        '212-vip-men-black-elixir-carolina-herrera': 274,
        'ch-men-eau-de-toilette-carolina-herrera': 275,
        'ch-men-pasion-carolina-herrera': 276,
        'one-million-parfum-rabanne': 277,
        'phantom-parfum-rabanne': 278,
        'phantom-eau-de-toilette-rabanne': 279,
        'phantom-intense-rabanne': 280,
        'fame-eau-de-parfum-rabanne': 281,
        'fame-intense-rabanne': 282,
        'good-girl-blush-elixir-carolina-herrera': 283,
        'very-good-girl-elixir-carolina-herrera': 284,
        'j-adore-eau-de-parfum-dior': 285,
        'la-vie-est-belle-l-eau-de-parfum-lancome': 286,
        'idole-lancome': 287,
        'my-way-eau-de-parfum-giorgio-armani': 288,
        'miss-dior-blooming-bouquet-dior': 289,
        'miss-dior-eau-de-toilette-dior': 290,
        'libre-eau-de-toilette-yves-saint-laurent': 291,
        'libre-edt-yves-saint-laurent': 291,
        'libre-l-absolu-platine-parfum-yves-saint-laurent': 292,
        'mon-paris-yves-saint-laurent': 293,
        'la-belle-le-parfum-jean-paul-gaultier': 294,
        'la-belle-eau-de-parfum-jean-paul-gaultier': 295,
        'gaultier-divine-le-parfum-jean-paul-gaultier': 296,
        'gaultier-divine-jean-paul-gaultier': 297,
        'scandal-absolu-jean-paul-gaultier': 298,
        'scandal-intense-jean-paul-gaultier': 299,
        'divine-elixir-jean-paul-gaultier': 300,
        'fame-parfum-rabanne': 301,
        'lady-million-prive-rabanne': 302,
        '212-vip-carolina-herrera': 303,
        '212-vip-rose-elixir-carolina-herrera': 304,
        'ch-carolina-herrera': 305,
        'ch-eau-de-toilette-carolina-herrera': 306,
        'light-blue-dolce-gabbana': 307,
        'devotion-edp-dolce-gabbana': 308,
        'devotion-edp-intense-dolce-gabbana': 309,
        'q-by-d-g-edp-dolce-gabbana': 310,
        'q-by-d-g-eau-de-parfum-dolce-gabbana': 310,
        'q-by-d-g-eau-de-parfum-intense-dolce-gabbana': 311,
        'crystal-noir-versace': 312,
        'bitter-peach-tom-ford': 313,
        'costa-azzurra-parfum-tom-ford': 314,
        'gentleman-reserve-privee-givenchy': 315,
        'gentleman-boisee-givenchy': 316,
        'gentleman-eau-de-parfum-givenchy': 317,
        'gentleman-edp-givenchy': 317,
        'gentleman-society-givenchy': 318,
        'gentleman-society-ambree-givenchy': 319,
        'gentleman-society-extreme-givenchy': 320,
        'homme-eau-de-parfum-kenzo': 321,
        'homme-edp-kenzo': 321,
        'homme-intense-kenzo': 322,
        'homme-homme-santal-marin-kenzo': 323,
        'homme-santal-marin-kenzo': 323,
        'terre-d-hermes-eau-de-toilette-hermes': 324,
        'man-in-black-eau-de-parfum-bvlgari': 325,
        'santos-de-cartier-cartier': 326,
        'original-lacoste': 327,
        'original-eau-de-parfum-lacoste': 327,
        'tabac-imperial-atelier-versace': 328,
        'iris-d-elite-atelier-versace': 329,
        'figue-blanche-atelier-versace': 330,
        'uomo-born-in-roma-extradose-valentino': 331,
        'donna-born-in-roma-extradose-valentino': 332,
        'uomo-born-in-roma-green-stravaganza-valentino': 333,
        'donna-born-in-roma-green-stravaganza-valentino': 334,
        'uomo-born-in-roma-purple-melancholia-valentino': 335,
        'donna-born-in-roma-purple-melancholia-valentino': 336,
        'born-in-roma-purple-melancholia-valentino': 337,
        'uomo-born-in-roma-edt-valentino': 338,
        'le-male-lover-jean-paul-gaultier': 339,
        'le-male-elixir-absolu-jean-paul-gaultier': 340,
        'le-beau-eau-de-toilette-jean-paul-gaultier': 341,
        'scandal-pour-homme-absolu-jean-paul-gaultier': 342,
        'la-belle-paradise-garden-jean-paul-gaultier': 343,
        'la-belle-flower-edition-jean-paul-gaultier': 344,
        'scandal-pour-homme-eau-de-toilette-jean-paul-gaultier': 345,
        'scandal-pour-homme-edt-jean-paul-gaultier': 345,
        'pure-xs-night-eau-de-parfum-rabanne': 346,
        'good-girl-sparkling-ice-carolina-herrera': 347,
        'bad-boy-le-parfum-carolina-herrera': 348,
        'bad-boy-cobalt-carolina-herrera': 349,
        '212-heroes-men-carolina-herrera': 350,
        'la-bomba-carolina-herrera': 351,
        'acqua-di-gio-absolu-giorgio-armani': 352,
        'aqcua-di-gio-absolu-giorgio-armani': 352,
        'stronger-with-you-powerfully-emporio-armani': 353,
        'eros-energy-versace': 354,
        'pour-homme-eau-de-toilette-versace': 355,
        'spicebomb-infrared-eau-de-parfum-viktor-rolf': 356,
        'light-blue-capri-in-love-dolce-gabbana': 357,
        'light-blue-pour-homme-capri-in-love-dolce-gabbana': 358,
        'k-by-d-g-edp-dolce-gabbana': 359,
        'k-by-d-g-eau-de-parfum-dolce-gabbana': 359,
        'k-by-d-g-eau-de-toilette-dolce-gabbana': 360,
        'k-by-d-g-edt-dolce-gabbana': 360,
        'k-by-d-g-eau-de-parfum-intense-dolce-gabbana': 361,
        'k-by-d-g-edp-intense-dolce-gabbana': 361,
        'the-one-dolce-gabbana': 362,
        'the-one-pour-homme-gold-dolce-gabbana': 363,
        'devotion-intense-dolce-gabbana': 364,
        'devotion-pour-homme-dolce-gabbana': 365,
        'pour-femme-eau-de-parfum-dolce-gabbana': 366,
        'pour-homme-eau-de-toilette-dolce-gabbana': 367,
        'explorer-platinum-montblanc': 368,
        'explorer-ultra-blue-montblanc': 369,
        'legend-eau-de-parfum-montblanc': 370,
        'legend-edp-montblanc': 370,
        'legend-eau-de-toilette-montblanc': 371,
        'legend-edt-montblanc': 371,
        'legend-spirit-montblanc': 372,
        'wanted-edp-azzaro': 373,
        'wanted-edt-azzaro': 374,
        'pour-homme-moncler': 374,
        'pour-femme-moncler': 375,
        'sunrise-pour-homme-moncler': 376,
        'sunrise-pour-femme-moncler': 377,
        'sunrise-pour-homme-set-moncler': 378,
        'fresh-couture-moschino': 379,
        'toy-boy-moschino': 380,
        'sauvage-eau-forte-dior': 381,
        'dior-fahrenheit-dior': 382,
        'fahrenheit-eau-de-toilette-dior': 382,
        '212-vip-men-black-mtv-edition-carolina-herrera': 383,
        'very-good-girl-glam-carolina-herrera': 384,
        'set-polo-blue-polo-ralph-lauren': 385,
        'aguafresca-citrus-cedro-adolfo-dominguez': 386,

        // ─── ÁRABES ─────────────────────────────────────────────────────────────────
        'khamrah-lattafa': 600,
        'yara-lattafa': 601,
        '9pm-afnan': 602,
        'hawas-for-him-rasasi': 603,
        'club-de-nuit-intense-armaf': 604,
        'club-de-nuit-milestone-armaf': 605,
        'odyssey-homme-eau-de-parfum-armaf': 606,
        'khamrah-qahwa-lattafa': 607,
        'asad-lattafa': 608,
        'eclaire-lattafa': 609,
        'yara-candy-lattafa': 610,
        '9am-dive-afnan': 611,
        'turathi-blue-afnan': 612,
        'liquid-brun-french-avenue': 613,
        'amber-oud-gold-edition-al-haramain': 614,
        'amber-oud-acqua-dubai-al-haramain': 615,
        'bade-e-al-oud-oud-for-glory-lattafa': 616,
        'bade-e-al-oud-honor-and-glory-lattafa': 617,
        'fakhar-black-lattafa': 618,
        'fakhar-rose-lattafa': 619,
        'mayar-lattafa': 620,
        'game-of-spades-wildcard-jo-milano': 621,
        'game-of-spades-royale-jo-milano': 622,
        'yara-tous-lattafa': 623,
        'asad-bourbon-lattafa': 624,
        'asad-elixir-lattafa': 625,
        'club-de-nuit-urban-man-elixir-armaf': 626,
        'bade-e-al-oud-amethyst-lattafa': 627,
        'yara-moi-lattafa': 628,
        'yara-elixir-lattafa': 629,
        'vintage-radio-lattafa': 630,
        'odyssey-mandarin-sky-armaf': 631,
        'hawas-ice-rasasi': 632,
        'hawas-ice-for-him-rasasi': 632,
        'hawas-fire-rasasi': 633,
        'hawas-fire-for-him-rasasi': 633,
        'hawas-elixir-for-him-rasasi': 634,
        'hawas-black-rasasi': 635,
        'hawas-black-for-him-rasasi': 635,
        'hawas-for-her-rasasi': 636,
        'hawas-tropical-rasasi': 637,
        'hawas-tropical-for-him-rasasi': 637,
        'hawas-kobra-rasasi': 638,
        'hawas-kobra-for-him-rasasi': 638,
        'hawas-malibu-rasasi': 639,
        'hawas-malibu-for-him-rasasi': 639,
        'hawas-verde-rasasi': 640,
        'hawas-verde-for-him-rasasi': 640,
        'odyssey-homme-white-edition-armaf': 641,
        'odyssey-limoni-armaf': 642,
        'odyssey-wild-one-armaf': 643,
        'king-bharara': 644,
        'king-eau-de-parfum-bharara': 644,
        'hayaati-beau-fragrance-world': 645,
        'eclaire-pistache-lattafa': 646,
        'khamrah-dukhan-lattafa': 647,
        'maahir-legacy-lattafa': 648,
        'qaed-al-fursan-lattafa': 649,
        'qaed-al-fursan-unlimited-lattafa': 650,
        'qaed-al-fursan-untamed-lattafa': 651,
        'eclaire-banoffi-lattafa': 652,
        'his-confession-lattafa': 653,
        'her-confession-lattafa': 654,
        'asad-zanzibar-lattafa': 655,
        'vulcan-feu-french-avenue': 656,
        'art-of-universe-lattafa': 657,
        '9am-afnan': 658,
        '9pm-rebel-afnan': 659,
        '9pm-elixir-afnan': 660,
        '9pm-night-out-afnan': 661,
        '9pm-set-crema-y-desodorante-afnan': 662,
        '9pm-version-tester-afnan': 663,
        'odyssey-mandarin-sky-elixir-armaf': 664,
        'odyssey-aqua-armaf': 665,
        'bade-e-al-oud-noble-blush-lattafa': 666,
        'bade-e-al-oud-sublime-lattafa': 667,
        'atlas-lattafa': 668,
        'fakhar-extrait-lattafa': 669,
        'ishq-al-shuyukh-lattafa': 670,
        'al-noble-safeer-lattafa': 671,
        'odyssey-candee-armaf': 672,
        'odyssey-mega-armaf': 673,
        'odyssey-spectra-armaf': 674,
        'yum-yum-armaf': 675,
        'hayaatim-lattafa': 676,
        'sehr-lattafa': 677,
        'atheeri-lattafa': 678,
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
            const entries = Array.isArray(perfume.precio_completo) ? perfume.precio_completo : [perfume.precio_completo];
            return entries.map(e => {
                const mlPart = e.ml != null ? `${e.ml} <strong>ml - </strong>` : '';
                return `<p class="price-label">${mlPart}${e.precio} Bs</p>`;
            }).join('');
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
