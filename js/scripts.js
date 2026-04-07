window.initCatalogNav = window.PerfSuarez.viewmodels.common.initCatalogNav;
window.normalizeRoutePath = window.PerfSuarez.core.normalizeRoutePath;

(function (App) {
    const STORAGE_KEY = 'perf-suarez-cart-v1';
    const WHATSAPP_NUMBER = '78064327';
    const MYSTERY_BOX_PRICE = 580;
    const MYSTERY_BOX_RULES = [
        { category: 'arabes', count: 2 },
        { category: 'disenador', count: 2 },
        { category: 'nicho', count: 1 }
    ];
    const CATEGORY_LABELS = {
        arabes: 'Árabe',
        disenador: 'Diseñador',
        nicho: 'Nicho'
    };

    function normalizeText(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }

    function normalizeTags(tags) {
        return (Array.isArray(tags) ? tags : [])
            .reduce(function (acc, tag) {
                return acc.concat(String(tag || '').split(/\s+/));
            }, [])
            .map(normalizeText)
            .filter(Boolean);
    }

    function formatPrice(value) {
        const amount = Number(value) || 0;
        return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
    }

    function buildWhatsAppUrl(message) {
        return `https://wa.me/${WHATSAPP_NUMBER}/?text=${encodeURIComponent(message)}`;
    }

    function createId(prefix) {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    }

    function readStorage() {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                return { items: [] };
            }

            const parsed = JSON.parse(raw);
            if (!parsed || !Array.isArray(parsed.items)) {
                return { items: [] };
            }

            return {
                items: parsed.items.filter(Boolean)
            };
        } catch (error) {
            return { items: [] };
        }
    }

    let cartState = readStorage();
    const subscribers = [];

    function persist() {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cartState));
        } catch (error) {
            console.error('No se pudo persistir el carrito:', error);
        }
    }

    function notify() {
        subscribers.forEach(function (listener) {
            try {
                listener(cartState);
            } catch (error) {
                console.error('Error actualizando suscriptor del carrito:', error);
            }
        });
    }

    function setState(nextState) {
        cartState = {
            items: Array.isArray(nextState.items) ? nextState.items : []
        };
        persist();
        notify();
    }

    function getState() {
        return {
            items: cartState.items.slice()
        };
    }

    function subscribe(listener) {
        if (typeof listener !== 'function') {
            return function () {};
        }

        subscribers.push(listener);
        return function unsubscribe() {
            const index = subscribers.indexOf(listener);
            if (index >= 0) {
                subscribers.splice(index, 1);
            }
        };
    }

    function getItemCount() {
        return cartState.items.length;
    }

    function getTotal() {
        return cartState.items.reduce(function (sum, item) {
            return sum + (Number(item.totalPrice) || 0);
        }, 0);
    }

    function addItem(item) {
        if (!item) {
            return null;
        }

        const nextItem = Object.assign({
            id: createId('cart'),
            currency: 'Bs'
        }, item);

        setState({
            items: cartState.items.concat(nextItem)
        });

        return nextItem;
    }

    function removeItem(itemId) {
        setState({
            items: cartState.items.filter(function (item) {
                return item.id !== itemId;
            })
        });
    }

    function clear() {
        setState({ items: [] });
    }

    function getPerfumes() {
        return Array.isArray(App.data && App.data.perfumes) ? App.data.perfumes : [];
    }

    function classifyPerfume(perfume) {
        const tags = normalizeTags(perfume && perfume.tags);
        if (tags.indexOf('arabes') >= 0) {
            return 'arabes';
        }
        if (tags.indexOf('nicho') >= 0) {
            return 'nicho';
        }
        return 'disenador';
    }

    function shuffle(array) {
        const copy = array.slice();
        for (let index = copy.length - 1; index > 0; index -= 1) {
            const swapIndex = Math.floor(Math.random() * (index + 1));
            const temp = copy[index];
            copy[index] = copy[swapIndex];
            copy[swapIndex] = temp;
        }
        return copy;
    }

    function createPerfumeItem(perfume, selection) {
        if (!perfume || !selection) {
            return null;
        }

        const typeLabel = selection.kind === 'perfume' ? 'Perfume completo' : 'Decant';
        const image = selection.kind === 'perfume'
            ? (perfume.image_miniatura || perfume.image_miniatura_decant || 'imagenes/image.webp')
            : (perfume.image_miniatura_decant || perfume.image_miniatura || 'imagenes/image.webp');

        return {
            id: createId('perfume'),
            type: 'perfume',
            title: perfume.nombre_interno,
            subtitle: `${typeLabel} ${selection.size} ml`,
            totalPrice: Number(selection.price) || 0,
            image: image,
            detailLines: [
                `${typeLabel}: ${selection.size} ml`,
                `Precio: Bs ${formatPrice(selection.price)}`
            ],
            whatsappLines: [
                `- ${perfume.nombre_interno}`,
                `  ${typeLabel} ${selection.size} ml`,
                `  Bs ${formatPrice(selection.price)}`
            ]
        };
    }

    function createComboItem(summary) {
        if (!summary || !Array.isArray(summary.items) || !summary.items.length) {
            return null;
        }

        const title = summary.isDecants ? 'Set de Decants' : 'Combo de Perfumes';
        const subtitle = summary.isDecants
            ? `${summary.items.length} decants seleccionados`
            : `${summary.items.length} perfumes seleccionados`;

        return {
            id: createId('combo'),
            type: 'combo',
            title: title,
            subtitle: subtitle,
            totalPrice: Number(summary.total) || 0,
            detailLines: summary.items.map(function (item) {
                return `${item.name} - ${item.size} ml`;
            }).concat(summary.savings > 0 ? [`Ahorro: Bs ${formatPrice(summary.savings)}`] : []),
            whatsappLines: [
                `- ${title}`,
                `  ${subtitle}`
            ].concat(summary.items.map(function (item) {
                return `  • ${item.name} - ${item.size} ml`;
            })).concat([
                `  Total combo: Bs ${formatPrice(summary.total)}`
            ])
        };
    }

    function buildMysteryBoxSelections() {
        const perfumes = getPerfumes().filter(function (perfume) {
            return perfume && perfume.en_stock_decants && perfume.precios_decants;
        });

        if (!perfumes.length) {
            return [];
        }

        const usedIds = {};
        const selections = [];

        MYSTERY_BOX_RULES.forEach(function (rule) {
            const pool = shuffle(perfumes.filter(function (perfume) {
                return !usedIds[perfume.id] && classifyPerfume(perfume) === rule.category;
            })).slice(0, rule.count);

            pool.forEach(function (perfume) {
                usedIds[perfume.id] = true;
                selections.push({
                    perfumeId: perfume.id,
                    name: perfume.nombre_interno,
                    category: rule.category
                });
            });
        });

        if (selections.length < 5) {
            shuffle(perfumes.filter(function (perfume) {
                return !usedIds[perfume.id];
            })).slice(0, 5 - selections.length).forEach(function (perfume) {
                selections.push({
                    perfumeId: perfume.id,
                    name: perfume.nombre_interno,
                    category: classifyPerfume(perfume)
                });
            });
        }

        return selections;
    }

    function createMysteryBoxItem() {
        const selections = buildMysteryBoxSelections();
        if (!selections.length) {
            return null;
        }

        return {
            id: createId('mystery'),
            type: 'mystery-box',
            title: 'Mystery Box',
            subtitle: '2 árabes, 2 diseñador y 1 nicho',
            totalPrice: MYSTERY_BOX_PRICE,
            detailLines: selections.map(function (item) {
                return `${CATEGORY_LABELS[item.category] || 'Selección'}: ${item.name}`;
            }),
            whatsappLines: [
                '- Mystery Box',
                '  Incluye: 2 árabes, 2 diseñador y 1 nicho'
            ].concat(selections.map(function (item) {
                return `  • ${CATEGORY_LABELS[item.category] || 'Selección'}: ${item.name}`;
            })).concat([
                `  Precio: Bs ${formatPrice(MYSTERY_BOX_PRICE)}`
            ])
        };
    }

    function buildWhatsAppMessage() {
        if (!cartState.items.length) {
            return 'Hola! Quisiera pedir estos productos.';
        }

        const lines = ['Hola! Quisiera pedir este carrito:', ''];

        cartState.items.forEach(function (item, index) {
            lines.push(`${index + 1}.`);
            if (Array.isArray(item.whatsappLines) && item.whatsappLines.length) {
                item.whatsappLines.forEach(function (line) {
                    lines.push(`   ${line}`);
                });
            } else {
                lines.push(`   ${item.title}`);
                if (item.subtitle) {
                    lines.push(`   ${item.subtitle}`);
                }
            }
            lines.push(`   Subtotal: Bs ${formatPrice(item.totalPrice)}`);
            lines.push('');
        });

        lines.push(`Total del carrito: Bs ${formatPrice(getTotal())}`);
        return lines.join('\n');
    }

    App.models.cart = {
        addItem,
        buildWhatsAppMessage,
        buildWhatsAppUrl,
        clear,
        createComboItem,
        createMysteryBoxItem,
        createPerfumeItem,
        formatPrice,
        getItemCount,
        getState,
        getTotal,
        removeItem,
        subscribe
    };

    App.viewmodels.cart = App.viewmodels.cart || {};
    App.viewmodels.cart = Object.assign(App.viewmodels.cart, (function () {
        let isOpen = false;

        function getElements() {
            return {
                toggle: document.getElementById('cart-toggle'),
                panel: document.getElementById('cart-panel'),
                backdrop: document.getElementById('cart-backdrop'),
                count: document.getElementById('cart-count'),
                items: document.getElementById('cart-items'),
                total: document.getElementById('cart-total'),
                empty: document.getElementById('cart-empty'),
                send: document.getElementById('cart-send'),
                clearBtn: document.getElementById('cart-clear'),
                close: document.getElementById('cart-close')
            };
        }

        function setOpen(nextOpen) {
            const elements = getElements();
            if (!elements.panel || !elements.toggle || !elements.backdrop) {
                return;
            }

            isOpen = !!nextOpen;
            elements.panel.classList.toggle('is-open', isOpen);
            elements.backdrop.classList.toggle('is-open', isOpen);
            elements.toggle.setAttribute('aria-expanded', String(isOpen));
            elements.panel.setAttribute('aria-hidden', String(!isOpen));
            document.body.classList.toggle('cart-open', isOpen);
        }

        function openCart() {
            setOpen(true);
        }

        function closeCart() {
            setOpen(false);
        }

        function render() {
            const elements = getElements();
            if (!elements.count) {
                return;
            }

            const state = App.models.cart.getState();
            const total = App.models.cart.getTotal();
            const itemCount = App.models.cart.getItemCount();

            elements.count.textContent = String(itemCount);
            elements.count.classList.toggle('is-empty', itemCount === 0);

            if (elements.total) {
                elements.total.textContent = `Bs ${App.models.cart.formatPrice(total)}`;
            }

            if (elements.send) {
                const hasItems = itemCount > 0;
                elements.send.classList.toggle('is-disabled', !hasItems);
                elements.send.setAttribute('href', hasItems
                    ? App.models.cart.buildWhatsAppUrl(App.models.cart.buildWhatsAppMessage())
                    : 'javascript:void(0)');
            }

            if (elements.empty) {
                elements.empty.hidden = itemCount > 0;
            }

            if (elements.items) {
                elements.items.innerHTML = state.items.map(function (item) {
                    const lines = (item.detailLines || []).map(function (line) {
                        return `<li>${line}</li>`;
                    }).join('');

                    return ''
                        + `<article class="cart-item" data-cart-id="${item.id}">`
                        +   '<div class="cart-item__header">'
                        +     `<div><h3>${item.title}</h3>${item.subtitle ? `<p>${item.subtitle}</p>` : ''}</div>`
                        +     `<button type="button" class="cart-item__remove" data-remove-cart-item="${item.id}" aria-label="Eliminar producto">×</button>`
                        +   '</div>'
                        +   (lines ? `<ul class="cart-item__details">${lines}</ul>` : '')
                        +   `<p class="cart-item__price">Bs ${App.models.cart.formatPrice(item.totalPrice)}</p>`
                        + '</article>';
                }).join('');
            }
        }

        function bind() {
            const elements = getElements();
            if (!elements.panel || elements.panel.dataset.cartReady === 'true') {
                return;
            }

            elements.panel.dataset.cartReady = 'true';

            elements.toggle?.addEventListener('click', function () {
                setOpen(!isOpen);
            });
            elements.close?.addEventListener('click', closeCart);
            elements.backdrop?.addEventListener('click', closeCart);
            elements.clearBtn?.addEventListener('click', function () {
                App.models.cart.clear();
            });
            elements.items?.addEventListener('click', function (event) {
                const button = event.target.closest('[data-remove-cart-item]');
                if (!button) {
                    return;
                }
                App.models.cart.removeItem(button.getAttribute('data-remove-cart-item'));
            });

            document.addEventListener('keydown', function (event) {
                if (event.key === 'Escape' && isOpen) {
                    closeCart();
                }
            });

            App.models.cart.subscribe(render);
            window.addEventListener('storage', function (event) {
                if (event.key === STORAGE_KEY) {
                    cartState = readStorage();
                    notify();
                }
            });

            setOpen(false);
            render();
        }

        function initCartUi() {
            bind();
            render();
        }

        return {
            closeCart,
            initCartUi,
            openCart
        };
    })());
})(window.PerfSuarez);

window.PerfSuarez.core.onReady(() => {
    window.PerfSuarez.viewmodels.common.initGlobalUi();
    window.PerfSuarez.viewmodels.cart?.initCartUi();
});
