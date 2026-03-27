(function (App) {
    const MONEDA_LOCAL = 'Bs';
    const PRECIO_REGEX = /(\d+)ml.*?(\d+\.?\d*)Bs/i;

    function parseComboConfig(content) {
        const result = {};
        if (!content) {
            return result;
        }

        const lines = content.replace(/\r\n?/g, '\n').split('\n').filter(line => line.trim().length > 0);
        if (!lines.length) {
            return result;
        }

        const headers = lines.shift().replace(/^\ufeff/, '').split(';').map(header => header.trim());

        lines.forEach(line => {
            const values = line.split(';');
            const record = {};

            headers.forEach((header, index) => {
                record[header] = (values[index] || '').trim();
            });

            const name = record.Nombre;
            if (!name) {
                return;
            }

            const entry = result[name] || { tamanos: {}, precioPorDefecto: null };

            [1, 2].forEach(idx => {
                const approved = (record[`Aprobado${idx}`] || '').toUpperCase() === 'APROBADO';
                const ml = record[`ML${idx}`];
                const priceText = (record[`Precio${idx}`] || '').replace(',', '.');
                if (!approved) {
                    return;
                }

                const price = parseFloat(priceText);
                if (Number.isNaN(price)) {
                    return;
                }

                if (ml) {
                    const size = parseInt(ml, 10);
                    if (!Number.isNaN(size)) {
                        entry.tamanos[size] = price;
                    }
                } else if (entry.precioPorDefecto === null) {
                    entry.precioPorDefecto = price;
                }
            });

            if (Object.keys(entry.tamanos).length > 0 || entry.precioPorDefecto !== null) {
                result[name] = entry;
            }
        });

        return result;
    }

    function readPriceData(paragraph) {
        if (!paragraph) {
            return null;
        }

        const text = paragraph.textContent.replace(/\s+/g, '');
        const match = text.match(PRECIO_REGEX);
        if (!match) {
            return null;
        }

        return {
            tamano: parseInt(match[1], 10),
            precio: parseFloat(match[2]),
            moneda: MONEDA_LOCAL
        };
    }

    function getComboPrice(config, name, size) {
        const entry = config[name];
        if (!entry) {
            return null;
        }

        if (typeof entry.tamanos?.[size] === 'number') {
            return entry.tamanos[size];
        }

        return typeof entry.precioPorDefecto === 'number' ? entry.precioPorDefecto : null;
    }

    async function fetchComboConfig(path) {
        const response = await fetch(path);
        const content = await response.text();
        return parseComboConfig(content);
    }

    async function fetchProducts(type, comboConfig) {
        const response = await fetch(`${type}.html`);
        const text = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');

        return Array.from(doc.querySelectorAll('.decant'))
            .filter(element => {
                const hasStock = !element.querySelector('.etiquetas .fuera-de-stock');
                if (!hasStock) {
                    return false;
                }

                if (type === 'perfumes' && !comboConfig[element.dataset.name]) {
                    return false;
                }

                return true;
            })
            .map(element => {
                const isPerfume = type === 'perfumes';
                const name = element.dataset.name;

                return {
                    tipo: type,
                    skuBase: isPerfume ? element.dataset.sku : null,
                    nombre: name,
                    imagen: element.querySelector('img')?.src || 'imagenes/image.webp',
                    precios: Array.from(element.querySelectorAll('p'))
                        .map(p => {
                            const data = readPriceData(p);
                            if (!data) {
                                return null;
                            }

                            const comboPrice = isPerfume ? getComboPrice(comboConfig, name, data.tamano) : null;
                            if (isPerfume && typeof comboPrice !== 'number') {
                                return null;
                            }

                            return {
                                sku: p.dataset.sku || 'DECANT',
                                tamano: data.tamano,
                                precio: data.precio,
                                moneda: data.moneda,
                                comboPrecio: comboPrice
                            };
                        })
                        .filter(Boolean)
                        .sort((a, b) => a.tamano - b.tamano)
                };
            })
            .filter(product => product.precios.length > 0);
    }

    App.models.combo = {
        fetchComboConfig,
        fetchProducts,
        parseComboConfig,
        getComboPrice,
        readPriceData,
        MONEDA_LOCAL
    };
})(window.PerfSuarez);
