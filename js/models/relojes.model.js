(function (App) {
    const MANIFEST_URL = 'js/data/relojes-manifest.json';

    // Marco de composicion. Todo se expresa como fraccion del lado del stage,
    // asi la misma matematica sirve para el DOM y para el canvas de descarga.
    const CX = 0.5;
    const CY = 0.5;
    /**
     * Referencia: el radio del cuerpo circular de la caja, que es donde apoya
     * el bisel. Normalizar por ahi (y no por la apertura) hace dos cosas: todas
     * las cajas salen del mismo tamano en pantalla, y el bisel elegido cubre por
     * completo al que ya trae la caja. Las cajas 4-12 tienen la apertura mucho
     * mas chica en proporcion (ratio 1.41-1.54 contra 1.31 de las lisas), asi
     * que anclar por apertura dejaba asomando un anillo del bisel integrado.
     */
    const RADIO_CUERPO = 0.284;
    const RADIO_INDICES = 0.76;      // anillo donde se apoyan los indices
    const ALTO_INDICE = 0.115;       // alto de cada glifo, relativo al dial
    const LARGO_AGUJA = { hora: 0.55, minuto: 0.82, segundero: 0.90 };
    const ANCHO_CORREA = 0.42;       // relativo al ancho de la caja
    const SOLAPE_CORREA = 0.14;      // cuanto se mete la correa debajo de la caja

    // Hora de escaparate: 10:10:30, la que usan las fotos de catalogo.
    const ANGULOS = { hora: 305, minuto: 60, segundero: 180 };

    // De atras hacia adelante: correa, caja, dial, indices, bisel, agujas.

    let piezas = [];
    let porId = new Map();
    let cargaPromesa = null;

    function load() {
        if (cargaPromesa) {
            return cargaPromesa;
        }

        cargaPromesa = fetch(MANIFEST_URL)
            .then(function (response) {
                if (!response.ok) {
                    throw new Error(`No se pudo cargar el manifiesto (${response.status})`);
                }
                return response.json();
            })
            .then(function (manifest) {
                piezas = Array.isArray(manifest.piezas) ? manifest.piezas : [];
                porId = new Map(piezas.map(function (pieza) {
                    return [pieza.id, pieza];
                }));
                return piezas;
            });

        return cargaPromesa;
    }

    function get(id) {
        return porId.get(Number(id)) || null;
    }

    function porCategoria(categoria) {
        return piezas.filter(function (pieza) {
            return pieza.categoria === categoria;
        });
    }

    /**
     * Numero visible de una pieza dentro de su categoria. Se calcula sobre la
     * categoria y no sobre la lista filtrada para que el nombre sea el mismo
     * en el grid y en el resumen final.
     */
    function ordinalDe(pieza) {
        if (!pieza) {
            return '';
        }
        return porCategoria(pieza.categoria).findIndex(function (item) {
            return item.id === pieza.id;
        }) + 1;
    }

    /** Opciones que se muestran en el grid de cada paso. */
    function opcionesDe(pasoId, seleccion) {
        switch (pasoId) {
            case 'correa':
                // Cuero y brazalete comparten el paso: son alternativas de lo mismo.
                return porCategoria('correa').concat(porCategoria('brazalete'));
            case 'aguja':
                return porCategoria('aguja').filter(function (pieza) {
                    return pieza.slot === 'principal';
                });
            case 'indice':
                // Cada juego se representa por su primer glifo.
                return juegosDeIndices();
            default:
                return porCategoria(pasoId);
        }
    }

    /**
     * Los indices vienen como glifos sueltos. Los numerales forman juegos de 12
     * (uno por hora); las barras son un unico marcador que se repite en las 12
     * posiciones. En ambos casos la opcion expone `glifos` y la UI la trata igual.
     */
    function juegosDeIndices() {
        const opciones = [];
        let actual = null;

        porCategoria('indice').forEach(function (pieza) {
            if (pieza.familia === 'barra') {
                actual = null;
                opciones.push(Object.assign({}, pieza, { glifos: [pieza.id] }));
                return;
            }

            const clave = `${pieza.familia}|${pieza.acabado}`;
            if (!actual || actual.clave !== clave || actual.glifos.length === 12) {
                actual = Object.assign({}, pieza, { clave: clave, glifos: [] });
                opciones.push(actual);
            }
            actual.glifos.push(pieza.id);
        });

        return opciones.map(function (opcion) {
            delete opcion.clave;
            return opcion;
        });
    }

    function agujasSegundero(acabado) {
        return porCategoria('aguja').filter(function (pieza) {
            return pieza.slot === 'segundero' && (!acabado || pieza.acabado === acabado);
        });
    }

    function seleccionInicial() {
        const juegos = juegosDeIndices();
        const primeraAguja = opcionesDe('aguja')[0];
        return {
            caja: (porCategoria('caja')[0] || {}).id,
            bisel: (porCategoria('bisel')[0] || {}).id,
            dial: (porCategoria('dial')[0] || {}).id,
            indice: (juegos[0] || {}).id,
            aguja: (primeraAguja || {}).id,
            segundero: (agujasSegundero(primeraAguja && primeraAguja.acabado)[0] || {}).id,
            correa: (porCategoria('correa')[0] || {}).id
        };
    }

    function capa(src, width, height, left, top, rot, originX, originY) {
        return {
            src: src,
            width: width,
            height: height,
            left: left,
            top: top,
            rot: rot || 0,
            originX: originX === undefined ? 0.5 : originX,
            originY: originY === undefined ? 0.5 : originY
        };
    }

    /** Geometria de la caja: de ella cuelgan el bisel y la correa. */
    function marcoDeCaja(caja) {
        if (!caja || !caja.apertura || !caja.radioAsiento) {
            return null;
        }
        const escala = RADIO_CUERPO / caja.radioAsiento;
        const ancho = caja.w * escala;
        const alto = caja.h * escala;
        const top = CY - caja.apertura.cy * escala;
        const left = CX - caja.apertura.cx * escala;
        return { escala: escala, ancho: ancho, alto: alto, top: top, left: left, bottom: top + alto };
    }

    /**
     * El bisel apoya en el cuerpo de la caja, y su apertura define hasta donde
     * llega el dial. Todo lo que va sobre la esfera (dial, indices, agujas) se
     * mide contra este radio, no contra la apertura de la caja.
     */
    function marcoDeBisel(bisel) {
        if (!bisel || !bisel.apertura) {
            return null;
        }
        const escala = RADIO_CUERPO / (bisel.w / 2);
        return { escala: escala, radioDial: bisel.apertura.r * escala };
    }

    function capasDeCorrea(seleccion, marco) {
        const correa = get(seleccion.correa);
        if (!correa || !marco) {
            return [];
        }

        const objetivo = marco.ancho * ANCHO_CORREA;
        const solape = marco.ancho * SOLAPE_CORREA;
        const partes = correa.partes && correa.partes.length
            ? correa.partes
            : [{ rol: 'unica', src: correa.src, w: correa.w, h: correa.h }];

        const capas = [];
        const unica = partes[0].rol === 'unica';

        partes.forEach(function (parte) {
            const escala = objetivo / parte.w;
            const alto = parte.h * escala;
            const left = CX - objetivo / 2;

            if (parte.rol === 'inferior' || parte.rol === 'unica') {
                capas.push(capa(parte.src, objetivo, alto, left, marco.bottom - solape, 0));
            }
            if (parte.rol === 'superior') {
                capas.push(capa(parte.src, objetivo, alto, left, marco.top + solape - alto, 0));
            }
            if (unica) {
                // Una sola tira: la de arriba es la misma girada 180 grados.
                capas.push(capa(parte.src, objetivo, alto, left, marco.top + solape - alto, 180));
            }
        });

        return capas;
    }

    function capasDeIndices(seleccion, radioDial) {
        const juego = juegosDeIndices().find(function (opcion) {
            return opcion.id === Number(seleccion.indice);
        });
        if (!juego) {
            return [];
        }

        const capas = [];
        for (let posicion = 0; posicion < 12; posicion += 1) {
            // Un juego de numerales trae 12 glifos; una barra trae uno solo que
            // se repite en las doce posiciones.
            const glifo = get(juego.glifos[juego.glifos.length === 1 ? 0 : posicion]);
            if (!glifo) {
                continue;
            }

            const escala = (ALTO_INDICE * radioDial) / glifo.h;
            const ancho = glifo.w * escala;
            const alto = glifo.h * escala;
            // El primer glifo es el "1", que va en la posicion de la una.
            const angulo = ((posicion + 1) * 30 * Math.PI) / 180;
            const x = CX + RADIO_INDICES * radioDial * Math.sin(angulo);
            const y = CY - RADIO_INDICES * radioDial * Math.cos(angulo);
            capas.push(capa(glifo.src, ancho, alto, x - ancho / 2, y - alto / 2, 0));
        }

        return capas;
    }

    function capaDeAguja(pieza, tipo, radioDial) {
        if (!pieza || !pieza.pivote) {
            return null;
        }
        const escala = (LARGO_AGUJA[tipo] * radioDial) / pieza.pivote.cy;
        const ancho = pieza.w * escala;
        const alto = pieza.h * escala;
        return capa(
            pieza.src,
            ancho,
            alto,
            CX - pieza.pivote.cx * escala,
            CY - pieza.pivote.cy * escala,
            ANGULOS[tipo],
            pieza.pivote.cx / pieza.w,
            pieza.pivote.cy / pieza.h
        );
    }

    /** Todas las capas del reloj, en orden de dibujo. */
    function capasDe(seleccion) {
        const caja = get(seleccion.caja);
        const bisel = get(seleccion.bisel);
        const marco = marcoDeCaja(caja);
        const aro = marcoDeBisel(bisel);
        if (!marco || !aro) {
            return [];
        }

        const radioDial = aro.radioDial;
        const capas = capasDeCorrea(seleccion, marco);
        capas.push(capa(caja.src, marco.ancho, marco.alto, marco.left, marco.top, 0));

        const dial = get(seleccion.dial);
        if (dial) {
            const escala = radioDial / dial.radio;
            const ancho = dial.w * escala;
            const alto = dial.h * escala;
            capas.push(capa(dial.src, ancho, alto, CX - ancho / 2, CY - alto / 2, 0));
        }

        capas.push.apply(capas, capasDeIndices(seleccion, radioDial));

        capas.push(capa(
            bisel.src,
            bisel.w * aro.escala,
            bisel.h * aro.escala,
            CX - bisel.apertura.cx * aro.escala,
            CY - bisel.apertura.cy * aro.escala,
            0
        ));

        [
            [get(seleccion.aguja), 'hora'],
            [get(seleccion.aguja), 'minuto'],
            [get(seleccion.segundero), 'segundero']
        ].forEach(function (par) {
            const resultado = capaDeAguja(par[0], par[1], radioDial);
            if (resultado) {
                capas.push(resultado);
            }
        });

        return capas;
    }

    function cargarImagen(src) {
        return new Promise(function (resolve, reject) {
            const image = new Image();
            image.decoding = 'async';
            image.onload = function () {
                resolve(image);
            };
            image.onerror = function () {
                reject(new Error(`No se pudo cargar ${src}`));
            };
            image.src = src;
        });
    }

    /** Recompone el reloj en un canvas para descargarlo o miniaturizarlo. */
    function renderizar(seleccion, lado) {
        const capas = capasDe(seleccion);
        const size = lado || 1600;

        return Promise.all(capas.map(function (item) {
            return cargarImagen(item.src);
        })).then(function (imagenes) {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const context = canvas.getContext('2d');
            context.imageSmoothingQuality = 'high';

            capas.forEach(function (item, indice) {
                const width = item.width * size;
                const height = item.height * size;
                const originX = item.originX * width;
                const originY = item.originY * height;

                context.save();
                context.translate(item.left * size + originX, item.top * size + originY);
                if (item.rot) {
                    context.rotate((item.rot * Math.PI) / 180);
                }
                context.drawImage(imagenes[indice], -originX, -originY, width, height);
                context.restore();
            });

            return canvas;
        });
    }

    App.models.relojes = {
        agujasSegundero,
        capasDe,
        get,
        juegosDeIndices,
        load,
        opcionesDe,
        ordinalDe,
        porCategoria,
        renderizar,
        seleccionInicial
    };
})(window.PerfSuarez);
