(function (App) {
    const MANIFEST_URL = 'js/data/relojes-manifest.json';
    const LOGO_SRC = 'imagenes/Suarez.png';

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
    const ALTO_INDICE = 0.1725;      // alto de cada glifo, relativo al dial
    const LARGO_AGUJA = { hora: 0.55, minuto: 0.82, segundero: 0.90 };
    const SOLAPE_CORREA = 0.14;      // cuanto se mete la correa debajo de la caja
    // La correa se recorta apenas respecto del ancho medido entre las puntas de
    // las asas: al ras se ve flush, un pelo mas y asoma por los costados.
    const AJUSTE_CORREA = 0.98;
    const ANCHO_CORREA_FALLBACK = 0.58;

    // El logo va en el tercio superior de la esfera, entre las 12 y el centro.
    // Un tercio del diametro es la proporcion habitual en un reloj real; mas
    // grande que eso se cruza con las agujas apenas se mueven de las 10:10.
    const LOGO_ANCHO = 0.60;         // relativo al radio del dial
    const LOGO_ALTURA = 0.50;        // a que altura del radio se centra

    // Tinta del logo segun que tan claro sea el dial y de que metal son los
    // indices elegidos: sobre esfera oscura va el metal claro y al reves.
    const TINTA_LOGO = {
        oro: { claro: '#8A6A28', oscuro: '#D8B77A' },
        plata: { claro: '#4A4A48', oscuro: '#E4E4E2' },
        gunmetal: { claro: '#3C3C3A', oscuro: '#CFCFCD' },
        rojo: { claro: '#8E2A24', oscuro: '#E5726B' }
    };

    // Hora de escaparate: 10:10:30, la que usan las fotos de catalogo.
    const ANGULOS = { hora: 305, minuto: 60, segundero: 180 };

    // Solo los biseles GMT se parten en dos colores, y la particion es
    // HORIZONTAL: en la escala de 24 horas el 6 cae a las 3 en punto y el 18 a
    // las 9, asi que la linea dia/noche es el diametro horizontal.
    const MODELOS_GMT = ['bisel-01', 'bisel-02'];

    // Posiciones del fechador: 24 alrededor de la esfera, una cada 15 grados,
    // sobre los indices (pares) y entre ellos (impares). Los assets solo traen
    // la ventana a los 90, 135 y 180 grados, pero esta orientada radialmente y
    // siempre al mismo radio, asi que para el resto se rota el dial entero.
    const POSICIONES_FECHA = 24;
    const GRADOS_POR_POSICION = 360 / POSICIONES_FECHA;

    // De atras hacia adelante: correa, caja, dial, foto, indices, logo, bisel, agujas.

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

    // ---------- Modelos y colores ----------

    /**
     * Agrupa una lista de piezas por `modelo`. Cada grupo es un diseno y sus
     * piezas son el mismo diseno en distintos colores: la UI dibuja una sola
     * tarjeta por grupo y ofrece los colores como puntitos.
     */
    function agrupar(lista) {
        const grupos = [];
        const indice = new Map();

        lista.forEach(function (pieza) {
            const clave = pieza.modelo || `suelto-${pieza.id}`;
            if (!indice.has(clave)) {
                const grupo = { modelo: clave, categoria: pieza.categoria, piezas: [] };
                indice.set(clave, grupo);
                grupos.push(grupo);
            }
            indice.get(clave).piezas.push(pieza);
        });

        return grupos;
    }

    /** El grupo al que pertenece una pieza, dentro de las opciones de un paso. */
    function grupoDe(pasoId, pieza) {
        if (!pieza) {
            return null;
        }
        return modelosDe(pasoId).find(function (grupo) {
            return grupo.modelo === pieza.modelo;
        }) || null;
    }

    /**
     * Los diales con fechador comparten modelo y color con su gemelo sin fecha:
     * son el mismo dial con la ventana ya dibujada. En los grids solo se ofrece
     * el gemelo sin fecha; la ventana se elige despues, en el paso de detalles.
     */
    function dialesBase() {
        return porCategoria('dial').filter(function (pieza) {
            return (pieza.fecha || 'no') === 'no';
        });
    }

    function modelosDe(pasoId, filtro) {
        switch (pasoId) {
            case 'correa':
                // Cuero y brazalete comparten el paso: son alternativas de lo mismo.
                return agrupar(porCategoria('correa').concat(porCategoria('brazalete')));
            case 'dial':
                return agrupar(dialesBase());
            case 'hora':
            case 'minuto':
            case 'aguja':
                return agrupar(porCategoria('aguja').filter(function (pieza) {
                    return pieza.slot === 'principal';
                }));
            case 'segundero':
                return agrupar(porCategoria('aguja').filter(function (pieza) {
                    return pieza.slot === 'segundero';
                }));
            case 'indice':
                return agrupar(porCategoria('indice'));
            default:
                return agrupar(porCategoria(pasoId));
        }
    }

    /**
     * Colores ofrecidos por un grupo. Los indices repiten el acabado en sus doce
     * glifos, asi que se colapsan a una entrada por acabado.
     */
    function coloresDe(grupo) {
        if (!grupo) {
            return [];
        }

        if (grupo.categoria === 'indice') {
            const vistos = new Map();
            grupo.piezas.forEach(function (pieza) {
                if (!vistos.has(pieza.acabado)) {
                    vistos.set(pieza.acabado, pieza);
                }
            });
            return Array.from(vistos.values());
        }

        return grupo.piezas;
    }

    /** La pieza del grupo que corresponde a un color, o la primera disponible. */
    function variantePorColor(grupo, nombre) {
        if (!grupo || !grupo.piezas.length) {
            return null;
        }
        return grupo.piezas.find(function (pieza) {
            return pieza.color && pieza.color.nombre === nombre;
        }) || grupo.piezas[0];
    }

    // ---------- Fechador ----------

    // Angulo al que cada asset trae dibujada la ventana.
    const ANGULO_DE_ASSET = { '3': 90, '430': 135, '6': 180 };

    /** Variantes con fechador de un dial base, indexadas por su angulo. */
    function variantesConFecha(dialId) {
        const variantes = {};
        porCategoria('dial').forEach(function (pieza) {
            if (pieza.gemelo === Number(dialId) && ANGULO_DE_ASSET[pieza.fecha] !== undefined) {
                variantes[ANGULO_DE_ASSET[pieza.fecha]] = pieza;
            }
        });
        return variantes;
    }

    /** Si el dial elegido admite fechador (o sea, si tiene alguna variante). */
    function admiteFechador(dialId) {
        return Object.keys(variantesConFecha(dialId)).length > 0;
    }

    function anguloDeFecha(posicion) {
        return ((Number(posicion) % POSICIONES_FECHA) + POSICIONES_FECHA) % POSICIONES_FECHA * GRADOS_POR_POSICION;
    }

    /**
     * El dial que se dibuja y cuanto hay que girarlo.
     *
     * Si existe un asset con la ventana justo en esa posicion se usa tal cual;
     * si no, se toma el que esta mas cerca y se rota la diferencia. Rotar el
     * dial es seguro: las texturas son radiales u organicas, y la ventana viene
     * orientada hacia el centro, asi que sigue leyendose bien en cualquier hora.
     */
    function dialEfectivo(seleccion) {
        const base = get(seleccion.dial);
        if (!base || seleccion.fechador === 'no' || seleccion.fechador === undefined || seleccion.fechador === null) {
            return { pieza: base, rot: 0 };
        }

        const variantes = variantesConFecha(base.id);
        const angulos = Object.keys(variantes).map(Number);
        if (!angulos.length) {
            return { pieza: base, rot: 0 };
        }

        const objetivo = anguloDeFecha(seleccion.fechador);
        const elegido = angulos.reduce(function (mejor, angulo) {
            const propia = Math.abs(((objetivo - angulo + 540) % 360) - 180);
            const previa = Math.abs(((objetivo - mejor + 540) % 360) - 180);
            return propia < previa ? angulo : mejor;
        }, angulos[0]);

        return { pieza: variantes[elegido], rot: (objetivo - elegido + 360) % 360 };
    }

    // ---------- Indices ----------

    const POSICIONES = 12;

    /** Los glifos de un juego, en orden de hora. La posicion 11 son las 12. */
    function juegoDeIndices(modelo, acabado) {
        const grupo = modelosDe('indice').find(function (item) {
            return item.modelo === modelo;
        });
        if (!grupo) {
            return null;
        }

        const propias = grupo.piezas.filter(function (pieza) {
            return pieza.acabado === acabado;
        });
        if (!propias.length) {
            return null;
        }

        // Las barras vienen en dos piezas: una simple para las once posiciones
        // y una doble que en un reloj real marca las 12.
        if (propias[0].variante) {
            const simple = propias.find(function (pieza) {
                return pieza.variante === 'simple';
            }) || propias[0];
            const doble = propias.find(function (pieza) {
                return pieza.variante === 'doble';
            }) || simple;
            const glifos = [];
            for (let posicion = 0; posicion < POSICIONES; posicion += 1) {
                glifos.push(posicion === POSICIONES - 1 ? doble.id : simple.id);
            }
            return { modelo: modelo, acabado: acabado, glifos: glifos };
        }

        return {
            modelo: modelo,
            acabado: acabado,
            glifos: propias.slice(0, POSICIONES).map(function (pieza) {
                return pieza.id;
            })
        };
    }

    /** Todos los juegos completos, para el grid de "todos iguales". */
    function juegosDeIndices() {
        const juegos = [];
        modelosDe('indice').forEach(function (grupo) {
            coloresDe(grupo).forEach(function (pieza) {
                const juego = juegoDeIndices(grupo.modelo, pieza.acabado);
                if (juego) {
                    juegos.push(juego);
                }
            });
        });
        return juegos;
    }

    /**
     * Los glifos que se pueden poner en una posicion suelta: uno por juego, ya
     * resuelto a la hora correspondiente. Asi se puede armar un dial con
     * romanos en las 12/3/6/9 y barras en el resto sin recorrer 120 archivos.
     */
    function glifosParaPosicion(posicion) {
        const opciones = [];
        juegosDeIndices().forEach(function (juego) {
            const pieza = get(juego.glifos[posicion]);
            if (pieza) {
                opciones.push(pieza);
            }
        });

        // En las 12 tambien se ofrece la barra simple, por si alguien no quiere
        // la doble; en el resto, la doble como acento.
        modelosDe('indice').forEach(function (grupo) {
            grupo.piezas.forEach(function (pieza) {
                const esAlternativa = pieza.variante
                    && ((posicion === POSICIONES - 1 && pieza.variante === 'simple')
                        || (posicion !== POSICIONES - 1 && pieza.variante === 'doble'));
                if (esAlternativa) {
                    opciones.push(pieza);
                }
            });
        });

        return opciones;
    }

    function mapaDeIndices(juego) {
        const mapa = {};
        if (juego) {
            juego.glifos.forEach(function (id, posicion) {
                mapa[posicion] = id;
            });
        }
        return mapa;
    }

    // ---------- Seleccion inicial ----------

    function agujasSegundero(acabado) {
        return porCategoria('aguja').filter(function (pieza) {
            return pieza.slot === 'segundero' && (!acabado || pieza.acabado === acabado);
        });
    }

    function seleccionInicial() {
        const primeraAguja = (modelosDe('hora')[0] || { piezas: [] }).piezas[0];
        const acabado = primeraAguja ? primeraAguja.acabado : 'plata';
        const juego = juegoDeIndices('indice-barra-solida', 'plata') || juegosDeIndices()[0];

        return {
            caja: (porCategoria('caja')[0] || {}).id,
            bisel: (porCategoria('bisel')[0] || {}).id,
            biselAbajo: null,
            dial: (dialesBase()[0] || {}).id,
            fechador: 'no',
            foto: null,
            usarFoto: false,
            indiceModelo: juego ? juego.modelo : null,
            indiceAcabado: juego ? juego.acabado : null,
            // Representante del juego activo: es el glifo que el grid marca
            // como seleccionado cuando los doce indices son del mismo set.
            indiceJuego: juego ? juego.glifos[0] : null,
            indices: mapaDeIndices(juego),
            hora: primeraAguja ? primeraAguja.id : null,
            minuto: primeraAguja ? primeraAguja.id : null,
            segundero: (agujasSegundero(acabado)[0] || {}).id,
            correa: (porCategoria('correa')[0] || {}).id
        };
    }

    // ---------- Capas ----------

    /**
     * `clave` identifica a la capa entre repintados. La vista reusa los nodos
     * por clave y no por posicion: cuando una capa aparece o desaparece (el
     * bisel bicolor pasa de una a dos, el fechador tapa un indice) el indice de
     * todas las siguientes se corre y los nodos se reciclaban cruzados, con el
     * parpadeo y los saltos que se veian.
     */
    function capa(src, width, height, left, top, rot, originX, originY, clave) {
        return {
            tipo: 'imagen',
            clip: null,
            clave: clave || src,
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
        const asas = caja.asas || {};
        return {
            escala: escala,
            ancho: ancho,
            alto: alto,
            top: top,
            left: left,
            bottom: top + alto,
            anchoAsaSuperior: (asas.anchoSuperior || ANCHO_CORREA_FALLBACK) * AJUSTE_CORREA,
            anchoAsaInferior: (asas.anchoInferior || ANCHO_CORREA_FALLBACK) * AJUSTE_CORREA
        };
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

        const solape = marco.ancho * SOLAPE_CORREA;
        const partes = correa.partes && correa.partes.length
            ? correa.partes
            : [{ rol: 'unica', src: correa.src, w: correa.w, h: correa.h }];

        const capas = [];
        const unica = partes[0].rol === 'unica';

        // La correa se dimensiona contra el ancho real entre las asas de la caja
        // elegida. Con un porcentaje fijo quedaba mas angosta que la luz de las
        // asas y se veia flotar un hilo de fondo a los costados.
        function dibujar(parte, arriba) {
            const objetivo = marco.ancho * (arriba ? marco.anchoAsaSuperior : marco.anchoAsaInferior);
            const escala = objetivo / parte.w;
            const alto = parte.h * escala;
            const left = CX - objetivo / 2;
            const top = arriba ? marco.top + solape - alto : marco.bottom - solape;
            capas.push(capa(
                parte.src, objetivo, alto, left, top,
                arriba && unica ? 180 : 0, undefined, undefined,
                arriba ? 'correa-sup' : 'correa-inf'
            ));
        }

        partes.forEach(function (parte) {
            if (parte.rol === 'inferior' || parte.rol === 'unica') {
                dibujar(parte, false);
            }
            if (parte.rol === 'superior') {
                dibujar(parte, true);
            }
            if (unica) {
                // Una sola tira: la de arriba es la misma girada 180 grados.
                dibujar(parte, true);
            }
        });

        return capas;
    }

    /** Angulo en grados de una posicion horaria. La 0 es la una, la 11 las doce. */
    function anguloDePosicion(posicion) {
        return (posicion + 1) * 30;
    }

    /**
     * Indice que tapa la ventana del fechador. Solo las posiciones pares caen
     * sobre una hora; las impares quedan entre dos indices y no pisan ninguno.
     */
    function posicionOcupadaPorFecha(fechador) {
        if (fechador === 'no' || fechador === undefined || fechador === null) {
            return -1;
        }
        const posicion = Number(fechador);
        if (posicion % 2 !== 0) {
            return -1;
        }
        // Las capas de indice van de la una a las doce: la posicion 0 (mediodia)
        // es la ultima de la vuelta.
        return (posicion / 2 + 11) % 12;
    }

    function capasDeIndices(seleccion, radioDial) {
        const mapa = seleccion.indices || {};
        const ocupada = posicionOcupadaPorFecha(seleccion.fechador);
        const capas = [];

        for (let posicion = 0; posicion < POSICIONES; posicion += 1) {
            if (posicion === ocupada) {
                continue;
            }
            const glifo = get(mapa[posicion]);
            if (!glifo) {
                continue;
            }

            const escala = (ALTO_INDICE * radioDial) / glifo.h;
            const ancho = glifo.w * escala;
            const alto = glifo.h * escala;
            const grados = anguloDePosicion(posicion);
            const angulo = (grados * Math.PI) / 180;
            const x = CX + RADIO_INDICES * radioDial * Math.sin(angulo);
            const y = CY - RADIO_INDICES * radioDial * Math.cos(angulo);
            // Las barras apuntan al centro de la esfera, como en un reloj real;
            // los numerales se leen siempre derechos.
            const rot = glifo.variante ? grados : 0;
            capas.push(capa(
                glifo.src, ancho, alto, x - ancho / 2, y - alto / 2, rot,
                undefined, undefined, `indice-${posicion}`
            ));
        }

        return capas;
    }

    function capaDeAguja(pieza, tipo, radioDial, fechador) {
        if (!pieza || !pieza.pivote) {
            return null;
        }
        const escala = (LARGO_AGUJA[tipo] * radioDial) / pieza.pivote.cy;
        const ancho = pieza.w * escala;
        const alto = pieza.h * escala;
        const angulo = ANGULOS[tipo];
        return capa(
            pieza.src,
            ancho,
            alto,
            CX - pieza.pivote.cx * escala,
            CY - pieza.pivote.cy * escala,
            angulo,
            pieza.pivote.cx / pieza.w,
            pieza.pivote.cy / pieza.h,
            tipo
        );
    }

    /** Color del logo: contrasta con el dial y sigue el metal de los indices. */
    function tintaDelLogo(seleccion, dial) {
        const tabla = TINTA_LOGO[seleccion.indiceAcabado] || TINTA_LOGO.plata;
        const claro = dial && typeof dial.luminancia === 'number' ? dial.luminancia > 128 : false;
        return claro ? tabla.claro : tabla.oscuro;
    }

    function capaDeLogo(seleccion, dial, radioDial) {
        const ancho = LOGO_ANCHO * radioDial;
        const alto = ancho * (320 / 742);
        const capaLogo = capa(
            LOGO_SRC, ancho, alto, CX - ancho / 2, CY - LOGO_ALTURA * radioDial - alto / 2,
            0, undefined, undefined, 'logo'
        );
        capaLogo.tipo = 'tinte';
        capaLogo.tinta = tintaDelLogo(seleccion, dial);
        return capaLogo;
    }

    function capaDeFoto(seleccion, radioDial) {
        // La foto queda guardada aunque se elija "Sin foto": deslizar de ida y
        // vuelta por esa pantalla no deberia obligar a subirla otra vez.
        if (!seleccion.foto || !seleccion.usarFoto) {
            return null;
        }
        const lado = radioDial * 2;
        const capaFoto = capa(
            seleccion.foto, lado, lado, CX - radioDial, CY - radioDial,
            0, undefined, undefined, 'foto'
        );
        capaFoto.clip = 'circulo';
        return capaFoto;
    }

    /** Solo los biseles GMT se parten en dos colores. */
    function admiteBicolor(pieza) {
        return !!pieza && MODELOS_GMT.indexOf(pieza.modelo) >= 0;
    }

    /**
     * El bisel bicolor se arma con dos variantes de color del mismo modelo,
     * cada una recortada a su mitad. No hace falta recolorear nada: las piezas
     * comparten geometria exacta, asi que la costura cae justa.
     *
     * El corte es HORIZONTAL porque en la escala GMT de 24 horas el 6 queda a
     * las 3 en punto y el 18 a las 9: la linea que separa dia de noche es el
     * diametro horizontal, no el vertical.
     *
     * Las dos mitades se dibujan con la geometria de la pieza de arriba para
     * que no puedan desalinearse ni por un pixel, y se pisan un pelo en la
     * costura para que el antialias no deje una linea de fondo entremedio.
     */
    function capasDeBisel(seleccion, aro) {
        const arriba = get(seleccion.bisel);
        if (!arriba) {
            return [];
        }

        function capaBisel(pieza, clip, clave) {
            const item = capa(
                pieza.src,
                arriba.w * aro.escala,
                arriba.h * aro.escala,
                CX - arriba.apertura.cx * aro.escala,
                CY - arriba.apertura.cy * aro.escala,
                0
            );
            item.clip = clip;
            item.clave = clave;
            return item;
        }

        const abajo = get(seleccion.biselAbajo);
        const parte = abajo && abajo.id !== arriba.id
            && abajo.modelo === arriba.modelo && admiteBicolor(arriba);

        if (!parte) {
            return [capaBisel(arriba, null, 'bisel')];
        }
        return [capaBisel(arriba, 'arriba', 'bisel'), capaBisel(abajo, 'abajo', 'bisel-abajo')];
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
        capas.push(capa(caja.src, marco.ancho, marco.alto, marco.left, marco.top, 0, undefined, undefined, 'caja'));

        const { pieza: dial, rot: rotDial } = dialEfectivo(seleccion);
        if (dial) {
            const escala = radioDial / dial.radio;
            const ancho = dial.w * escala;
            const alto = dial.h * escala;
            capas.push(capa(
                dial.src, ancho, alto, CX - ancho / 2, CY - alto / 2,
                rotDial, undefined, undefined, 'dial'
            ));
        }

        const foto = capaDeFoto(seleccion, radioDial);
        if (foto) {
            capas.push(foto);
        }

        capas.push.apply(capas, capasDeIndices(seleccion, radioDial));
        capas.push(capaDeLogo(seleccion, dial, radioDial));
        capas.push.apply(capas, capasDeBisel(seleccion, aro));

        [
            [get(seleccion.hora), 'hora'],
            [get(seleccion.minuto), 'minuto'],
            [get(seleccion.segundero), 'segundero']
        ].forEach(function (par) {
            const resultado = capaDeAguja(par[0], par[1], radioDial, seleccion.fechador);
            if (resultado) {
                capas.push(resultado);
            }
        });

        return capas;
    }

    /**
     * Centro de cada indice dentro del stage, en fracciones del lado. Lo usa la
     * vista para saber a que posicion horaria le pego el usuario cuando toca el
     * reloj para editar un indice suelto.
     */
    function centrosDeIndices(seleccion) {
        const aro = marcoDeBisel(get(seleccion.bisel));
        if (!aro) {
            return [];
        }
        const centros = [];
        for (let posicion = 0; posicion < POSICIONES; posicion += 1) {
            const angulo = (anguloDePosicion(posicion) * Math.PI) / 180;
            centros.push({
                posicion: posicion,
                x: CX + RADIO_INDICES * aro.radioDial * Math.sin(angulo),
                y: CY - RADIO_INDICES * aro.radioDial * Math.cos(angulo)
            });
        }
        return centros;
    }

    /** Posicion horaria mas cercana a un punto del stage, o null si esta lejos. */
    function posicionMasCercana(seleccion, x, y) {
        let mejor = null;
        centrosDeIndices(seleccion).forEach(function (centro) {
            const distancia = Math.hypot(centro.x - x, centro.y - y);
            if (!mejor || distancia < mejor.distancia) {
                mejor = { posicion: centro.posicion, distancia: distancia };
            }
        });
        return mejor && mejor.distancia < 0.12 ? mejor.posicion : null;
    }

    // ---------- Render a canvas ----------

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

    /** Recorta una imagen a un color plano conservando su alfa. */
    function tintar(imagen, ancho, alto, color) {
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(ancho));
        canvas.height = Math.max(1, Math.round(alto));
        const context = canvas.getContext('2d');
        context.drawImage(imagen, 0, 0, canvas.width, canvas.height);
        context.globalCompositeOperation = 'source-in';
        context.fillStyle = color;
        context.fillRect(0, 0, canvas.width, canvas.height);
        return canvas;
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

                // El recorte se aplica en el sistema ya trasladado, con el
                // origen de la capa en (0,0) menos su punto de anclaje.
                if (item.clip) {
                    context.beginPath();
                    if (item.clip === 'circulo') {
                        context.arc(-originX + width / 2, -originY + height / 2, width / 2, 0, Math.PI * 2);
                    } else if (item.clip === 'izquierda') {
                        context.rect(-originX, -originY, width / 2, height);
                    } else {
                        context.rect(-originX + width / 2, -originY, width / 2, height);
                    }
                    context.clip();
                }

                const fuente = item.tipo === 'tinte'
                    ? tintar(imagenes[indice], width, height, item.tinta)
                    : imagenes[indice];
                context.drawImage(fuente, -originX, -originY, width, height);
                context.restore();
            });

            return canvas;
        });
    }

    // ---------- Pantallas del configurador ----------

    /**
     * Que campo gobierna cada pantalla y contra que categoria se agrupan sus
     * modelos. Horas y minutos comparten pieza: el asset `principal` es el
     * mismo para las dos agujas, solo cambia el largo con el que se dibuja.
     */
    const PANTALLAS = {
        'caja-modelo': { campo: 'caja', grupo: 'caja', tipo: 'modelo' },
        'caja-color': { campo: 'caja', grupo: 'caja', tipo: 'color' },
        'bisel-modelo': { campo: 'bisel', grupo: 'bisel', tipo: 'modelo' },
        'bisel-color': { campo: 'bisel', grupo: 'bisel', tipo: 'color' },
        'bisel-abajo': { campo: 'biselAbajo', grupo: 'bisel', tipo: 'abajo' },
        'dial-modelo': { campo: 'dial', grupo: 'dial', tipo: 'modelo' },
        'dial-color': { campo: 'dial', grupo: 'dial', tipo: 'color' },
        'dial-fecha': { campo: 'fechador', tipo: 'fecha' },
        'indice-modelo': { campo: 'indices', tipo: 'indice-modelo' },
        'indice-color': { campo: 'indices', tipo: 'indice-color' },
        // Solo desde el menu, en modo avanzado: glifo de una hora suelta.
        'indice-pos': { campo: 'indices', tipo: 'indice-pos' },
        'aguja-modelo': { campo: 'hora', grupo: 'hora', tipo: 'modelo' },
        'aguja-color': { campo: 'hora', grupo: 'hora', tipo: 'color' },
        'segundero-modelo': { campo: 'segundero', grupo: 'segundero', tipo: 'modelo' },
        'segundero-color': { campo: 'segundero', grupo: 'segundero', tipo: 'color' },
        'correa-modelo': { campo: 'correa', grupo: 'correa', tipo: 'modelo' },
        'correa-color': { campo: 'correa', grupo: 'correa', tipo: 'color' },
        foto: { campo: 'usarFoto', tipo: 'foto' }
    };

    function catalogo() {
        return App.data.relojes;
    }

    function tipoDe(pantallaId) {
        return (PANTALLAS[pantallaId] || {}).tipo || null;
    }

    function nombreDeColor(pieza) {
        if (!pieza) {
            return '';
        }
        return pieza.color ? pieza.color.nombre : catalogo().acabadoLabel(pieza);
    }

    function grupoDeIndice(modelo) {
        return modelosDe('indice').find(function (grupo) {
            return grupo.modelo === modelo;
        }) || null;
    }

    /**
     * Las tres posiciones que ya traen los assets van primero: son las que se
     * ven "de fabrica", sin girar el dial. El resto sigue en sentido horario
     * desde las 12, para que buscar una hora sea contar como en un reloj.
     */
    const FECHAS_PRIMERAS = [6, 9, 12];

    function ordenDeFechas() {
        const resto = [];
        for (let posicion = 0; posicion < POSICIONES_FECHA; posicion += 1) {
            if (FECHAS_PRIMERAS.indexOf(posicion) < 0) {
                resto.push(posicion);
            }
        }
        return FECHAS_PRIMERAS.concat(resto);
    }

    function etiquetaDeFecha(valor) {
        if (valor === 'no' || valor === undefined || valor === null) {
            return 'Sin fecha';
        }
        const posicion = Number(valor);
        const hora = Math.floor(posicion / 2) || 12;
        return `A las ${hora}${posicion % 2 ? ':30' : ''}`;
    }

    /**
     * Si la pantalla tiene algo para elegir con la seleccion actual. Una
     * pantalla de color con un solo color, el bicolor de un bisel que no es
     * GMT o la fecha de un dial sin gemelo con ventana se saltan solas.
     */
    function pantallaVisible(pantallaId, seleccion) {
        const conf = PANTALLAS[pantallaId];
        if (!conf) {
            return false;
        }
        switch (conf.tipo) {
            case 'abajo': {
                const bisel = get(seleccion.bisel);
                return admiteBicolor(bisel) && coloresDe(grupoDe('bisel', bisel)).length > 1;
            }
            case 'fecha':
                return admiteFechador(seleccion.dial);
            case 'color':
                return coloresDe(grupoDe(conf.grupo, get(seleccion[conf.campo]))).length > 1;
            case 'indice-color':
                return coloresDe(grupoDeIndice(seleccion.indiceModelo)).length > 1;
            case 'indice-pos':
                return false;
            default:
                return true;
        }
    }

    /** Pantallas visibles, en orden, con su parte y su lugar dentro de ella. */
    function pantallasDe(seleccion) {
        const lista = [];
        catalogo().PASOS.forEach(function (parte, parteIndice) {
            const visibles = parte.pantallas.filter(function (pantalla) {
                return pantallaVisible(pantalla.id, seleccion);
            });
            visibles.forEach(function (pantalla, enParte) {
                lista.push({
                    id: pantalla.id,
                    pantalla: pantalla,
                    parte: parte,
                    parteIndice: parteIndice,
                    enParte: enParte,
                    totalEnParte: visibles.length
                });
            });
        });
        return lista;
    }

    /**
     * Opciones de una pantalla, como lista plana. Es la unica fuente que usan
     * el carrusel, las flechas, el menu y el tutorial: lo que se ve deslizando
     * y lo que se ve en el grid no pueden separarse.
     *
     * `tipo` le dice a la vista como dibujar la ficha: la pieza entera, una
     * muestra de color, la ventana de la fecha o el icono de la foto.
     */
    function opcionesDe(pantallaId, seleccion, extra) {
        const conf = PANTALLAS[pantallaId];
        if (!conf) {
            return [];
        }
        const nombres = catalogo();

        switch (conf.tipo) {
            case 'modelo': {
                // Cada modelo se ofrece en el color que ya estaba elegido si lo
                // tiene: cambiar de bisel no obliga a volver a buscar el azul.
                const activa = get(seleccion[conf.campo]);
                return modelosDe(conf.grupo).map(function (grupo) {
                    const pieza = (activa && activa.color
                        ? variantePorColor(grupo, activa.color.nombre)
                        : null) || grupo.piezas[0];
                    return {
                        valor: String(pieza.id),
                        etiqueta: nombres.nombrarModelo(grupo),
                        tipo: 'pieza',
                        pieza: pieza,
                        modelo: grupo.modelo
                    };
                });
            }
            case 'color': {
                const grupo = grupoDe(conf.grupo, get(seleccion[conf.campo]));
                return coloresDe(grupo).map(function (pieza) {
                    return { valor: String(pieza.id), etiqueta: nombreDeColor(pieza), tipo: 'color', pieza: pieza };
                });
            }
            case 'abajo': {
                const arriba = get(seleccion.bisel);
                if (!arriba) {
                    return [];
                }
                const otros = coloresDe(grupoDe('bisel', arriba)).filter(function (pieza) {
                    return pieza.id !== arriba.id;
                }).map(function (pieza) {
                    return { valor: String(pieza.id), etiqueta: `Abajo ${nombreDeColor(pieza).toLowerCase()}`, tipo: 'color', pieza: pieza };
                });
                return [{ valor: 'igual', etiqueta: 'Todo de un color', tipo: 'pieza', pieza: arriba }].concat(otros);
            }
            case 'fecha':
                return [{ valor: 'no', etiqueta: 'Sin fecha', tipo: 'fecha', angulo: null }].concat(
                    ordenDeFechas().map(function (posicion) {
                        return {
                            valor: String(posicion),
                            etiqueta: etiquetaDeFecha(posicion),
                            tipo: 'fecha',
                            angulo: anguloDeFecha(posicion)
                        };
                    })
                );
            case 'indice-modelo':
                return modelosDe('indice').map(function (grupo) {
                    const acabados = coloresDe(grupo).map(function (pieza) {
                        return pieza.acabado;
                    });
                    const acabado = acabados.indexOf(seleccion.indiceAcabado) >= 0 ? seleccion.indiceAcabado : acabados[0];
                    const juego = juegoDeIndices(grupo.modelo, acabado);
                    return {
                        valor: `${grupo.modelo}|${acabado}`,
                        etiqueta: nombres.nombrarModelo(grupo),
                        tipo: 'pieza',
                        // El glifo de las 12 es el que mejor representa al juego.
                        pieza: juego ? get(juego.glifos[POSICIONES - 1]) : grupo.piezas[0]
                    };
                }).filter(function (opcion) {
                    return !!opcion.pieza;
                });
            case 'indice-color': {
                const grupo = grupoDeIndice(seleccion.indiceModelo);
                return coloresDe(grupo).map(function (pieza) {
                    return { valor: `${grupo.modelo}|${pieza.acabado}`, etiqueta: nombres.acabadoLabel(pieza), tipo: 'color', pieza: pieza };
                });
            }
            case 'indice-pos': {
                const posicion = extra && typeof extra.posicion === 'number' ? extra.posicion : POSICIONES - 1;
                return glifosParaPosicion(posicion).map(function (pieza) {
                    const doble = pieza.variante === 'doble' ? ' doble' : '';
                    return {
                        valor: String(pieza.id),
                        etiqueta: `${nombres.MODELOS[pieza.modelo] || pieza.modelo}${doble} · ${nombres.acabadoLabel(pieza)}`,
                        tipo: 'pieza',
                        pieza: pieza
                    };
                });
            }
            case 'foto':
                return [
                    { valor: 'no', etiqueta: 'Sin foto', tipo: 'foto' },
                    { valor: 'si', etiqueta: 'Con mi foto', tipo: 'foto' }
                ];
            default:
                return [];
        }
    }

    /** Posicion de la opcion elegida dentro de `opciones`. */
    function indiceActual(pantallaId, seleccion, opciones, extra) {
        const conf = PANTALLAS[pantallaId];
        if (!conf || !opciones.length) {
            return 0;
        }
        let buscado = null;
        switch (conf.tipo) {
            case 'modelo': {
                const activa = get(seleccion[conf.campo]);
                const encontrado = activa
                    ? opciones.findIndex(function (opcion) {
                        return opcion.modelo === activa.modelo;
                    })
                    : 0;
                return Math.max(0, encontrado);
            }
            case 'color':
                buscado = String(seleccion[conf.campo]);
                break;
            case 'abajo':
                buscado = seleccion.biselAbajo && seleccion.biselAbajo !== seleccion.bisel
                    ? String(seleccion.biselAbajo)
                    : 'igual';
                break;
            case 'fecha':
                buscado = String(seleccion.fechador === undefined || seleccion.fechador === null ? 'no' : seleccion.fechador);
                break;
            case 'indice-modelo': {
                const prefijo = `${seleccion.indiceModelo}|`;
                return Math.max(0, opciones.findIndex(function (opcion) {
                    return opcion.valor.indexOf(prefijo) === 0;
                }));
            }
            case 'indice-color':
                buscado = `${seleccion.indiceModelo}|${seleccion.indiceAcabado}`;
                break;
            case 'indice-pos': {
                const posicion = extra && typeof extra.posicion === 'number' ? extra.posicion : POSICIONES - 1;
                buscado = String((seleccion.indices || {})[posicion]);
                break;
            }
            case 'foto':
                buscado = seleccion.usarFoto ? 'si' : 'no';
                break;
            default:
                return 0;
        }
        return Math.max(0, opciones.findIndex(function (opcion) {
            return opcion.valor === buscado;
        }));
    }

    /**
     * Deja la seleccion coherente despues de un cambio: el bicolor solo cierra
     * entre variantes del mismo bisel GMT, y la fecha solo existe si el dial
     * tiene gemelo con ventana.
     */
    function normalizar(seleccion) {
        const arriba = get(seleccion.bisel);
        const abajo = get(seleccion.biselAbajo);
        if (abajo && admiteBicolor(arriba)) {
            if (abajo.modelo !== arriba.modelo) {
                // GMT a GMT fina: se conserva el color de la mitad de abajo.
                const equivalente = variantePorColor(grupoDe('bisel', arriba), nombreDeColor(abajo));
                seleccion.biselAbajo = equivalente && equivalente.id !== arriba.id ? equivalente.id : null;
            } else if (abajo.id === arriba.id) {
                seleccion.biselAbajo = null;
            }
        } else {
            seleccion.biselAbajo = null;
        }

        if (!admiteFechador(seleccion.dial)) {
            seleccion.fechador = 'no';
        }
        return seleccion;
    }

    /** Aplica una opcion y devuelve una seleccion nueva. */
    function aplicar(pantallaId, seleccion, valor, extra) {
        const conf = PANTALLAS[pantallaId];
        const nueva = Object.assign({}, seleccion);
        if (!conf) {
            return nueva;
        }

        switch (conf.tipo) {
            case 'modelo':
            case 'color': {
                const pieza = get(valor);
                if (!pieza) {
                    return nueva;
                }
                nueva[conf.campo] = pieza.id;
                if (conf.campo === 'hora') {
                    nueva.minuto = pieza.id;
                }
                break;
            }
            case 'abajo':
                nueva.biselAbajo = valor === 'igual' ? null : Number(valor);
                break;
            case 'fecha':
                nueva.fechador = valor === 'no' ? 'no' : Number(valor);
                break;
            case 'indice-modelo':
            case 'indice-color': {
                const partes = String(valor).split('|');
                const juego = juegoDeIndices(partes[0], partes[1]);
                if (juego) {
                    nueva.indiceModelo = juego.modelo;
                    nueva.indiceAcabado = juego.acabado;
                    nueva.indiceJuego = juego.glifos[0];
                    nueva.indices = mapaDeIndices(juego);
                }
                break;
            }
            case 'indice-pos': {
                const posicion = extra && typeof extra.posicion === 'number' ? extra.posicion : POSICIONES - 1;
                nueva.indices = Object.assign({}, nueva.indices);
                nueva.indices[posicion] = Number(valor);
                break;
            }
            case 'foto':
                nueva.usarFoto = valor === 'si';
                break;
            default:
                break;
        }
        return normalizar(nueva);
    }

    App.models.relojes = {
        POSICIONES_FECHA,
        admiteBicolor,
        admiteFechador,
        anguloDeFecha,
        aplicar,
        capasDe,
        etiquetaDeFecha,
        indiceActual,
        nombreDeColor,
        opcionesDe,
        pantallasDe,
        tipoDe,
        centrosDeIndices,
        coloresDe,
        dialEfectivo,
        get,
        glifosParaPosicion,
        grupoDe,
        juegoDeIndices,
        juegosDeIndices,
        load,
        mapaDeIndices,
        modelosDe,
        porCategoria,
        posicionMasCercana,
        posicionOcupadaPorFecha,
        renderizar,
        seleccionInicial,
        variantePorColor
    };
})(window.PerfSuarez);
