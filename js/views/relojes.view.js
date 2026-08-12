(function (App) {
    const catalogo = App.data.relojes;

    /** Pinta las capas del reloj sobre el stage. Reusa los <img> ya montados. */
    function renderStage(frame, capas) {
        while (frame.children.length > capas.length) {
            frame.removeChild(frame.lastChild);
        }
        while (frame.children.length < capas.length) {
            const image = document.createElement('img');
            image.alt = '';
            image.decoding = 'async';
            frame.appendChild(image);
        }

        capas.forEach(function (capa, indice) {
            const image = frame.children[indice];
            if (image.getAttribute('src') !== capa.src) {
                image.setAttribute('src', capa.src);
            }
            image.style.left = `${capa.left * 100}%`;
            image.style.top = `${capa.top * 100}%`;
            image.style.width = `${capa.width * 100}%`;
            image.style.height = `${capa.height * 100}%`;
            image.style.transformOrigin = `${capa.originX * 100}% ${capa.originY * 100}%`;
            image.style.transform = capa.rot ? `rotate(${capa.rot}deg)` : 'none';
        });
    }

    function renderPasos(nav, pasos, activo, completados) {
        nav.innerHTML = pasos.map(function (paso, indice) {
            const clases = ['watch-step-chip'];
            if (indice === activo) {
                clases.push('is-active');
            }
            if (completados.indexOf(paso.id) >= 0) {
                clases.push('is-done');
            }
            return `<button type="button" class="${clases.join(' ')}" data-paso="${paso.id}">${indice + 1}. ${paso.label}</button>`;
        }).join('');
    }

    function renderFiltros(contenedor, filtros, activo) {
        if (!filtros.length) {
            contenedor.innerHTML = '';
            return;
        }

        contenedor.innerHTML = filtros.map(function (filtro) {
            const clase = filtro.valor === activo ? 'watch-filter is-active' : 'watch-filter';
            return `<button type="button" class="${clase}" data-filtro="${filtro.valor}">${filtro.label}</button>`;
        }).join('');
    }

    function opcionHtml(pieza, seleccionada, ordinal) {
        const clase = seleccionada ? 'watch-option is-active' : 'watch-option';
        const nombre = catalogo.nombrarPieza(pieza, ordinal);
        return ''
            + `<button type="button" class="${clase}" data-pieza="${pieza.id}" title="${nombre}">`
            +   `<img src="${pieza.src}" alt="${nombre}" loading="lazy">`
            +   `<span class="watch-option__label">${nombre}</span>`
            + '</button>';
    }

    /** Un paso puede tener varios grids (las agujas traen dos selectores). */
    function renderPaneles(contenedor, paneles) {
        contenedor.innerHTML = paneles.map(function (panel) {
            const titulo = panel.titulo ? `<h2 class="watch-panel-title">${panel.titulo}</h2>` : '';
            const opciones = panel.opciones.map(function (pieza) {
                return opcionHtml(pieza, pieza.id === panel.seleccion, App.models.relojes.ordinalDe(pieza));
            }).join('');
            return `${titulo}<div class="watch-grid" data-campo="${panel.campo}">${opciones}</div>`;
        }).join('');
    }

    function renderResumen(lista, filas) {
        lista.innerHTML = filas.map(function (fila) {
            return `<dt>${fila.label}</dt><dd>${fila.valor}</dd>`;
        }).join('');
    }

    App.views.relojes = {
        opcionHtml,
        renderFiltros,
        renderPaneles,
        renderPasos,
        renderResumen,
        renderStage
    };
})(window.PerfSuarez);
