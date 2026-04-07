(function (App) {
    const PANEL_META = [
        {
            slug: '',
            src: 'catalogo.html',
            title: 'Perfumería Suárez | Perfumes Originales en Bolivia',
            description: 'Perfumería Suárez: tu perfumería de confianza en Bolivia. Catálogo completo de perfumes originales para mujer y hombre. Envíos a todo el país.'
        },
        {
            slug: 'perfumes',
            src: 'perfumes.html',
            title: 'Catálogo de Perfumes Originales | Perfumería Suárez Bolivia',
            description: 'Explorá el catálogo completo de perfumes de Perfumería Suárez. Marcas internacionales para mujer y hombre: Xerjoff, Dior, Carolina Herrera, Rabanne y más.'
        },
        {
            slug: 'decants',
            src: 'decants.html',
            title: 'Decants de Perfumes Nicho | Perfumería Suárez Bolivia',
            description: 'Decants de perfumes nicho y de diseñador en formatos de 5, 10 y 15 ml. Probá antes de invertir en el frasco completo.'
        },
        {
            slug: 'armarcombo',
            src: 'armarcombo.html',
            title: 'Combos y Sets Personalizados | Perfumería Suárez Bolivia',
            description: 'Armá tu combo de perfumes a medida en Perfumería Suárez. Combinaciones personalizadas para regalar o para vos.'
        },
        {
            slug: 'mysterybox',
            src: 'mysterybox.html',
            title: 'Mystery Box de Perfumes | Perfumería Suárez Bolivia',
            description: 'La Mystery Box de Perfumería Suárez: una selección sorpresa de perfumes nicho y de diseñador curada especialmente para vos.'
        },
        {
            slug: 'aux',
            src: 'search.html',
            title: 'Perfumería Suárez',
            description: 'Explora el catálogo de Perfumería Suárez.'
        }
    ];

    const PRIMARY_PANEL_COUNT = 5;
    const AUX_PANEL_INDEX = PANEL_META.length - 1;

    function initCatalogShell() {
        const stage = document.querySelector('.swipe-stage');
        const track = document.getElementById('swipe-track');
        if (!stage || !track) {
            return;
        }

        document.documentElement.classList.add('swipe-shell-lock');

        const panels = Array.from(track.querySelectorAll('.swipe-panel'));
        const dots = Array.from(document.querySelectorAll('.swipe-progress span'));
        const dragState = { active: false, pending: false, startX: 0, startY: 0, prevTranslate: 0, currentTranslate: 0, pointerId: null };
        const horizontalDeadZone = 32;
        const verticalAbortThreshold = 18;
        let currentIndex = 0;
        let currentRoute = null;
        let navController = null;
        let headerLinks = [];
        const useDirectHtmlRoutes = App.core.isShellRedirectDisabled();

        const stageWidth = () => stage.getBoundingClientRect().width;
        const applyTranslate = value => { track.style.transform = `translateX(${value}px)`; };
        const pointerShouldHandle = event => !event.pointerType || event.pointerType !== 'touch';

        function makeHistoryUrl(src, slug, search, hash) {
            if (useDirectHtmlRoutes) {
                if (!src || src === 'catalogo.html') {
                    return '/';
                }
                return `/${src}${search || ''}${hash || ''}`;
            }
            return slug ? `/${slug}${search || ''}${hash || ''}` : `/${search || ''}${hash || ''}`;
        }

        function getRouteForPath(pathname, search, hash) {
            const cleanPath = pathname
                .replace(/(\.html)\/+$/i, '$1')
                .replace(/\/+$/, '') || '/';
            const metaBySlug = Object.fromEntries(PANEL_META.map((item, index) => [item.slug, { item, index }]));

            if (cleanPath === '/' || cleanPath === '/index.html' || cleanPath === '/catalogo' || cleanPath === '/catalogo.html') {
                return {
                    index: 0,
                    panelSrc: 'catalogo.html',
                    historyUrl: makeHistoryUrl('catalogo.html', '', search, hash),
                    navHref: 'catalogo.html',
                    meta: PANEL_META[0]
                };
            }

            const slug = cleanPath.replace(/^\//, '').replace(/\.html$/, '');
            if (metaBySlug[slug] && metaBySlug[slug].index < PRIMARY_PANEL_COUNT) {
                const panel = metaBySlug[slug];
                return {
                    index: panel.index,
                    panelSrc: panel.item.src,
                    historyUrl: makeHistoryUrl(panel.item.src, panel.item.slug, search, hash),
                    navHref: panel.item.src,
                    meta: panel.item
                };
            }

            if (slug === 'search') {
                return {
                    index: AUX_PANEL_INDEX,
                    panelSrc: `search.html${search || ''}`,
                    historyUrl: makeHistoryUrl('search.html', 'search', search, hash),
                    navHref: null,
                    meta: {
                        slug: 'search',
                        title: 'Resultados de búsqueda | Perfumería Suárez',
                        description: 'Resultados de búsqueda dentro del catálogo de Perfumería Suárez.'
                    }
                };
            }

            if (slug === 'perfume') {
                return {
                    index: AUX_PANEL_INDEX,
                    panelSrc: `perfume.html${search || ''}`,
                    historyUrl: makeHistoryUrl('perfume.html', 'perfume', search, hash),
                    navHref: null,
                    meta: {
                        slug: 'perfume',
                        title: 'Perfume | Perfumería Suárez',
                        description: 'Detalle de producto dentro del catálogo de Perfumería Suárez.'
                    }
                };
            }

            if (slug === 'velas') {
                return {
                    index: AUX_PANEL_INDEX,
                    panelSrc: 'velas.html',
                    historyUrl: makeHistoryUrl('velas.html', 'velas', search, hash),
                    navHref: null,
                    meta: {
                        slug: 'velas',
                        title: 'Velas Aromáticas | Perfumería Suárez',
                        description: 'Colección de velas aromáticas de Perfumería Suárez.'
                    }
                };
            }

            if (slug === 'contacto') {
                return {
                    index: AUX_PANEL_INDEX,
                    panelSrc: 'contacto.html',
                    historyUrl: makeHistoryUrl('contacto.html', 'contacto', search, hash),
                    navHref: null,
                    meta: {
                        slug: 'contacto',
                        title: 'Contacto | Perfumería Suárez',
                        description: 'Canales de contacto y asesoría de Perfumería Suárez.'
                    }
                };
            }

            return {
                index: 0,
                panelSrc: 'catalogo.html',
                historyUrl: '/',
                navHref: 'catalogo.html',
                meta: PANEL_META[0]
            };
        }

        function resolveRoute(target) {
            const url = new URL(target, window.location.origin);
            return getRouteForPath(url.pathname, url.search, url.hash);
        }

        function updateDots() {
            dots.forEach((dot, index) => {
                dot.classList.toggle('is-active', index === currentIndex && index < PRIMARY_PANEL_COUNT);
            });
        }

        function syncHeaderLinks(href) {
            const normalized = href ? App.core.normalizeRoutePath(href) : null;
            headerLinks.forEach(link => {
                const match = normalized && App.core.normalizeRoutePath(link.getAttribute('href')) === normalized;
                link.classList.toggle('is-active', !!match);
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

        function resetEmbeddedViewport(iframe) {
            try {
                const frameWindow = iframe.contentWindow;
                const doc = frameWindow?.document;
                if (!frameWindow || !doc) {
                    return;
                }

                if ('scrollRestoration' in frameWindow.history) {
                    frameWindow.history.scrollRestoration = 'manual';
                }

                const { documentElement, body } = doc;
                const scrollingElement = doc.scrollingElement || documentElement || body;
                if (documentElement) {
                    documentElement.style.scrollBehavior = 'auto';
                    documentElement.style.marginTop = '0';
                    documentElement.style.paddingTop = '0';
                    documentElement.scrollTop = 0;
                }
                if (body) {
                    body.style.scrollBehavior = 'auto';
                    body.style.marginTop = '0';
                    body.style.paddingTop = '0';
                    body.scrollTop = 0;
                }

                doc.querySelector('main')?.style.setProperty('margin-top', '0');
                frameWindow.scrollTo(0, 0);
                if (scrollingElement) {
                    scrollingElement.scrollTop = 0;
                }

                requestAnimationFrame(() => {
                    frameWindow.scrollTo(0, 0);
                    if (scrollingElement) {
                        scrollingElement.scrollTop = 0;
                    }
                });
            } catch (error) {
                // ignore inaccessible frames
            }
        }

        function loadPanel(index, route) {
            const panel = panels[index];
            const iframe = panel?.querySelector('iframe');
            if (!panel || !iframe) {
                return;
            }

            const targetSrc = route?.panelSrc || panel.dataset.src;
            if (!targetSrc) {
                return;
            }

            if (iframe.dataset.loadedSrc === targetSrc) {
                return;
            }

            iframe.src = targetSrc;
            iframe.dataset.loadedSrc = targetSrc;
            iframe.addEventListener('load', () => {
                resetEmbeddedViewport(iframe);
                panel.querySelector('.panel-loading')?.remove();
                bindFrameGestures(iframe);
            }, { once: true });
        }

        function updateActive(route, pushHistory) {
            currentRoute = route;
            currentIndex = Math.max(0, Math.min(route.index, panels.length - 1));

            snapToIndex(false);
            updateDots();
            loadPanel(currentIndex, route);
            if (currentIndex < PRIMARY_PANEL_COUNT) {
                loadPanel(currentIndex + 1);
                loadPanel(currentIndex - 1);
            }

            navController?.setActiveByHref(route.navHref);
            syncHeaderLinks(route.navHref);
            document.body.classList.toggle('is-home-panel', currentIndex === 0);

            if (pushHistory) {
                history.pushState({ route: route.historyUrl }, '', route.historyUrl);
            }
            App.views.shell.updateMeta(route.meta);
        }

        function startDrag(x, y, pointerId, immediate) {
            if (dragState.active || dragState.pending || currentIndex >= PRIMARY_PANEL_COUNT) {
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
                const nextIndex = Math.max(0, Math.min(PRIMARY_PANEL_COUNT - 1, currentIndex + (moved < 0 ? 1 : -1)));
                updateActive({
                    index: nextIndex,
                    panelSrc: PANEL_META[nextIndex].src,
                    historyUrl: makeHistoryUrl(PANEL_META[nextIndex].src, PANEL_META[nextIndex].slug, '', ''),
                    navHref: PANEL_META[nextIndex].src,
                    meta: PANEL_META[nextIndex]
                }, true);
            } else {
                snapToIndex(false);
            }
        }

        function goToHref(href) {
            const route = resolveRoute(href);
            if (!route) {
                return false;
            }

            updateActive(route, true);
            return true;
        }

        window.catalogShellNavigate = goToHref;

        document.addEventListener('catalogNavReady', event => {
            navController = event.detail;
            navController?.setActiveByHref(currentRoute?.navHref);
        });

        document.addEventListener('headerReady', () => {
            headerLinks = Array.from(document.querySelectorAll('.nav-link'));
            syncHeaderLinks(currentRoute?.navHref);
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
            const routeTarget = typeof event.state?.route === 'string'
                ? event.state.route
                : window.location.pathname + window.location.search + window.location.hash;
            updateActive(resolveRoute(routeTarget), false);
        });

        const redirect = sessionStorage.getItem('spa-redirect');
        if (redirect) {
            sessionStorage.removeItem('spa-redirect');
            const route = resolveRoute(redirect);
            history.replaceState({ route: route.historyUrl }, '', route.historyUrl);
            updateActive(route, false);
            return;
        }

        const initialRoute = resolveRoute(window.location.pathname + window.location.search + window.location.hash);
        history.replaceState({ route: initialRoute.historyUrl }, '', initialRoute.historyUrl);
        updateActive(initialRoute, false);
    }

    App.viewmodels.shell = {
        initCatalogShell
    };

    App.core.onReady(initCatalogShell);
})(window.PerfSuarez);
