(function (App) {
    App.data = App.data || {};

    App.data.relojes = {
        categorias: [
            { id: 'diales', label: 'Diales', visualLayer: true },
            { id: 'manecillas', label: 'Manecillas', visualLayer: true },
            { id: 'cajas', label: 'Cajas', visualLayer: true },
            { id: 'brazaletes', label: 'Brazaletes', visualLayer: true }
        ],
        piezas: [
            {
                sku: 'DIA-001',
                nombre: 'Negro Sunburst',
                categoria: 'diales',
                imagen: 'imagenes/fotos-relojes/diales/dia-001.png',
                disponible: true
            },
            {
                sku: 'DIA-002',
                nombre: 'Blanco Polar',
                categoria: 'diales',
                imagen: 'imagenes/fotos-relojes/diales/dia-002.png',
                disponible: true
            },
            {
                sku: 'MAN-001',
                nombre: 'Royal Plata',
                categoria: 'manecillas',
                imagen: 'imagenes/fotos-relojes/manecillas/man-001.png',
                disponible: true
            },
            {
                sku: 'MAN-002',
                nombre: 'Skeleton Dorado',
                categoria: 'manecillas',
                imagen: 'imagenes/fotos-relojes/manecillas/man-002.png',
                disponible: true
            },
            {
                sku: 'CAJ-001',
                nombre: 'Acero 40mm',
                categoria: 'cajas',
                tamanoMm: 40,
                layout: {
                    caseScale: 0.70,
                    braceletScale: 0.76,
                    dialScale: 1.08,
                    handsScale: 0.88,
                    logoScale: 0.54
                },
                imagen: 'imagenes/fotos-relojes/cajas/caj-001.png',
                disponible: true
            },
            {
                sku: 'CAJ-002',
                nombre: 'Acero 42mm DLC',
                categoria: 'cajas',
                tamanoMm: 42,
                layout: {
                    caseScale: 0.78,
                    braceletScale: 0.84,
                    dialScale: 1.18,
                    handsScale: 0.96,
                    logoScale: 0.60
                },
                imagen: 'imagenes/fotos-relojes/cajas/caj-002.png',
                disponible: true
            },
            {
                sku: 'BRZ-001',
                nombre: 'Acero Milanese',
                categoria: 'brazaletes',
                imagen: 'imagenes/fotos-relojes/brazaletes/brz-001.png',
                disponible: true
            },
            {
                sku: 'BRZ-002',
                nombre: 'Cuero Marrón',
                categoria: 'brazaletes',
                imagen: 'imagenes/fotos-relojes/brazaletes/brz-002.png',
                disponible: true
            },
            {
                sku: 'BRZ-003',
                nombre: 'NATO Negro',
                categoria: 'brazaletes',
                imagen: 'imagenes/fotos-relojes/brazaletes/brz-003.png',
                disponible: true
            }
        ]
    };
})(window.PerfSuarez);
