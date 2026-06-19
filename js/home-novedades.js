/* Carrusel de Novedades de la pantalla de inicio.
   Reemplaza al buscador principal: muestra los artes promocionales con
   desplazamiento por scroll-snap, puntos indicadores y autoplay suave.
   Es autónomo y no hace nada si la sección no está presente. */
(function () {
    'use strict';

    function init() {
        var track = document.getElementById('novedades-track');
        var dotsWrap = document.getElementById('novedades-dots');
        if (!track) {
            return;
        }

        var slides = Array.prototype.slice.call(track.children);
        if (slides.length === 0) {
            return;
        }

        var reduceMotion = window.matchMedia
            && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var current = 0;
        var autoplayId = null;
        var AUTOPLAY_MS = 5000;

        // Construir puntos indicadores
        var dots = [];
        if (dotsWrap) {
            slides.forEach(function (_, index) {
                var dot = document.createElement('button');
                dot.type = 'button';
                dot.className = 'home-novedades__dot';
                dot.setAttribute('role', 'tab');
                dot.setAttribute('aria-label', 'Novedad ' + (index + 1));
                dot.addEventListener('click', function () {
                    goTo(index, true);
                    restartAutoplay();
                });
                dotsWrap.appendChild(dot);
                dots.push(dot);
            });
        }

        function setActive(index) {
            current = index;
            dots.forEach(function (dot, i) {
                var active = i === index;
                dot.classList.toggle('is-active', active);
                dot.setAttribute('aria-selected', active ? 'true' : 'false');
            });
        }

        function goTo(index, smooth) {
            var slide = slides[index];
            if (!slide) {
                return;
            }
            track.scrollTo({
                left: slide.offsetLeft - track.offsetLeft,
                behavior: smooth && !reduceMotion ? 'smooth' : 'auto'
            });
            setActive(index);
        }

        // Sincronizar el punto activo según la posición de scroll
        var scrollTick = null;
        track.addEventListener('scroll', function () {
            if (scrollTick) {
                return;
            }
            scrollTick = window.requestAnimationFrame(function () {
                scrollTick = null;
                var center = track.scrollLeft + track.clientWidth / 2;
                var nearest = 0;
                var minDist = Infinity;
                slides.forEach(function (slide, i) {
                    var slideCenter = slide.offsetLeft - track.offsetLeft + slide.clientWidth / 2;
                    var dist = Math.abs(slideCenter - center);
                    if (dist < minDist) {
                        minDist = dist;
                        nearest = i;
                    }
                });
                setActive(nearest);
            });
        }, { passive: true });

        function startAutoplay() {
            if (reduceMotion || slides.length < 2 || autoplayId) {
                return;
            }
            autoplayId = window.setInterval(function () {
                goTo((current + 1) % slides.length, true);
            }, AUTOPLAY_MS);
        }

        function stopAutoplay() {
            if (autoplayId) {
                window.clearInterval(autoplayId);
                autoplayId = null;
            }
        }

        function restartAutoplay() {
            stopAutoplay();
            startAutoplay();
        }

        // Pausar mientras el usuario interactúa o la pestaña está oculta
        ['pointerdown', 'touchstart', 'mouseenter'].forEach(function (evt) {
            track.addEventListener(evt, stopAutoplay, { passive: true });
        });
        ['pointerup', 'touchend', 'mouseleave'].forEach(function (evt) {
            track.addEventListener(evt, restartAutoplay, { passive: true });
        });
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) {
                stopAutoplay();
            } else {
                startAutoplay();
            }
        });

        setActive(0);
        startAutoplay();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
