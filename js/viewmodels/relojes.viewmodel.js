(function (App) {
    const WHATSAPP_NUMBER = '78064327';
    const CLAVE_FOTO = 'perfsuarez:reloj:foto';
    // La foto viaja a localStorage como data URL: a 700 px y calidad 0.82 pesa
    // unos 60 KB, lejos del tope de 5 MB que comparte con el carrito.
    const FOTO_LADO = 700;
    const FOTO_CALIDAD = 0.82;
    // Si en este tiempo nadie toca nada, una mano muestra el gesto.
    const INACTIVIDAD_MS = 8000;
    // La pista deja de aparecer cuando ya se cambio de opcion varias veces.
    const CAMBIOS_PARA_APRENDIDO = 3;
    // Cuanto hay que desplazar el trackpad para pasar una opcion.
    const UMBRAL_RUEDA = 36;

    function initRelojes() {
        const builder = document.getElementById('watch-builder');
        if (!builder) {
            return;
        }

        const catalogo = App.data.relojes;
        const modelo = App.models.relojes;
        const vista = App.views.relojes;
        const partes = catalogo.PASOS;
        const escritorio = window.matchMedia('(min-width: 900px)');

        const el = {
            head: document.getElementById('watch-head'),
            headPaso: document.getElementById('watch-head-paso'),
            headPuntos: document.getElementById('watch-head-puntos'),
            headBarra: document.getElementById('watch-head-barra'),
            headPregunta: document.getElementById('watch-head-pregunta'),
            stage: document.getElementById('watch-stage'),
            frame: document.getElementById('watch-frame'),
            status: document.getElementById('watch-status'),
            arrowPrev: document.getElementById('watch-arrow-prev'),
            arrowNext: document.getElementById('watch-arrow-next'),
            menuAbrir: document.getElementById('watch-menu-abrir'),
            fotoElegir: document.getElementById('watch-foto-elegir'),
            carrusel: document.getElementById('watch-carousel'),
            rail: document.getElementById('watch-carousel-rail'),
            opcionNombre: document.getElementById('watch-opcion-nombre'),
            opcionCuenta: document.getElementById('watch-opcion-cuenta'),
            sheetCerrar: document.getElementById('watch-sheet-cerrar'),
            body: document.getElementById('watch-sheet-body'),
            panels: document.getElementById('watch-panels'),
            foto: document.getElementById('watch-foto'),
            prev: document.getElementById('watch-prev'),
            next: document.getElementById('watch-next'),
            result: document.getElementById('watch-result'),
            resultImg: document.getElementById('watch-result-img'),
            resultPrice: document.getElementById('watch-result-price'),
            resultSummary: document.getElementById('watch-result-summary'),
            resultClose: document.getElementById('watch-result-close'),
            wa: document.getElementById('watch-wa'),
            cart: document.getElementById('watch-cart'),
            download: document.getElementById('watch-download')
        };

        let seleccion = {};
        let pantallas = [];
        let pantallaId = partes[0].pantallas[0].id;
        let opciones = [];
        let actual = 0;
        let fichas = [];
        let claveMontada = '';
        let menuAbierto = false;
        let resultadoAbierto = false;
        // Modo avanzado de los indices, solo desde el menu: 'juego' aplica el
        // mismo glifo a las doce horas, 'individual' edita una por una.
        let modoIndices = 'juego';
        let posicionActiva = 11;
        let cambios = 0;

        // ---------- Tutorial ----------

        /**
         * Mientras corre el tutorial, `data-tuto-permite` dice que acciones
         * valen: si alguien toca otra cosa no pasa nada, y el paso no se
         * desordena. Sin tutorial, todo esta permitido.
         */
        function permitido(accion) {
            const permite = builder.dataset.tutoPermite;
            if (permite === undefined) {
                return true;
            }
            return permite.split(' ').indexOf(accion) >= 0;
        }

        function emitir(tipo, detalle) {
            builder.dispatchEvent(new CustomEvent(`reloj:${tipo}`, { detail: detalle || {} }));
        }

        // ---------- Estado derivado ----------

        function pantallaActual() {
            return pantallas.find(function (pantalla) {
                return pantalla.id === pantallaId;
            }) || pantallas[0];
        }

        function indicePantalla() {
            return pantallas.findIndex(function (pantalla) {
                return pantalla.id === pantallaId;
            });
        }

        function enModoAvanzado() {
            const pantalla = pantallaActual();
            return !!pantalla && pantalla.parte.id === 'indice' && modoIndices === 'individual';
        }

        function idDeOpciones() {
            return enModoAvanzado() ? 'indice-pos' : pantallaId;
        }

        function extra() {
            return { posicion: posicionActiva };
        }

        function claveDe(lista) {
            return lista.map(function (opcion) {
                return opcion.valor;
            }).join(',');
        }

        /**
         * Si la pantalla actual deja de tener sentido (por ejemplo, la fecha de
         * un dial que no la admite) se pasa a la siguiente que exista, en el
         * orden del catalogo.
         */
        function recalcular() {
            pantallas = modelo.pantallasDe(seleccion);
            if (!pantallas.some(function (pantalla) { return pantalla.id === pantallaId; })) {
                const orden = [];
                partes.forEach(function (parte) {
                    parte.pantallas.forEach(function (pantalla) {
                        orden.push(pantalla.id);
                    });
                });
                const desde = orden.indexOf(pantallaId);
                const siguiente = orden.slice(desde + 1).concat(orden.slice(0, desde)).find(function (id) {
                    return pantallas.some(function (pantalla) { return pantalla.id === id; });
                });
                pantallaId = siguiente || pantallas[0].id;
            }
            const id = idDeOpciones();
            opciones = modelo.opcionesDe(id, seleccion, extra());
            actual = modelo.indiceActual(id, seleccion, opciones, extra());
        }

        // ---------- Render ----------

        function extrasDeVista() {
            return { foto: seleccion.foto };
        }

        function pintarReloj() {
            vista.renderStage(el.frame, modelo.capasDe(seleccion));
            builder.classList.toggle('is-editando-indices', enModoAvanzado());
            marcarPosicionActiva();
        }

        /** Aro dorado sobre el indice que se esta editando. */
        function marcarPosicionActiva() {
            if (!enModoAvanzado()) {
                el.stage.style.removeProperty('--marca-x');
                el.stage.style.removeProperty('--marca-y');
                return;
            }
            // El aro vive dentro del mismo cuadrado que el reloj: el modelo da
            // el centro como fraccion del lado y alcanza con porcentajes.
            const centro = modelo.centrosDeIndices(seleccion)[posicionActiva];
            if (centro) {
                el.stage.style.setProperty('--marca-x', `${centro.x * 100}%`);
                el.stage.style.setProperty('--marca-y', `${centro.y * 100}%`);
            }
        }

        function pintarEncabezado() {
            const pantalla = pantallaActual();
            vista.renderEncabezado(el, {
                partes: partes,
                parte: pantalla.parte,
                parteIndice: pantalla.parteIndice,
                enParte: pantalla.enParte,
                totalEnParte: pantalla.totalEnParte,
                pregunta: enModoAvanzado()
                    ? `¿Qué ponemos en las ${posicionActiva + 1}?`
                    : pantalla.pantalla.pregunta
            });
        }

        function pintarEtiqueta() {
            const opcion = opciones[actual];
            el.opcionNombre.textContent = opcion ? opcion.etiqueta : '';
            el.opcionCuenta.textContent = opciones.length > 1 ? `${actual + 1} de ${opciones.length}` : '';
            el.arrowPrev.disabled = actual <= 0;
            el.arrowNext.disabled = actual >= opciones.length - 1;
        }

        function pintarNav() {
            const indice = indicePantalla();
            const ultima = indice === pantallas.length - 1;
            el.prev.disabled = indice <= 0;
            el.next.textContent = ultima ? 'Terminar mi reloj' : 'Siguiente';
            el.next.classList.toggle('is-final', ultima);
        }

        function pintarFotoAccion() {
            const visible = pantallaId === 'foto' && !!seleccion.usarFoto;
            el.fotoElegir.hidden = !visible;
            el.fotoElegir.textContent = seleccion.foto ? 'Cambiar foto' : 'Elegir foto';
            // Con el boton de la foto a la vista, "Ver todas" sobra y lo tapa.
            el.menuAbrir.hidden = visible;
        }

        function montarCarrusel() {
            fichas = vista.montarCarrusel(el.rail, opciones, extrasDeVista());
            claveMontada = claveDe(opciones);
            vista.moverCarrusel(fichas, actual, false);
        }

        function sincronizarCarrusel(animado) {
            if (claveDe(opciones) !== claveMontada) {
                montarCarrusel();
                return;
            }
            vista.moverCarrusel(fichas, actual, animado);
        }

        /** Siempre conserva el scroll: volver arriba solo pasa al cambiar de pantalla. */
        function pintarMenu() {
            const scroll = el.body.scrollTop;
            const pantalla = pantallaActual();
            vista.renderMenu(el.panels, {
                titulo: enModoAvanzado() ? `Elegí qué va en las ${posicionActiva + 1}` : pantalla.pantalla.pregunta,
                opciones: opciones,
                actual: actual,
                extras: extrasDeVista(),
                indices: pantalla.parte.id === 'indice' ? { modo: modoIndices, hora: posicionActiva + 1 } : null,
                foto: pantalla.id === 'foto' ? { tiene: !!seleccion.foto } : null
            });
            el.body.scrollTop = scroll;
        }

        function pintarTodo() {
            recalcular();
            pintarReloj();
            pintarEncabezado();
            montarCarrusel();
            pintarEtiqueta();
            pintarMenu();
            pintarNav();
            pintarFotoAccion();
        }

        /**
         * Centra la opcion elegida moviendo SOLO el cuerpo del menu.
         * No usar scrollIntoView: propaga el scroll a todos los contenedores
         * ancestros, incluidos los del documento padre cuando la pagina corre
         * embebida, y termina desplazando el carrusel de paneles del shell.
         */
        function centrarOpcionActiva() {
            const boton = el.panels.querySelector('.watch-option.is-active');
            if (!boton) {
                return;
            }
            const destino = boton.offsetTop - (el.body.clientHeight - boton.offsetHeight) / 2;
            el.body.scrollTop = Math.max(0, destino);
        }

        // ---------- Elegir ----------

        function vibrar() {
            try {
                if (navigator.vibrate) {
                    navigator.vibrate(8);
                }
            } catch (error) {
                // Algunos navegadores lo bloquean dentro de iframes.
            }
        }

        /**
         * Aplica la opcion `indice` de `lista`. Durante un arrastre la lista es
         * la que estaba al empezar: si se rearmara a mitad del gesto (cambia el
         * color preferido de cada modelo) la tira y el dedo se desfasarian.
         */
        function elegirOpcion(indice, origen, lista) {
            const fuente = lista || opciones;
            const destino = Math.max(0, Math.min(fuente.length - 1, indice));
            if (!fuente.length || (fuente === opciones && destino === actual)) {
                return false;
            }
            const opcion = fuente[destino];
            seleccion = modelo.aplicar(idDeOpciones(), seleccion, opcion.valor, extra());
            cambios += 1;
            if (origen === 'arrastre' || origen === 'flecha' || origen === 'rueda') {
                vibrar();
            }

            recalcular();
            pintarReloj();
            pintarEncabezado();
            pintarEtiqueta();
            pintarNav();
            pintarFotoAccion();

            // El grid solo se rehace si cambiaron sus opciones; si no, se mueve
            // la marca. En los dos casos el scroll queda donde estaba.
            if (claveDe(opciones) !== claveMontada) {
                pintarMenu();
            } else {
                vista.marcarActivo(el.panels, actual);
            }
            if (origen !== 'arrastre') {
                sincronizarCarrusel(true);
            }

            // Elegir "Con mi foto" con un toque abre directo el selector de
            // archivos. Desde un arrastre no se puede: el navegador exige que
            // lo dispare un click.
            if (pantallaId === 'foto' && opcion.valor === 'si' && !seleccion.foto && origen !== 'arrastre' && origen !== 'rueda') {
                el.foto.click();
            }

            emitir('opcion', { origen: origen });
            return true;
        }

        function irAPantalla(id) {
            pantallaId = id;
            if (!pantallaActual() || pantallaActual().parte.id !== 'indice') {
                modoIndices = 'juego';
            }
            pintarTodo();
            if (pantallaActual().parte.id !== 'indice') {
                modoIndices = 'juego';
            }
            el.body.scrollTop = 0;
            centrarOpcionActiva();
            emitir('pantalla', { id: pantallaId });
        }

        function irAParte(parteId) {
            const primera = pantallas.find(function (pantalla) {
                return pantalla.parte.id === parteId;
            });
            if (primera) {
                irAPantalla(primera.id);
            }
        }

        // ---------- Navegacion del padre ----------

        function navOculta() {
            // Durante el tutorial tambien: el dock tapaba la tarjeta y era una
            // salida facil a mitad de aprendizaje.
            const tutorialActivo = builder.dataset.tutoPermite !== undefined;
            return !escritorio.matches && (menuAbierto || resultadoAbierto || tutorialActivo);
        }

        /**
         * Con el menu o el resultado abiertos se esconden el header y el dock
         * del shell: el espacio es del reloj. El padre es del mismo origen, asi
         * que se tocan sus clases directo; `catalog-dock--detail-hidden` ya
         * existia en catalog-dock.css.
         */
        function sincronizarNav() {
            const ocultar = navOculta();
            document.body.classList.toggle('is-nav-oculta', ocultar);
            if (window.parent === window) {
                return;
            }
            try {
                const doc = window.parent.document;
                doc.body.classList.toggle('is-watch-menu', ocultar);
                const dock = doc.getElementById('catalog-dock');
                if (dock) {
                    dock.classList.toggle('catalog-dock--detail-hidden', ocultar);
                }
            } catch (error) {
                // Padre de otro origen: la navegacion queda como esta.
            }
        }

        /**
         * El shell restituye su navegacion al cambiar de panel. Si eso pasa con
         * el menu abierto, el menu se cierra: si no, al volver a Watches el
         * reloj quedaria achicado debajo del header.
         */
        function vigilarNavDelPadre() {
            if (window.parent === window || typeof MutationObserver === 'undefined') {
                return;
            }
            try {
                const cuerpo = window.parent.document.body;
                new MutationObserver(function () {
                    if (navOculta() && !cuerpo.classList.contains('is-watch-menu')) {
                        menuAbierto = false;
                        builder.classList.remove('is-menu');
                        document.body.classList.remove('is-nav-oculta');
                    }
                }).observe(cuerpo, { attributes: true, attributeFilter: ['class'] });
            } catch (error) {
                // Padre de otro origen.
            }
        }

        // ---------- Menu ----------

        function alternarMenu(abrir) {
            const siguiente = typeof abrir === 'boolean' ? abrir : !menuAbierto;
            if (siguiente === menuAbierto) {
                return;
            }
            menuAbierto = siguiente;
            builder.classList.toggle('is-menu', menuAbierto);
            sincronizarNav();
            if (menuAbierto) {
                requestAnimationFrame(centrarOpcionActiva);
            }
            // El stage cambia de alto: el aro del indice se recalcula en pixeles.
            requestAnimationFrame(marcarPosicionActiva);
            emitir(menuAbierto ? 'menu-abierto' : 'menu-cerrado');
        }

        // ---------- Gestos ----------

        /**
         * Arrastre con carrusel, al estilo del selector de modo de la camara de
         * iOS: la tira de opciones sigue al dedo y la del centro se aplica. El
         * indice fraccionario manda tanto la animacion como la seleccion, asi
         * lo que se ve y lo que se elige no se separan.
         *
         * Vale sobre el reloj y sobre la tira. Un toque sin movimiento llama a
         * `alTocar`.
         */
        function conectarArrastre(zona, alTocar) {
            let gesto = null;

            zona.addEventListener('pointerdown', function (event) {
                if ((event.button !== undefined && event.button > 0) || event.target.closest('button')) {
                    return;
                }
                gesto = {
                    x: event.clientX,
                    y: event.clientY,
                    movido: false,
                    bloqueado: false,
                    base: actual,
                    aplicado: actual,
                    lista: opciones,
                    objetivo: event.target
                };
                zona.setPointerCapture?.(event.pointerId);
            });

            zona.addEventListener('pointermove', function (event) {
                if (!gesto) {
                    return;
                }
                const dx = event.clientX - gesto.x;
                const dy = event.clientY - gesto.y;
                if (!gesto.movido) {
                    if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) {
                        return;
                    }
                    gesto.movido = true;
                    gesto.bloqueado = !permitido('arrastre') || gesto.lista.length < 2;
                    if (!gesto.bloqueado) {
                        builder.classList.add('is-arrastrando');
                    }
                }
                if (gesto.bloqueado) {
                    return;
                }

                // Restar y no sumar: la tira acompana al dedo. Al arrastrar a
                // la derecha las fichas viajan a la derecha y entra la anterior.
                const posicion = Math.max(0, Math.min(gesto.lista.length - 1, gesto.base - dx / vista.FICHA));
                vista.moverCarrusel(fichas, posicion, false);

                const destino = Math.round(posicion);
                if (destino !== gesto.aplicado) {
                    gesto.aplicado = destino;
                    elegirOpcion(destino, 'arrastre', gesto.lista);
                }
            });

            function soltar(event) {
                if (!gesto) {
                    return;
                }
                const terminado = gesto;
                gesto = null;
                zona.releasePointerCapture?.(event.pointerId);

                if (!terminado.movido) {
                    if (event.type === 'pointerup') {
                        alTocar(event, terminado.objetivo);
                    }
                    return;
                }
                if (terminado.bloqueado) {
                    return;
                }
                builder.classList.remove('is-arrastrando');
                sincronizarCarrusel(true);
                emitir('arrastre-fin', { cambio: terminado.aplicado !== terminado.base });
            }

            zona.addEventListener('pointerup', soltar);
            zona.addEventListener('pointercancel', soltar);
        }

        /**
         * Swipe de trackpad en escritorio. El builder es
         * `data-shell-swipe-ignore`, asi que el shell no cambia de panel; aca se
         * traduce a una opcion por gesto, con el mismo lock que usa el shell.
         */
        function conectarRueda(zona) {
            let acumulado = 0;
            let bloqueado = false;
            let reinicio = null;

            zona.addEventListener('wheel', function (event) {
                if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) {
                    return;
                }
                event.preventDefault();
                clearTimeout(reinicio);
                reinicio = setTimeout(function () {
                    acumulado = 0;
                    bloqueado = false;
                }, 180);
                if (bloqueado || !permitido('arrastre')) {
                    return;
                }
                acumulado += event.deltaX;
                if (Math.abs(acumulado) > UMBRAL_RUEDA) {
                    bloqueado = true;
                    elegirOpcion(actual + (acumulado > 0 ? 1 : -1), 'rueda');
                }
            }, { passive: false });
        }

        function alTocarReloj(event) {
            if (enModoAvanzado() && apuntarIndice(event.clientX, event.clientY)) {
                return;
            }
            // En escritorio el menu esta siempre a la vista.
            if (escritorio.matches || !permitido('menu')) {
                return;
            }
            alternarMenu();
        }

        function alTocarCarrusel(event, objetivo) {
            const ficha = objetivo && objetivo.closest ? objetivo.closest('[data-ficha]') : null;
            if (ficha && permitido('elegir')) {
                elegirOpcion(Number(ficha.dataset.ficha), 'toque');
            }
        }

        /** Un toque sobre una hora, en modo "uno por uno", la elige para editar. */
        function apuntarIndice(clientX, clientY) {
            const caja = el.frame.getBoundingClientRect();
            const posicion = modelo.posicionMasCercana(
                seleccion,
                (clientX - caja.left) / caja.width,
                (clientY - caja.top) / caja.height
            );
            if (posicion === null || posicion === modelo.posicionOcupadaPorFecha(seleccion.fechador)) {
                return false;
            }
            posicionActiva = posicion;
            pintarTodo();
            return true;
        }

        // ---------- Pista por inactividad ----------

        let temporizadorPista = null;

        function reiniciarPista() {
            builder.classList.remove('is-nudge');
            clearTimeout(temporizadorPista);
            if (cambios >= CAMBIOS_PARA_APRENDIDO) {
                return;
            }
            temporizadorPista = setTimeout(function () {
                const tutorialActivo = builder.dataset.tutoPermite !== undefined;
                if (!tutorialActivo && !resultadoAbierto && !menuAbierto && cambios < CAMBIOS_PARA_APRENDIDO) {
                    builder.classList.add('is-nudge');
                }
            }, INACTIVIDAD_MS);
        }

        // ---------- Foto del dial ----------

        function guardarFoto(dataUrl) {
            seleccion.foto = dataUrl;
            try {
                if (dataUrl) {
                    localStorage.setItem(CLAVE_FOTO, dataUrl);
                } else {
                    localStorage.removeItem(CLAVE_FOTO);
                }
            } catch (error) {
                // Cuota llena: la foto sigue viva en memoria hasta recargar.
                el.status.textContent = 'La foto no se pudo guardar: se pierde al recargar.';
                console.warn(error);
            }
        }

        /**
         * Deja la foto en un cuadrado de FOTO_LADO px como data URL.
         * Se usa FileReader y no `createImageBitmap`: este ultimo no decodifica
         * en todos los navegadores y Safari solo lo trae desde iOS 15.
         */
        function recortarFoto(archivo) {
            return new Promise(function (resolve, reject) {
                const lector = new FileReader();
                lector.onerror = function () {
                    reject(new Error('No se pudo leer el archivo'));
                };
                lector.onload = function () {
                    const imagen = new Image();
                    imagen.onerror = function () {
                        reject(new Error('No se pudo decodificar la imagen'));
                    };
                    imagen.onload = function () {
                        const lado = Math.min(FOTO_LADO, Math.max(imagen.width, imagen.height));
                        const canvas = document.createElement('canvas');
                        canvas.width = lado;
                        canvas.height = lado;
                        const context = canvas.getContext('2d');
                        // Cuadrado recortado al centro: la capa del dial es
                        // circular y una foto apaisada quedaria deformada.
                        const corte = Math.min(imagen.width, imagen.height);
                        context.drawImage(
                            imagen,
                            (imagen.width - corte) / 2, (imagen.height - corte) / 2, corte, corte,
                            0, 0, lado, lado
                        );
                        resolve(canvas.toDataURL('image/jpeg', FOTO_CALIDAD));
                    };
                    imagen.src = lector.result;
                };
                lector.readAsDataURL(archivo);
            });
        }

        function initFoto() {
            el.foto.addEventListener('change', function () {
                const archivo = el.foto.files && el.foto.files[0];
                if (!archivo) {
                    return;
                }
                el.status.textContent = 'Poniendo tu foto…';
                recortarFoto(archivo).then(function (dataUrl) {
                    guardarFoto(dataUrl);
                    seleccion.usarFoto = true;
                    pintarTodo();
                    el.status.textContent = '';
                }).catch(function (error) {
                    el.status.textContent = 'No se pudo leer esa imagen.';
                    console.error(error);
                }).finally(function () {
                    // Recien aca: vaciar el input antes de que termine la
                    // lectura suelta el File y la decodificacion falla. Se
                    // vacia igual para poder volver a elegir la misma foto.
                    el.foto.value = '';
                });
            });

            try {
                const guardada = localStorage.getItem(CLAVE_FOTO);
                if (guardada) {
                    seleccion.foto = guardada;
                    seleccion.usarFoto = true;
                }
            } catch (error) {
                console.warn(error);
            }
        }

        // ---------- Resultado ----------

        function nombreDe(campo) {
            return catalogo.nombrarPieza(modelo.get(seleccion[campo]));
        }

        /** Si las doce posiciones comparten juego se nombra el juego; si no, "combinados". */
        function descripcionDeIndices() {
            const usados = [];
            Object.keys(seleccion.indices || {}).forEach(function (clave) {
                const pieza = modelo.get(seleccion.indices[clave]);
                if (pieza && usados.indexOf(pieza.modelo) < 0) {
                    usados.push(pieza.modelo);
                }
            });

            if (usados.length === 1) {
                const juego = modelo.juegoDeIndices(seleccion.indiceModelo, seleccion.indiceAcabado);
                const muestra = juego ? modelo.get(juego.glifos[0]) : null;
                return muestra ? catalogo.nombrarPieza(muestra) : usados[0];
            }
            return `Combinados (${usados.map(function (id) {
                return catalogo.MODELOS[id] || id;
            }).join(', ')})`;
        }

        function pieza(campo) {
            return modelo.get(seleccion[campo]);
        }

        function resumen() {
            const filas = [];
            function fila(parte, label, valor, opcion) {
                filas.push({ parte: parte, label: label, valor: valor, opcion: opcion });
            }

            fila('caja', 'Caja', nombreDe('caja'), { tipo: 'pieza', pieza: pieza('caja') });

            let bisel = nombreDe('bisel');
            const abajo = pieza('biselAbajo');
            if (abajo) {
                bisel = `${bisel} arriba / ${modelo.nombreDeColor(abajo)} abajo`;
            }
            fila('bisel', 'Bisel', bisel, { tipo: 'pieza', pieza: pieza('bisel') });

            fila('dial', 'Esfera', nombreDe('dial'), { tipo: 'pieza', pieza: pieza('dial') });
            if (modelo.admiteFechador(seleccion.dial)) {
                const conFecha = seleccion.fechador !== 'no';
                fila('dial', 'Fecha', modelo.etiquetaDeFecha(seleccion.fechador), {
                    tipo: 'fecha',
                    angulo: conFecha ? modelo.anguloDeFecha(seleccion.fechador) : null
                });
            }

            fila('indice', 'Números', descripcionDeIndices(), {
                tipo: 'pieza',
                pieza: modelo.get((seleccion.indices || {})[11])
            });
            fila('aguja', 'Agujas', nombreDe('hora'), { tipo: 'pieza', pieza: pieza('hora') });
            fila('aguja', 'Segundero', nombreDe('segundero'), { tipo: 'pieza', pieza: pieza('segundero') });
            fila('correa', 'Correa', nombreDe('correa'), { tipo: 'pieza', pieza: pieza('correa') });

            if (seleccion.foto && seleccion.usarFoto) {
                fila('foto', 'Foto', 'Con tu foto en la esfera', { tipo: 'foto', valor: 'si' });
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
            el.next.disabled = true;
            el.next.textContent = 'Armando tu reloj…';
            modelo.renderizar(seleccion, 1600).then(function (canvas) {
                composicion = canvas;
                el.resultImg.src = canvas.toDataURL('image/png');
                el.resultPrice.textContent = `${catalogo.MONEDA} ${catalogo.PRECIO_USD}`;
                vista.renderResumen(el.resultSummary, resumen(), extrasDeVista());
                el.wa.href = `https://wa.me/${WHATSAPP_NUMBER}/?text=${encodeURIComponent(mensajeWhatsApp())}`;
                el.result.hidden = false;
                el.result.setAttribute('aria-hidden', 'false');
                el.result.scrollTop = 0;
                resultadoAbierto = true;
                sincronizarNav();
                emitir('resultado');
            }).catch(function (error) {
                el.status.textContent = 'No se pudo armar la imagen. Probá de nuevo.';
                console.error(error);
            }).finally(function () {
                el.next.disabled = false;
                pintarNav();
            });
        }

        function cerrarResultado() {
            if (!resultadoAbierto) {
                return;
            }
            el.result.hidden = true;
            el.result.setAttribute('aria-hidden', 'true');
            resultadoAbierto = false;
            sincronizarNav();
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

        function initEventos() {
            conectarArrastre(el.stage, alTocarReloj);
            conectarArrastre(el.carrusel, alTocarCarrusel);
            conectarRueda(el.stage);
            conectarRueda(el.carrusel);

            el.arrowPrev.addEventListener('click', function () {
                if (permitido('flechas') && elegirOpcion(actual - 1, 'flecha')) {
                    emitir('flecha');
                }
            });
            el.arrowNext.addEventListener('click', function () {
                if (permitido('flechas') && elegirOpcion(actual + 1, 'flecha')) {
                    emitir('flecha');
                }
            });

            document.addEventListener('keydown', function (event) {
                if (resultadoAbierto || (event.target.closest && event.target.closest('input, textarea, select'))) {
                    return;
                }
                if ((event.key === 'ArrowLeft' || event.key === 'ArrowRight') && permitido('flechas')) {
                    event.preventDefault();
                    elegirOpcion(actual + (event.key === 'ArrowRight' ? 1 : -1), 'tecla');
                }
                if (event.key === 'Escape' && menuAbierto) {
                    alternarMenu(false);
                }
            });

            el.menuAbrir.addEventListener('click', function () {
                if (permitido('menu')) {
                    alternarMenu(true);
                }
            });
            el.sheetCerrar.addEventListener('click', function () {
                if (permitido('menu')) {
                    alternarMenu(false);
                }
            });
            el.fotoElegir.addEventListener('click', function () {
                el.foto.click();
            });

            el.panels.addEventListener('click', function (event) {
                const modo = event.target.closest('[data-modo-indices]');
                if (modo) {
                    modoIndices = modo.dataset.modoIndices;
                    pintarTodo();
                    return;
                }

                const accionFoto = event.target.closest('[data-foto]');
                if (accionFoto) {
                    if (accionFoto.dataset.foto === 'elegir') {
                        el.foto.click();
                    } else {
                        guardarFoto(null);
                        seleccion.usarFoto = false;
                        pintarTodo();
                    }
                    return;
                }

                const boton = event.target.closest('[data-opcion]');
                if (boton && permitido('elegir')) {
                    elegirOpcion(Number(boton.dataset.opcion), 'menu');
                }
            });

            el.prev.addEventListener('click', function () {
                if (!permitido('atras')) {
                    return;
                }
                const indice = indicePantalla();
                if (indice > 0) {
                    irAPantalla(pantallas[indice - 1].id);
                }
            });

            el.next.addEventListener('click', function () {
                if (!permitido('siguiente')) {
                    return;
                }
                const indice = indicePantalla();
                if (indice === pantallas.length - 1) {
                    alternarMenu(false);
                    abrirResultado();
                    return;
                }
                irAPantalla(pantallas[indice + 1].id);
            });

            el.resultClose.addEventListener('click', cerrarResultado);
            el.resultSummary.addEventListener('click', function (event) {
                const boton = event.target.closest('[data-parte]');
                if (boton) {
                    cerrarResultado();
                    irAParte(boton.dataset.parte);
                }
            });
            el.cart.addEventListener('click', agregarAlCarrito);
            el.download.addEventListener('click', descargar);

            // Cualquier toque reinicia la pista, y si el shell restituyo su
            // navegacion con el menu abierto, la vuelve a esconder.
            document.addEventListener('pointerdown', function () {
                reiniciarPista();
                if (navOculta()) {
                    sincronizarNav();
                }
            }, true);
            builder.addEventListener('animationend', function (event) {
                if (event.animationName === 'watch-pista') {
                    builder.classList.remove('is-nudge');
                    reiniciarPista();
                }
            });

            const alCambiarAncho = function () {
                sincronizarNav();
                requestAnimationFrame(marcarPosicionActiva);
            };
            if (escritorio.addEventListener) {
                escritorio.addEventListener('change', alCambiarAncho);
            } else if (escritorio.addListener) {
                escritorio.addListener(alCambiarAncho);
            }
            window.addEventListener('resize', function () {
                requestAnimationFrame(marcarPosicionActiva);
            });
            builder.addEventListener('reloj:tutorial-inicio', sincronizarNav);
            builder.addEventListener('reloj:tutorial-fin', function () {
                sincronizarNav();
                reiniciarPista();
            });
            window.addEventListener('pagehide', function () {
                menuAbierto = false;
                resultadoAbierto = false;
                sincronizarNav();
            });
        }

        // ---------- Arranque ----------

        App.viewmodels.relojes.control = {
            /** El tutorial arranca con el reloj a la vista y sin nada encima. */
            prepararTutorial: function () {
                cerrarResultado();
                alternarMenu(false);
                builder.classList.remove('is-nudge');
            }
        };

        el.frame.classList.add('is-loading');
        modelo.load().then(function () {
            seleccion = modelo.seleccionInicial();
            initFoto();
            initEventos();
            vigilarNavDelPadre();
            pintarTodo();
            el.frame.classList.remove('is-loading');
            el.status.textContent = '';
            reiniciarPista();
            emitir('listo');
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
