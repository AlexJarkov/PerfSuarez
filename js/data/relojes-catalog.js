(function (App) {
    App.data = App.data || {};

    // Precio unico del reloj armado, independiente de las piezas elegidas.
    const PRECIO_USD = 500;

    // Las cajas 4 a 12 traen su propio bisel dibujado. Se marcan para poder
    // avisarlo en la UI y arrancar con un bisel equivalente preseleccionado.
    const CAJAS_CON_BISEL_INTEGRADO = [4, 5, 6, 7, 8, 9, 10, 11, 12];

    const ACABADOS = {
        oro: 'Oro',
        plata: 'Plata',
        gunmetal: 'Gunmetal',
        rojo: 'Rojo'
    };

    // Nombre visible de cada modelo. Los assets vienen numerados y sin nombre,
    // asi que el nombre sale de la revision visual de las hojas de contacto que
    // deja `scripts/medir-piezas-reloj.py`.
    const MODELOS = {
        'caja-01': 'Clásica',
        'caja-02': 'Buceo',
        'caja-03': 'GMT',
        'caja-04': 'Estriada',
        'caja-05': 'Lisa',

        'bisel-01': 'GMT 24h',
        'bisel-02': 'GMT 24h fina',
        'bisel-03': 'Buceo 60 min',
        'bisel-04': 'Taquímetro',
        'bisel-05': 'Pulido',
        'bisel-06': 'Moleteado',
        'bisel-07': 'Estriado fino',
        'bisel-08': 'Buceo marcado',

        'dial-01': 'Sol radial',
        'dial-02': 'Calado',
        'dial-03': 'Nácar',
        'dial-04': 'Waffle',

        'correa-01': 'Cuero liso',
        'correa-02': 'Cuero texturizado',
        'brazalete-01': 'Brazalete eslabón ancho',
        'brazalete-02': 'Brazalete tejido',
        'brazalete-03': 'Brazalete plano',

        'indice-arabigo': 'Números arábigos',
        'indice-romano': 'Números romanos',
        'indice-indico': 'Números índicos',
        'indice-barra-solida': 'Barras',
        'indice-barra-marco': 'Barras con marco'
    };

    // Broches y coronas quedaron fuera de la seleccion por decision interna
    // (Ago 2026). Los assets siguen generados en imagenes/relojes/ por si vuelven.

    /**
     * Siete partes, cada una partida en pantallas de UNA sola decision.
     *
     * La version anterior mezclaba en cada paso un grid de modelos, una barra
     * de colores y alternadores: en la prueba con un usuario sin experiencia no
     * se entendio por donde empezar. Ahora cada pantalla es una lista que se
     * recorre deslizando sobre el reloj, y nada mas.
     *
     * `pregunta` es lo que se lee arriba: frases cortas, como hablando.
     */
    const PASOS = [
        {
            id: 'caja',
            label: 'Caja',
            pantallas: [
                { id: 'caja-modelo', label: 'Forma', pregunta: '¿Qué forma de reloj te gusta?' },
                { id: 'caja-color', label: 'Color', pregunta: '¿De qué color querés la caja?' }
            ]
        },
        {
            id: 'bisel',
            label: 'Bisel',
            pantallas: [
                { id: 'bisel-modelo', label: 'Modelo', pregunta: '¿Qué aro querés alrededor?' },
                { id: 'bisel-color', label: 'Color', pregunta: '¿De qué color querés el aro?' },
                { id: 'bisel-abajo', label: 'Dos colores', pregunta: '¿Querés la mitad de abajo de otro color?' }
            ]
        },
        {
            id: 'dial',
            label: 'Esfera',
            pantallas: [
                { id: 'dial-modelo', label: 'Textura', pregunta: '¿Qué fondo querés para la esfera?' },
                { id: 'dial-color', label: 'Color', pregunta: '¿De qué color querés la esfera?' },
                { id: 'dial-fecha', label: 'Fecha', pregunta: '¿Querés que muestre la fecha? ¿Dónde?' }
            ]
        },
        {
            id: 'indice',
            label: 'Números',
            pantallas: [
                { id: 'indice-modelo', label: 'Estilo', pregunta: '¿Números o marcas para las horas?' },
                { id: 'indice-color', label: 'Color', pregunta: '¿De qué color los números?' }
            ]
        },
        {
            id: 'aguja',
            label: 'Agujas',
            pantallas: [
                { id: 'aguja-modelo', label: 'Agujas', pregunta: '¿Qué agujas te gustan?' },
                { id: 'aguja-color', label: 'Color', pregunta: '¿De qué color las agujas?' },
                { id: 'segundero-modelo', label: 'Segundero', pregunta: '¿Qué aguja fina para los segundos?' },
                { id: 'segundero-color', label: 'Color', pregunta: '¿De qué color el segundero?' }
            ]
        },
        {
            id: 'correa',
            label: 'Correa',
            pantallas: [
                { id: 'correa-modelo', label: 'Modelo', pregunta: '¿Cuero o metal?' },
                { id: 'correa-color', label: 'Color', pregunta: '¿De qué color la correa?' }
            ]
        },
        {
            id: 'foto',
            label: 'Foto',
            pantallas: [
                { id: 'foto', label: 'Foto', pregunta: '¿Querés una foto tuya en la esfera?' }
            ]
        }
    ];

    function titleCase(value) {
        const text = String(value || '').replace(/-/g, ' ');
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    function acabadoLabel(pieza) {
        return ACABADOS[pieza.acabado] || titleCase(pieza.acabado);
    }

    /** Nombre del diseno, sin el color. */
    function nombrarModelo(grupo) {
        if (!grupo) {
            return '';
        }
        return MODELOS[grupo.modelo] || titleCase(grupo.modelo);
    }

    /** Nombre completo de una pieza: diseno + color. */
    function nombrarPieza(pieza) {
        if (!pieza) {
            return '';
        }
        const modelo = MODELOS[pieza.modelo] || titleCase(pieza.modelo);
        const color = pieza.color ? pieza.color.nombre : acabadoLabel(pieza);
        return `${modelo} · ${color}`;
    }

    App.data.relojes = {
        PRECIO_USD,
        MONEDA: 'US$',
        CAJAS_CON_BISEL_INTEGRADO,
        ACABADOS,
        MODELOS,
        PASOS,
        acabadoLabel,
        nombrarModelo,
        nombrarPieza
    };
})(window.PerfSuarez);
