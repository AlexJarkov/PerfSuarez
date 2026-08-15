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
            carruselRail: document.getElementById('watch-carousel-rail'),
            carruselLabel: document.getElementById('watch-carousel-label'),
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

        /**
         * Grid de modelos + su barra de colores. Van juntos siempre: elegir
         * diseno y elegir color son dos decisiones distintas sobre lo mismo.
         */
        function bloqueDeModelos(campo, opciones) {
            const conf = opciones || {};
            const activa = modelo.get(seleccion[campo]);
            const grupo = modelo.grupoDe(conf.paso || campo, activa);
            return [
                panelDeModelos(campo, conf),
                { html: vista.coloresHtml(modelo.coloresDe(grupo), seleccion[campo], campo) }
            ];
        }

        function panelesDeBisel() {
            const arriba = modelo.get(seleccion.bisel);
            const grupo = modelo.grupoDe('bisel', arriba);
            const colores = modelo.coloresDe(grupo);
            const esGmt = modelo.admiteBicolor(arriba);
            const paneles = [panelDeModelos('bisel')];

            // El bicolor solo aplica a los biseles GMT: son los unicos con una
            // escala de 24 horas, donde la mitad de arriba es la noche y la de
            // abajo el dia. En un bisel de buceo o taquimetro partir el color no
            // significa nada.
            if (esGmt && colores.length > 1) {
                paneles.push({
                    html: vista.alternadorHtml('bisel-bicolor', [
                        { valor: 'no', label: 'Un color' },
                        { valor: 'si', label: 'Bicolor GMT' }
                    ], biselBicolor ? 'si' : 'no')
                });
            }

            if (biselBicolor && esGmt && colores.length > 1) {
                paneles.push({ html: vista.coloresHtml(colores, seleccion.bisel, 'bisel', 'Mitad superior (noche)') });
                paneles.push({ html: vista.coloresHtml(colores, seleccion.biselAbajo, 'biselAbajo', 'Mitad inferior (día)') });
            } else {
                paneles.push({ html: vista.coloresHtml(colores, seleccion.bisel, 'bisel') });
            }

            return paneles;
        }

        /**
         * Al encender el bicolor la mitad de abajo arranca en otro color: si
         * arrancara en el mismo, activar la opcion no cambiaria nada en pantalla
         * y no se entenderia que quedo encendida.
         */
        function mitadInferiorPorDefecto() {
            if (seleccion.biselAbajo && seleccion.biselAbajo !== seleccion.bisel) {
                return seleccion.biselAbajo;
            }
            const colores = modelo.coloresDe(modelo.grupoDe('bisel', modelo.get(seleccion.bisel)));
            const otra = colores.find(function (pieza) {
                return pieza.id !== seleccion.bisel;
            });
            return otra ? otra.id : seleccion.bisel;
        }

        function panelesDeIndices() {
            const paneles = [{
                html: vista.alternadorHtml('modo-indices', [
                    { valor: 'juego', label: 'Todos iguales' },
                    { valor: 'individual', label: 'Uno por uno' }
                ], modoIndices)
            }];

            if (modoIndices === 'juego') {
                return paneles.concat(bloqueDeModelos('indiceJuego', { paso: 'indice' }));
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

        /** Las 24 posiciones del fechador, ya ubicadas sobre la rueda. */
        function posicionesDeFecha() {
            const posiciones = [];
            for (let p = 0; p < modelo.POSICIONES_FECHA; p += 1) {
                const angulo = (modelo.anguloDeFecha(p) * Math.PI) / 180;
                // Dos posiciones por hora: las pares caen sobre el indice y las
                // impares en la media hora, entre dos indices.
                const hora = Math.floor(p / 2) || 12;
                posiciones.push({
                    valor: p,
                    label: `${hora}${p % 2 ? ':30' : ''}`,
                    sobreIndice: p % 2 === 0,
                    x: +(50 + 40 * Math.sin(angulo)).toFixed(2),
                    y: +(50 - 40 * Math.cos(angulo)).toFixed(2)
                });
            }
            return posiciones;
        }

        function panelesDeDetalles() {
            const habilitado = modelo.admiteFechador(seleccion.dial);
            const nota = habilitado
                ? 'La ventana se puede poner en cualquiera de las 24 posiciones, sobre un índice o entre dos.'
                : 'Este dial no tiene versión con fechador. Probá con otro color o textura.';

            const foto = seleccion.foto
                ? `<div class="watch-foto"><img src="${seleccion.foto}" alt="Foto del dial">`
                    + '<button type="button" class="watch-btn watch-btn--ghost" id="watch-foto-quitar">Quitar foto</button></div>'
                : '<p class="watch-panel-note">La foto se guarda solo en este dispositivo: el sitio es estático y no sube nada a ningún servidor.</p>';

            return [
                {
                    titulo: 'Fechador',
                    nota: nota,
                    html: vista.fechadorHtml(posicionesDeFecha(), seleccion.fechador, habilitado)
                },
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
                    return bloqueDeModelos('hora', { titulo: 'Horas' })
                        .concat(bloqueDeModelos('minuto', { titulo: 'Minutos' }))
                        .concat(bloqueDeModelos('segundero', { titulo: 'Segundero' }));
                default:
                    return bloqueDeModelos(pasoId);
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
            } else if (campo === 'biselAbajo') {
                seleccion.biselAbajo = pieza.id;
            } else {
                seleccion[campo] = conservandoColor(campo, pieza).id;
            }

            if (campo === 'bisel') {
                const elegido = modelo.get(seleccion.bisel);
                // El bicolor solo cierra entre variantes del mismo modelo, y
                // solo los GMT lo admiten: cambiar a un bisel de buceo lo apaga.
                if (!modelo.admiteBicolor(elegido)) {
                    biselBicolor = false;
                    seleccion.biselAbajo = null;
                } else if (biselBicolor) {
                    const abajo = modelo.get(seleccion.biselAbajo);
                    if (!abajo || abajo.modelo !== elegido.modelo) {
                        seleccion.biselAbajo = seleccion.bisel;
                    }
                }
            }

            if (campo === 'dial' && !modelo.admiteFechador(seleccion.dial)) {
                // El fechador vive en el asset del dial: si el nuevo no tiene
                // ninguna variante con ventana, se vuelve a "sin fechador".
                seleccion.fechador = 'no';
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
            if (paso.id === 'indice' && modoIndices === 'individual') {
                // Arrastrar aplicaria un juego entero y borraria lo editado
                // posicion por posicion, que es justo lo que se vino a hacer.
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

        /**
         * Arrastre sobre el reloj con carrusel, al estilo del selector de modo
         * de la camara de iOS: la tira de piezas sigue al dedo y la del centro
         * es la que se aplica. El indice fraccionario manda tanto la animacion
         * como la seleccion, asi lo que se ve y lo que se elige no se separan.
         */
        function initArrastreStage() {
            let arrastre = null;
            // El <button> del zoom dispara su click al soltar el arrastre; sin
            // esta bandera, deslizar sobre el reloj tambien lo ampliaria.
            let ignorarClick = false;

            el.stage.addEventListener('pointerdown', function (event) {
                const recorrido = recorridoDelPaso();
                if (!recorrido || recorrido.ids.length < 2) {
                    arrastre = { x: event.clientX, y: event.clientY, movido: false };
                    return;
                }
                arrastre = {
                    x: event.clientX,
                    y: event.clientY,
                    movido: false,
                    recorrido: recorrido,
                    base: indiceActualEnRecorrido(recorrido),
                    aplicado: indiceActualEnRecorrido(recorrido),
                    fichas: vista.montarCarrusel(el.carruselRail, recorrido.ids.map(modelo.get))
                };
                el.stage.setPointerCapture?.(event.pointerId);
            });

            el.stage.addEventListener('pointermove', function (event) {
                if (!arrastre) {
                    return;
                }
                const dx = event.clientX - arrastre.x;
                const dy = event.clientY - arrastre.y;
                if (!arrastre.movido && (Math.abs(dx) < 4 || Math.abs(dx) < Math.abs(dy))) {
                    return;
                }
                if (!arrastre.recorrido) {
                    arrastre.movido = true;
                    return;
                }
                if (!arrastre.movido) {
                    arrastre.movido = true;
                    abrirCarrusel();
                }

                const total = arrastre.recorrido.ids.length;
                // Restar y no sumar: la tira tiene que acompanar al dedo. Al
                // arrastrar hacia la derecha las fichas viajan a la derecha y
                // entra la pieza anterior, como cualquier carrusel del sistema.
                const posicion = Math.max(0, Math.min(total - 1, arrastre.base - dx / vista.FICHA));
                vista.moverCarrusel(arrastre.fichas, posicion);

                const destino = Math.round(posicion);
                if (destino !== arrastre.aplicado) {
                    arrastre.aplicado = destino;
                    elegir(arrastre.recorrido.campo, arrastre.recorrido.ids[destino]);
                    etiquetarCarrusel(destino, total);
                }
            });

            function soltar(event) {
                if (!arrastre) {
                    return;
                }
                const movido = arrastre.movido && !!arrastre.recorrido;
                arrastre = null;
                el.stage.releasePointerCapture?.(event.pointerId);
                ignorarClick = movido;
                if (movido) {
                    cerrarCarrusel();
                } else {
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

        function abrirCarrusel() {
            clearTimeout(abrirCarrusel.temporizador);
            builder.classList.add('is-carruseleando');
            etiquetarCarrusel(null, null);
        }

        function etiquetarCarrusel(indice, total) {
            const paso = pasos[pasoActivo];
            const pieza = modelo.get(seleccion[campoDe(paso.id)]);
            const nombre = pieza ? catalogo.nombrarModelo(modelo.grupoDe(campoDe(paso.id), pieza)) : '';
            const cuenta = indice === null ? '' : ` · ${indice + 1}/${total}`;
            el.carruselLabel.textContent = `${nombre}${cuenta}`;
        }

        function cerrarCarrusel() {
            // Se queda un momento a la vista para que se lea que quedo elegido.
            abrirCarrusel.temporizador = setTimeout(function () {
                builder.classList.remove('is-carruseleando');
            }, 620);
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

            const abajo = modelo.get(seleccion.biselAbajo);
            if (biselBicolor && abajo && abajo.id !== seleccion.bisel) {
                filas[1].valor = `${filas[1].valor} arriba / ${abajo.color.nombre} abajo (bicolor GMT)`;
            }

            filas.push({ label: 'Dial', valor: nombreDe('dial') });
            filas.push({ label: 'Fechador', valor: etiquetaDeFechador() });
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

        function etiquetaDeFechador() {
            if (seleccion.fechador === 'no') {
                return 'Sin fechador';
            }
            const posicion = posicionesDeFecha().find(function (opcion) {
                return opcion.valor === Number(seleccion.fechador);
            });
            return posicion ? `A las ${posicion.label}` : 'Sin fechador';
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

            const fecha = event.target.closest('[data-fecha]');
            if (fecha) {
                seleccion.fechador = fecha.dataset.fecha === 'no' ? 'no' : Number(fecha.dataset.fecha);
                pintarReloj();
                pintarPaso();
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
                seleccion.biselAbajo = biselBicolor ? mitadInferiorPorDefecto() : null;
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
