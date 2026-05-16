(function (App) {
    function normalizeBrandValue(value) {
        if (!value) {
            return '';
        }

        const normalized = App.core.search.normalizeText(value);
        if (normalized === 'd&g') {
            return 'dolce';
        }
        if (normalized === 'mntblanc') {
            return 'montblanc';
        }
        return normalized;
    }

    function getCardMeta(card) {
        const name = App.core.search.normalizeText(card.dataset.name || card.textContent || '');
        const tags = App.core.search.normalizeText(card.dataset.tags || '');
        const brandStrong = card.querySelector('h3 strong')?.textContent || '';
        const brandText = App.core.search.normalizeText((card.dataset.brand || brandStrong || card.querySelector('h3')?.textContent || '').trim());
        const searchText = [
            card.dataset.name,
            card.dataset.tags,
            card.dataset.brand,
            card.textContent
        ].join(' ');

        if (brandText && !card.dataset.brand) {
            card.dataset.brand = brandText;
        }

        return {
            name,
            tags,
            brandText,
            searchText,
            hasOutBadge: !!card.querySelector('.etiqueta.fuera-de-stock, .badge.out-of-stock'),
            hasNewBadge: !!card.querySelector('.etiqueta.novedad, .badge.novedad')
        };
    }

    function collectBrandOptions(cards) {
        const brandMap = new Map();

        cards.forEach(card => {
            const brandText = card.querySelector('h3 strong')?.textContent || '';
            const display = brandText.trim();
            if (!display) {
                return;
            }

            const slug = display.toLowerCase();
            card.dataset.brand = slug;
            if (!brandMap.has(slug)) {
                brandMap.set(slug, display);
            }
        });

        return Array.from(brandMap.entries())
            .sort((a, b) => a[1].localeCompare(b[1], 'es', { sensitivity: 'base' }))
            .map(([value, label]) => ({ value, label }));
    }

    function filterCards(cards, options) {
        let visible = 0;

        cards.forEach(card => {
            const meta = getCardMeta(card);
            const matchesSearch = !options.query || App.core.search.matches(options.query, meta.searchText);
            const matchesCategory = options.category === 'all' || meta.tags.split(/\s+/).includes(options.category) || meta.tags.includes(options.category);
            const normalizedBrand = normalizeBrandValue(options.brand);
            const matchesBrand = normalizedBrand === 'all' || meta.brandText === normalizedBrand || App.core.search.matches(normalizedBrand, meta.searchText);
            const matchesStock = !options.hideOutOfStock || !meta.hasOutBadge;
            const matchesNew = !options.onlyNew || meta.hasNewBadge;
            const shouldShow = matchesSearch && matchesCategory && matchesBrand && matchesStock && matchesNew;

            card.style.display = shouldShow ? options.visibleDisplay || '' : 'none';
            if (shouldShow) {
                visible += 1;
            }
        });

        return visible;
    }

    App.models.catalog = {
        collectBrandOptions,
        filterCards,
        getCardMeta,
        normalizeBrandValue
    };
})(window.PerfSuarez);
