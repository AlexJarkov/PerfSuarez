// js/grid-paginator.js
class GridPaginator {
  /**
   * @param {{
   *  gridEl: Element|string,
   *  itemSelector?: string,
   *  inputEl: HTMLInputElement|string,
   *  prevEl: HTMLButtonElement|string,
   *  nextEl: HTMLButtonElement|string,
   *  statusEl: Element|string,
   *  onPageChange?: (page:number, total:number)=>void
   * }} opts
   */
  constructor(opts) {
    this.grid = typeof opts.gridEl === 'string' ? document.querySelector(opts.gridEl) : opts.gridEl;
    this.itemSelector = opts.itemSelector || '.decant';
    this.input = typeof opts.inputEl === 'string' ? document.querySelector(opts.inputEl) : opts.inputEl;
    this.prevBtn = typeof opts.prevEl === 'string' ? document.querySelector(opts.prevEl) : opts.prevEl;
    this.nextBtn = typeof opts.nextEl === 'string' ? document.querySelector(opts.nextEl) : opts.nextEl;
    this.statusEl = typeof opts.statusEl === 'string' ? document.querySelector(opts.statusEl) : opts.statusEl;
    this.onPageChange = typeof opts.onPageChange === 'function' ? opts.onPageChange : null;

    this.currentPage = 1;
    this.pageSize = Math.max(1, parseInt(this.input?.value || '12', 10));
    this.items = Array.from(this.grid.querySelectorAll(this.itemSelector));
    this._bind();
  }

  _bind() {
    if (this.input) {
      this.input.addEventListener('input', () => {
        const v = parseInt(this.input.value, 10);
        this.setPageSize(Number.isFinite(v) && v > 0 ? v : 1);
      });
    }
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => this.prev());
    }
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => this.next());
    }

    // Recalcula si cambian el tamaño de ventana (opcional)
    window.addEventListener('resize', () => this._updateStatusOnly());
  }

  /** Devuelve los ítems que están visibles tras filtros (display != 'none') */
  _visibleItems() {
    return this.items.filter(el => el.offsetParent !== null && getComputedStyle(el).display !== 'none');
  }

  /** Total de páginas con el pageSize actual */
  _totalPages(visibleCount) {
    const count = visibleCount ?? this._visibleItems().length;
    return Math.max(1, Math.ceil(count / this.pageSize));
  }

  setPageSize(n) {
    const oldSize = this.pageSize;
    this.pageSize = Math.max(1, n);

    // Mantener inicio de rango cuando se cambia el tamaño de página
    const startIndex = (this.currentPage - 1) * oldSize;
    this.currentPage = Math.floor(startIndex / this.pageSize) + 1;

    this.render();
  }

  goTo(page) {
    const total = this._totalPages();
    this.currentPage = Math.min(Math.max(1, page), total);
    this.render();
  }

  next() { this.goTo(this.currentPage + 1); }
  prev() { this.goTo(this.currentPage - 1); }

  /** Llamar luego de aplicar filtros/búsqueda para recalcular y redibujar */
  refresh() {
    // clamp y render
    const total = this._totalPages();
    if (this.currentPage > total) this.currentPage = total;
    this.render();
  }

  _updateStatusOnly() {
    const total = this._totalPages();
    if (this.statusEl) {
      this.statusEl.textContent = `Página ${this.currentPage} de ${total}`;
    }
    if (this.prevBtn) this.prevBtn.disabled = this.currentPage <= 1;
    if (this.nextBtn) this.nextBtn.disabled = this.currentPage >= total;
  }

  render() {
    const allVisible = this._visibleItems(); // ya filtrados por tus controles
    const total = Math.max(1, Math.ceil(allVisible.length / this.pageSize));
    this.currentPage = Math.min(Math.max(1, this.currentPage), total);

    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    // Efecto suave
    this.grid.classList.add('is-paging');

    // Primero limpia el estado
    this.items.forEach(el => el.classList.remove('pag-hidden'));

    // Luego oculta los visibles que quedan fuera del rango
    allVisible.forEach((el, idx) => {
      el.classList.toggle('pag-hidden', !(idx >= start && idx < end));
    });

    // Ítems no visibles por filtros ya están ocultos (display:none), no tocamos eso.
    this._updateStatusOnly();

    if (this.onPageChange) {
      this.onPageChange(this.currentPage, total);
    }

    // Quita efecto
    window.requestAnimationFrame(() => {
      setTimeout(() => this.grid.classList.remove('is-paging'), 100);
    });
  }
}