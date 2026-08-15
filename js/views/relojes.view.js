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
     * Las dos mitades del bisel GMT se pisan un pelo en la costura: cortadas
     * justo al 50% el antialias deja una linea de fondo entre ambas.
     */
    const CORTES = {
        arriba: 'inset(0 0 49.7% 0)',
        abajo: 'inset(50% 0 0 0)',
        circulo: '',
        null: ''
    };

    function crearNodo(tipo) {
        const nodo = document.createElement(tipo === 'tinte' ? 'span' : 'img');
        if (tipo !== 'tinte') {
            nodo.alt = '';
            nodo.decoding = 'async';
            // Sin esto el navegador arranca su drag&drop nativo al arrastrar
            // sobre el reloj, manda `pointercancel` y se pierde el gesto.
            nodo.draggable = false;
        }
        return nodo;
    }

    /**
     * Pinta las capas del reloj sobre el stage.
     *
     * Los nodos se reusan por `clave`, no por posicion: cuando una capa aparece
     * o desaparece (el bisel pasa de una mitad a dos, el fechador tapa un
     * indice) todas las siguientes se corren un lugar, y reciclarlas por indice
     * hacia que un nodo cambiara de imagen conservando la transformacion de la
     * anterior — el parpadeo y los saltos del bisel bicolor.
     */
    function renderStage(frame, capas) {
        const previos = new Map();
        Array.from(frame.children).forEach(function (nodo) {
            previos.set(nodo.dataset.capa, nodo);
        });

        capas.forEach(function (capa, indice) {
            const tipo = capa.tipo === 'tinte' ? 'tinte' : 'imagen';
            let nodo = previos.get(capa.clave);

            if (nodo && ((nodo.tagName === 'SPAN') !== (tipo === 'tinte'))) {
                nodo.remove();
                nodo = null;
            }
            if (!nodo) {
                nodo = crearNodo(tipo);
                nodo.dataset.capa = capa.clave;
            } else {
                previos.delete(capa.clave);
            }

            // El orden de pintado es el orden del DOM: se reinserta cada capa
            // en su lugar en vez de confiar en donde quedo la vez anterior.
            const enPosicion = frame.children[indice];
            if (enPosicion !== nodo) {
                frame.insertBefore(nodo, enPosicion || null);
            }

            if (tipo === 'tinte') {
                // El logo es un trazo negro con alfa: se usa como mascara y el
                // color lo pone el fondo, para poder tenirlo segun el dial.
                nodo.style.webkitMaskImage = `url("${capa.src}")`;
                nodo.style.webkitMaskSize = '100% 100%';
                nodo.style.mask = `url("${capa.src}") center / 100% 100% no-repeat`;
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
            nodo.style.clipPath = CORTES[capa.clip] || '';
        });

        previos.forEach(function (nodo) {
            nodo.remove();
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

    /**
     * Barra de colores del modelo activo.
     *
     * Antes cada tarjeta llevaba su propia fila de puntitos de 14 px: en el
     * telefono eran imposibles de acertar y llenaban el grid de ruido. Ahora hay
     * una sola barra, debajo del grid, con muestras grandes y el nombre del
     * color elegido a la vista.
     */
    function coloresHtml(colores, seleccionado, campo, etiqueta) {
        if (colores.length < 2) {
            return '';
        }

        const activa = colores.find(function (pieza) {
            return pieza.id === seleccionado;
        });
        const muestras = colores.map(function (pieza) {
            const clase = pieza.id === seleccionado ? 'watch-swatch is-active' : 'watch-swatch';
            const nombre = pieza.color ? pieza.color.nombre : '';
            return `<button type="button" class="${clase}" data-campo="${escapar(campo)}" data-pieza="${pieza.id}"`
                + ` style="--tono: ${rgbCss(pieza.color)}" title="${escapar(nombre)}" aria-label="${escapar(nombre)}"></button>`;
        }).join('');

        return ''
            + '<div class="watch-colors">'
            +   '<p class="watch-colors__head">'
            +     `<span>${escapar(etiqueta || 'Color')}</span>`
            +     `<strong>${escapar(activa && activa.color ? activa.color.nombre : '')}</strong>`
            +   '</p>'
            +   `<div class="watch-swatches">${muestras}</div>`
            + '</div>';
    }

    /**
     * Tarjeta de un modelo. Reemplaza al listado de una tarjeta por archivo,
     * que dejaba 147 agujas practicamente iguales en pantalla. El color se
     * elige aparte, en la barra de colores del paso.
     */
    function modeloHtml(grupo, colores, activa, campo) {
        const seleccionada = activa && activa.modelo === grupo.modelo;
        const muestra = seleccionada ? activa : colores[0];
        const clase = seleccionada ? 'watch-option is-active' : 'watch-option';
        const nombre = catalogo.nombrarModelo(grupo);
        return ''
            + `<button type="button" class="${clase}" data-campo="${escapar(campo)}" data-pieza="${muestra.id}" title="${escapar(nombre)}">`
            +   `<img src="${muestra.src}" alt="${escapar(nombre)}" loading="lazy">`
            +   `<span class="watch-option__label">${escapar(nombre)}</span>`
            + '</button>';
    }

    /** Tarjeta de una pieza suelta, sin agrupar (glifos de un indice puntual). */
    function piezaHtml(pieza, seleccionada, campo, etiqueta) {
        const clase = seleccionada ? 'watch-option is-active' : 'watch-option';
        const nombre = etiqueta || catalogo.nombrarPieza(pieza);
        return ''
            + `<button type="button" class="${clase}" data-campo="${escapar(campo)}" data-pieza="${pieza.id}" title="${escapar(nombre)}">`
            +   `<img src="${pieza.src}" alt="${escapar(nombre)}" loading="lazy">`
            +   `<span class="watch-option__label">${escapar(nombre)}</span>`
            + '</button>';
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

    // ---------- Carrusel del arrastre ----------

    // Ancho de cada ficha del carrusel, en px. El arrastre avanza una pieza
    // cada este tanto, asi que la tira sigue al dedo uno a uno.
    const FICHA = 68;
    // Cuantas fichas a cada lado siguen siendo visibles.
    const ALCANCE = 3;

    /** Monta la tira de piezas del paso activo. Se llama al empezar a arrastrar. */
    function montarCarrusel(rail, piezas) {
        rail.innerHTML = piezas.map(function (pieza) {
            return `<span class="watch-carousel__item"><img src="${pieza.src}" alt="" draggable="false"></span>`;
        }).join('');
        return Array.from(rail.children);
    }

    /**
     * Coloca la tira segun la posicion (fraccionaria) en la que va el arrastre.
     * Las fichas se alejan del centro encogiendose y desvaneciendose, como el
     * selector de modo de la camara de iOS.
     */
    function moverCarrusel(fichas, posicion) {
        fichas.forEach(function (ficha, indice) {
            const distancia = indice - posicion;
            const absoluta = Math.abs(distancia);
            if (absoluta > ALCANCE + 0.5) {
                ficha.style.display = 'none';
                return;
            }
            const suave = Math.min(absoluta, ALCANCE);
            ficha.style.display = '';
            ficha.style.transform = `translate(-50%, -50%) translateX(${distancia * FICHA}px) scale(${1 - suave * 0.17})`;
            ficha.style.opacity = String(Math.max(0.12, 1 - suave * 0.3));
            ficha.style.zIndex = String(10 - Math.round(suave));
        });
    }

    // ---------- Selector de fechador ----------

    /**
     * Rueda de 24 posiciones. Una lista de 24 chips no entra en el panel y no
     * dice nada; sobre un circulo se ve de una donde va a quedar la ventana.
     */
    function fechadorHtml(posiciones, activa, habilitado) {
        const puntos = posiciones.map(function (opcion) {
            const clases = ['watch-clock__dot'];
            if (String(opcion.valor) === String(activa)) {
                clases.push('is-active');
            }
            if (opcion.sobreIndice) {
                clases.push('is-hora');
            }
            return `<button type="button" class="${clases.join(' ')}" data-fecha="${opcion.valor}"`
                + ` style="--x: ${opcion.x}%; --y: ${opcion.y}%" title="${escapar(opcion.label)}"`
                + ` aria-label="${escapar(opcion.label)}"${habilitado ? '' : ' disabled'}></button>`;
        }).join('');

        const clase = habilitado ? 'watch-clock' : 'watch-clock is-disabled';
        const activaLabel = activa === 'no'
            ? 'Sin fechador'
            : `A las ${(posiciones.find(function (o) { return String(o.valor) === String(activa); }) || {}).label || ''}`;

        return ''
            + `<div class="${clase}">`
            +   `<div class="watch-clock__face">${puntos}</div>`
            +   '<div class="watch-clock__side">'
            +     `<p class="watch-clock__value">${escapar(activaLabel)}</p>`
            +     `<button type="button" class="watch-toggle${activa === 'no' ? ' is-active' : ''}" data-fecha="no"${habilitado ? '' : ' disabled'}>Sin fechador</button>`
            +   '</div>'
            + '</div>';
    }

    function renderResumen(lista, filas) {
        lista.innerHTML = filas.map(function (fila) {
            return `<dt>${escapar(fila.label)}</dt><dd>${escapar(fila.valor)}</dd>`;
        }).join('');
    }

    App.views.relojes = {
        FICHA,
        alternadorHtml,
        coloresHtml,
        escapar,
        fechadorHtml,
        montarCarrusel,
        moverCarrusel,
        renderPaneles,
        renderPasos,
        renderResumen,
        renderStage
    };
})(window.PerfSuarez);
