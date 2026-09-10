/* Códigos de combo compartibles.
   Un combo vive solo en el DOM del armador, así que para poder compartirlo
   necesitamos expresarlo como texto corto: cada perfume se reduce a un token
   derivado de su id de catálogo, y el código lleva además el tipo y la cantidad.

   Formato:  SRZ-<T><N>-<token>.<ml>-<token>.<ml>...
     T  = C (perfumes completos, N siempre 3) | D (set de decants, N de 5 a 10)
     N  = cantidad de slots; tiene que coincidir con los slots que siguen
   Ejemplo: SRZ-C3-42wi6z.120-tykrv9.100-x3gpki.100

   Módulo puro: no toca el DOM ni conoce el estado del armador. */
(function (App) {
    'use strict';

    var PREFIX = 'SRZ';
    // Una ranura sin elegir. Sólo aparece en los borradores que se guardan en
    // caché: los códigos que se comparten siempre van completos.
    var EMPTY_SLOT = '_';
    var TOKEN_LENGTH = 6;
    // Reservado para desempatar colisiones (ver buildTokenMap).
    var LONG_TOKEN_LENGTH = 10;
    var TIPO_BY_LETTER = { C: 'perfumes', D: 'decants' };
    var LETTER_BY_TIPO = { perfumes: 'C', decants: 'D' };
    var DECANT_RANGE = { min: 5, max: 10 };
    var PERFUME_SLOTS = 3;

    // Mapas construidos una sola vez desde el catálogo completo.
    var tokenToId = {};
    var idToToken = {};

    /* FNV-1a de 32 bits. Elegido por ser corto, determinista y sin dependencias;
       no es criptográfico y no hace falta que lo sea. */
    function hashSlug(slug) {
        var hash = 0x811c9dc5;
        for (var i = 0; i < slug.length; i += 1) {
            hash ^= slug.charCodeAt(i) & 0xff;
            // Multiplicación por el primo FNV emulada en 32 bits sin desbordar.
            hash = (hash + ((hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24))) >>> 0;
        }
        return hash >>> 0;
    }

    /* Toma los últimos `length` dígitos en base36 (equivale a hash % 36^length),
       que se reparten de forma uniforme; quedarse con los primeros truncaría el
       dígito más significativo y concentraría los tokens. */
    function toToken(slug, length) {
        var base = hashSlug(slug).toString(36);
        if (length > base.length) {
            // Un segundo pase sobre el slug invertido alarga el token sin
            // perder determinismo, para los casos de colisión.
            base += hashSlug(slug.split('').reverse().join('')).toString(36);
        }
        while (base.length < length) {
            base = '0' + base;
        }
        return base.slice(-length);
    }

    /* Construye id<->token sobre TODO el catálogo (no sobre el subconjunto
       filtrado por tipo), así un token identifica al perfume sin importar si
       se está usando como completo o como decant.
       Si dos ids colisionan, el que ordena primero conserva el token corto y
       el otro pasa a uno largo: así un código ya compartido no cambia de
       significado cuando entra un perfume nuevo al catálogo. */
    function buildTokenMap(perfumes) {
        tokenToId = {};
        idToToken = {};

        var ids = (perfumes || [])
            .map(function (p) { return p && p.id; })
            .filter(Boolean)
            .sort();

        ids.forEach(function (id) {
            var token = toToken(id, TOKEN_LENGTH);
            if (Object.prototype.hasOwnProperty.call(tokenToId, token)) {
                var longToken = toToken(id, LONG_TOKEN_LENGTH);
                console.warn('[combo-code] colisión de token entre "' + tokenToId[token] +
                    '" y "' + id + '"; este último usa el token largo ' + longToken);
                token = longToken;
            }
            tokenToId[token] = id;
            idToToken[id] = token;
        });

        return ids.length;
    }

    function expectedSlots(tipo, cantidad) {
        return tipo === 'decants' ? cantidad : PERFUME_SLOTS;
    }

    /* items = [{ id, ml }]. Devuelve null si falta algún dato: preferimos no
       emitir código antes que emitir uno que no se pueda volver a resolver. */
    function encode(tipo, items) {
        var letter = LETTER_BY_TIPO[tipo];
        if (!letter || !Array.isArray(items) || !items.length) {
            return null;
        }

        var cantidad = items.length;
        if (cantidad !== expectedSlots(tipo, cantidad)) {
            return null;
        }
        if (tipo === 'decants' && (cantidad < DECANT_RANGE.min || cantidad > DECANT_RANGE.max)) {
            return null;
        }

        var slots = [];
        for (var i = 0; i < items.length; i += 1) {
            if (!items[i]) {
                slots.push(EMPTY_SLOT);
                continue;
            }
            var token = idToToken[items[i].id];
            var ml = parseInt(items[i].ml, 10);
            if (!token || Number.isNaN(ml)) {
                return null;
            }
            slots.push(token + '.' + ml);
        }

        return PREFIX + '-' + letter + cantidad + '-' + slots.join('-');
    }

    /* Devuelve { tipo, cantidad, items: [{ id, ml }] } o null.
       Valida la forma del código y que cada token exista en el catálogo; la
       disponibilidad real (stock, precio de combo) la revisa el viewmodel,
       que es quien tiene las listas ya filtradas por tipo. */
    function decode(code) {
        if (typeof code !== 'string') {
            return null;
        }

        var parts = code.trim().split('-');
        if (parts.length < 3 || parts[0].toUpperCase() !== PREFIX) {
            return null;
        }

        var header = parts[1].toUpperCase();
        var tipo = TIPO_BY_LETTER[header.charAt(0)];
        var cantidad = parseInt(header.slice(1), 10);
        if (!tipo || Number.isNaN(cantidad)) {
            return null;
        }

        var slots = parts.slice(2);
        if (cantidad !== slots.length || cantidad !== expectedSlots(tipo, cantidad)) {
            return null;
        }
        if (tipo === 'decants' && (cantidad < DECANT_RANGE.min || cantidad > DECANT_RANGE.max)) {
            return null;
        }

        var items = [];
        for (var i = 0; i < slots.length; i += 1) {
            if (slots[i] === EMPTY_SLOT) {
                items.push(null);
                continue;
            }
            var piece = slots[i].split('.');
            var id = tokenToId[piece[0].toLowerCase()];
            var ml = parseInt(piece[1], 10);
            if (!id || Number.isNaN(ml)) {
                return null;
            }
            items.push({ id: id, ml: ml });
        }

        return { tipo: tipo, cantidad: cantidad, items: items };
    }

    /* Acepta lo que sea que el cliente haya pegado: el código pelado o el link
       completo que le compartieron. */
    function extractFromInput(text) {
        var value = (text || '').trim();
        if (!value) {
            return '';
        }

        if (value.indexOf('?') !== -1 || value.indexOf('=') !== -1) {
            var query = value.slice(value.indexOf('?') + 1);
            var found = null;
            query.split(/[&#]/).forEach(function (pair) {
                var eq = pair.indexOf('=');
                if (eq !== -1 && pair.slice(0, eq) === 'combo' && !found) {
                    found = decodeURIComponent(pair.slice(eq + 1));
                }
            });
            if (found) {
                return found.trim();
            }
        }

        return value;
    }

    App.models.comboCode = {
        buildTokenMap: buildTokenMap,
        encode: encode,
        decode: decode,
        extractFromInput: extractFromInput,
        // El encabezado (C3, D7...) identifica la combinación tipo+cantidad y
        // sirve de clave para guardar un borrador por cada una.
        headerFor: function headerFor(tipo, cantidad) {
            var letter = LETTER_BY_TIPO[tipo];
            return letter ? letter + cantidad : null;
        },
        EMPTY_SLOT: EMPTY_SLOT,
        PARAM: 'combo'
    };
})(window.PerfSuarez);
