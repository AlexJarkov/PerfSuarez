(function (App) {
    async function fetchHtmlDocument(path) {
        const response = await fetch(path);
        const html = await response.text();
        const parser = new DOMParser();
        return parser.parseFromString(html, 'text/html');
    }

    async function searchPages(files, query) {
        const results = [];

        await Promise.all(files.map(async (file) => {
            try {
                const doc = await fetchHtmlDocument(file);
                const items = Array.from(doc.querySelectorAll('.perfume, .decant'));

                items.forEach(item => {
                    const name = item.getAttribute('data-name') || '';
                    const brand = (item.getAttribute('data-brand') || '').toLowerCase();
                    if (name.toLowerCase().includes(query) || brand.includes(query)) {
                        results.push({
                            type: item.classList.contains('perfume') ? 'perfume' : 'decant',
                            node: item.cloneNode(true)
                        });
                    }
                });
            } catch (error) {
                console.error(`Error al cargar el archivo: ${file}`, error);
            }
        }));

        return results;
    }

    App.models.search = {
        searchPages
    };
})(window.PerfSuarez);
