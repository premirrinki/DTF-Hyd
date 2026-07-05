/**
 * DTF Hyderabad - Core Application Controller
 * Handles drawing items, managing sidebar drawers, popup modals, client-side accounts,
 * custom toasts alerts, and FAQ accordions.
 */

class AppController {
    constructor() {
        this.toastContainer = null;
        this.activeCategory = 'all';
    }

    init() {
        this.toastContainer = document.getElementById('toast-container');
        this.renderProducts();
        this.bindEvents();
        this.updateCartBadge();
        this.updateWishlistBadge();
        this.updateHeaderAuthStatus();
        this.initEventListeners();
    }

    // -------------------------------------------------------------
    // EVENT LISTENERS & DRAWER/MODAL TOGGLES
    // -------------------------------------------------------------
    bindEvents() {
        // Drawer toggles - Cart Drawer
        const cartTriggers = document.querySelectorAll('.cart-trigger, .view-cart-btn');
        const cartDrawer = document.getElementById('cart-drawer');
        const cartOverlay = document.getElementById('cart-overlay');
        const closeCart = document.getElementById('close-cart');

        const openCartDrawer = () => {
            this.renderCartDrawer();
            cartDrawer.classList.add('active');
            cartOverlay.classList.add('active');
        };

        const closeCartDrawer = () => {
            cartDrawer.classList.remove('active');
            cartOverlay.classList.remove('active');
        };

        cartTriggers.forEach(btn => btn.addEventListener('click', (e) => { e.preventDefault(); openCartDrawer(); }));
        if (closeCart) closeCart.addEventListener('click', closeCartDrawer);
        if (cartOverlay) cartOverlay.addEventListener('click', closeCartDrawer);

        // Drawer toggles - Wishlist Drawer
        const wishlistTriggers = document.querySelectorAll('[aria-label="Wishlist"]');
        const wishlistDrawer = document.getElementById('wishlist-drawer');
        const wishlistOverlay = document.getElementById('wishlist-overlay');
        const closeWishlist = document.getElementById('close-wishlist');

        const openWishlistDrawer = () => {
            this.renderWishlistDrawer();
            wishlistDrawer.classList.add('active');
            wishlistOverlay.classList.add('active');
        };

        const closeWishlistDrawer = () => {
            wishlistDrawer.classList.remove('active');
            wishlistOverlay.classList.remove('active');
        };

        wishlistTriggers.forEach(btn => btn.addEventListener('click', (e) => { e.preventDefault(); openWishlistDrawer(); }));
        if (closeWishlist) closeWishlist.addEventListener('click', closeWishlistDrawer);
        if (wishlistOverlay) wishlistOverlay.addEventListener('click', closeWishlistDrawer);

        // Modal toggles - User Accounts Authentication Modal
        const userTriggers = document.querySelectorAll('[aria-label="User Account"]');
        const authModal = document.getElementById('auth-modal');
        const closeAuth = document.getElementById('close-auth');

        const openAuthModal = () => {
            this.renderAuthModal();
            authModal.classList.add('active');
        };

        const closeAuthModal = () => {
            authModal.classList.remove('active');
        };

        userTriggers.forEach(btn => btn.addEventListener('click', (e) => { e.preventDefault(); openAuthModal(); }));
        if (closeAuth) closeAuth.addEventListener('click', closeAuthModal);
        if (authModal) authModal.addEventListener('click', (e) => {
            if (e.target === authModal) closeAuthModal();
        });

        // Bind place checkout button inside Cart Drawer -> Redirects directly to checkout page!
        document.addEventListener('click', (e) => {
            if (e.target && e.target.classList.contains('btn-drawer-checkout')) {
                const cart = window.Store.getCart();
                if (cart.length === 0) {
                    this.showToast("Your cart is empty. Add products first!", "warning");
                    return;
                }
                closeCartDrawer();
                window.location.href = 'checkout.html';
            }
        });

        // Tabs Toggle inside Auth Modal
        document.addEventListener('click', (e) => {
            if (e.target && e.target.classList.contains('auth-tab')) {
                document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.remove('active'));
                document.querySelectorAll('.auth-form-panel').forEach(p => p.classList.remove('active'));
                
                e.target.classList.add('active');
                const targetForm = document.getElementById(e.target.dataset.target);
                if (targetForm) targetForm.classList.add('active');
            }
        });

