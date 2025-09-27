// ============================
// Script completo (solo JS) - carrito en tiempo real + mantiene tema/scroll
// ============================

(() => {
    // --- Estado del carrito (persistido) ---
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    // --- Utilidades ---
    const saveCart = () => {
        localStorage.setItem('cart', JSON.stringify(cart));
    };

    const updateCartBadge = () => {
        const badge = document.getElementById('cart-count');
        if (!badge) return;
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        badge.textContent = totalItems;
    };

    // --- Añadir producto ---
    const addToCart = (productId, name, price) => {
        const existingItem = cart.find(item => item.id == productId);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ id: productId, name: name, price: price, quantity: 1 });
        }
        saveCart();
        updateCartBadge();
        renderCart(); // <-- fuerza actualización inmediata (si el modal está abierto también se verá)
    };

    // --- Renderizar carrito (contenido del modal) ---
    const renderCart = () => {
        const container = document.getElementById('cart-items-container');
        const totalElement = document.getElementById('cart-total-price');
        const emptyMessage = document.getElementById('empty-cart-message');

        if (!container) return; // si no existe, no hacemos nada

        // Default para elementos opcionales
        if (totalElement === null && document.querySelector('#cart-total-price') === null) {
            // no hacemos crash si falta el elemento del total
        }

        let total = 0;

        if (cart.length === 0) {
            container.innerHTML = '';
            if (emptyMessage) emptyMessage.style.display = 'block';
            if (totalElement) totalElement.textContent = 'S/ 0.00';
            return;
        }

        if (emptyMessage) emptyMessage.style.display = 'none';

        let htmlContent = '';
        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;

            htmlContent += `
                <div class="d-flex align-items-center justify-content-between border-bottom py-2" data-index="${index}">
                    <div class="d-flex align-items-center">
                        <span class="fw-bold me-3 text-truncate" style="max-width: 250px;">${item.name}</span>
                        <span class="text-muted">(S/ ${item.price.toFixed(2)})</span>
                    </div>
                    <div class="d-flex align-items-center">
                        <div class="input-group input-group-sm me-3" style="width: 120px;">
                            <button class="btn btn-outline-secondary btn-decrease" type="button" data-index="${index}">-</button>
                            <input type="text" class="form-control text-center" value="${item.quantity}" readonly>
                            <button class="btn btn-outline-secondary btn-increase" type="button" data-index="${index}">+</button>
                        </div>
                        <span class="fw-bold me-3 text-success">S/ ${itemTotal.toFixed(2)}</span>
                        <button class="btn btn-sm btn-outline-danger btn-remove" data-index="${index}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = htmlContent;
        if (totalElement) totalElement.textContent = `S/ ${total.toFixed(2)}`;
    };

    // --- Manejar acciones del carrito (delegación) ---
    const handleCartAction = (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        const indexData = btn.getAttribute('data-index');
        if (indexData === null) return;

        const index = parseInt(indexData, 10);
        if (isNaN(index) || !cart[index]) return;

        if (btn.classList.contains('btn-increase')) {
            cart[index].quantity++;
        } else if (btn.classList.contains('btn-decrease')) {
            cart[index].quantity--;
            if (cart[index].quantity < 1) cart.splice(index, 1);
        } else if (btn.classList.contains('btn-remove')) {
            cart.splice(index, 1);
        } else {
            return;
        }

        saveCart();
        updateCartBadge();
        renderCart(); // refresca en tiempo real, aunque el modal ya esté abierto
    };

    // --- Finalizar compra ---
    const finishPurchaseHandler = function () {
        if (cart.length > 0) {
            const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2);
            const modalBody = document.querySelector('#cartModal .modal-body');
            if (modalBody) {
                modalBody.innerHTML = `
                    <div class="text-center py-4">
                        <i class="bi bi-check-circle-fill text-success" style="font-size: 3rem;"></i>
                        <h4 class="mt-3">¡Compra Exitosa!</h4>
                        <p class="lead">Gracias por tu pedido. El total de la compra simulada fue: 
                        <span class="fw-bold text-success">S/ ${total}</span>.</p>
                        <p>La página se recargará en 3 segundos para comenzar una nueva sesión.</p>
                    </div>
                `;
            }

            this.style.display = 'none';
            const closeBtn = document.querySelector('.modal-footer .btn-secondary-custom');
            if (closeBtn) closeBtn.textContent = 'Cerrar';

            cart = [];
            saveCart();
            updateCartBadge();
            renderCart();

            setTimeout(() => window.location.reload(), 3000);
        } else {
            const emptyMessage = document.getElementById('empty-cart-message');
            if (emptyMessage) {
                emptyMessage.textContent = 'Por favor, añade productos al carrito antes de finalizar la compra.';
                emptyMessage.classList.add('text-danger');
                setTimeout(() => {
                    emptyMessage.textContent = 'El carrito está vacío.';
                    emptyMessage.classList.remove('text-danger');
                }, 3000);
            }
        }
    };

    // --- Inicialización y binding de eventos ---
    document.addEventListener('DOMContentLoaded', function () {
        // Bind botones "Añadir al carrito"
        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', function () {
                const id = this.getAttribute('data-id');
                const name = this.getAttribute('data-name') || this.dataset.name;
                const price = parseFloat(this.getAttribute('data-price') || this.dataset.price);
                if (!id || !name || isNaN(price)) {
                    console.warn('add-to-cart-btn: faltan atributos data-id/data-name/data-price');
                    return;
                }
                addToCart(id, name, price);
            });
        });

        // Delegación en el contenedor del modal (si existe)
        const cartContainer = document.getElementById('cart-items-container');
        if (cartContainer) {
            cartContainer.addEventListener('click', handleCartAction);
        }

        // Garantizar que al abrir el modal se renderice la versión más reciente
        const cartModal = document.getElementById('cartModal');
        if (cartModal) {
            // 'shown.bs.modal' se dispara cuando el modal ya está completamente visible
            cartModal.addEventListener('shown.bs.modal', renderCart);
        }

        // Botón finalizar compra
        const finishBtn = document.getElementById('finish-purchase-btn');
        if (finishBtn) finishBtn.addEventListener('click', finishPurchaseHandler);

        // Inicializar badge y render inicial (por si ya hay items guardados)
        updateCartBadge();
        renderCart();

        // --- Mantengo tu lógica de scroll y tema exactamente como la tenías ---
        // Script para el desplazamiento suave
        const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
        navLinks.forEach(link => {
            link.addEventListener('click', function (e) {
                if (this.getAttribute('href').startsWith('#')) {
                    e.preventDefault();
                    let targetId = this.getAttribute('href');
                    let targetElement = document.querySelector(targetId);

                    if (targetElement) {
                        let navbarHeight = document.querySelector('.navbar').offsetHeight;
                        let targetPosition = targetElement.offsetTop - navbarHeight;
                        window.scrollTo({ top: targetPosition, behavior: 'smooth' });
                    }
                }
                const navbarCollapse = document.querySelector('.navbar-collapse');
                if (navbarCollapse && navbarCollapse.classList.contains('show')) {
                    const bsCollapse = new bootstrap.Collapse(navbarCollapse, { toggle: false });
                    bsCollapse.hide();
                }
            });
        });

        // --- Lógica del Selector de Tema (idéntica a la tuya) ---
        const getStoredTheme = () => localStorage.getItem('theme');
        const setStoredTheme = theme => localStorage.setItem('theme', theme);

        const getPreferredTheme = () => {
            const storedTheme = getStoredTheme();
            if (storedTheme) return storedTheme;
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        };

        const setTheme = theme => {
            let themeToSet = theme;
            if (theme === 'auto') {
                themeToSet = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }
            document.documentElement.setAttribute('data-bs-theme', themeToSet);
        };

        const showActiveTheme = (theme) => {
            const activeThemeIcon = document.querySelector('.theme-icon-active');
            const btnToActive = document.querySelector(`[data-bs-theme-value="${theme}"]`);
            const iconClass = {
                'light': 'bi-sun-fill',
                'dark': 'bi-moon-stars-fill',
                'auto': 'bi-circle-half'
            }[theme];

            document.querySelectorAll('[data-bs-theme-value]').forEach(el => el.classList.remove('active'));
            if (btnToActive) btnToActive.classList.add('active');
            if (activeThemeIcon) activeThemeIcon.className = `bi ${iconClass} theme-icon-active my-1`;
        };

        const currentTheme = getPreferredTheme();
        setTheme(currentTheme);
        showActiveTheme(currentTheme);

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (getStoredTheme() === 'auto') {
                const newTheme = getPreferredTheme();
                setTheme(newTheme);
                showActiveTheme(newTheme);
            }
        });

        document.querySelectorAll('[data-bs-theme-value]').forEach(toggle => {
            toggle.addEventListener('click', () => {
                const theme = toggle.getAttribute('data-bs-theme-value');
                setStoredTheme(theme);
                setTheme(theme);
                showActiveTheme(theme);
            });
        });
    });
})(); // fin IIFE
