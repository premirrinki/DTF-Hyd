/**
 * DTF Hyderabad - State & Data Store Manager
 * Manages localStorage persistence, cart logic, wishlist actions, authentication state,
 * wholesale discount engines, and Supabase SQL PostgreSQL backend integrations.
 */

class DataStore {
    constructor() {
        // Initialize State Keys
        this.CART_KEY = 'dtf_cart';
        this.WISHLIST_KEY = 'dtf_wishlist';
        this.USER_KEY = 'dtf_user';
        this.ORDERS_KEY = 'dtf_orders';
        this.USERS_DB_KEY = 'dtf_registered_users';
        this.CUSTOM_PRODUCTS_KEY = 'dtf_custom_products';
        this.DISABLED_PRODUCTS_KEY = 'dtf_disabled_products';
        this.DB_CONFIG_KEY = 'dtf_supabase_config';
    }

    // -------------------------------------------------------------
    // DATABASE / SQL CONFIGURATION & BINDINGS (Supabase PostgreSQL)
    // -------------------------------------------------------------
    getSupabaseConfig() {
        // Reads configuration from localStorage (set by admin dashboard) or config.js fallback
        const localConfig = JSON.parse(localStorage.getItem(this.DB_CONFIG_KEY));
        if (localConfig) return localConfig;
        
        const config = window.StoreConfig || {};
        return config.supabase || { enabled: false, url: "", anonKey: "" };
    }

    saveSupabaseConfig(url, anonKey, enabled) {
        const newConfig = { enabled: !!enabled, url, anonKey };
        localStorage.setItem(this.DB_CONFIG_KEY, JSON.stringify(newConfig));
        this.triggerEvent('dbConfigUpdated');
    }

    isSupabaseEnabled() {
        const config = this.getSupabaseConfig();
        return config.enabled && config.url && config.anonKey;
    }

    getSupabaseClient() {
        if (!this.isSupabaseEnabled()) return null;
        if (window.supabase) {
            const config = this.getSupabaseConfig();
            try {
                return window.supabase.createClient(config.url, config.anonKey);
            } catch (err) {
                console.error("Failed to initialize Supabase client instance", err);
            }
        }
        return null;
    }

    // -------------------------------------------------------------
    // USER AUTHENTICATION SYSTEM
    // -------------------------------------------------------------
    getRegisteredUsers() {
        return JSON.parse(localStorage.getItem(this.USERS_DB_KEY)) || [];
    }

    getCurrentUser() {
        return JSON.parse(localStorage.getItem(this.USER_KEY)) || null;
    }

    register(name, email, password, phone) {
        const users = this.getRegisteredUsers();
        if (users.find(u => u.email === email)) {
            throw new Error("An account with this email already exists.");
        }
        const newUser = { name, email, password, phone, registeredAt: new Date().toISOString() };
        users.push(newUser);
        localStorage.setItem(this.USERS_DB_KEY, JSON.stringify(users));
        
        // Log user in automatically after registration
        return this.login(email, password);
    }

    login(email, password) {
        const users = this.getRegisteredUsers();
        const user = users.find(u => u.email === email && u.password === password);
        if (!user) {
            throw new Error("Invalid email or password.");
        }
        
        const sessionUser = { name: user.name, email: user.email, phone: user.phone };
        localStorage.setItem(this.USER_KEY, JSON.stringify(sessionUser));
        
        this.triggerEvent('authUpdated');
        return sessionUser;
    }

    logout() {
        localStorage.removeItem(this.USER_KEY);
        this.triggerEvent('authUpdated');
    }

    // -------------------------------------------------------------
    // PRODUCT INTEGRATION MANAGER (With custom visibility hides)
    // -------------------------------------------------------------
    getDisabledProductIds() {
        return JSON.parse(localStorage.getItem(this.DISABLED_PRODUCTS_KEY)) || [];
    }

    toggleProductVisibility(productId) {
        let disabledIds = this.getDisabledProductIds();
        const index = disabledIds.indexOf(productId);
        let hidden = false;

        if (index > -1) {
            disabledIds.splice(index, 1);
        } else {
            disabledIds.push(productId);
            hidden = true;
        }

        localStorage.setItem(this.DISABLED_PRODUCTS_KEY, JSON.stringify(disabledIds));
        this.triggerEvent('productsVisibilityUpdated');
        return hidden;
    }

