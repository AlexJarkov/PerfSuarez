(function (App) {
    App.data = App.data || {};

    App.data.relojes = {
        categorias: [
            { id: 'movimientos', label: 'Movimientos', visualLayer: false },
            { id: 'diales', label: 'Diales', visualLayer: true },
            { id: 'manecillas', label: 'Manecillas', visualLayer: true },
            { id: 'logos', label: 'Logos', visualLayer: true },
            { id: 'cajas', label: 'Cajas', visualLayer: true },
            { id: 'brazaletes', label: 'Brazaletes', visualLayer: true }
        ],
        piezas: [
            {
                sku: 'MOV-001',
                nombre: 'Miyota 8215',
                categoria: 'movimientos',
                precio: 35.00,
                imagen: null,
                disponible: true
            },
            {
                sku: 'MOV-002',
                nombre: 'NH35A Seiko',
                categoria: 'movimientos',
                precio: 45.00,
                imagen: null,
                disponible: true
            },
            {
                sku: 'MOV-003',
                nombre: 'ETA 2824-2',
                categoria: 'movimientos',
                precio: 80.00,
                imagen: null,
                disponible: false
            },
            {
                sku: 'DIA-001',
                nombre: 'Negro Sunburst',
                categoria: 'diales',
                precio: 40.00,
                imagen: 'imagenes/fotos-relojes/diales/dia-001.png',
                disponible: true
            },
            {
                sku: 'DIA-002',
                nombre: 'Blanco Polar',
                categoria: 'diales',
                precio: 40.00,
                imagen: 'imagenes/fotos-relojes/diales/dia-002.png',
                disponible: true
            },
            {
                sku: 'MAN-001',
                nombre: 'Royal Plata',
                categoria: 'manecillas',
                precio: 18.00,
                imagen: 'imagenes/fotos-relojes/manecillas/man-001.png',
                disponible: true
            },
            {
                sku: 'MAN-002',
                nombre: 'Skeleton Dorado',
                categoria: 'manecillas',
                precio: 22.00,
                imagen: 'imagenes/fotos-relojes/manecillas/man-002.png',
                disponible: true
            },
            {
                sku: 'LOG-001',
                nombre: 'Niquelado',
                categoria: 'logos',
                precio: 12.00,
                imagen: 'imagenes/fotos-relojes/logos/log-001.png',
                disponible: true
            },
            {
                sku: 'LOG-002',
                nombre: 'Impreso',
                categoria: 'logos',
                precio: 8.00,
                imagen: 'imagenes/fotos-relojes/logos/log-002.png',
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
                precio: 110.00,
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
                precio: 130.00,
                imagen: 'imagenes/fotos-relojes/cajas/caj-002.png',
                disponible: true
            },
            {
                sku: 'BRZ-001',
                nombre: 'Acero Milanese',
                categoria: 'brazaletes',
                precio: 55.00,
                imagen: 'imagenes/fotos-relojes/brazaletes/brz-001.png',
                disponible: true
            },
            {
                sku: 'BRZ-002',
                nombre: 'Cuero Marrón',
                categoria: 'brazaletes',
                precio: 38.00,
                imagen: 'imagenes/fotos-relojes/brazaletes/brz-002.png',
                disponible: true
            },
            {
                sku: 'BRZ-003',
                nombre: 'NATO Negro',
                categoria: 'brazaletes',
                precio: 25.00,
                imagen: 'imagenes/fotos-relojes/brazaletes/brz-003.png',
                disponible: true
            }
        ]
    };
})(window.PerfSuarez);
