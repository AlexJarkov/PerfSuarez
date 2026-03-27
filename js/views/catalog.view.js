(function (App) {
    class GridPaginator {
        constructor(opts) {
            this.grid = typeof opts.gridEl === 'string' ? document.querySelector(opts.gridEl) : opts.gridEl;
            this.itemSelector = opts.itemSelector || '.decant';
            this.items = Array.from(this.grid ? this.grid.querySelectorAll(this.itemSelector) : []);
            this.controls = [];

            if (Array.isArray(opts.controls)) {
                opts.controls.forEach(control => this.attachControls(control));
            } else {
                this.attachControls(opts);
            }

            this.pageSize = this.getInitialPageSize();
            this.page = 1;
            this.bind();
        }

        query(selectorOrElement) {
            return typeof selectorOrElement === 'string' ? document.querySelector(selectorOrElement) : selectorOrElement;
        }

        attachControls(control) {
            const input = this.query(control.inputEl);
            const prev = this.query(control.prevEl);
            const next = this.query(control.nextEl);
            const status = this.query(control.statusEl);
            const wrapper = (input || prev || next || status) ? (input || prev || next || status).closest('.pagination-controls') : null;
            this.controls.push({ input, prev, next, status, wrapper });
        }

        getInitialPageSize() {
            for (const control of this.controls) {
                const value = parseInt(control.input?.value || '', 10);
                if (Number.isFinite(value) && value > 0) {
                    return value;
                }
            }

            return 30;
        }

        getUniverse() {
            return this.items.filter(element => element.style.display !== 'none');
        }

        getTotalPages() {
            return Math.max(1, Math.ceil(this.getUniverse().length / this.pageSize));
        }

        syncInputs() {
            this.controls.forEach(control => {
                if (control.input && control.input.value !== String(this.pageSize)) {
                    control.input.value = String(this.pageSize);
                }
            });
        }

        updateUi(totalPages) {
            this.controls.forEach(control => {
                if (control.status) {
                    control.status.textContent = `Página ${this.page} de ${totalPages}`;
                }
                if (control.prev) {
                    control.prev.disabled = this.page <= 1;
                }
                if (control.next) {
                    control.next.disabled = this.page >= totalPages;
                }
                if (control.wrapper) {
                    control.wrapper.style.display = totalPages > 1 ? '' : 'none';
                }
            });
            this.syncInputs();
        }

        render() {
            if (!this.grid) {
                return;
            }

            const universe = this.getUniverse();
            const totalPages = Math.max(1, Math.ceil(universe.length / this.pageSize));
            this.page = Math.min(Math.max(1, this.page), totalPages);

            const start = (this.page - 1) * this.pageSize;
            const end = start + this.pageSize;

            this.grid.classList.add('is-paging');
            this.items.forEach(item => item.classList.remove('pag-hidden'));
            universe.forEach((item, index) => {
                item.classList.toggle('pag-hidden', !(index >= start && index < end));
            });

            this.updateUi(totalPages);
            window.requestAnimationFrame(() => {
                setTimeout(() => this.grid.classList.remove('is-paging'), 100);
            });
        }

        refresh() {
            const totalPages = this.getTotalPages();
            if (this.page > totalPages) {
                this.page = totalPages;
            }
            this.render();
        }

        setPageSize(value) {
            const previous = this.pageSize;
            this.pageSize = Math.max(1, parseInt(value, 10) || 1);
            const startIndex = (this.page - 1) * previous;
            this.page = Math.floor(startIndex / this.pageSize) + 1;
            this.syncInputs();
            this.render();
        }

        bind() {
            this.controls.forEach(control => {
                control.prev?.addEventListener('click', () => {
                    this.page = Math.max(1, this.page - 1);
                    this.render();
                });

                control.next?.addEventListener('click', () => {
                    this.page = Math.min(this.getTotalPages(), this.page + 1);
                    this.render();
                });

                control.input?.addEventListener('change', () => {
                    const value = parseInt(control.input.value, 10);
                    this.setPageSize(Number.isFinite(value) && value > 0 ? value : 1);
                });
            });
        }
    }

    class LazyImages {
        constructor(selector) {
            this.selector = selector || '.perfume-grid img';
        }

        init() {
            const images = document.querySelectorAll(this.selector);

            images.forEach((image, index) => {
                if (!image.hasAttribute('loading')) {
                    image.setAttribute('loading', 'lazy');
                }
                if (!image.hasAttribute('decoding')) {
                    image.setAttribute('decoding', 'async');
                }
                if (index < 4 && !image.hasAttribute('fetchpriority')) {
                    image.setAttribute('fetchpriority', 'high');
                }
            });

            if (!('IntersectionObserver' in window)) {
                return;
            }

            const observer = new IntersectionObserver((entries, instance) => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) {
                        return;
                    }

                    entry.target.classList.add('in-view');
                    instance.unobserve(entry.target);
                });
            }, { rootMargin: '200px 0px' });

            images.forEach(image => observer.observe(image));
        }
    }

    App.views.catalog = {
        GridPaginator,
        LazyImages
    };
})(window.PerfSuarez);