    getAllProducts() {
        const config = window.StoreConfig || { products: [] };
        const customProducts = JSON.parse(localStorage.getItem(this.CUSTOM_PRODUCTS_KEY)) || [];
        const disabledIds = this.getDisabledProductIds();

        // 1. Gather all items
        const all = [...config.products, ...customProducts];

        // 2. Format items, calculate discount automatically based on oldPrice & price
        return all.map(p => {
            const price = parseFloat(p.price) || 0;
            const oldPrice = parseFloat(p.oldPrice) || price || 0;
            
            // Automatic discount calculation
            const discountPct = oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
            const discountLabel = discountPct > 0 ? `${discountPct}% OFF` : 'SALE';

            return {
                ...p,
                price: price,
                oldPrice: oldPrice,
                discount: discountLabel,
                stock: parseInt(p.stock) !== undefined ? parseInt(p.stock) : 100,
                rating: parseFloat(p.rating) || 5.0,
                reviews: parseInt(p.reviews) || 0,
                isAvailable: !disabledIds.includes(p.id) // Hide if disabled/hidden by admin
            };
        });
    }

    // Return custom products only (for catalog panel management)
    getCustomProducts() {
        return JSON.parse(localStorage.getItem(this.CUSTOM_PRODUCTS_KEY)) || [];
    }

    // -------------------------------------------------------------
    // CART MANAGEMENT ENGINE
    // -------------------------------------------------------------
    getCart() {
        return JSON.parse(localStorage.getItem(this.CART_KEY)) || [];
    }

    saveCart(cart) {
        localStorage.setItem(this.CART_KEY, JSON.stringify(cart));
        this.triggerEvent('cartUpdated');
    }

    addToCart(productId, size = 'a3', quantity = 1) {
        const product = this.getAllProducts().find(p => p.id === productId);
        if (!product) return;

        // Check stock
        if (product.stock === 0) {
            throw new Error("This product is currently out of stock.");
        }

        let cart = this.getCart();
        const existingItemIndex = cart.findIndex(item => item.id === productId && item.size === size);

        if (existingItemIndex > -1) {
            const newQty = cart[existingItemIndex].quantity + quantity;
            if (product.stock !== undefined && newQty > product.stock) {
                throw new Error(`Only ${product.stock} items available in stock.`);
            }
            cart[existingItemIndex].quantity = newQty;
        } else {
            if (product.stock !== undefined && quantity > product.stock) {
                throw new Error(`Only ${product.stock} items available in stock.`);
            }
            cart.push({
                id: product.id,
                title: product.title,
                basePrice: product.price,
                img: product.img,
                category: product.category,
                size: size,
                quantity: quantity
            });
        }

        this.saveCart(cart);
    }

    updateCartQuantity(productId, size, quantity) {
        const product = this.getAllProducts().find(p => p.id === productId);
        if (!product) return;

        if (quantity < 1) {
            this.removeFromCart(productId, size);
            return;
        }

        if (product.stock !== undefined && quantity > product.stock) {
            throw new Error(`Only ${product.stock} items available in stock.`);
        }

        let cart = this.getCart();
        const itemIndex = cart.findIndex(item => item.id === productId && item.size === size);
        if (itemIndex > -1) {
            cart[itemIndex].quantity = quantity;
            this.saveCart(cart);
        }
    }

    removeFromCart(productId, size) {
        let cart = this.getCart();
        cart = cart.filter(item => !(item.id === productId && item.size === size));
        this.saveCart(cart);
    }

    clearCart() {
        this.saveCart([]);
    }

