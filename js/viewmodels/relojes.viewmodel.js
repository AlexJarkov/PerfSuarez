(function (App) {
    const WHATSAPP_NUMBER = '78064327';
    const ESTADOS_SHEET = ['is-expanded', 'is-half', 'is-collapsed'];

    function initRelojes() {
        const builder = document.getElementById('watch-builder');
        if (!builder) {
            return;
        }

        const catalogo = App.data.relojes;
        const modelo = App.models.relojes;
        const vista = App.views.relojes;
        const pasos = catalogo.PASOS;

        const el = {
            frame: document.getElementById('watch-frame'),
            status: document.getElementById('watch-status'),
            sheet: document.getElementById('watch-sheet'),
            handle: document.getElementById('watch-sheet-handle'),
            hint: document.getElementById('watch-sheet-hint'),
            hintText: document.getElementById('watch-sheet-hint-text'),
            zoom: document.getElementById('watch-zoom'),
            steps: document.getElementById('watch-steps'),
            body: document.getElementById('watch-sheet-body'),
            title: document.getElementById('watch-step-title'),
            copy: document.getElementById('watch-step-copy'),
            filters: document.getElementById('watch-filters'),
            panels: document.getElementById('watch-panels'),
            prev: document.getElementById('watch-prev'),
            next: document.getElementById('watch-next'),
            result: document.getElementById('watch-result'),
            resultImg: document.getElementById('watch-result-img'),
            resultSummary: document.getElementById('watch-result-summary'),
            resultClose: document.getElementById('watch-result-close'),
            wa: document.getElementById('watch-wa'),
            cart: document.getElementById('watch-cart'),
            download: document.getElementById('watch-download')
        };

        let seleccion = {};
        let pasoActivo = 0;
        let visitados = [];
        // Filtro activo por paso, para no perderlo al ir y volver.
        const filtros = {};
        let estadoSheet = 0;

        // ---------- Datos de cada paso ----------

        function filtrosDe(pasoId) {
            const opciones = modelo.opcionesDe(pasoId, seleccion);
            let campo = null;

            if (pasoId === 'aguja') {
                campo = 'acabado';
            } else if (pasoId === 'indice' || pasoId === 'correa') {
                campo = 'familia';
            }

            if (!campo) {
                return [];
            }

            const vistos = [];
            opciones.forEach(function (pieza) {
                // El paso de correa mezcla categorias (cuero y brazalete).
                const valor = pasoId === 'correa' && pieza.categoria === 'brazalete'
                    ? 'brazalete'
                    : pieza[campo];
                if (vistos.indexOf(valor) < 0) {
                    vistos.push(valor);
                }
            });

            return [{ valor: 'todos', label: 'Todos' }].concat(vistos.map(function (valor) {
                return { valor: valor, label: etiquetaFiltro(pasoId, valor) };
            }));
        }

        function etiquetaFiltro(pasoId, valor) {
            if (pasoId === 'aguja') {
                return catalogo.ACABADOS[valor] || valor;
            }
            if (pasoId === 'indice') {
                return catalogo.FAMILIAS_INDICE[valor] || valor;
            }
            if (pasoId === 'correa') {
                return valor === 'brazalete' ? 'Brazalete metálico' : (catalogo.FAMILIAS_CORREA[valor] || valor);
            }
            return valor;
        }

        function aplicarFiltro(pasoId, opciones) {
            const activo = filtros[pasoId] || 'todos';
            if (activo === 'todos') {
                return opciones;
            }
            return opciones.filter(function (pieza) {
                if (pasoId === 'correa') {
                    return activo === 'brazalete'
                        ? pieza.categoria === 'brazalete'
                        : pieza.categoria === 'correa' && pieza.familia === activo;
                }
                if (pasoId === 'aguja') {
                    return pieza.acabado === activo;
                }
                return pieza.familia === activo;
            });
        }

        function panelesDe(pasoId) {
            const opciones = aplicarFiltro(pasoId, modelo.opcionesDe(pasoId, seleccion));

            if (pasoId === 'aguja') {
                const elegida = modelo.get(seleccion.aguja);
                return [
                    { campo: 'aguja', titulo: 'Horas y minutos', opciones: opciones, seleccion: seleccion.aguja },
                    {
                        campo: 'segundero',
                        titulo: 'Segundero',
                        opciones: modelo.agujasSegundero(elegida && elegida.acabado),
                        seleccion: seleccion.segundero
                    }
                ];
            }

            return [{ campo: pasoId, opciones: opciones, seleccion: seleccion[pasoId] }];
        }

        // ---------- Render ----------

        function pintarReloj() {
            vista.renderStage(el.frame, modelo.capasDe(seleccion));
        }

        function pintarPaso() {
            const paso = pasos[pasoActivo];
            vista.renderPasos(el.steps, pasos, pasoActivo, visitados);
            el.title.textContent = paso.titulo;
            el.copy.textContent = mensajeDePaso(paso);
            vista.renderFiltros(el.filters, filtrosDe(paso.id), filtros[paso.id] || 'todos');
            vista.renderPaneles(el.panels, panelesDe(paso.id));

            el.prev.disabled = pasoActivo === 0;
            el.next.textContent = pasoActivo === pasos.length - 1 ? 'Ver mi reloj' : 'Siguiente';
            el.body.scrollTop = 0;

            centrarChipActivo();
        }

        /**
         * Centra el chip del paso actual moviendo SOLO el riel.
         * No usar scrollIntoView: propaga el scroll a todos los contenedores
         * ancestros, incluidos los del documento padre cuando la pagina corre
         * embebida, y termina desplazando el carrusel de paneles del shell.
         */
        function centrarChipActivo() {
            const chip = el.steps.querySelector('.is-active');
            if (!chip) {
                return;
            }
            const destino = chip.offsetLeft - (el.steps.clientWidth - chip.offsetWidth) / 2;
            el.steps.scrollLeft = Math.max(0, destino);
        }

        function mensajeDePaso(paso) {
            if (paso.id === 'bisel') {
                const caja = modelo.get(seleccion.caja);
                if (caja && catalogo.CAJAS_CON_BISEL_INTEGRADO.indexOf(caja.id) >= 0) {
                    return 'Esta caja ya trae bisel integrado. El que elijas se monta encima.';
                }
            }
            return paso.descripcion;
        }

        function marcarVisitado(pasoId) {
            if (visitados.indexOf(pasoId) < 0) {
                visitados.push(pasoId);
            }
        }

        // ---------- Navegación ----------

        function irAPaso(indice) {
            pasoActivo = Math.max(0, Math.min(pasos.length - 1, indice));
            marcarVisitado(pasos[pasoActivo].id);
            pintarPaso();
        }

        function elegir(campo, id) {
            seleccion[campo] = Number(id);

            // Cambiar de acabado de aguja deja el segundero de otro color; se
            // reemplaza por uno del mismo acabado.
            if (campo === 'aguja') {
                const aguja = modelo.get(seleccion.aguja);
                const actual = modelo.get(seleccion.segundero);
                if (aguja && (!actual || actual.acabado !== aguja.acabado)) {
                    const alternativa = modelo.agujasSegundero(aguja.acabado)[0];
                    seleccion.segundero = alternativa ? alternativa.id : seleccion.segundero;
                }
            }

            marcarVisitado(pasos[pasoActivo].id);
            pintarReloj();
            pintarPaso();
        }

        // ---------- Sheet arrastrable ----------

        function aplicarEstadoSheet() {
            ESTADOS_SHEET.forEach(function (clase, indice) {
                builder.classList.toggle(clase, indice === estadoSheet);
            });
            // El texto acompaña a lo que hace el próximo toque.
            el.hintText.textContent = estadoSheet === ESTADOS_SHEET.length - 1
                ? 'Deslizá para volver a las opciones'
                : 'Deslizá para ver el reloj más grande';
        }

        function initSheet() {
            aplicarEstadoSheet();
            el.hint.classList.add('is-pulsing');
            // Una vez que el usuario mueve el panel, la pista ya cumplió.
            el.hint.addEventListener('animationend', function () {
                el.hint.classList.remove('is-pulsing');
            });

            // Tocar el reloj lo amplía si todavía está en vista chica.
            el.zoom.addEventListener('click', function () {
                if (estadoSheet < ESTADOS_SHEET.length - 1) {
                    estadoSheet += 1;
                    el.hint.classList.remove('is-pulsing');
                    aplicarEstadoSheet();
                }
            });

            let inicio = null;
            // Al soltar un arrastre el navegador dispara igual un click; sin
            // esto el panel saltaria de estado dos veces.
            let ignorarClick = false;

            el.handle.addEventListener('click', function () {
                if (ignorarClick) {
                    ignorarClick = false;
                    return;
                }
                estadoSheet = (estadoSheet + 1) % ESTADOS_SHEET.length;
                el.hint.classList.remove('is-pulsing');
                aplicarEstadoSheet();
            });

            el.handle.addEventListener('pointerdown', function (event) {
                el.hint.classList.remove('is-pulsing');
                inicio = { y: event.clientY, alto: el.sheet.getBoundingClientRect().height, movido: false };
                el.handle.setPointerCapture(event.pointerId);
                builder.classList.add('is-dragging');
            });

            el.handle.addEventListener('pointermove', function (event) {
                if (!inicio) {
                    return;
                }
                const delta = event.clientY - inicio.y;
                if (Math.abs(delta) > 4) {
                    inicio.movido = true;
                }
                const alto = Math.max(96, Math.min(window.innerHeight * 0.8, inicio.alto - delta));
                // La variable vive en el builder: es el grid quien reparte el alto.
                builder.style.setProperty('--sheet-height', `${alto}px`);
            });

            function soltar(event) {
                if (!inicio) {
                    return;
                }
                const movido = inicio.movido;
                const alto = el.sheet.getBoundingClientRect().height;
                inicio = null;
                builder.classList.remove('is-dragging');
                builder.style.removeProperty('--sheet-height');
                el.handle.releasePointerCapture?.(event.pointerId);

                if (!movido) {
                    return;
                }

                ignorarClick = true;
                // Se engancha al punto de anclaje mas cercano.
                const ratio = alto / window.innerHeight;
                estadoSheet = ratio > 0.45 ? 0 : (ratio > 0.24 ? 1 : 2);
                aplicarEstadoSheet();
            }

            el.handle.addEventListener('pointerup', soltar);
            el.handle.addEventListener('pointercancel', soltar);
        }

        // ---------- Resultado ----------

        function resumen() {
            const filas = [];
            pasos.forEach(function (paso) {
                const pieza = modelo.get(seleccion[paso.id]);
                if (pieza) {
                    filas.push({ label: paso.label, valor: catalogo.nombrarPieza(pieza, modelo.ordinalDe(pieza)) });
                }
            });
            const segundero = modelo.get(seleccion.segundero);
            if (segundero) {
                filas.push({ label: 'Segundero', valor: catalogo.nombrarPieza(segundero, modelo.ordinalDe(segundero)) });
            }
            return filas;
        }

        function mensajeWhatsApp() {
            const lineas = ['Hola! Quisiera pedir este Suarez Watch:', ''];
            resumen().forEach(function (fila) {
                lineas.push(`- ${fila.label}: ${fila.valor}`);
            });
            lineas.push('', `Precio: ${catalogo.MONEDA} ${catalogo.PRECIO_USD}`);
            return lineas.join('\n');
        }

        let composicion = null;

        function abrirResultado() {
            el.status.textContent = 'Componiendo tu reloj…';
            modelo.renderizar(seleccion, 1600).then(function (canvas) {
                composicion = canvas;
                el.resultImg.src = canvas.toDataURL('image/png');
                vista.renderResumen(el.resultSummary, resumen());
                el.wa.href = `https://wa.me/${WHATSAPP_NUMBER}/?text=${encodeURIComponent(mensajeWhatsApp())}`;
                el.result.hidden = false;
                el.result.setAttribute('aria-hidden', 'false');
                el.status.textContent = '';
            }).catch(function (error) {
                el.status.textContent = 'No se pudo componer la imagen.';
                console.error(error);
            });
        }

        function cerrarResultado() {
            el.result.hidden = true;
            el.result.setAttribute('aria-hidden', 'true');
        }

        function agregarAlCarrito() {
            if (!App.models.cart) {
                return;
            }

            // En localStorage solo entra una miniatura; la imagen grande pesa
            // varios MB y reventaria la cuota del carrito.
            modelo.renderizar(seleccion, 220).then(function (mini) {
                const detalle = resumen().map(function (fila) {
                    return `${fila.label}: ${fila.valor}`;
                });

                App.models.cart.addItem({
                    type: 'reloj',
                    title: 'Suarez Watch a medida',
                    subtitle: 'Reloj configurado pieza por pieza',
                    totalPrice: catalogo.PRECIO_USD,
                    currency: catalogo.MONEDA,
                    image: mini.toDataURL('image/webp', 0.8),
                    detailLines: detalle,
                    whatsappLines: ['- Suarez Watch a medida'].concat(detalle.map(function (linea) {
                        return `  • ${linea}`;
                    }))
                });

                cerrarResultado();
                App.viewmodels.cart?.openCart();
                el.status.textContent = 'Reloj añadido al carrito.';
            });
        }

        function descargar() {
            if (!composicion) {
                return;
            }
            composicion.toBlob(function (blob) {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'suarez-watch.png';
                link.click();
                URL.revokeObjectURL(url);
            }, 'image/png');
        }

        // ---------- Eventos ----------

        el.steps.addEventListener('click', function (event) {
            const chip = event.target.closest('[data-paso]');
            if (chip) {
                irAPaso(pasos.findIndex(function (paso) {
                    return paso.id === chip.dataset.paso;
                }));
            }
        });

        el.filters.addEventListener('click', function (event) {
            const chip = event.target.closest('[data-filtro]');
            if (chip) {
                filtros[pasos[pasoActivo].id] = chip.dataset.filtro;
                pintarPaso();
            }
        });

        el.panels.addEventListener('click', function (event) {
            const boton = event.target.closest('[data-pieza]');
            if (!boton) {
                return;
            }
            const grid = boton.closest('[data-campo]');
            elegir(grid.dataset.campo, boton.dataset.pieza);
        });

        el.prev.addEventListener('click', function () {
            irAPaso(pasoActivo - 1);
        });

        el.next.addEventListener('click', function () {
            if (pasoActivo === pasos.length - 1) {
                abrirResultado();
                return;
            }
            irAPaso(pasoActivo + 1);
        });

        el.resultClose.addEventListener('click', cerrarResultado);
        el.cart.addEventListener('click', agregarAlCarrito);
        el.download.addEventListener('click', descargar);

        // ---------- Arranque ----------

        el.frame.classList.add('is-loading');
        modelo.load().then(function () {
            seleccion = modelo.seleccionInicial();
            visitados = ['caja'];
            initSheet();
            pintarReloj();
            pintarPaso();
            el.frame.classList.remove('is-loading');
            el.status.textContent = '';
        }).catch(function (error) {
            el.status.textContent = 'No se pudieron cargar las piezas del reloj.';
            console.error(error);
        });
    }

    App.viewmodels.relojes = { initRelojes };

    App.core.onReady(function () {
        App.viewmodels.common?.initGlobalUi();
        initRelojes();
    });
})(window.PerfSuarez);
