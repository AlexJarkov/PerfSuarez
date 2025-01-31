const filesToSearch = [
    '../decants.html',
    '../perfumes.html',
];

// Consulta de búsqueda del usuario
const searchQuery = new URLSearchParams(window.location.search).get('q').toLowerCase();

// Muestra la consulta de búsqueda en la página
document.getElementById('search-query').textContent = searchQuery;

const perfumeResultsDiv = document.getElementById('perfumes');
const decantResultsDiv = document.getElementById('decants');
let perfumeFound = false;
let decantFound = false;

// Función para buscar en el contenido cargado y copiar todo el bloque del perfume o decant
function searchInContent(html, query) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const items = doc.querySelectorAll('.perfume, .decant');

    items.forEach(item => {
        const name = item.getAttribute('data-name');
        const brand = item.getAttribute('data-brand') ? item.getAttribute('data-brand').toLowerCase() : '';

        if (name.toLowerCase().includes(query) || brand.includes(query)) {
            // Simplemente clona el elemento HTML encontrado y lo inserta en la página de resultados
            const clonedItem = item.cloneNode(true);

            if (item.classList.contains('perfume')) {
                perfumeResultsDiv.appendChild(clonedItem);
                perfumeFound = true;
            } else if (item.classList.contains('decant')) {
                decantResultsDiv.appendChild(clonedItem);
                decantFound = true;
            }
        }
    });

    // Añadir el listener de click a los decants después de ser generados
    addDecantClickListener();
}



// Función para añadir los listeners de click a los decants
function addDecantClickListener() {
    const decants = document.querySelectorAll('.decant');
    decants.forEach(decant => {
        decant.addEventListener('click', () => {
            const name = decant.getAttribute('data-name');
            sendToWhatsApp(name);
        });
    });
}


// Cargar cada archivo HTML y buscar
filesToSearch.forEach(file => {
    fetch(file)
        .then(response => response.text())
        .then(html => {
            searchInContent(html, searchQuery);
        })
        .catch(err => {
            console.log('Error al cargar el archivo: ' + file, err);
        });
});

// Verifica si no se encontraron perfumes o decants después de la búsqueda
window.onload = () => {
    if (!perfumeFound) {
        perfumeResultsDiv.innerHTML = '<p>Perdón pariente... No tenemos perfumes que coincidan con tu búsqueda :(.</p>';
    }

    if (!decantFound) {
        decantResultsDiv.innerHTML = '<p>Perdón pariente... No tenemos decants que coincidan con tu búsqueda :(.</p>';
    }
};

document.getElementById('search-icon').addEventListener('click', function() {
    const searchInput = document.getElementById('search-input');
    searchInput.classList.toggle('active'); // Activa y desactiva el cuadro de búsqueda
    searchInput.focus(); // Focaliza automáticamente el cuadro de búsqueda
});
