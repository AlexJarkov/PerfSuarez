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

    const FAMILIAS_INDICE = {
        arabigo: 'Números arábigos',
        romano: 'Números romanos',
        indico: 'Números índicos',
        barra: 'Barras'
    };

    const FAMILIAS_CORREA = {
        'cuero-liso': 'Cuero liso',
        'cuero-textura': 'Cuero texturizado'
    };

    // Broches y coronas quedaron fuera de la seleccion por decision interna
    // (Ago 2026). Los assets siguen generados en imagenes/relojes/ por si vuelven.

    // Orden de armado. `capa` es false cuando el paso no dibuja nada sobre el
    // reloj (la corona ya viene dibujada de perfil en cada caja).
    const PASOS = [
        {
            id: 'caja',
            label: 'Caja',
            titulo: 'Elegí la caja',
            descripcion: 'Define el tamaño, el perfil y el acabado del reloj.',
            capa: true
        },
        {
            id: 'bisel',
            label: 'Bisel',
            titulo: 'Elegí el bisel',
            descripcion: 'El anillo que rodea la esfera. Se monta sobre la caja.',
            capa: true
        },
        {
            id: 'dial',
            label: 'Dial',
            titulo: 'Elegí el dial',
            descripcion: 'La esfera del reloj: color, textura y acabado.',
            capa: true
        },
        {
            id: 'indice',
            label: 'Índices',
            titulo: 'Elegí los índices',
            descripcion: 'Los doce marcadores de hora sobre la esfera.',
            capa: true
        },
        {
            id: 'aguja',
            label: 'Agujas',
            titulo: 'Elegí las agujas',
            descripcion: 'Un diseño para horas y minutos, otro para el segundero.',
            capa: true
        },
        {
            id: 'correa',
            label: 'Correa',
            titulo: 'Elegí la correa',
            descripcion: 'Cuero o brazalete metálico.',
            capa: true
        }
    ];

    function titleCase(value) {
        const text = String(value || '').replace(/-/g, ' ');
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    function acabadoLabel(pieza) {
        return ACABADOS[pieza.acabado] || titleCase(pieza.acabado);
    }

    // Nombre visible de cada pieza. Los assets vienen numerados y sin nombre,
    // asi que se arma con la familia, el acabado y un correlativo por grupo.
    function nombrarPieza(pieza, ordinal) {
        switch (pieza.categoria) {
            case 'caja':
                return `Caja ${acabadoLabel(pieza)} ${ordinal}`;
            case 'bisel':
                return `Bisel ${acabadoLabel(pieza)} ${ordinal}`;
            case 'dial':
                return `Dial ${ordinal}`;
            case 'indice':
                return `${FAMILIAS_INDICE[pieza.familia] || titleCase(pieza.familia)} · ${acabadoLabel(pieza)}`;
            case 'aguja':
                return `Aguja ${acabadoLabel(pieza)} ${ordinal}`;
            case 'correa':
                return `${FAMILIAS_CORREA[pieza.familia] || titleCase(pieza.familia)} ${ordinal}`;
            case 'brazalete':
                return `Brazalete ${acabadoLabel(pieza)} ${ordinal}`;
            default:
                return `Pieza ${pieza.id}`;
        }
    }

    App.data.relojes = {
        PRECIO_USD,
        MONEDA: 'US$',
        CAJAS_CON_BISEL_INTEGRADO,
        ACABADOS,
        FAMILIAS_INDICE,
        FAMILIAS_CORREA,
        PASOS,
        acabadoLabel,
        nombrarPieza
    };
})(window.PerfSuarez);
