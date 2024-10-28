document.addEventListener('DOMContentLoaded', function() {
    const includes = document.querySelectorAll('[data-include]');
    includes.forEach(el => {
        const file = el.getAttribute('data-include');
        fetch(file)
            .then(response => response.text())
            .then(data => {
                el.innerHTML = data;
                if (file.includes('header.html')) { // Verificar que el header se incluya correctamente
                    const menuToggle = document.getElementById('menu-toggle');
                    const menu = document.getElementById('menu');
                    const overlay = document.getElementById('overlay');
                    if (menuToggle && menu && overlay) {
                        menuToggle.addEventListener('click', () => {
                            menu.classList.toggle('show');
                            overlay.classList.toggle('show');
                        });
                        overlay.addEventListener('click', () => {
                            menu.classList.remove('show');
                            overlay.classList.remove('show');
                        });
                    }
                }
            })
            .catch(error => console.error('Error loading include:', error));
    });
});