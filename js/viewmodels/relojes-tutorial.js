(function (App) {
    /**
     * Tutorial interactivo de Suarez Watches.
     *
     * No son diapositivas: cada paso pide HACER el gesto (deslizar, tocar la
     * flecha, tocar Siguiente) y solo avanza cuando el configurador avisa que
     * paso. Quien no sabe usar un celular no aprende leyendo, aprende haciendo.
     *
     * Mientras corre, `data-tuto-permite` en el builder dice que acciones valen
     * (ver `permitido()` en relojes.viewmodel.js), asi un toque en otro lado no
     * cambia nada ni desordena el paso.
     */
    const CLAVE = 'perfsuarez:reloj:tutorial';
    const PAUSA_EXITO_MS = 1000;

    const builder = document.getElementById('watch-builder');
    if (!builder) {
        return;
    }
    const escritorio = window.matchMedia('(min-width: 900px)');

    const PASOS = [
        {
            texto: '¡Hola! Vamos a armar tu reloj',
            detalle: 'Son 7 pasos cortos. Primero te muestro cómo se usa, es muy fácil.',
            boton: 'Empezar'
        },
        {
            foco: '#watch-stage',
            texto: 'Pasá el dedo sobre el reloj hacia un costado',
            detalle: 'Así cambiás la pieza. ¡Probalo ahora!',
            mano: 'deslizar',
            permite: 'arrastre',
            espera: 'arrastre-fin',
            condicion: function (detalle) {
                return detalle.cambio;
            },
            exito: '¡Muy bien! Cambiaste la pieza'
        },
        {
            foco: '#watch-arrow-next',
            redondo: true,
            texto: 'También podés tocar las flechas',
            detalle: 'Tocá esta flecha para ver otra opción.',
            mano: 'tocar',
            permite: 'flechas elegir',
            espera: 'flecha',
            exito: '¡Perfecto!'
        },
        {
            foco: '#watch-head',
            texto: 'Acá arriba ves en qué paso vas',
            detalle: 'Y la pregunta de cada paso, para que sepas qué estás eligiendo.',
            boton: 'Entendido'
        },
        {
            foco: '#watch-next',
            texto: 'Cuando te guste, tocá Siguiente',
            detalle: 'Así pasás a la próxima pieza. Si te arrepentís, tocá Atrás.',
            mano: 'tocar',
            permite: 'siguiente',
            espera: 'pantalla',
            exito: '¡Eso es!',
            omitir: function () {
                return document.getElementById('watch-next')?.classList.contains('is-final');
            }
        },
        {
            foco: '#watch-stage',
            texto: 'Tocá el reloj para ver todas las opciones juntas',
            detalle: 'Es otra forma de elegir, en una lista.',
            mano: 'tocar',
            permite: 'menu',
            espera: 'menu-abierto',
            soloMovil: true
        },
        {
            foco: '#watch-stage',
            texto: 'Tocá el reloj otra vez para cerrar la lista',
            mano: 'tocar',
            permite: 'menu',
            espera: 'menu-cerrado',
            soloMovil: true,
            exito: '¡Muy bien!'
        },
        {
            foco: '#watch-help',
            redondo: true,
            texto: '¡Listo! Ya sabés usarlo',
            detalle: 'Si te olvidás, tocá este botón con el signo de pregunta y te lo muestro de nuevo.',
            boton: 'Armar mi reloj'
        }
    ];

    let activo = null;

    function yaVisto() {
        try {
            return localStorage.getItem(CLAVE) === '1';
        } catch (error) {
            return false;
        }
    }

    function marcarVisto() {
        try {
            localStorage.setItem(CLAVE, '1');
        } catch (error) {
            // Sin almacenamiento el tutorial vuelve a aparecer: mejor que nunca.
        }
    }

    function crearOverlay() {
        const nodo = document.createElement('div');
        nodo.className = 'watch-tuto';
        nodo.setAttribute('role', 'dialog');
        nodo.setAttribute('aria-label', 'Cómo se usa');
        nodo.innerHTML = ''
            + '<div class="watch-tuto__foco"></div>'
            + '<span class="watch-tuto__mano" aria-hidden="true">👆</span>'
            + '<div class="watch-tuto__card" aria-live="polite">'
            +   '<p class="watch-tuto__cuenta"></p>'
            +   '<p class="watch-tuto__texto"></p>'
            +   '<p class="watch-tuto__detalle"></p>'
            +   '<div class="watch-tuto__acciones">'
            +     '<button type="button" class="watch-btn watch-btn--ghost" data-tuto="saltar">Saltar</button>'
            +     '<button type="button" class="watch-btn watch-btn--solid" data-tuto="seguir"></button>'
            +   '</div>'
            + '</div>';
        nodo.addEventListener('click', function (event) {
            const boton = event.target.closest('[data-tuto]');
            if (!boton) {
                return;
            }
            if (boton.dataset.tuto === 'saltar') {
                terminar();
            } else {
                avanzar();
            }
        });
        document.body.appendChild(nodo);
        return {
            raiz: nodo,
            foco: nodo.querySelector('.watch-tuto__foco'),
            mano: nodo.querySelector('.watch-tuto__mano'),
            card: nodo.querySelector('.watch-tuto__card'),
            cuenta: nodo.querySelector('.watch-tuto__cuenta'),
            texto: nodo.querySelector('.watch-tuto__texto'),
            detalle: nodo.querySelector('.watch-tuto__detalle'),
            saltar: nodo.querySelector('[data-tuto="saltar"]'),
            seguir: nodo.querySelector('[data-tuto="seguir"]')
        };
    }

    function iniciar() {
        if (activo) {
            return;
        }
        App.viewmodels.relojes?.control?.prepararTutorial();
        activo = {
            lista: PASOS.filter(function (paso) {
                return !(paso.soloMovil && escritorio.matches);
            }),
            indice: -1,
            paso: null,
            nodos: crearOverlay(),
            espera: null,
            temporizador: null,
            cuadro: null
        };
        builder.dataset.tutoPermite = '';
        builder.dispatchEvent(new CustomEvent('reloj:tutorial-inicio'));
        seguirPosicion();
        avanzar();
    }

    function avanzar() {
        if (!activo) {
            return;
        }
        quitarEspera();
        clearTimeout(activo.temporizador);
        activo.indice += 1;
        while (activo.indice < activo.lista.length && activo.lista[activo.indice].omitir?.()) {
            activo.indice += 1;
        }
        if (activo.indice >= activo.lista.length) {
            terminar();
            return;
        }
        mostrar(activo.lista[activo.indice]);
    }

    function mostrar(paso) {
        const nodos = activo.nodos;
        activo.paso = paso;

        nodos.card.classList.remove('is-exito');
        nodos.cuenta.textContent = `${activo.indice + 1} de ${activo.lista.length}`;
        nodos.texto.textContent = paso.texto;
        nodos.detalle.textContent = paso.detalle || '';
        nodos.detalle.hidden = !paso.detalle;
        nodos.seguir.hidden = !paso.boton;
        nodos.seguir.textContent = paso.boton || '';
        nodos.saltar.hidden = activo.indice === activo.lista.length - 1;
        nodos.mano.hidden = !paso.mano;
        nodos.mano.className = `watch-tuto__mano${paso.mano ? ` is-${paso.mano}` : ''}`;
        nodos.raiz.classList.toggle('is-sin-foco', !paso.foco);

        builder.dataset.tutoPermite = paso.permite || '';

        if (paso.espera) {
            const oyente = function (event) {
                if (paso.condicion && !paso.condicion(event.detail || {})) {
                    return;
                }
                quitarEspera();
                festejar(paso);
            };
            builder.addEventListener(`reloj:${paso.espera}`, oyente);
            activo.espera = { tipo: paso.espera, oyente: oyente };
        }
    }

    function quitarEspera() {
        if (activo && activo.espera) {
            builder.removeEventListener(`reloj:${activo.espera.tipo}`, activo.espera.oyente);
            activo.espera = null;
        }
    }

    /** Confirma que salio bien antes de pasar al siguiente: refuerza lo aprendido. */
    function festejar(paso) {
        builder.dataset.tutoPermite = '';
        const nodos = activo.nodos;
        nodos.card.classList.add('is-exito');
        nodos.texto.textContent = paso.exito || '¡Muy bien!';
        nodos.detalle.hidden = true;
        nodos.mano.hidden = true;
        clearTimeout(activo.temporizador);
        activo.temporizador = setTimeout(avanzar, PAUSA_EXITO_MS);
    }

    function terminar() {
        if (!activo) {
            return;
        }
        quitarEspera();
        clearTimeout(activo.temporizador);
        cancelAnimationFrame(activo.cuadro);
        activo.nodos.raiz.remove();
        activo = null;
        delete builder.dataset.tutoPermite;
        marcarVisto();
        builder.dispatchEvent(new CustomEvent('reloj:tutorial-fin'));
    }

    /**
     * El foco sigue a su objetivo en cada cuadro: el menu se abre con
     * animacion y el reloj cambia de tamano, asi que medir una sola vez deja
     * el recorte corrido.
     */
    function seguirPosicion() {
        if (!activo) {
            return;
        }
        if (activo.paso) {
            ubicar(activo.paso);
        }
        activo.cuadro = requestAnimationFrame(seguirPosicion);
    }

    function ubicar(paso) {
        const nodos = activo.nodos;
        const alto = window.innerHeight;
        const altoCard = nodos.card.offsetHeight;
        const objetivo = paso.foco ? document.querySelector(paso.foco) : null;

        if (!objetivo) {
            nodos.card.style.top = `${Math.max(16, (alto - altoCard) / 2)}px`;
            return;
        }

        const rect = objetivo.getBoundingClientRect();
        const margen = paso.redondo ? 6 : 4;
        nodos.foco.style.left = `${rect.left - margen}px`;
        nodos.foco.style.top = `${rect.top - margen}px`;
        nodos.foco.style.width = `${rect.width + margen * 2}px`;
        nodos.foco.style.height = `${rect.height + margen * 2}px`;
        nodos.foco.style.borderRadius = paso.redondo ? '50%' : '20px';

        nodos.mano.style.left = `${rect.left + rect.width / 2}px`;
        nodos.mano.style.top = `${rect.top + rect.height * (paso.mano === 'deslizar' ? 0.5 : 0.55)}px`;

        // La tarjeta va donde entre sin tapar el objetivo: abajo, arriba o, si
        // el objetivo ocupa casi todo (el reloj), pegada al borde inferior.
        const abajo = rect.bottom + margen + 12;
        const arriba = rect.top - margen - 12 - altoCard;
        let top;
        if (abajo + altoCard <= alto - 12) {
            top = abajo;
        } else if (arriba >= 12) {
            top = arriba;
        } else {
            top = Math.max(12, alto - altoCard - 12);
        }
        nodos.card.style.top = `${top}px`;
    }

    builder.addEventListener('reloj:listo', function () {
        if (!yaVisto()) {
            setTimeout(iniciar, 450);
        }
    });

    document.getElementById('watch-help')?.addEventListener('click', iniciar);

    App.relojesTutorial = { iniciar: iniciar, terminar: terminar };
})(window.PerfSuarez);
