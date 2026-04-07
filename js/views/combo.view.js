(function (App) {
    function createComboItem(type, index) {
        const item = document.createElement('div');
        item.className = 'combo-item combo-item--empty';
        item.innerHTML = `
            <div class="combo-selection">
                <div class="combo-card-img-wrap">
                    <img src="imagenes/image.webp" alt="${type}" id="${type}-imagen-${index}" class="combo-card-img">
                </div>
                <span class="combo-card-label">${type === 'perfumes' ? 'Perfume' : 'Decant'} ${index + 1}</span>
                <p class="combo-card-name" id="${type}-nombre-${index}">Sin seleccionar</p>
                <button class="dropdown-toggle" type="button">Seleccionar</button>
                <div class="dropdown" id="${type}-dropdown-${index}"></div>
            </div>
        `;
        return item;
    }

    App.views.combo = {
        createComboItem
    };
})(window.PerfSuarez);
