document.addEventListener("DOMContentLoaded", function() {
    const head = document.querySelector("head");

    // Crear las etiquetas meta para Open Graph
    const ogTitle = document.createElement("meta");
    ogTitle.setAttribute("property", "og:title");
    ogTitle.setAttribute("content", "Perfumería Suárez");
    head.appendChild(ogTitle);

    const ogDescription = document.createElement("meta");
    ogDescription.setAttribute("property", "og:description");
    ogDescription.setAttribute("content", "Descubre nuestra nueva colección de perfumes nicho para decants!.");
    head.appendChild(ogDescription);

    const ogImage = document.createElement("meta");
    ogImage.setAttribute("property", "og:image");
    ogImage.setAttribute("content", "..\imagenes\miniatura.JPEG");
    head.appendChild(ogImage);

    const ogUrl = document.createElement("meta");
    ogUrl.setAttribute("property", "og:url");
    ogUrl.setAttribute("content", "https://www.perfumeriasuarez.com");
    head.appendChild(ogUrl);

    const ogType = document.createElement("meta");
    ogType.setAttribute("property", "og:type");
    ogType.setAttribute("content", "website");
    head.appendChild(ogType);
});
