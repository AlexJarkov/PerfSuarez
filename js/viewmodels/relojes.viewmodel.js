(function (App) {
    const WHATSAPP_NUMBER = '78064327';
    const ESTADOS_SHEET = ['is-expanded', 'is-half', 'is-collapsed'];
    // Cuanto hay que arrastrar sobre el reloj para pasar a la pieza siguiente.
    const PASO_ARRASTRE = 52;
    const CLAVE_FOTO = 'perfsuarez:reloj:foto';
    // La foto viaja a localStorage como data URL: a 700 px y calidad 0.82 pesa
    // unos 60 KB, lejos del tope de 5 MB que comparte con el carrito.
    const FOTO_LADO = 700;
    const FOTO_CALIDAD = 0.82;

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
            stage: document.getElementById('watch-stage'),
            frame: document.getElementById('watch-frame'),
            status: document.getElementById('watch-status'),
            swipe: document.getElementById('watch-swipe'),
            sheet: document.getElementById('watch-sheet'),
            handle: document.getElementById('watch-sheet-handle'),
            hint: document.getElementById('watch-sheet-hint'),
            hintText: document.getElementById('watch-sheet-hint-text'),
            zoom: document.getElementById('watch-zoom'),
            steps: document.getElementById('watch-steps'),
            body: document.getElementById('watch-sheet-body'),
            title: document.getElementById('watch-step-title'),
            copy: document.getElementById('watch-step-copy'),
            panels: document.getElementById('watch-panels'),
            foto: document.getElementById('watch-foto'),
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
        let estadoSheet = 0;
        // Modo del paso de indices: 'juego' aplica el mismo glifo a las doce
        // posiciones, 'individual' deja editar una por una tocando el reloj.
        let modoIndices = 'juego';
        let posicionActiva = 11;
        let biselBicolor = false;

        // ---------- Paneles de cada paso ----------

        /**
         * Campo que gobierna cada paso. Es el que cambia al arrastrar sobre el
         * reloj y el que se usa para saber que modelo esta activo.
         */
        function campoDe(pasoId) {
            return pasoId === 'aguja' ? 'hora' : pasoId;
        }

        function modelosConColores(campo, pasoId) {
            const activa = modelo.get(seleccion[campo]);
            return modelo.modelosDe(pasoId || campo).map(function (grupo) {
                return {
                    grupo: grupo,
                    colores: modelo.coloresDe(grupo),
                    activa: activa
                };
            });
        }

        /** `paso` solo hace falta cuando el campo no se llama como la categoria. */
        function panelDeModelos(campo, opciones) {
            const conf = opciones || {};
            return Object.assign({
                campo: campo,
                modelos: modelosConColores(campo, conf.paso || campo)
            }, conf);
        }

        function panelesDeBisel() {
            const izquierda = modelo.get(seleccion.bisel);
            const grupo = modelo.grupoDe('bisel', izquierda);
            const colores = modelo.coloresDe(grupo);
            const paneles = [];

            // El bisel bicolor no recolorea nada: dibuja la mitad izquierda de
            // una variante y la derecha de otra. Como las variantes del mismo
            // modelo comparten geometria, la costura cae justa en la vertical.
            if (colores.length > 1) {
                paneles.push({
                    html: vista.alternadorHtml('bisel-bicolor', [
                        { valor: 'no', label: 'Un color' },
                        { valor: 'si', label: 'Bicolor' }
                    ], biselBicolor ? 'si' : 'no')
                });
            }

            paneles.push(panelDeModelos('bisel', { titulo: biselBicolor ? 'Diseño' : null }));

            if (biselBicolor && colores.length > 1) {
                paneles.push({
                    titulo: 'Mitad izquierda',
                    html: vista.coloresHtml(colores, seleccion.bisel, 'bisel')
                });
                paneles.push({
                    titulo: 'Mitad derecha',
                    html: vista.coloresHtml(colores, seleccion.biselDerecho, 'biselDerecho')
                });
            }

            return paneles;
        }

        function panelesDeIndices() {
            const paneles = [{
                html: vista.alternadorHtml('modo-indices', [
                    { valor: 'juego', label: 'Todos iguales' },
                    { valor: 'individual', label: 'Uno por uno' }
                ], modoIndices)
            }];

            if (modoIndices === 'juego') {
                paneles.push(panelDeModelos('indiceJuego', { paso: 'indice' }));
                return paneles;
            }

            const hora = posicionActiva + 1;
            paneles.push({
                campo: 'indicePos',
                titulo: `Editando la posición ${hora}`,
                nota: 'Tocá otro índice sobre el reloj para cambiar de posición.',
                piezas: modelo.glifosParaPosicion(posicionActiva),
                seleccion: (seleccion.indices || {})[posicionActiva],
                etiqueta: etiquetaDeGlifo
            });
            paneles.push({ html: '<button type="button" class="watch-btn watch-btn--ghost" id="watch-aplicar-todos">Aplicar a todos</button>' });
            return paneles;
        }

        function etiquetaDeGlifo(pieza) {
            const nombre = catalogo.MODELOS[pieza.modelo] || pieza.modelo;
            const color = pieza.color ? pieza.color.nombre : '';
            const doble = pieza.variante === 'doble' ? ' doble' : '';
            return `${nombre}${doble} · ${color}`;
        }

        function panelesDeDetalles() {
            const disponibles = modelo.fechadoresDe(seleccion.dial);
            const chips = ['no', '3', '430', '6'].map(function (valor) {
                const habilitado = disponibles.indexOf(valor) >= 0;
                const clases = ['watch-toggle'];
                if (valor === seleccion.fechador) {
                    clases.push('is-active');
                }
                if (!habilitado) {
                    clases.push('is-disabled');
                }
                const attr = habilitado ? '' : ' disabled';
                return `<button type="button" class="${clases.join(' ')}" data-alternador="fechador" data-valor="${valor}"${attr}>${vista.escapar(catalogo.FECHADORES[valor])}</button>`;
            }).join('');

            const nota = disponibles.length > 1
                ? 'La ventana viene grabada en la esfera, así que depende del dial elegido.'
                : 'Este dial no tiene versión con fechador. Probá con otro color o textura.';

            const foto = seleccion.foto
                ? `<div class="watch-foto"><img src="${seleccion.foto}" alt="Foto del dial">`
                    + '<button type="button" class="watch-btn watch-btn--ghost" id="watch-foto-quitar">Quitar foto</button></div>'
                : '<p class="watch-panel-note">La foto se guarda solo en este dispositivo: el sitio es estático y no sube nada a ningún servidor.</p>';

            return [
                { titulo: 'Fechador', nota: nota, html: `<div class="watch-toggles" role="group">${chips}</div>` },
                {
                    titulo: 'Foto en la esfera',
                    html: `<button type="button" class="watch-btn watch-btn--solid" id="watch-foto-elegir">${seleccion.foto ? 'Cambiar foto' : 'Subir una foto'}</button>${foto}`
                }
            ];
        }

        function panelesDe(pasoId) {
            switch (pasoId) {
                case 'bisel':
                    return panelesDeBisel();
                case 'indice':
                    return panelesDeIndices();
                case 'detalles':
                    return panelesDeDetalles();
                case 'aguja':
                    return [
                        panelDeModelos('hora', { titulo: 'Horas' }),
                        panelDeModelos('minuto', { titulo: 'Minutos' }),
                        panelDeModelos('segundero', { titulo: 'Segundero' })
                    ];
                default:
                    return [panelDeModelos(pasoId)];
            }
        }

        // ---------- Render ----------

        function pintarReloj() {
            vista.renderStage(el.frame, modelo.capasDe(seleccion));
            builder.classList.toggle('is-editando-indices', pasos[pasoActivo].id === 'indice' && modoIndices === 'individual');
            marcarPosicionActiva();
        }

        /** Aro dorado sobre el indice que se esta editando. */
        function marcarPosicionActiva() {
            if (pasos[pasoActivo].id !== 'indice' || modoIndices !== 'individual') {
                el.stage.style.removeProperty('--marca-x');
                el.stage.style.removeProperty('--marca-y');
                return;
            }
            const centro = modelo.centrosDeIndices(seleccion)[posicionActiva];
            if (centro) {
                el.stage.style.setProperty('--marca-x', `${centro.x * 100}%`);
                el.stage.style.setProperty('--marca-y', `${centro.y * 100}%`);
            }
        }

        function pintarPaso() {
            const paso = pasos[pasoActivo];
            vista.renderPasos(el.steps, pasos, pasoActivo, visitados);
            el.title.textContent = paso.titulo;
            el.copy.textContent = mensajeDePaso(paso);
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
            if (paso.id === 'indice' && modoIndices === 'individual') {
                return 'Tocá un índice sobre el reloj y elegí qué poner en esa hora.';
            }
            return paso.descripcion;
        }

        function marcarVisitado(pasoId) {
            if (visitados.indexOf(pasoId) < 0) {
                visitados.push(pasoId);
            }
        }

        // ---------- Selección ----------

        /**
         * Al cambiar de modelo se conserva el color que ya estaba elegido si el
         * nuevo modelo lo tiene: cambiar de bisel no deberia obligar a volver a
         * buscar el azul.
         */
        function conservandoColor(campo, pieza) {
            const actual = modelo.get(seleccion[campo]);
            if (!actual || !actual.color || actual.modelo === pieza.modelo) {
                return pieza;
            }
            const grupo = modelo.grupoDe(campo === 'hora' || campo === 'minuto' ? 'hora' : campo, pieza);
            return modelo.variantePorColor(grupo, actual.color.nombre) || pieza;
        }

        function elegir(campo, id) {
            const pieza = modelo.get(id);
            if (!pieza) {
                return;
            }

            if (campo === 'indiceJuego') {
                aplicarJuego(pieza);
            } else if (campo === 'indicePos') {
                seleccion.indices = Object.assign({}, seleccion.indices);
                seleccion.indices[posicionActiva] = pieza.id;
            } else if (campo === 'biselDerecho') {
                seleccion.biselDerecho = pieza.id;
            } else {
                seleccion[campo] = conservandoColor(campo, pieza).id;
            }

            if (campo === 'bisel' && biselBicolor) {
                // El bicolor solo cierra entre variantes del mismo modelo.
                const derecha = modelo.get(seleccion.biselDerecho);
                if (!derecha || derecha.modelo !== modelo.get(seleccion.bisel).modelo) {
                    seleccion.biselDerecho = seleccion.bisel;
                }
            }

            if (campo === 'dial') {
                // El fechador vive en el asset del dial: si el nuevo no tiene la
                // ventana en esa posicion, se vuelve a "sin fechador".
                if (modelo.fechadoresDe(seleccion.dial).indexOf(seleccion.fechador) < 0) {
                    seleccion.fechador = 'no';
                }
            }

            marcarVisitado(pasos[pasoActivo].id);
            pintarReloj();
            pintarPaso();
        }

        /** Aplica un juego completo a las doce posiciones. */
        function aplicarJuego(pieza) {
            const juego = modelo.juegoDeIndices(pieza.modelo, pieza.acabado);
            if (!juego) {
                return;
            }
            seleccion.indiceModelo = juego.modelo;
            seleccion.indiceAcabado = juego.acabado;
            seleccion.indiceJuego = juego.glifos[0];
            seleccion.indices = modelo.mapaDeIndices(juego);
        }

        // ---------- Arrastre sobre el reloj ----------

        /** Modelos del paso activo, para poder recorrerlos arrastrando. */
        function recorridoDelPaso() {
            const paso = pasos[pasoActivo];
            if (paso.id === 'detalles') {
                return null;
            }
            if (paso.id === 'indice') {
                const juegos = modelo.juegosDeIndices().map(function (juego) {
                    return juego.glifos[0];
                });
                return { campo: 'indiceJuego', ids: juegos, actual: seleccion.indiceJuego };
            }

            const campo = campoDe(paso.id);
            const grupos = modelo.modelosDe(campo);
            const activa = modelo.get(seleccion[campo]);
            return {
                campo: campo,
                ids: grupos.map(function (grupo) {
                    const preferida = activa && activa.color
                        ? modelo.variantePorColor(grupo, activa.color.nombre)
                        : grupo.piezas[0];
                    return (preferida || grupo.piezas[0]).id;
                }),
                actual: activa ? activa.id : null,
                grupos: grupos
            };
        }

        function indiceActualEnRecorrido(recorrido) {
            const actual = modelo.get(recorrido.actual);
            if (!actual) {
                return 0;
            }
            const encontrado = recorrido.ids.findIndex(function (id) {
                const pieza = modelo.get(id);
                return pieza && pieza.modelo === actual.modelo;
            });
            return encontrado < 0 ? 0 : encontrado;
        }

        function avanzarModelo(direccion) {
            const recorrido = recorridoDelPaso();
            if (!recorrido || !recorrido.ids.length) {
                return;
            }
            const total = recorrido.ids.length;
            const proximo = (indiceActualEnRecorrido(recorrido) + direccion + total) % total;
            elegir(recorrido.campo, recorrido.ids[proximo]);
            mostrarRotulo(recorrido, proximo + 1, total);
        }

        function mostrarRotulo(recorrido, numero, total) {
            const paso = pasos[pasoActivo];
            el.swipe.textContent = `${paso.label} · ${numero}/${total}`;
            el.swipe.classList.add('is-visible');
            clearTimeout(mostrarRotulo.temporizador);
            mostrarRotulo.temporizador = setTimeout(function () {
                el.swipe.classList.remove('is-visible');
            }, 1100);
        }

        function initArrastreStage() {
            let inicio = null;
            // El <button> del zoom dispara su click al soltar el arrastre; sin
            // esta bandera, deslizar sobre el reloj tambien lo ampliaria.
            let ignorarClick = false;

            el.stage.addEventListener('pointerdown', function (event) {
                inicio = { x: event.clientX, y: event.clientY, consumido: 0, movido: false };
                el.stage.setPointerCapture?.(event.pointerId);
            });

            el.stage.addEventListener('pointermove', function (event) {
                if (!inicio) {
                    return;
                }
                const dx = event.clientX - inicio.x;
                const dy = event.clientY - inicio.y;
                if (Math.abs(dx) < 4 || Math.abs(dx) < Math.abs(dy)) {
                    return;
                }
                inicio.movido = true;

                // Un tramo de PASO_ARRASTRE px equivale a una pieza. Se compara
                // contra lo ya consumido para que un arrastre largo avance de a
                // una y no salte varias de golpe.
                const pasosDados = Math.trunc(dx / PASO_ARRASTRE);
                if (pasosDados !== inicio.consumido) {
                    const direccion = pasosDados > inicio.consumido ? 1 : -1;
                    avanzarModelo(direccion);
                    inicio.consumido += direccion;
                }
            });

            function soltar(event) {
                if (!inicio) {
                    return;
                }
                const movido = inicio.movido;
                inicio = null;
                el.stage.releasePointerCapture?.(event.pointerId);
                ignorarClick = movido;
                if (!movido) {
                    apuntarIndice(event.clientX, event.clientY);
                }
            }

            el.stage.addEventListener('pointerup', soltar);
            el.stage.addEventListener('pointercancel', soltar);

            el.zoom.addEventListener('click', function () {
                if (ignorarClick) {
                    ignorarClick = false;
                    return;
                }
                if (yaApunte) {
                    yaApunte = false;
                    return;
                }
                ampliarReloj();
            });
        }

        // Un toque sobre un indice en modo "uno por uno" lo selecciona en vez de
        // ampliar el reloj; la bandera evita que el click posterior haga las dos.
        let yaApunte = false;

        function apuntarIndice(clientX, clientY) {
            if (pasos[pasoActivo].id !== 'indice' || modoIndices !== 'individual') {
                return;
            }
            const caja = el.frame.getBoundingClientRect();
            const posicion = modelo.posicionMasCercana(
                seleccion,
                (clientX - caja.left) / caja.width,
                (clientY - caja.top) / caja.height
            );
            if (posicion === null || posicion === modelo.posicionOcupadaPorFecha(seleccion.fechador)) {
                return;
            }
            posicionActiva = posicion;
            yaApunte = true;
            marcarPosicionActiva();
            pintarPaso();
        }

        function ampliarReloj() {
            if (estadoSheet < ESTADOS_SHEET.length - 1) {
                estadoSheet += 1;
                el.hint.classList.remove('is-pulsing');
                aplicarEstadoSheet();
            }
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
                recortarFoto(archivo).then(function (dataUrl) {
                    guardarFoto(dataUrl);
                    pintarReloj();
                    pintarPaso();
                    el.status.textContent = '';
                }).catch(function (error) {
                    el.status.textContent = 'No se pudo leer esa imagen.';
                    console.error(error);
                }).finally(function () {
                    // Recien aca: vaciar el input antes de que termine la
                    // lectura suelta el File y `createImageBitmap` falla con
                    // "source image could not be decoded". Se vacia igual para
                    // poder volver a elegir la misma foto.
                    el.foto.value = '';
                });
            });

            try {
                const guardada = localStorage.getItem(CLAVE_FOTO);
                if (guardada) {
                    seleccion.foto = guardada;
                }
            } catch (error) {
                console.warn(error);
            }
        }

        // ---------- Resultado ----------

        function nombreDe(campo) {
            return catalogo.nombrarPieza(modelo.get(seleccion[campo]));
        }

        function resumen() {
            const filas = [
                { label: 'Caja', valor: nombreDe('caja') },
                { label: 'Bisel', valor: nombreDe('bisel') }
            ];

            const derecha = modelo.get(seleccion.biselDerecho);
            if (biselBicolor && derecha && derecha.id !== seleccion.bisel) {
                filas[1].valor = `${filas[1].valor} / ${derecha.color.nombre} (bicolor)`;
            }

            filas.push({ label: 'Dial', valor: nombreDe('dial') });
            filas.push({ label: 'Fechador', valor: catalogo.FECHADORES[seleccion.fechador] || 'Sin fechador' });
            filas.push({ label: 'Índices', valor: descripcionDeIndices() });
            filas.push({ label: 'Horas', valor: nombreDe('hora') });
            filas.push({ label: 'Minutos', valor: nombreDe('minuto') });
            filas.push({ label: 'Segundero', valor: nombreDe('segundero') });
            filas.push({ label: 'Correa', valor: nombreDe('correa') });

            if (seleccion.foto) {
                filas.push({ label: 'Esfera', valor: 'Con foto personalizada' });
            }

            return filas;
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

        // ---------- Navegación ----------

        function irAPaso(indice) {
            pasoActivo = Math.max(0, Math.min(pasos.length - 1, indice));
            marcarVisitado(pasos[pasoActivo].id);
            pintarPaso();
            pintarReloj();
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

        el.panels.addEventListener('click', function (event) {
            const alternador = event.target.closest('[data-alternador]');
            if (alternador) {
                cambiarAlternador(alternador.dataset.alternador, alternador.dataset.valor);
                return;
            }

            if (event.target.closest('#watch-aplicar-todos')) {
                const pieza = modelo.get((seleccion.indices || {})[posicionActiva]);
                if (pieza) {
                    aplicarJuego(pieza);
                    pintarReloj();
                    pintarPaso();
                }
                return;
            }

            if (event.target.closest('#watch-foto-elegir')) {
                el.foto.click();
                return;
            }

            if (event.target.closest('#watch-foto-quitar')) {
                guardarFoto(null);
                pintarReloj();
                pintarPaso();
                return;
            }

            const boton = event.target.closest('[data-pieza]');
            if (boton) {
                elegir(boton.dataset.campo, boton.dataset.pieza);
            }
        });

        function cambiarAlternador(nombre, valor) {
            if (nombre === 'modo-indices') {
                modoIndices = valor;
            } else if (nombre === 'bisel-bicolor') {
                biselBicolor = valor === 'si';
                seleccion.biselDerecho = biselBicolor ? (seleccion.biselDerecho || seleccion.bisel) : null;
            } else if (nombre === 'fechador') {
                seleccion.fechador = valor;
            }
            pintarReloj();
            pintarPaso();
        }

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
            initFoto();
            initSheet();
            initArrastreStage();
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
