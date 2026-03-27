(function (App) {
    const PANEL_META = [
        {
            slug: '',
            title: 'Perfumería Suárez | Perfumes Originales en Bolivia',
            description: 'Perfumería Suárez: tu perfumería de confianza en Bolivia. Catálogo completo de perfumes originales para mujer y hombre. Envíos a todo el país.'
        },
        {
            slug: 'perfumes',
            title: 'Catálogo de Perfumes Originales | Perfumería Suárez Bolivia',
            description: 'Explorá el catálogo completo de perfumes de Perfumería Suárez. Marcas internacionales para mujer y hombre: Xerjoff, Dior, Carolina Herrera, Rabanne y más.'
        },
        {
            slug: 'decants',
            title: 'Decants de Perfumes Nicho | Perfumería Suárez Bolivia',
            description: 'Decants de perfumes nicho y de diseñador en formatos de 5, 10 y 15 ml. Probá antes de invertir en el frasco completo.'
        },
        {
            slug: 'armarcombo',
            title: 'Combos y Sets Personalizados | Perfumería Suárez Bolivia',
            description: 'Armá tu combo de perfumes a medida en Perfumería Suárez. Combinaciones personalizadas para regalar o para vos.'
        },
        {
            slug: 'mysterybox',
            title: 'Mystery Box de Perfumes | Perfumería Suárez Bolivia',
            description: 'La Mystery Box de Perfumería Suárez: una selección sorpresa de perfumes nicho y de diseñador curada especialmente para vos.'
        }
    ];

    function initCatalogShell() {
        const stage = document.querySelector('.swipe-stage');
        const track = document.getElementById('swipe-track');
        if (!stage || !track) {
            return;
        }

        const panels = Array.from(track.querySelectorAll('.swipe-panel'));
        const dots = Array.from(document.querySelectorAll('.swipe-progress span'));
        const panelPaths = panels.map(panel => App.core.normalizeRoutePath(panel.dataset.src));
        const dragState = { active: false, pending: false, startX: 0, startY: 0, prevTranslate: 0, currentTranslate: 0, pointerId: null };
        const horizontalDeadZone = 32;
        const verticalAbortThreshold = 18;
        let currentIndex = 0;
        let navController = null;
        let headerLinks = [];

        const stageWidth = () => stage.getBoundingClientRect().width;
        const applyTranslate = value => { track.style.transform = `translateX(${value}px)`; };
        const pointerShouldHandle = event => !event.pointerType || event.pointerType !== 'touch';
        const slugToIndex = pathname => {
            const slug = pathname.replace(/^\//, '').replace(/\/$/, '');
            const index = PANEL_META.findIndex(item => item.slug === slug);
            return index >= 0 ? index : 0;
        };

        function updateDots() {
            dots.forEach((dot, index) => dot.classList.toggle('is-active', index === currentIndex));
        }

        function syncHeaderLinks(href) {
            const normalized = App.core.normalizeRoutePath(href);
            headerLinks.forEach(link => {
                const match = App.core.normalizeRoutePath(link.getAttribute('href')) === normalized;
                link.classList.toggle('is-active', match);
                if (match) {
                    link.setAttribute('aria-current', 'page');
                } else {
                    link.removeAttribute('aria-current');
                }
            });
        }

        function snapToIndex(instant) {
            const target = -currentIndex * stageWidth();
            if (instant) {
                track.classList.add('is-dragging');
                applyTranslate(target);
                requestAnimationFrame(() => track.classList.remove('is-dragging'));
            } else {
                applyTranslate(target);
            }
            dragState.prevTranslate = target;
            dragState.currentTranslate = target;
        }

        function bindFrameGestures(iframe) {
            if (!iframe || iframe.dataset.gestureReady === 'true') {
                return;
            }

            iframe.dataset.gestureReady = 'true';
            try {
                const doc = iframe.contentWindow?.document;
                if (!doc) {
                    return;
                }

                doc.addEventListener('touchstart', event => {
                    if (event.touches.length !== 1) return;
                    const touch = event.touches[0];
                    startDrag(touch.clientX, touch.clientY);
                }, { passive: true });
                doc.addEventListener('touchmove', event => {
                    if (event.touches.length !== 1) return;
                    const touch = event.touches[0];
                    moveDrag(touch.clientX, touch.clientY);
                }, { passive: true });
                doc.addEventListener('touchend', () => endDrag());
                doc.addEventListener('touchcancel', () => endDrag());
                doc.addEventListener('pointerdown', event => {
                    if (!pointerShouldHandle(event) || event.button !== 0) return;
                    startDrag(event.clientX, event.clientY, event.pointerId, true);
                });
                doc.addEventListener('pointermove', event => {
                    if (!pointerShouldHandle(event) || event.buttons === 0) return;
                    moveDrag(event.clientX, event.clientY, event.pointerId);
                });
                doc.addEventListener('pointerup', event => {
                    if (pointerShouldHandle(event)) {
                        endDrag(event.pointerId);
                    }
                });
                doc.addEventListener('pointercancel', event => {
                    if (pointerShouldHandle(event)) {
                        endDrag(event.pointerId);
                    }
                });
            } catch (error) {
                // ignore inaccessible frames
            }
        }

        function loadPanel(index) {
            const panel = panels[index];
            const iframe = panel?.querySelector('iframe');
            if (!iframe || iframe.dataset.loaded === 'true') {
                return;
            }

            iframe.src = panel.dataset.src;
            iframe.dataset.loaded = 'true';
            iframe.addEventListener('load', () => {
                panel.querySelector('.panel-loading')?.remove();
                bindFrameGestures(iframe);
            }, { once: true });
        }

        function updateActive(index, pushHistory) {
            currentIndex = Math.max(0, Math.min(index, panels.length - 1));
            snapToIndex(false);
            updateDots();
            loadPanel(currentIndex);
            loadPanel(currentIndex + 1);
            loadPanel(currentIndex - 1);

            const activeSrc = panels[currentIndex]?.dataset.src;
            navController?.setActiveByHref(activeSrc);
            syncHeaderLinks(activeSrc);
            document.body.classList.toggle('is-home-panel', currentIndex === 0);

            const meta = PANEL_META[currentIndex];
            if (pushHistory && meta) {
                history.pushState({ index: currentIndex }, '', `/${meta.slug}`);
            }
            App.views.shell.updateMeta(meta);
        }

        function startDrag(x, y, pointerId, immediate) {
            if (dragState.active || dragState.pending) {
                return;
            }

            dragState.pointerId = pointerId ?? null;
            dragState.startX = x;
            dragState.startY = y || 0;
            dragState.prevTranslate = -currentIndex * stageWidth();
            dragState.currentTranslate = dragState.prevTranslate;
            dragState.pending = !immediate;
            dragState.active = !!immediate;

            if (immediate) {
                track.classList.add('is-dragging');
            }
        }

        function cancelPendingDrag() {
            dragState.pending = false;
            dragState.pointerId = null;
        }

        function activateDrag() {
            if (dragState.active) {
                return;
            }

            dragState.active = true;
            dragState.pending = false;
            track.classList.add('is-dragging');
        }

        function moveDrag(x, y, pointerId) {
            if (!dragState.active && !dragState.pending) {
                return;
            }
            if (dragState.pointerId !== null && pointerId !== undefined && pointerId !== null && pointerId !== dragState.pointerId) {
                return;
            }

            if (dragState.pending) {
                if (y === undefined || y === null) {
                    activateDrag();
                } else {
                    const deltaX = x - dragState.startX;
                    const deltaY = y - dragState.startY;
                    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > verticalAbortThreshold) {
                        cancelPendingDrag();
                        return;
                    }
                    if (Math.abs(deltaX) >= horizontalDeadZone) {
                        activateDrag();
                    } else {
                        return;
                    }
                }
            }

            if (!dragState.active) {
                return;
            }

            dragState.currentTranslate = dragState.prevTranslate + (x - dragState.startX);
            applyTranslate(dragState.currentTranslate);
        }

        function endDrag(pointerId) {
            if (!dragState.active && !dragState.pending) {
                return;
            }
            if (dragState.pointerId !== null && pointerId !== undefined && pointerId !== null && pointerId !== dragState.pointerId) {
                return;
            }

            if (dragState.pending && !dragState.active) {
                cancelPendingDrag();
                return;
            }

            dragState.active = false;
            dragState.pending = false;
            dragState.pointerId = null;
            track.classList.remove('is-dragging');

            const moved = dragState.currentTranslate - dragState.prevTranslate;
            const snapThreshold = Math.min(stageWidth() * 0.18, 260);
            if (Math.abs(moved) > snapThreshold) {
                updateActive(currentIndex + (moved < 0 ? 1 : -1), true);
            } else {
                snapToIndex(false);
            }
        }

        function goToHref(href) {
            const index = panelPaths.indexOf(App.core.normalizeRoutePath(href));
            if (index < 0) {
                return false;
            }

            updateActive(index, true);
            return true;
        }

        window.catalogShellNavigate = goToHref;

        document.addEventListener('catalogNavReady', event => {
            navController = event.detail;
            navController?.setActiveByHref(panels[currentIndex]?.dataset.src);
        });

        document.addEventListener('headerReady', () => {
            headerLinks = Array.from(document.querySelectorAll('.nav-link'));
            syncHeaderLinks(panels[currentIndex]?.dataset.src);
        });

        track.addEventListener('touchstart', event => {
            if (event.touches.length !== 1) return;
            const touch = event.touches[0];
            startDrag(touch.clientX, touch.clientY);
        }, { passive: true });
        track.addEventListener('touchmove', event => {
            if (event.touches.length !== 1) return;
            const touch = event.touches[0];
            moveDrag(touch.clientX, touch.clientY);
        }, { passive: true });
        track.addEventListener('touchend', () => endDrag());
        track.addEventListener('touchcancel', () => endDrag());
        track.addEventListener('pointerdown', event => {
            if (!pointerShouldHandle(event) || event.button !== 0) return;
            startDrag(event.clientX, event.clientY, event.pointerId, true);
        });
        track.addEventListener('pointermove', event => {
            if (!pointerShouldHandle(event) || event.buttons === 0) return;
            moveDrag(event.clientX, event.clientY, event.pointerId);
        });
        track.addEventListener('pointerup', event => {
            if (pointerShouldHandle(event)) {
                endDrag(event.pointerId);
            }
        });
        track.addEventListener('pointercancel', event => {
            if (pointerShouldHandle(event)) {
                endDrag(event.pointerId);
            }
        });

        window.addEventListener('resize', () => snapToIndex(true));
        window.addEventListener('popstate', event => {
            const index = typeof event.state?.index === 'number'
                ? event.state.index
                : slugToIndex(window.location.pathname);
            updateActive(index, false);
        });

        const redirect = sessionStorage.getItem('spa-redirect');
        if (redirect) {
            sessionStorage.removeItem('spa-redirect');
            const redirectedIndex = slugToIndex(new URL(redirect, window.location.origin).pathname);
            currentIndex = redirectedIndex;
            history.replaceState({ index: redirectedIndex }, '', `/${PANEL_META[redirectedIndex]?.slug || ''}`);
        } else {
            currentIndex = slugToIndex(window.location.pathname);
            history.replaceState({ index: currentIndex }, '', window.location.pathname);
        }

        updateActive(currentIndex, false);
    }

    App.viewmodels.shell = {
        initCatalogShell
    };
})(window.PerfSuarez);