    // -------------------------------------------------------------
    // PRICING CALCULATION ENGINE (B2B wholesale pricing included)
    // -------------------------------------------------------------
    getCartTotals() {
        const cart = this.getCart();
        const config = window.StoreConfig || { freeShippingThreshold: 999, flatShippingFee: 99, taxRate: 0.18, wholesaleTiers: [] };
        
        // Calculate B2B wholesale pricing discounts
        let totalSheetSheetsCount = 0;
        cart.forEach(item => {
            if (item.category === 'gang_sheet' || item.category === 'custom_prints') {
                totalSheetSheetsCount += item.quantity;
            }
        });

        // Determine price multiplier tier
        let activeTier = config.wholesaleTiers.find(t => totalSheetSheetsCount >= t.minQuantity);
        const wholesaleApplied = activeTier && activeTier.minQuantity > 0;
        const discountPricePerSheet = activeTier ? activeTier.pricePerSheet : null;

        let subtotal = 0;
        let originalSubtotal = 0;

        const updatedCart = cart.map(item => {
            let activePrice = item.basePrice;
            
            // Adjust base prices for size modifiers
            if (item.size === 'a4') {
                activePrice = Math.round(item.basePrice * 0.6); // A4 is 60% of A3 price
            } else if (item.size === 'meter') {
                activePrice = Math.round(item.basePrice * 1.8); // Per Meter is 1.8x A3 price
            }

            // Apply wholesale per-sheet limits
            if (wholesaleApplied && (item.category === 'gang_sheet' || item.category === 'custom_prints')) {
                if (item.size === 'meter') {
                    activePrice = Math.round(discountPricePerSheet * 1.8);
                } else if (item.size === 'a4') {
                    activePrice = Math.round(discountPricePerSheet * 0.6);
                } else {
                    activePrice = discountPricePerSheet;
                }
            }

            const itemTotal = activePrice * item.quantity;
            subtotal += itemTotal;
            originalSubtotal += (item.size === 'a4' ? Math.round(item.basePrice * 0.6) : (item.size === 'meter' ? Math.round(item.basePrice * 1.8) : item.basePrice)) * item.quantity;

            return {
                ...item,
                price: activePrice,
                total: itemTotal
            };
        });

        const discountValue = originalSubtotal - subtotal;
        
        // Shipping
        let shipping = 0;
        if (subtotal > 0 && subtotal < config.freeShippingThreshold) {
            shipping = config.flatShippingFee;
        }

        // GST
        const gst = Math.round(subtotal * config.taxRate);

        // Final total
        const finalTotal = subtotal + shipping + gst;

        return {
            items: updatedCart,
            subtotal: subtotal,
            discount: discountValue,
            wholesaleApplied: wholesaleApplied,
            wholesaleSheetCount: totalSheetSheetsCount,
            wholesaleDiscountRate: discountPricePerSheet,
            shipping: shipping,
            tax: gst,
            total: finalTotal
        };
    }

    // -------------------------------------------------------------
    // WISHLIST ENGINE
    // -------------------------------------------------------------
    getWishlist() {
        return JSON.parse(localStorage.getItem(this.WISHLIST_KEY)) || [];
    }

    toggleWishlist(productId) {
        let wishlist = this.getWishlist();
        const index = wishlist.indexOf(productId);
        let added = false;

        if (index > -1) {
            wishlist.splice(index, 1);
        } else {
            wishlist.push(productId);
            added = true;
        }

        localStorage.setItem(this.WISHLIST_KEY, JSON.stringify(wishlist));
        this.triggerEvent('wishlistUpdated');
        return added;
    }

    isInWishlist(productId) {
        return this.getWishlist().includes(productId);
    }

    // -------------------------------------------------------------
    // ORDER HISTORY MANAGER & SQL SYNC (Supabase PostgreSQL Client)
    // -------------------------------------------------------------
    getOrders() {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return [];

        const allOrders = JSON.parse(localStorage.getItem(this.ORDERS_KEY)) || [];
        return allOrders.filter(order => order.customerEmail === currentUser.email);
    }

    getAllOrders() {
        return JSON.parse(localStorage.getItem(this.ORDERS_KEY)) || [];
    }

