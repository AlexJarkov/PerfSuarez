document.addEventListener('DOMContentLoaded', () => {

    const combos = document.querySelectorAll('.combo');

    combos.forEach(combo => {
        combo.addEventListener('click', (e) => {
            e.preventDefault();
            const whatsappNumber = combo.getAttribute('data-whatsapp');
            const nomCombo = combo.getAttribute('data-combo');
            const confirmation = confirm('¿Desea continuar a WhatsApp para realizar su consulta?');

            if (confirmation) {
                window.open(`https://wa.me/${whatsappNumber}/?text=Hola!%20Quisiera%20pedir%20el%20${nomCombo}!`, '_blank');
            }
        });
    });

});

document.addEventListener('DOMContentLoaded', () => {
    const perfumes = document.querySelectorAll('.perfume');

    // Añade un filtro basado en etiquetas
    const filterPerfumes = (tag) => {
        perfumes.forEach(perfume => {
            if (perfume.getAttribute('data-tags').includes(tag)) {
                perfume.style.display = 'block';
            } else {
                perfume.style.display = 'none';
            }
        });
    };

    // Ejemplo de uso del filtro
    // filterPerfumes('mas-vendido'); // Muestra solo los perfumes con la etiqueta "más vendido"
});

document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menu-toggle');
    const menu = document.getElementById('menu');

    menuToggle.addEventListener('click', () => {
        menu.classList.toggle('show');
    });
});