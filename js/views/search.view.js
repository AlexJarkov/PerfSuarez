(function (App) {
    function renderSearchQuery(element, query) {
        if (element) {
            element.textContent = query;
        }
    }

    function renderSearchResults(container, items, emptyMessage) {
        if (!container) {
            return;
        }

        container.innerHTML = '';
        if (!items.length) {
            container.innerHTML = `<p>${emptyMessage}</p>`;
            return;
        }

        items.forEach(item => container.appendChild(item));
    }

    App.views.search = {
        renderSearchQuery,
        renderSearchResults
    };
})(window.PerfSuarez);
