(function (App) {
    'use strict';

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
            return `<p class="price-label">${perfume.precio_completo.ml} <strong>ml - </strong>${perfume.precio_completo.precio} Bs</p>`;
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

    function renderCard(perfume, mode) {
        const img = getImage(perfume, mode);
        const tags = perfume.tags.join(' ');
        const priceHtml = buildPriceHtml(perfume, mode);
        const tagsHtml = buildTagsHtml(perfume, mode);

        return `<div class="decant" data-name="${perfume.nombre_interno}" data-tags="${tags}" data-id="${perfume.id}">
            <img src="${img}" alt="${perfume.nombre}" loading="lazy" decoding="async">
            <h3><strong>${perfume.marca}</strong></h3>
            <p>${perfume.nombre}</p>
            ${priceHtml}
            ${tagsHtml}
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

        gridEl.innerHTML = filtered.map(p => renderCard(p, mode)).join('');
        return Array.from(gridEl.querySelectorAll('.decant'));
    }

    function bindCardNavigation(gridEl) {
        gridEl.addEventListener('click', function (event) {
            var card = event.target.closest('.decant');
            if (!card) return;
            var id = card.getAttribute('data-id');
            if (id) {
                window.location.href = 'perfume.html?id=' + encodeURIComponent(id);
            }
        });
    }

    App.viewmodels = App.viewmodels || {};
    App.viewmodels.catalogRenderer = {
        renderCatalog: renderCatalog,
        bindCardNavigation: bindCardNavigation
    };
})(window.PerfSuarez);