    // Sync / Load orders from Supabase SQL table (Source of Truth)
    async fetchSupabaseOrders() {
        if (!this.isSupabaseEnabled()) return this.getAllOrders();
        
        const client = this.getSupabaseClient();
        if (!client) return this.getAllOrders();

        try {
            // Select all rows ordered descending by date
            const { data, error } = await client
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Supabase PostgreSQL Query Error:", error);
                return this.getAllOrders();
            }

            // Map data schema from PostgreSQL table keys back to store format
            const mappedOrders = data.map(row => ({
                id: row.order_id,
                date: row.order_date || new Date(row.created_at).toLocaleString('en-IN'),
                customerEmail: row.customer_email,
                shippingDetails: typeof row.shipping_address === 'string' ? JSON.parse(row.shipping_address) : row.shipping_address,
                items: typeof row.items_ordered === 'string' ? JSON.parse(row.items_ordered) : row.items_ordered,
                subtotal: parseFloat(row.subtotal) || 0,
                tax: parseFloat(row.tax) || 0,
                shipping: parseFloat(row.shipping) || 0,
                total: parseFloat(row.total_amount) || 0,
                paymentMethod: row.payment_method,
                paymentId: row.payment_id,
                paymentStatus: row.payment_status,
                status: row.status
            }));

            // Sync cache locally
            localStorage.setItem(this.ORDERS_KEY, JSON.stringify(mappedOrders));
            this.triggerEvent('ordersUpdated');
            return mappedOrders;
        } catch (err) {
            console.error("Failed loading from Supabase Database", err);
            return this.getAllOrders();
        }
    }

    async updateOrderStatus(orderId, newStatus) {
        const allOrders = JSON.parse(localStorage.getItem(this.ORDERS_KEY)) || [];
        const orderIndex = allOrders.findIndex(o => o.id === orderId);
        
        if (orderIndex > -1) {
            allOrders[orderIndex].status = newStatus;
            localStorage.setItem(this.ORDERS_KEY, JSON.stringify(allOrders));
            this.triggerEvent('ordersUpdated');

            // Sync status update to SQL database
            if (this.isSupabaseEnabled()) {
                const client = this.getSupabaseClient();
                if (client) {
                    try {
                        const { error } = await client
                            .from('orders')
                            .update({ status: newStatus })
                            .eq('order_id', orderId);
                        if (error) console.error("Supabase SQL update failed:", error);
                    } catch (e) {
                        console.error("Supabase transaction failed", e);
                    }
                }
            }
            return true;
        }
        return false;
    }

    async addOrder(order) {
        // 1. Cache order locally
        const allOrders = JSON.parse(localStorage.getItem(this.ORDERS_KEY)) || [];
        allOrders.push(order);
        localStorage.setItem(this.ORDERS_KEY, JSON.stringify(allOrders));

        // 2. Subtract stock quantities for products in the order
        const customProducts = JSON.parse(localStorage.getItem(this.CUSTOM_PRODUCTS_KEY)) || [];
        const config = window.StoreConfig || { products: [] };
        
        order.items.forEach(orderedItem => {
            const customProductIndex = customProducts.findIndex(p => p.id === orderedItem.id);
            if (customProductIndex > -1) {
                const currentStock = parseInt(customProducts[customProductIndex].stock) || 0;
                customProducts[customProductIndex].stock = Math.max(0, currentStock - orderedItem.quantity);
            } else {
                const product = config.products.find(p => p.id === orderedItem.id);
                if (product && product.stock !== undefined) {
                    product.stock = Math.max(0, product.stock - orderedItem.quantity);
                }
            }
        });
        localStorage.setItem(this.CUSTOM_PRODUCTS_KEY, JSON.stringify(customProducts));
        this.triggerEvent('ordersUpdated');

        // 3. Sync to Supabase SQL Database (PostgreSQL)
        if (this.isSupabaseEnabled()) {
            const client = this.getSupabaseClient();
            if (client) {
                try {
                    const { error } = await client
                        .from('orders')
                        .insert([{
                            order_id: order.id,
                            order_date: order.date,
                            customer_email: order.customerEmail,
                            customer_name: order.shippingDetails.name,
                            customer_phone: order.shippingDetails.phone,
                            shipping_address: order.shippingDetails, // JSON field supported natively in PostgreSQL
                            items_ordered: order.items,            // JSON array supported natively in PostgreSQL
                            subtotal: order.subtotal,
                            tax: order.tax,
                            shipping: order.shipping,
                            total_amount: order.total,
                            payment_method: order.paymentMethod,
                            payment_id: order.paymentId,
                            payment_status: order.paymentStatus,
                            status: order.status
                        }]);
                    if (error) {
                        console.error("Supabase SQL Insert Error:", error);
                    } else {
                        console.log("Order synced to Supabase SQL successfully!");
                    }
                } catch (err) {
                    console.error("Supabase transaction failed", err);
                }
            }
        }
    }

    // -------------------------------------------------------------
    // EVENT DISPATCHER FOR DOM BINDINGS
    // -------------------------------------------------------------
    triggerEvent(eventName) {
        const event = new CustomEvent(eventName, { detail: this });
        window.dispatchEvent(event);
    }
}

// Instantiate global store
window.Store = new DataStore();
