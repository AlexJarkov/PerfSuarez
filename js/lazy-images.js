// js/lazy-images.js
class LazyImages {
  /**
   * @param {string} selector CSS selector para imágenes a vigilar (por defecto, todas dentro del grid)
   */
  constructor(selector = '.perfume-grid img') {
    this.selector = selector;
  }

  init() {
    const imgs = document.querySelectorAll(this.selector);

    // Asegura atributos por si faltan en el HTML
    imgs.forEach((img, i) => {
      if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');
      if (!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async');

      // Opcional: prioriza las primeras visibles (mejora LCP)
      if (i < 4 && !img.hasAttribute('fetchpriority')) {
        img.setAttribute('fetchpriority', 'high');
      }
    });

    // IntersectionObserver para añadir una clase cuando realmente aparezcan (si la quieres usar)
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries, obs) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('in-view');
            obs.unobserve(e.target);
          }
        });
      }, { rootMargin: '200px 0px' });

      imgs.forEach(img => io.observe(img));
    }
  }
}