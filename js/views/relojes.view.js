(function (App) {
    function escapar(texto) {
        return String(texto == null ? '' : texto)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
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

    // ---------- Fichas: como se dibuja cada opcion ----------

    /**
     * Como recortar cada categoria para la muestra de color.
     *
     * Antes la muestra era el RGB promedio del asset, y mentia: el bisel GMT
     * "Rojo" es blanco y rojo, y promediado salia rosa. Ahora la muestra ES el
     * asset, recortado donde mejor se lee su color.
     */
    const MUESTRA = {
        bisel: 'contain',
        caja: 'contain',
        dial: 'cover',
        correa: 'tira',
        brazalete: 'tira'
    };

    function muestraHtml(pieza) {
        if (!pieza) {
            return '<span class="watch-muestra" aria-hidden="true"></span>';
        }
        // Agujas e indices son trazos de un par de pixeles: recortados no se
        // ve nada. Se muestran como una pastilla del metal que son.
        if (pieza.categoria === 'aguja' || pieza.categoria === 'indice') {
            return `<span class="watch-muestra watch-muestra--metal is-${escapar(pieza.acabado)}" aria-hidden="true"></span>`;
        }
        const modo = MUESTRA[pieza.categoria] || 'cover';
        return `<span class="watch-muestra watch-muestra--${modo}" style="background-image: url('${escapar(pieza.src)}')" aria-hidden="true"></span>`;
    }

    const ICONO_SIN_FOTO = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M6.5 17.5l11-11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
    const ICONO_CAMARA = '<svg viewBox="0 0 24 24"><path d="M4 8h3.2l1.8-2.5h6l1.8 2.5H20v11H4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="13.2" r="3.4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';

    /** Lo que va dentro de una ficha, del carrusel o del menu. */
    function fichaInterior(opcion, extras) {
        const conf = extras || {};
        switch (opcion.tipo) {
            case 'color':
                return muestraHtml(opcion.pieza);
            case 'fecha':
                return opcion.angulo === null || opcion.angulo === undefined
                    ? '<span class="watch-fecha is-sin" aria-hidden="true"></span>'
                    : `<span class="watch-fecha" style="--ang: ${opcion.angulo}deg" aria-hidden="true"><i></i></span>`;
            case 'foto':
                if (opcion.valor === 'si' && conf.foto) {
                    return `<span class="watch-foto-icono" aria-hidden="true"><img src="${conf.foto}" alt="" draggable="false"></span>`;
                }
                return `<span class="watch-foto-icono" aria-hidden="true">${opcion.valor === 'si' ? ICONO_CAMARA : ICONO_SIN_FOTO}</span>`;
            default:
                return opcion.pieza
                    ? `<img src="${escapar(opcion.pieza.src)}" alt="" draggable="false">`
                    : '';
        }
    }

    // ---------- Encabezado ----------

    /** "Paso 2 de 7 · Bisel", la barra de partes y la pregunta de la pantalla. */
    function renderEncabezado(el, info) {
        el.headPaso.textContent = `Paso ${info.parteIndice + 1} de ${info.partes.length} · ${info.parte.label}`;
        el.headBarra.innerHTML = info.partes.map(function (parte, indice) {
            let clase = '';
            if (indice < info.parteIndice) {
                clase = 'is-hecho';
            } else if (indice === info.parteIndice) {
                clase = 'is-actual';
            }
            return `<span class="${clase}"></span>`;
        }).join('');

        // Los puntitos cuentan las pantallas dentro de la parte: con uno solo
        // no dicen nada y se ocultan.
        el.headPuntos.innerHTML = info.totalEnParte > 1
            ? Array.from({ length: info.totalEnParte }, function (_, indice) {
                let clase = '';
                if (indice < info.enParte) {
                    clase = 'is-hecho';
                } else if (indice === info.enParte) {
                    clase = 'is-actual';
                }
                return `<i class="${clase}"></i>`;
            }).join('')
            : '';
        el.headPregunta.textContent = info.pregunta;
    }

    // ---------- Carrusel ----------

    // Distancia entre fichas, en px. El arrastre avanza una opcion cada este
    // tanto, asi que la tira sigue al dedo uno a uno.
    const FICHA = 76;
    // Cuantas fichas a cada lado siguen siendo visibles.
    const ALCANCE = 3;

    function montarCarrusel(rail, opciones, extras) {
        rail.innerHTML = opciones.map(function (opcion, indice) {
            return `<span class="watch-ficha watch-ficha--${opcion.tipo}" data-ficha="${indice}">${fichaInterior(opcion, extras)}</span>`;
        }).join('');
        return Array.from(rail.children);
    }

    /**
     * Coloca la tira segun la posicion (fraccionaria) elegida. Las fichas se
     * alejan del centro encogiendose y desvaneciendose, como el selector de
     * modo de la camara de iOS. `animado` suaviza el acomodo al soltar o al
     * tocar una flecha; durante el arrastre la tira va pegada al dedo.
     */
    function moverCarrusel(fichas, posicion, animado) {
        fichas.forEach(function (ficha, indice) {
            const distancia = indice - posicion;
            const absoluta = Math.abs(distancia);
            const suave = Math.min(absoluta, ALCANCE);
            const visible = absoluta <= ALCANCE + 0.5;
            ficha.style.transition = animado ? 'transform 240ms ease, opacity 240ms ease' : 'none';
            ficha.style.transform = `translate(-50%, -50%) translateX(${distancia * FICHA}px) scale(${1 - suave * 0.16})`;
            ficha.style.opacity = visible ? String(Math.max(0.15, 1 - suave * 0.28)) : '0';
            ficha.style.visibility = visible ? '' : 'hidden';
            ficha.style.zIndex = String(10 - Math.round(suave));
            ficha.classList.toggle('is-centro', Math.round(posicion) === indice);
        });
    }

    // ---------- Menu secundario ----------

    function alternadorHtml(opciones, activo) {
        return '<div class="watch-toggles" role="group">' + opciones.map(function (opcion) {
            const clase = opcion.valor === activo ? 'watch-toggle is-active' : 'watch-toggle';
            return `<button type="button" class="${clase}" data-modo-indices="${escapar(opcion.valor)}" aria-pressed="${opcion.valor === activo}">${escapar(opcion.label)}</button>`;
        }).join('') + '</div>';
    }

    /**
     * El menu dibuja la misma lista que se recorre deslizando, en grid. Es la
     * forma secundaria de elegir: para quien prefiere ver todo junto.
     */
    function renderMenu(contenedor, conf) {
        let html = `<p class="watch-menu-titulo">${escapar(conf.titulo)}</p>`;

        if (conf.indices) {
            html += '<div class="watch-avanzado">'
                + '<p class="watch-avanzado__titulo">Avanzado</p>'
                + alternadorHtml([
                    { valor: 'juego', label: 'Todos iguales' },
                    { valor: 'individual', label: 'Uno por uno' }
                ], conf.indices.modo)
                + (conf.indices.modo === 'individual'
                    ? `<p class="watch-panel-note">Tocá una hora sobre el reloj para cambiarla. Ahora estás cambiando las ${conf.indices.hora}.</p>`
                    : '')
                + '</div>';
        }

        html += `<div class="watch-grid">${conf.opciones.map(function (opcion, indice) {
            const activa = indice === conf.actual;
            return `<button type="button" class="watch-option${activa ? ' is-active' : ''}" data-opcion="${indice}" aria-pressed="${activa}">`
                + `<span class="watch-option__ficha watch-option__ficha--${opcion.tipo}">${fichaInterior(opcion, conf.extras)}</span>`
                + `<span class="watch-option__label">${escapar(opcion.etiqueta)}</span>`
                + '</button>';
        }).join('')}</div>`;

        if (conf.foto) {
            html += '<div class="watch-foto-acciones">'
                + `<button type="button" class="watch-btn watch-btn--solid" data-foto="elegir">${conf.foto.tiene ? 'Cambiar foto' : 'Elegir foto'}</button>`
                + (conf.foto.tiene ? '<button type="button" class="watch-btn watch-btn--ghost" data-foto="quitar">Borrar foto</button>' : '')
                + '</div>'
                + '<p class="watch-panel-note">La foto queda solo en este teléfono: no se sube a ningún lado.</p>';
        }

        contenedor.innerHTML = html;
    }

    /** Cambia la opcion marcada sin volver a dibujar el grid (no mueve el scroll). */
    function marcarActivo(contenedor, actual) {
        contenedor.querySelectorAll('[data-opcion]').forEach(function (boton) {
            const activa = Number(boton.dataset.opcion) === actual;
            boton.classList.toggle('is-active', activa);
            boton.setAttribute('aria-pressed', String(activa));
        });
    }

    // ---------- Resultado ----------

    function renderResumen(lista, filas, extras) {
        lista.innerHTML = filas.map(function (fila) {
            return '<li class="watch-resumen__fila">'
                + `<span class="watch-resumen__mini">${fila.opcion ? fichaInterior(fila.opcion, extras) : ''}</span>`
                + `<span class="watch-resumen__texto"><small>${escapar(fila.label)}</small><strong>${escapar(fila.valor)}</strong></span>`
                + `<button type="button" class="watch-resumen__cambiar" data-parte="${escapar(fila.parte)}">Cambiar</button>`
                + '</li>';
        }).join('');
    }

    App.views.relojes = {
        FICHA,
        escapar,
        marcarActivo,
        montarCarrusel,
        moverCarrusel,
        renderEncabezado,
        renderMenu,
        renderResumen,
        renderStage
    };
})(window.PerfSuarez);
