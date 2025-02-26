document.addEventListener('DOMContentLoaded', () => {
    const comboTypeSelect = document.getElementById('combo-type');
    const decantQuantitySelect = document.getElementById('decant-quantity');
    const decantQuantityContainer = document.getElementById('decant-quantity-container');
    const comboItemsContainer = document.getElementById('combo-items');
    const whatsappLink = document.getElementById('whatsapp-link');
    
    let products = {
        perfumes: [],
        decants: []
    };

    // Cargar productos inicialmente
    loadProducts();

    async function loadProducts() {
        try {
            products.perfumes = await fetchProducts('perfumes');
            products.decants = await fetchProducts('decants');
            populateComboItems();
        } catch (error) {
            console.error('Error cargando productos:', error);
        }
    }

    async function fetchProducts(category) {
        const file = `${category}.html`;
        try {
            const response = await fetch(file);
            const text = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            
            return Array.from(doc.querySelectorAll(`.${category}`)).map(element => {
                const prices = Array.from(element.querySelectorAll('p'))
                    .filter(p => p.textContent.match(/(\d+)\s*ml\s*-\s*([\d.]+)/))
                    .map(p => {
                        const match = p.textContent.match(/(\d+)\s*ml\s*-\s*([\d.]+)/);
                        return {
                            size: parseInt(match[1]),
                            price: parseFloat(match[2])
                        };
                    }).sort((a, b) => a.size - b.size);

                return {
                    name: element.dataset.name,
                    image: element.querySelector('img').src,
                    prices: prices,
                    cost: parseFloat(element.dataset.cost || 0),
                    tags: element.dataset.tags || ''
                };
            });
        } catch (error) {
            console.error(`Error cargando ${file}:`, error);
            return [];
        }
    }

    function toggleComboType() {
        const type = comboTypeSelect.value;
        decantQuantityContainer.classList.toggle('hidden', type !== 'decants');
        populateComboItems();
    }

    function populateComboItems() {
        comboItemsContainer.innerHTML = '';
        const type = comboTypeSelect.value;
        const count = type === 'decants' ? parseInt(decantQuantitySelect.value) : 3;

        for (let i = 0; i < count; i++) {
            comboItemsContainer.appendChild(createComboItem(type, i));
        }

        if (type === 'perfumes') {
            comboItemsContainer.appendChild(createGiftSelector());
        }

        handleResize();
    }

    function createComboItem(type, index) {
        const item = document.createElement('div');
        item.className = 'combo-item';
        item.innerHTML = `
            <div class="combo-selection">
                <img src="imagenes/image.webp" alt="${type}" id="${type}-image-${index}">
                <h3>${type === 'perfumes' ? 'Perfume' : 'Decant'} ${index + 1}</h3>
                <p id="${type}-name-${index}"></p>
                <button class="dropdown-toggle">Seleccionar</button>
                <div class="dropdown" id="${type}-dropdown-${index}"></div>
            </div>
        `;

        const dropdown = item.querySelector('.dropdown');
        populateDropdown(type, index, dropdown);
        setupDropdownToggle(item);

        return item;
    }

    function populateDropdown(type, index, dropdown) {
        const filteredProducts = type === 'perfumes' 
            ? products.perfumes.filter(p => (p.cost + 50) * 1.354 > p.prices[0].price)
            : products.decants;

        filteredProducts.forEach(product => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.innerHTML = `
                <img src="${product.image}" alt="${product.name}">
                <p>${product.name}</p>
            `;
            item.onclick = () => selectProduct(type, index, product, dropdown.parentElement);
            dropdown.appendChild(item);
        });
    }

    function selectProduct(type, index, product, container) {
        const selection = container.querySelector('.combo-selection');
        selection.querySelector(`#${type}-name-${index}`).textContent = product.name;
        selection.querySelector(`#${type}-image-${index}`).src = product.image;

        // Crear selector de tamaño
        const sizeContainer = document.createElement('div');
        sizeContainer.className = 'size-selector-container visible';
        sizeContainer.innerHTML = `
            <select class="size-selector" data-product-id="${type}-${index}">
                ${product.prices.map(price => `
                    <option value="${price.price}">${price.size}ml - ${type === 'decants' ? 'Bs' : '$'}${price.price.toFixed(2)}</option>
                `).join('')}
            </select>
        `;

        sizeContainer.querySelector('select').addEventListener('change', updateTotal);
        selection.querySelector('.size-selector-container')?.remove();
        selection.appendChild(sizeContainer);
        
        updateTotal();
    }

    function createGiftSelector() {
        const gifts = [
            { name: 'Waka', image: 'imagenes/waka.webp' },
            { name: 'Vela aromática', image: 'imagenes/vela.jpg' }
        ];

        const item = document.createElement('div');
        item.className = 'combo-item';
        item.innerHTML = `
            <div class="combo-selection">
                <img src="imagenes/gift.jpg" alt="Regalo" id="gift-image">
                <h3>Regalo</h3>
                <p id="gift-name"></p>
                <button class="dropdown-toggle">Seleccionar Regalo</button>
                <div class="dropdown" id="gift-dropdown"></div>
            </div>
        `;

        const dropdown = item.querySelector('.dropdown');
        gifts.forEach(gift => {
            const giftItem = document.createElement('div');
            giftItem.className = 'dropdown-item';
            giftItem.innerHTML = `
                <img src="${gift.image}" alt="${gift.name}">
                <p>${gift.name}</p>
            `;
            giftItem.onclick = () => {
                item.querySelector('#gift-name').textContent = gift.name;
                item.querySelector('#gift-image').src = gift.image;
                updateTotal();
            };
            dropdown.appendChild(giftItem);
        });

        setupDropdownToggle(item);
        return item;
    }

    function setupDropdownToggle(container) {
        const toggle = container.querySelector('.dropdown-toggle');
        const dropdown = container.querySelector('.dropdown');
        
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
            closeOtherDropdowns(dropdown);
        });
    }

    function closeOtherDropdowns(current) {
        document.querySelectorAll('.dropdown').forEach(d => {
            if (d !== current) d.classList.remove('show');
        });
    }

    function updateTotal() {
        let total = 0;
        let originalTotal = 0;
        let selectedCount = 0;

        document.querySelectorAll('.combo-item').forEach(item => {
            const selector = item.querySelector('.size-selector');
            if (selector) {
                const price = parseFloat(selector.value);
                total += price;
                selectedCount++;
            }
        });

        document.getElementById('total-price').textContent = total.toFixed(2);
        updateWhatsappLink(total);
        updateWhatsappButton(selectedCount);
    }

    function updateWhatsappButton(selectedCount) {
        const required = comboTypeSelect.value === 'decants' 
            ? parseInt(decantQuantitySelect.value)
            : 3;

        whatsappLink.classList.toggle('disabled', selectedCount < required);
    }

    function updateWhatsappLink(total) {
        const type = comboTypeSelect.value;
        const currency = type === 'decants' ? 'Bs' : '$';
        let message = `¡Hola! Quiero armar mi combo de ${type}:\n\n`;

        document.querySelectorAll('.combo-item').forEach((item, index) => {
            const name = item.querySelector('[id$="-name"]')?.textContent;
            const size = item.querySelector('.size-selector')?.selectedOptions[0]?.textContent;
            
            if (name) {
                message += `➤ ${name}${size ? ` (${size})` : ''}\n`;
            }
        });

        message += `\nTotal: ${currency} ${total.toFixed(2)}`;
        whatsappLink.href = `https://wa.me/78064327?text=${encodeURIComponent(message)}`;
    }

    function handleResize() {
        comboItemsContainer.style.gridTemplateColumns = window.innerWidth < 768 
            ? '1fr' 
            : 'repeat(auto-fill, minmax(250px, 1fr))';
    }

    // Event Listeners
    comboTypeSelect.addEventListener('change', toggleComboType);
    decantQuantitySelect.addEventListener('change', populateComboItems);
    window.addEventListener('resize', handleResize);
    document.addEventListener('click', closeOtherDropdowns.bind(null, null));

    // Inicialización
    handleResize();
});