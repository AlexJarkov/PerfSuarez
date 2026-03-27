(function (App) {
    function createComboItem(type, index) {
        const item = document.createElement('div');
        item.className = 'combo-item';
        item.innerHTML = `
            <div class="combo-selection">
                <img src="imagenes/image.webp" alt="${type}" id="${type}-imagen-${index}">
                <h3>${type === 'perfumes' ? 'Perfume' : 'Decant'} ${index + 1}</h3>
                <p id="${type}-nombre-${index}"></p>
                <button class="dropdown-toggle">Seleccionar</button>
                <div class="dropdown" id="${type}-dropdown-${index}"></div>
                <div class="size-selector-container" id="${type}-size-${index}"></div>
            </div>
        `;
        return item;
    }

    App.views.combo = {
        createComboItem
    };
})(window.PerfSuarez);
