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

    // Etiquetas de las posiciones de fechador. Los diales 289-306 ya traen la
    // ventana dibujada, asi que elegir fechador es elegir otra variante del
    // mismo dial: no todas estan disponibles para todos los colores.
    const FECHADORES = {
        no: 'Sin fechador',
        '3': 'A las 3',
        '430': 'A las 4:30',
        '6': 'A las 6'
    };

    // Broches y coronas quedaron fuera de la seleccion por decision interna
    // (Ago 2026). Los assets siguen generados en imagenes/relojes/ por si vuelven.

    const PASOS = [
        {
            id: 'caja',
            label: 'Caja',
            titulo: 'Elegí la caja',
            descripcion: 'Define el tamaño, el perfil y el acabado del reloj.'
        },
        {
            id: 'bisel',
            label: 'Bisel',
            titulo: 'Elegí el bisel',
            descripcion: 'El anillo que rodea la esfera. Se monta sobre la caja.'
        },
        {
            id: 'dial',
            label: 'Dial',
            titulo: 'Elegí el dial',
            descripcion: 'La esfera del reloj: color, textura y acabado.'
        },
        {
            id: 'indice',
            label: 'Índices',
            titulo: 'Elegí los índices',
            descripcion: 'Los doce marcadores de hora sobre la esfera.'
        },
        {
            id: 'aguja',
            label: 'Agujas',
            titulo: 'Elegí las agujas',
            descripcion: 'Horas, minutos y segundero se eligen por separado.'
        },
        {
            id: 'correa',
            label: 'Correa',
            titulo: 'Elegí la correa',
            descripcion: 'Cuero o brazalete metálico.'
        },
        {
            id: 'detalles',
            label: 'Detalles',
            titulo: 'Últimos detalles',
            descripcion: 'Fechador y foto personalizada en la esfera.'
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
        FECHADORES,
        MODELOS,
        PASOS,
        acabadoLabel,
        nombrarModelo,
        nombrarPieza
    };
})(window.PerfSuarez);
