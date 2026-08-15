(function (App) {
    const catalogo = App.data.relojes;

    function escapar(texto) {
        return String(texto == null ? '' : texto)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function rgbCss(color) {
        const rgb = color && color.rgb ? color.rgb : [200, 200, 200];
        return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
    }

    /**
     * Pinta las capas del reloj sobre el stage. Reusa los nodos ya montados,
     * pero una capa tintada necesita un <span> con mascara y una normal un
     * <img>: si cambia el tipo, se reemplaza el nodo.
     */
    function renderStage(frame, capas) {
        while (frame.children.length > capas.length) {
            frame.removeChild(frame.lastChild);
        }

        capas.forEach(function (capa, indice) {
            const etiqueta = capa.tipo === 'tinte' ? 'SPAN' : 'IMG';
            let nodo = frame.children[indice];

            if (!nodo || nodo.tagName !== etiqueta) {
                const nuevo = document.createElement(etiqueta === 'IMG' ? 'img' : 'span');
                if (etiqueta === 'IMG') {
                    nuevo.alt = '';
                    nuevo.decoding = 'async';
                    // Sin esto el navegador arranca su drag&drop nativo al
                    // arrastrar sobre el reloj, manda `pointercancel` y se
                    // pierde el gesto que cambia de pieza.
                    nuevo.draggable = false;
                }
                if (nodo) {
                    frame.replaceChild(nuevo, nodo);
                } else {
                    frame.appendChild(nuevo);
                }
                nodo = nuevo;
            }

            if (capa.tipo === 'tinte') {
                // El logo es un trazo negro con alfa: se usa como mascara y el
                // color lo pone el fondo, para poder tenirlo segun el dial.
                const mascara = `url("${capa.src}") center / 100% 100% no-repeat`;
                nodo.style.webkitMaskImage = `url("${capa.src}")`;
                nodo.style.webkitMaskSize = '100% 100%';
                nodo.style.mask = mascara;
                nodo.style.backgroundColor = capa.tinta;
            } else if (nodo.getAttribute('src') !== capa.src) {
                nodo.setAttribute('src', capa.src);
            }

            nodo.style.left = `${capa.left * 100}%`;
            nodo.style.top = `${capa.top * 100}%`;
            nodo.style.width = `${capa.width * 100}%`;
            nodo.style.height = `${capa.height * 100}%`;
            nodo.style.transformOrigin = `${capa.originX * 100}% ${capa.originY * 100}%`;
            nodo.style.transform = capa.rot ? `rotate(${capa.rot}deg)` : 'none';
            nodo.style.objectFit = capa.clip === 'circulo' ? 'cover' : '';
            nodo.style.borderRadius = capa.clip === 'circulo' ? '50%' : '';
            nodo.style.clipPath = capa.clip === 'izquierda'
                ? 'inset(0 50% 0 0)'
                : (capa.clip === 'derecha' ? 'inset(0 0 0 50%)' : '');
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

    /** Fila de puntitos de color de un modelo. */
    function coloresHtml(colores, seleccionado, campo) {
        if (colores.length < 2) {
            return '';
        }
        const puntos = colores.map(function (pieza) {
            const clase = pieza.id === seleccionado ? 'watch-dot is-active' : 'watch-dot';
            const nombre = pieza.color ? pieza.color.nombre : '';
            return `<button type="button" class="${clase}" data-campo="${escapar(campo)}" data-pieza="${pieza.id}"`
                + ` style="--dot: ${rgbCss(pieza.color)}" title="${escapar(nombre)}" aria-label="${escapar(nombre)}"></button>`;
        }).join('');
        return `<div class="watch-dots">${puntos}</div>`;
    }

    /**
     * Tarjeta de un modelo: la miniatura muestra el color activo y debajo van
     * los colores disponibles. Reemplaza al listado de una tarjeta por archivo,
     * que dejaba 147 agujas practicamente iguales en pantalla.
     */
    function modeloHtml(grupo, colores, activa, campo) {
        const seleccionada = activa && activa.modelo === grupo.modelo;
        const muestra = seleccionada ? activa : colores[0];
        const clase = seleccionada ? 'watch-option is-active' : 'watch-option';
        const nombre = catalogo.nombrarModelo(grupo);
        return ''
            + `<div class="${clase}">`
            +   `<button type="button" class="watch-option__pick" data-campo="${escapar(campo)}" data-pieza="${muestra.id}" title="${escapar(nombre)}">`
            +     `<img src="${muestra.src}" alt="${escapar(nombre)}" loading="lazy">`
            +     `<span class="watch-option__label">${escapar(nombre)}</span>`
            +   '</button>'
            +   coloresHtml(colores, muestra.id, campo)
            + '</div>';
    }

    /** Tarjeta de una pieza suelta, sin agrupar (glifos de un indice puntual). */
    function piezaHtml(pieza, seleccionada, campo, etiqueta) {
        const clase = seleccionada ? 'watch-option is-active' : 'watch-option';
        const nombre = etiqueta || catalogo.nombrarPieza(pieza);
        return ''
            + `<div class="${clase}">`
            +   `<button type="button" class="watch-option__pick" data-campo="${escapar(campo)}" data-pieza="${pieza.id}" title="${escapar(nombre)}">`
            +     `<img src="${pieza.src}" alt="${escapar(nombre)}" loading="lazy">`
            +     `<span class="watch-option__label">${escapar(nombre)}</span>`
            +   '</button>'
            + '</div>';
    }

    /**
     * Un paso puede traer varios paneles (las agujas traen tres) y cada panel
     * puede ser un grid de modelos, un grid de piezas sueltas o un bloque de
     * controles propio.
     */
    function renderPaneles(contenedor, paneles) {
        contenedor.innerHTML = paneles.map(function (panel) {
            const titulo = panel.titulo ? `<h2 class="watch-panel-title">${escapar(panel.titulo)}</h2>` : '';
            const nota = panel.nota ? `<p class="watch-panel-note">${escapar(panel.nota)}</p>` : '';

            if (panel.html) {
                return `${titulo}${nota}${panel.html}`;
            }

            const cuerpo = panel.modelos
                ? panel.modelos.map(function (item) {
                    return modeloHtml(item.grupo, item.colores, item.activa, panel.campo);
                }).join('')
                : panel.piezas.map(function (pieza) {
                    return piezaHtml(pieza, pieza.id === panel.seleccion, panel.campo, panel.etiqueta && panel.etiqueta(pieza));
                }).join('');

            return `${titulo}${nota}<div class="watch-grid">${cuerpo}</div>`;
        }).join('');
    }

    /** Interruptor de dos opciones (todos iguales / uno por uno, bisel bicolor). */
    function alternadorHtml(campo, opciones, activo) {
        const botones = opciones.map(function (opcion) {
            const clase = opcion.valor === activo ? 'watch-toggle is-active' : 'watch-toggle';
            return `<button type="button" class="${clase}" data-alternador="${escapar(campo)}" data-valor="${escapar(opcion.valor)}">${escapar(opcion.label)}</button>`;
        }).join('');
        return `<div class="watch-toggles" role="group">${botones}</div>`;
    }

    function renderResumen(lista, filas) {
        lista.innerHTML = filas.map(function (fila) {
            return `<dt>${escapar(fila.label)}</dt><dd>${escapar(fila.valor)}</dd>`;
        }).join('');
    }

    App.views.relojes = {
        alternadorHtml,
        coloresHtml,
        escapar,
        renderPaneles,
        renderPasos,
        renderResumen,
        renderStage
    };
})(window.PerfSuarez);