        // Bind standard wholesale calculator
        const bulkQtyInput = document.getElementById('bulk-qty');
        if (bulkQtyInput) {
            bulkQtyInput.addEventListener('input', () => {
                const qty = parseInt(bulkQtyInput.value) || 0;
                const config = window.StoreConfig || { wholesaleTiers: [] };
                let activePrice = 299;
                
                const matchedTier = config.wholesaleTiers.find(t => qty >= t.minQuantity);
                if (matchedTier) {
                    activePrice = matchedTier.pricePerSheet;
                }
                
                const wholesalePriceText = document.getElementById('wholesale-price');
                if (wholesalePriceText) {
                    wholesalePriceText.innerText = `₹${activePrice}`;
                }
            });
        }
    }

    // Subscribe to events dispatched by window.Store
    initEventListeners() {
        window.addEventListener('cartUpdated', () => {
            this.updateCartBadge();
            this.renderCartDrawer();
        });

        window.addEventListener('wishlistUpdated', () => {
            this.updateWishlistBadge();
            this.renderWishlistDrawer();
            // Re-render product grids to reflect active wishlist states
            this.renderProducts();
        });

        window.addEventListener('authUpdated', () => {
            this.updateHeaderAuthStatus();
            this.renderAuthModal();
        });
    }

    // -------------------------------------------------------------
    // RENDER PRODUCT GRID
    // -------------------------------------------------------------
    renderProducts() {
        const container = document.getElementById('featured-products-container');
        if (!container) return;

        // Get merged product list
        const products = window.Store.getAllProducts();

        // Render HTML for active products only, filtered by category
        let activeProducts = products.filter(p => p.isAvailable);
        if (this.activeCategory !== 'all') {
            activeProducts = activeProducts.filter(p => p.category === this.activeCategory);
        }

        if (activeProducts.length === 0) {
            container.innerHTML = `
                <div style="grid-column: span 4; text-align: center; color: #64748b; padding: 60px 0; font-family: var(--font-main);">
                    <i class="fas fa-box-open" style="font-size: 3rem; margin-bottom: 12px; display: block; color: #94a3b8;"></i>
                    <h3>No items available in this category</h3>
                    <p style="font-size: 0.9rem; margin-top: 4px;">Check back later or browse other categories.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = activeProducts.map(prod => {
            const isOutOfStock = prod.stock === 0;
            const inWishlist = window.Store.isInWishlist(prod.id);
            
            return `
                <div class="product-card" data-id="${prod.id}">
                    <div class="product-image-container">
                        <span class="discount-badge">${prod.discount || 'SALE'}</span>
                        ${isOutOfStock ? `
                            <span class="stock-status-badge" style="background-color: #ef4444;">OUT OF STOCK</span>
                        ` : `
                            <span class="stock-status-badge">${prod.stock <= 15 ? 'Only ' + prod.stock + ' Left!' : 'In Stock'}</span>
                        `}
                        <button class="wishlist-btn ${inWishlist ? 'active' : ''}" onclick="window.App.toggleWishlist(${prod.id})" aria-label="Add to Wishlist">
                            <i class="${inWishlist ? 'fas' : 'far'} fa-heart"></i>
                        </button>
                        <img src="${prod.img}" alt="${prod.title}" class="product-img" loading="lazy">
                    </div>

                    <div class="product-details">
                        <a href="#" class="product-title" onclick="event.preventDefault()">${prod.title}</a>
                        <div class="rating-container">
                            <i class="fas fa-star"></i>
                            <span>${prod.rating}</span>
                            <span class="rating-count">(${prod.reviews})</span>
                        </div>
                        <div class="price-container">
                            <span class="offer-price">₹${prod.price}</span>
                            <span class="old-price">₹${prod.oldPrice}</span>
                        </div>
                    </div>

                    <div class="product-configs">
                        <select class="size-selector" id="size-select-${prod.id}">
                            <option value="a3">A3 Size</option>
                            <option value="a4">A4 Size (60% Price)</option>
                            <option value="meter">Per Meter Layer (1.8x Price)</option>
                        </select>
                        <div class="qty-container">
                            <button class="qty-btn" onclick="window.App.adjustQtyElement(${prod.id}, -1)">-</button>
                            <input type="text" id="qty-input-${prod.id}" class="qty-input" value="1" readonly>
                            <button class="qty-btn" onclick="window.App.adjustQtyElement(${prod.id}, 1)">+</button>
                        </div>
                    </div>

                    <div class="product-actions">
                        <button class="btn-card btn-add-cart" ${isOutOfStock ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''} onclick="window.App.handleAddToCart(${prod.id})">
                            <i class="fas fa-shopping-cart"></i> Add to Cart
                        </button>
                        <button class="btn-card btn-buy-now" ${isOutOfStock ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''} onclick="window.App.handleBuyNow(${prod.id})">
                            Buy Now
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Category filter engine
    filterCategory(category, btn = null) {
        this.activeCategory = category;
        this.renderProducts();

        // Highlight selected buttons in filter bar
        document.querySelectorAll('.filter-btn').forEach(button => {
            button.classList.remove('active');
            if (button.getAttribute('onclick') && button.getAttribute('onclick').includes(`'${category}'`)) {
                button.classList.add('active');
            }
        });

        if (btn) {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        }

        // Scroll view to shop container
        const shopSection = document.getElementById('shop');
        if (shopSection) {
            shopSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // Adjust UI quantity node values
    adjustQtyElement(id, change) {
        const input = document.getElementById(`qty-input-${id}`);
        if (!input) return;
        let val = parseInt(input.value) || 1;
        val = Math.max(1, val + change);
        input.value = val;
    }

    handleAddToCart(productId) {
        const sizeSelect = document.getElementById(`size-select-${productId}`);
        const qtyInput = document.getElementById(`qty-input-${productId}`);
        const size = sizeSelect ? sizeSelect.value : 'a3';
        const qty = qtyInput ? parseInt(qtyInput.value) : 1;

        try {
            window.Store.addToCart(productId, size, qty);
            this.showToast("Added item to your cart!", "success");
        } catch (err) {
            this.showToast(err.message, "error");
        }
    }

    handleBuyNow(productId) {
        const sizeSelect = document.getElementById(`size-select-${productId}`);
        const qtyInput = document.getElementById(`qty-input-${productId}`);
        const size = sizeSelect ? sizeSelect.value : 'a3';
        const qty = qtyInput ? parseInt(qtyInput.value) : 1;

        try {
            window.Store.addToCart(productId, size, qty);
            // Close other drawers
            const cartDrawer = document.getElementById('cart-drawer');
            const cartOverlay = document.getElementById('cart-overlay');
            if (cartDrawer) cartDrawer.classList.remove('active');
            if (cartOverlay) cartOverlay.classList.remove('active');
            
            // Redirect straight to checkout page
            window.location.href = 'checkout.html';
        } catch (err) {
            this.showToast(err.message, "error");
        }
    }

    toggleWishlist(productId) {
        const added = window.Store.toggleWishlist(productId);
        if (added) {
            this.showToast("Saved product to Wishlist!", "success");
        } else {
            this.showToast("Removed product from Wishlist.", "info");
        }
    }

    // -------------------------------------------------------------
    // RENDER DRAWERS CONTENT
    // -------------------------------------------------------------
    renderCartDrawer() {
        const drawerItemsContainer = document.getElementById('cart-drawer-items');
        if (!drawerItemsContainer) return;

        const totals = window.Store.getCartTotals();

        if (totals.items.length === 0) {
            drawerItemsContainer.innerHTML = `
                <div class="drawer-empty">
                    <i class="fas fa-shopping-bag"></i>
                    <h3>Your Cart is Empty</h3>
                    <p>Start browsing our custom DTF transfers and add sheets to your cart.</p>
                </div>
            `;
            document.getElementById('cart-drawer-footer').style.display = 'none';
            return;
        }

        document.getElementById('cart-drawer-footer').style.display = 'flex';

        // Draw items
        drawerItemsContainer.innerHTML = totals.items.map(item => {
            const sizeLabel = item.size === 'a3' ? 'A3 Size' : (item.size === 'a4' ? 'A4 Size' : 'Per Meter');
            return `
                <div class="drawer-item">
                    <div class="item-img-wrapper">
                        <img src="${item.img}" alt="${item.title}">
                    </div>
                    <div class="item-details">
                        <h4>${item.title}</h4>
                        <div class="item-meta">Size: <span>${sizeLabel}</span></div>
                        <div class="item-price">₹${item.price} <small style="color: #64748b; font-weight: normal;">each</small></div>
                    </div>
                    <div class="item-actions">
                        <button class="btn-remove-item" onclick="window.Store.removeFromCart(${item.id}, '${item.size}')">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                        <div class="drawer-qty">
                            <button class="drawer-qty-btn" onclick="window.App.updateCartQty(${item.id}, '${item.size}', ${item.quantity - 1})">-</button>
                            <input type="text" class="drawer-qty-input" value="${item.quantity}" readonly>
                            <button class="drawer-qty-btn" onclick="window.App.updateCartQty(${item.id}, '${item.size}', ${item.quantity + 1})">+</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Draw summary metrics
        document.getElementById('cart-subtotal-val').innerText = `₹${totals.subtotal}`;
        document.getElementById('cart-tax-val').innerText = `₹${totals.tax}`;
        document.getElementById('cart-shipping-val').innerText = totals.shipping === 0 ? 'FREE' : `₹${totals.shipping}`;
        document.getElementById('cart-total-val').innerText = `₹${totals.total}`;

        // Wholesale alert box
        const wholesaleBox = document.getElementById('cart-wholesale-alert');
        if (totals.wholesaleApplied) {
            wholesaleBox.style.display = 'flex';
            wholesaleBox.innerHTML = `
                <i class="fas fa-tags"></i>
                <div>
                    <strong>B2B Wholesale Applied!</strong><br>
                    Pricing reduced to <strong>₹${totals.wholesaleDiscountRate}</strong>/sheet based on your ${totals.wholesaleSheetCount} sheet bundle.
                </div>
            `;
        } else {
            const config = window.StoreConfig || { wholesaleTiers: [] };
            const nextTier = config.wholesaleTiers.slice().reverse().find(t => t.minQuantity > totals.wholesaleSheetCount);
            
            if (nextTier) {
                const sheetsNeeded = nextTier.minQuantity - totals.wholesaleSheetCount;
                wholesaleBox.style.display = 'flex';
                wholesaleBox.innerHTML = `
                    <i class="fas fa-info-circle"></i>
                    <div>
                        Add <strong>${sheetsNeeded} more sheets</strong> to unlock B2B wholesale pricing at <strong>₹${nextTier.pricePerSheet}</strong>/sheet!
                    </div>
                `;
            } else {
                wholesaleBox.style.display = 'none';
            }
        }
    }

    updateCartQty(id, size, newQty) {
        try {
            window.Store.updateCartQuantity(id, size, newQty);
        } catch (err) {
            this.showToast(err.message, "error");
        }
    }

    renderWishlistDrawer() {
        const container = document.getElementById('wishlist-drawer-items');
        if (!container) return;

        const wishlist = window.Store.getWishlist();
        const products = window.Store.getAllProducts();

        if (wishlist.length === 0) {
            container.innerHTML = `
                <div class="drawer-empty">
                    <i class="far fa-heart"></i>
                    <h3>Your Wishlist is Empty</h3>
                    <p>Tap the heart icon on any print template to add it here.</p>
                </div>
            `;
            return;
        }

        const wishlistProducts = products.filter(p => wishlist.includes(p.id));

        container.innerHTML = wishlistProducts.map(prod => {
            return `
                <div class="drawer-item">
                    <div class="item-img-wrapper">
                        <img src="${prod.img}" alt="${prod.title}">
                    </div>
                    <div class="item-details">
                        <h4>${prod.title}</h4>
                        <div class="item-price">₹${prod.price}</div>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <button class="btn-remove-item" onclick="window.Store.toggleWishlist(${prod.id})" style="align-self: flex-end;">
                            <i class="fas fa-times"></i>
                        </button>
                        <button class="btn-card" style="padding: 6px 12px; font-size: 0.75rem; border-radius: 6px; background: var(--primary-color); color: #ffffff;" 
                                onclick="window.Store.addToCart(${prod.id}, 'a3', 1); window.Store.toggleWishlist(${prod.id}); window.App.showToast('Moved item to Cart!', 'success');">
                            Buy
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // -------------------------------------------------------------
    // RENDER MODALS CONTENT (User Auth Panel only)
    // -------------------------------------------------------------
    renderAuthModal() {
        const container = document.getElementById('auth-modal-container');
        if (!container) return;

        const currentUser = window.Store.getCurrentUser();

        if (currentUser) {
            // Render Profile Panel with Customer past orders
            const orders = window.Store.getOrders();
            let orderCards = '';

            if (orders.length === 0) {
                orderCards = `
                    <div style="text-align: center; color: #94a3b8; padding: 20px 0; font-size: 0.9rem;">
                        <i class="fas fa-box-open" style="font-size: 2rem; margin-bottom: 8px; display: block;"></i>
                        No orders placed yet.
                    </div>
                `;
            } else {
                orderCards = orders.map(ord => {
                    const statusClass = ord.status.toLowerCase().includes('paid') || ord.status.toLowerCase().includes('confirmed') ? 'delivered' : 'pending';
                    return `
                        <div class="order-item-card">
                            <div class="order-item-meta">
                                <span class="order-id">Order #${ord.id}</span>
                                <span class="order-date">${ord.date}</span>
                                <span class="order-status ${statusClass}">${ord.status}</span>
                            </div>
                            <div class="order-right">
                                <span class="order-total">₹${ord.total}</span>
                                <button class="btn-invoice" onclick="window.App.viewPastInvoice('${ord.id}')">View Details</button>
                            </div>
                        </div>
                    `;
                }).join('');
            }

            container.innerHTML = `
                <button class="modal-close" id="close-auth"><i class="fas fa-times"></i></button>
                <div class="profile-panel">
                    <div class="profile-header">
                        <div class="profile-avatar">
                            ${currentUser.name.charAt(0).toUpperCase()}
                        </div>
                        <div class="profile-info">
                            <h3>${currentUser.name}</h3>
                            <p>${currentUser.email}</p>
                            <p style="font-size: 0.75rem;">Phone: ${currentUser.phone}</p>
                        </div>
                    </div>
                    
                    <div class="profile-body">
                        <h4>My Order History</h4>
                        <div class="order-history-list">
                            ${orderCards}
                        </div>
                    </div>
                    
                    <button class="btn-logout" onclick="window.Store.logout()">
                        <i class="fas fa-sign-out-alt"></i> Sign Out
                    </button>
                </div>
            `;
        } else {
            // Render Login & Registration Tabs
            container.innerHTML = `
                <button class="modal-close" id="close-auth"><i class="fas fa-times"></i></button>
                <div class="auth-tabs">
                    <button class="auth-tab active" data-target="login-form-panel">Login</button>
                    <button class="auth-tab" data-target="register-form-panel">Sign Up</button>
                </div>
                
                <div class="auth-forms-container">
                    <!-- Login Panel -->
                    <form id="login-form-panel" class="auth-form-panel active" onsubmit="window.App.handleLogin(event)">
                        <div class="form-group">
                            <label>Email Address</label>
                            <input type="email" id="login-email" required placeholder="name@email.com">
                        </div>
                        <div class="form-group">
                            <label>Password</label>
                            <input type="password" id="login-password" required placeholder="••••••••">
                        </div>
                        <button type="submit" class="btn-auth-submit">Sign In</button>
                    </form>
                    
                    <!-- Signup Panel -->
                    <form id="register-form-panel" class="auth-form-panel" onsubmit="window.App.handleRegister(event)">
                        <div class="form-group">
                            <label>Full Name</label>
                            <input type="text" id="reg-name" required placeholder="John Doe">
                        </div>
                        <div class="form-group">
                            <label>Email Address</label>
                            <input type="email" id="reg-email" required placeholder="name@email.com">
                        </div>
                        <div class="form-group">
                            <label>Contact Number (For WhatsApp Updates)</label>
                            <input type="tel" id="reg-phone" required placeholder="919876543210" pattern="[0-9]{10,12}">
                        </div>
                        <div class="form-group">
                            <label>Password</label>
                            <input type="password" id="reg-password" required placeholder="Min 6 characters" minlength="6">
                        </div>
                        <button type="submit" class="btn-auth-submit">Register Account</button>
                    </form>
                </div>
            `;
        }

        const closeAuth = document.getElementById('close-auth');
        if (closeAuth) {
            closeAuth.addEventListener('click', () => {
                document.getElementById('auth-modal').classList.remove('active');
            });
        }
    }

    handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-password').value;

        try {
            window.Store.login(email, pass);
            this.showToast("Logged in successfully!", "success");
        } catch (err) {
            this.showToast(err.message, "error");
        }
    }

    handleRegister(e) {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const phone = document.getElementById('reg-phone').value;
        const pass = document.getElementById('reg-password').value;

        try {
            window.Store.register(name, email, pass, phone);
            this.showToast("Account created successfully!", "success");
        } catch (err) {
            this.showToast(err.message, "error");
        }
    }

    viewPastInvoice(orderId) {
        // Find matching order in general list
        const orders = window.Store.getAllOrders();
        const matchedOrder = orders.find(o => o.id === orderId);
        if (matchedOrder) {
            document.getElementById('auth-modal').classList.remove('active');
            
            // Render overlay receipt page in secondary receipt box
            const checkoutModal = document.getElementById('checkout-modal');
            checkoutModal.classList.add('active');
            window.Checkout.renderReceipt(matchedOrder);
        }
    }

    // -------------------------------------------------------------
    // UI BADGES UPDATES
    // -------------------------------------------------------------
    updateCartBadge() {
        const cart = window.Store.getCart();
        let totalCount = 0;
        cart.forEach(item => totalCount += item.quantity);

        const badges = document.querySelectorAll('.backend-cart-count');
        badges.forEach(badge => {
            badge.innerText = totalCount;
            badge.classList.remove('pulse');
            void badge.offsetWidth;
            badge.classList.add('pulse');
        });
    }

    updateWishlistBadge() {
        const wishlist = window.Store.getWishlist();
        const badges = document.querySelectorAll('[aria-label="Wishlist"] .badge');
        badges.forEach(badge => {
            badge.innerText = wishlist.length;
        });
    }

    updateHeaderAuthStatus() {
        const currentUser = window.Store.getCurrentUser();
        const userBtn = document.querySelector('[aria-label="User Account"]');
        if (!userBtn) return;

        if (currentUser) {
            userBtn.innerHTML = `<i class="fas fa-user-check" style="color: var(--accent-color);"></i>`;
        } else {
            userBtn.innerHTML = `<i class="fas fa-user"></i>`;
        }
    }

    // -------------------------------------------------------------
    // TOAST NOTIFICATIONS WRAPPER ENGINE
    // -------------------------------------------------------------
    showToast(message, type = "success") {
        if (!this.toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let iconHtml = '<i class="fas fa-info-circle toast-icon"></i>';
        if (type === 'success') iconHtml = '<i class="fas fa-check-circle toast-icon"></i>';
        if (type === 'error') iconHtml = '<i class="fas fa-times-circle toast-icon"></i>';
        if (type === 'warning') iconHtml = '<i class="fas fa-exclamation-triangle toast-icon"></i>';

        toast.innerHTML = `
            ${iconHtml}
            <div class="toast-message">${message}</div>
            <button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
        `;

        this.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toast-slide-out 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards';
            toast.addEventListener('animationend', () => {
                toast.remove();
            });
        }, 3500);
    }
}

// Instantiate global app controller on page load
document.addEventListener('DOMContentLoaded', () => {
    window.App = new AppController();
    window.App.init();
});
