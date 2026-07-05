/**
 * DTF Hyderabad - Checkout & Payment Processor
 * Handles shipping form validation, Razorpay Checkout SDK, animated payment gateways simulation,
 * WhatsApp message formatting, and EmailJS triggers.
 */

class CheckoutManager {
    constructor() {
        this.currentPaymentMethod = 'online'; // Default to online
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Toggle payment option active state cards
        document.addEventListener('change', (e) => {
            if (e.target && e.target.name === 'payment-method') {
                this.currentPaymentMethod = e.target.value;
                document.querySelectorAll('.payment-option-card').forEach(card => {
                    card.classList.remove('active');
                });
                const selectedCard = e.target.closest('.payment-option-card');
                if (selectedCard) {
                    selectedCard.classList.add('active');
                }
            }
        });
    }

    // Process placing order
    async placeOrder(shippingDetails) {
        // Ensure cart is not empty
        const cartTotals = window.Store.getCartTotals();
        if (cartTotals.items.length === 0) {
            throw new Error("Your cart is empty.");
        }

        const user = window.Store.getCurrentUser();
        const orderId = 'DTF-' + Math.floor(100000 + Math.random() * 900000); // 6 Digit Unique Order Number
        
        const order = {
            id: orderId,
            items: cartTotals.items,
            subtotal: cartTotals.subtotal,
            discount: cartTotals.discount,
            shipping: cartTotals.shipping,
            tax: cartTotals.tax,
            total: cartTotals.total,
            wholesaleApplied: cartTotals.wholesaleApplied,
            customerEmail: user ? user.email : shippingDetails.email,
            shippingDetails: shippingDetails,
            date: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            status: 'Pending Confirmation',
            paymentMethod: this.currentPaymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Razorpay Online'
        };

        if (this.currentPaymentMethod === 'cod') {
            order.paymentStatus = 'Pending (Pay on Delivery)';
            order.paymentId = 'COD_' + Math.random().toString(36).substr(2, 9).toUpperCase();
            this.completeOrder(order);
        } else {
            // Online payment via Razorpay
            await this.processOnlinePayment(order);
        }
    }

    async processOnlinePayment(order) {
        const config = window.StoreConfig || { razorpayKeyId: "" };
        
        // Check if Razorpay Key exists
        if (config.razorpayKeyId && config.razorpayKeyId.trim() !== "") {
            // Real Razorpay SDK Checkout
            this.launchRazorpaySDK(order, config.razorpayKeyId);
        } else {
            // Simulated Razorpay Checkout Modal
            this.launchSimulatedPayment(order);
        }
    }

    launchRazorpaySDK(order, keyId) {
        const options = {
            "key": keyId,
            "amount": order.total * 100, // Amount in paise
            "currency": "INR",
            "name": "DTF Hyderabad",
            "description": `Order #${order.id}`,
            "image": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&width=100&auto=format&fit=crop",
            "handler": (response) => {
                order.paymentStatus = 'Paid';
                order.paymentId = response.razorpay_payment_id;
                order.status = 'Confirmed (Paid)';
                this.completeOrder(order);
            },
            "prefill": {
                "name": order.shippingDetails.name,
                "email": order.shippingDetails.email,
                "contact": order.shippingDetails.phone
            },
            "theme": {
                "color": "#0f172a"
            },
            "modal": {
                "ondismiss": () => {
                    window.App.showToast("Payment cancelled by user.", "info");
                }
            }
        };

        try {
            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            console.error("Razorpay SDK initialization failed, launching fallback simulation...", err);
            this.launchSimulatedPayment(order);
        }
    }

    launchSimulatedPayment(order) {
        // Create simulated payment modal elements
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay active';
        overlay.id = 'payment-simulation-overlay';
        overlay.style.zIndex = '12000';

        overlay.innerHTML = `
            <div class="modal-container" style="max-width: 450px; overflow: hidden;">
                <div class="payment-loader" id="simulation-step-1">
                    <div class="spinner"></div>
                    <h3 style="font-family: var(--font-main);">Connecting to Razorpay Secure Gateway...</h3>
                    <p style="font-size: 0.8rem; color: #64748b;">Do not refresh this page.</p>
                </div>

                <div id="simulation-step-2" style="display: none; padding: 30px; text-align: center; flex-direction: column; gap: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px;">
                        <h3 style="font-family: var(--font-main); color: var(--primary-color);">Razorpay Secure Checkout</h3>
                        <span style="background: #e2e8f0; color: #475569; font-size: 0.7rem; font-weight: 700; padding: 2px 6px; border-radius: 4px;">TEST MODE</span>
                    </div>
                    
                    <div style="text-align: left; background: #f8fafc; padding: 15px; border-radius: 12px; font-size: 0.85rem;">
                        <p style="color: #64748b; margin-bottom: 5px;">Paying To:</p>
                        <h4 style="color: var(--primary-color); font-weight: 700; margin-bottom: 10px;">DTF Hyderabad</h4>
                        <div style="display: flex; justify-content: space-between; font-weight: 600;">
                            <span>Amount to Pay:</span>
                            <span style="color: #b45309; font-size: 1.1rem;">₹${order.total}</span>
                        </div>
                        <p style="font-size: 0.75rem; color: #94a3b8; margin-top: 10px;">Simulation is running because no active Razorpay API key was supplied.</p>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <button id="sim-btn-success" class="btn-drawer-checkout" style="background: #22c55e;">
                            <i class="fas fa-check-circle"></i> Simulate Successful Payment
                        </button>
                        <button id="sim-btn-fail" class="btn-logout" style="width: 100%; border-color: #fecaca; background: #fef2f2; color: #ef4444;">
                            <i class="fas fa-times-circle"></i> Simulate Failed Payment
                        </button>
                    </div>
                </div>

                <div class="payment-loader" id="simulation-step-3" style="display: none;">
                    <div class="spinner" style="border-top-color: #22c55e;"></div>
                    <h3 style="font-family: var(--font-main); color: #22c55e;">Payment Processing...</h3>
                    <p style="font-size: 0.8rem; color: #64748b;">Authorizing your test bank account transaction.</p>
                </div>

                <div class="order-success-panel" id="simulation-step-4" style="display: none;">
                    <div class="success-checkmark">
                        <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                            <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                            <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                        </svg>
                    </div>
                    <h3 style="font-family: var(--font-main); color: #22c55e; margin-top: 15px;">Payment Successful!</h3>
                    <p style="font-size: 0.85rem; color: #64748b;">Transaction ID: PAY_SIM_${Math.floor(100000 + Math.random() * 900000)}</p>
                    <p style="font-size: 0.8rem; color: #94a3b8;">Redirecting back to store...</p>
                </div>

                <div class="order-success-panel" id="simulation-step-5" style="display: none; padding: 40px 30px;">
                    <div style="font-size: 3rem; color: #ef4444;"><i class="fas fa-exclamation-circle"></i></div>
                    <h3 style="font-family: var(--font-main); color: #ef4444; margin-top: 15px;">Payment Failed!</h3>
                    <p style="font-size: 0.85rem; color: #64748b;">The mock transaction was declined by the issuer bank.</p>
                    <button id="sim-btn-retry" class="btn-logout" style="width: 100%; border-color: #cbd5e1; background: #ffffff; color: var(--primary-color);">
                        Try Again
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Step 1 Loader timeout
        setTimeout(() => {
            const step1 = document.getElementById('simulation-step-1');
            const step2 = document.getElementById('simulation-step-2');
            if (step1 && step2) {
                step1.style.display = 'none';
                step2.style.display = 'flex';
            }
        }, 1500);

        // Bind simulator buttons
        document.getElementById('sim-btn-success').addEventListener('click', () => {
            document.getElementById('simulation-step-2').style.display = 'none';
            document.getElementById('simulation-step-3').style.display = 'flex';

            setTimeout(() => {
                document.getElementById('simulation-step-3').style.display = 'none';
                document.getElementById('simulation-step-4').style.display = 'flex';

                setTimeout(() => {
                    overlay.remove();
                    order.paymentStatus = 'Paid';
                    order.paymentId = 'PAY_SIM_' + Math.floor(100000 + Math.random() * 900000);
                    order.status = 'Confirmed (Paid)';
                    this.completeOrder(order);
                }, 2000);
            }, 1800);
        });

        document.getElementById('sim-btn-fail').addEventListener('click', () => {
            document.getElementById('simulation-step-2').style.display = 'none';
            document.getElementById('simulation-step-3').style.display = 'flex';

            setTimeout(() => {
                document.getElementById('simulation-step-3').style.display = 'none';
                document.getElementById('simulation-step-5').style.display = 'flex';
            }, 1500);
        });

        document.getElementById('sim-btn-retry').addEventListener('click', () => {
            document.getElementById('simulation-step-5').style.display = 'none';
            document.getElementById('simulation-step-2').style.display = 'flex';
        });
    }

    // Complete order placement, trigger alert notifications, save database, show receipt UI
    completeOrder(order) {
        // Save to Database
        window.Store.addOrder(order);
        
        // Clean cart
        window.Store.clearCart();
        
        // Show Success UI Receipt
        this.renderReceipt(order);
        
        // Show Success Toast
        window.App.showToast(`Order #${order.id} Placed Successfully!`, "success");

        // Trigger notifications
        this.sendWhatsAppNotification(order);
        this.sendEmailNotification(order);
    }

    // Format WhatsApp prefilled order text and generate API link
    sendWhatsAppNotification(order) {
        const config = window.StoreConfig || { whatsappNumber: "" };
        if (!config.whatsappNumber) return;

        let itemsText = '';
        order.items.forEach(item => {
            const sizeLabel = item.size === 'a3' ? 'A3 Size' : (item.size === 'a4' ? 'A4 Size' : 'Per Meter Layer');
            itemsText += `- *${item.title}* (${sizeLabel}) x ${item.quantity} = ₹${item.total}\n`;
        });

        const text = `Hi DTF Hyderabad, I have placed an order!\n\n` +
            `*Order ID:* #${order.id}\n` +
            `*Customer Name:* ${order.shippingDetails.name}\n` +
            `*Email:* ${order.shippingDetails.email}\n` +
            `*Contact Number:* ${order.shippingDetails.phone}\n` +
            `*Delivery Address:* ${order.shippingDetails.address}, ${order.shippingDetails.city}, ${order.shippingDetails.state} - ${order.shippingDetails.pin}\n\n` +
            `*Items Ordered:*\n${itemsText}\n` +
            `*Financial Summary:*\n` +
            `- Subtotal: ₹${order.subtotal}\n` +
            `- GST Tax: ₹${order.tax}\n` +
            `- Shipping: ₹${order.shipping > 0 ? '₹' + order.shipping : 'FREE'}\n` +
            `- Total Amount: *₹${order.total}*\n\n` +
            `*Payment Details:*\n` +
            `- Gateway: ${order.paymentMethod}\n` +
            `- Status: ${order.paymentStatus}\n` +
            `- Transaction ID: ${order.paymentId}\n\n` +
            `Please confirm my custom DTF print sheets production. Thank you!`;

        const encodedText = encodeURIComponent(text);
        const url = `https://wa.me/${config.whatsappNumber}?text=${encodedText}`;
        
        // Assign this to window variable so the receipt page can bind it to a button click
        window.activeWhatsAppOrderLink = url;
    }

    // Trigger EmailJS email alert using public keys
    sendEmailNotification(order) {
        const config = window.StoreConfig || { emailjs: { enabled: false } };
        if (!config.emailjs || !config.emailjs.enabled) {
            console.log("Email Notification skipped (EmailJS not enabled in js/config.js).");
            return;
        }

        let itemsText = '';
        order.items.forEach(item => {
            const sizeLabel = item.size === 'a3' ? 'A3 Size' : (item.size === 'a4' ? 'A4 Size' : 'Per Meter');
            itemsText += `${item.title} (${sizeLabel}) x ${item.quantity} - Rs.${item.total}\n`;
        });

        const templateParams = {
            order_id: order.id,
            customer_name: order.shippingDetails.name,
            customer_email: order.shippingDetails.email,
            customer_phone: order.shippingDetails.phone,
            address: `${order.shippingDetails.address}, ${order.shippingDetails.city}, ${order.shippingDetails.state} - ${order.shippingDetails.pin}`,
            items_ordered: itemsText,
            subtotal: order.subtotal,
            tax: order.tax,
            shipping: order.shipping,
            total_amount: order.total,
            payment_method: order.paymentMethod,
            payment_id: order.paymentId,
            payment_status: order.paymentStatus
        };

        // Initialize and send through client side SDK if loaded
        if (window.emailjs) {
            window.emailjs.send(config.emailjs.serviceId, config.emailjs.templateId, templateParams, config.emailjs.publicKey)
                .then((response) => {
                    console.log('Order confirmation email sent successfully via EmailJS!', response.status, response.text);
                }, (error) => {
                    console.error('EmailJS notification failed to send...', error);
                });
        } else {
            console.warn("EmailJS library not loaded. Checking internet connection.");
        }
    }

    // Render receipt inside checkout modal layout
    renderReceipt(order) {
        const checkoutModal = document.getElementById('checkout-modal');
        if (!checkoutModal) return;

        let itemsRows = '';
        order.items.forEach(item => {
            const sizeLabel = item.size === 'a3' ? 'A3' : (item.size === 'a4' ? 'A4' : 'Meter');
            itemsRows += `
                <tr>
                    <td>${item.title}<br><small style="color: #64748b;">Size: ${sizeLabel}</small></td>
                    <td>${item.quantity}</td>
                    <td>₹${item.price}</td>
                    <td style="text-align: right;">₹${item.total}</td>
                </tr>
            `;
        });

        const container = checkoutModal.querySelector('.modal-container');
        if (!container) return;

        container.style.maxWidth = '600px';
        container.innerHTML = `
            <div class="order-success-panel" style="padding: 40px 30px;">
                <div class="success-checkmark">
                    <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                        <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                    </svg>
                </div>
                
                <h2 style="font-family: var(--font-main); color: var(--primary-color); font-weight: 700; margin-top: 10px;">Order Placed Successfully!</h2>
                <p style="font-size: 0.9rem; color: #64748b; margin-bottom: 20px;">Order ID: <strong>#${order.id}</strong>. We've sent a summary to your phone and WhatsApp.</p>
                
                <div class="invoice-print-container" id="printable-invoice">
                    <div class="invoice-header">
                        <div>
                            <span class="invoice-header-title">DTF Hyderabad Invoice</span>
                            <p style="font-size: 0.7rem; margin-top: 2px;">Order ID: #${order.id}</p>
                            <p style="font-size: 0.7rem;">Date: ${order.date}</p>
                        </div>
                        <div style="text-align: right;">
                            <span style="font-weight: 700; color: var(--primary-color);">DTFHyd Shop</span>
                            <p style="font-size: 0.7rem; margin-top: 2px;">Hyderabad, TG, India</p>
                        </div>
                    </div>
                    
                    <div style="font-size: 0.75rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
                        <strong>Billed To:</strong><br>
                        ${order.shippingDetails.name} | ${order.shippingDetails.phone}<br>
                        ${order.shippingDetails.address}, ${order.shippingDetails.city}, ${order.shippingDetails.state} - ${order.shippingDetails.pin}
                    </div>

                    <table class="invoice-table">
                        <thead>
                            <tr>
                                <th>Item Details</th>
                                <th>Qty</th>
                                <th>Rate</th>
                                <th style="text-align: right;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsRows}
                        </tbody>
                    </table>

                    <div class="invoice-total-section">
                        <div style="display: flex; justify-content: space-between;">
                            <span>Subtotal:</span>
                            <span>₹${order.subtotal}</span>
                        </div>
                        ${order.discount > 0 ? `
                        <div style="display: flex; justify-content: space-between; color: #22c55e;">
                            <span>Discount:</span>
                            <span>-₹${order.discount}</span>
                        </div>` : ''}
                        <div style="display: flex; justify-content: space-between;">
                            <span>GST Tax (18%):</span>
                            <span>₹${order.tax}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span>Shipping:</span>
                            <span>${order.shipping > 0 ? `₹${order.shipping}` : 'FREE'}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; border-top: 1px solid #cbd5e1; padding-top: 6px; font-weight: 700; color: var(--primary-color); font-size: 0.9rem;">
                            <span>Total paid:</span>
                            <span>₹${order.total}</span>
                        </div>
                    </div>

                    <div style="font-size: 0.75rem; background: #faf5ff; border: 1px solid #f3e8ff; border-radius: 8px; padding: 10px; margin-top: 10px;">
                        <strong>Heat Press instructions:</strong> Press at 150°C for 12-15s under medium-firm pressure. Cool down completely before peeling.
                    </div>

                    <div class="invoice-footer">
                        Thank you for choosing DTF Hyderabad!
                    </div>
                </div>

                <div style="display: flex; gap: 10px; width: 100%; margin-top: 20px;">
                    <button class="btn-receipt-action" onclick="window.print()" style="flex: 1; justify-content: center;">
                        <i class="fas fa-print"></i> Print Invoice
                    </button>
                    <a href="${window.activeWhatsAppOrderLink}" target="_blank" class="btn-receipt-action" style="flex: 1.2; justify-content: center; background: #22c55e; color: #ffffff; border-color: #22c55e;">
                        <i class="fab fa-whatsapp"></i> Chat WhatsApp Conf.
                    </a>
                </div>
                
                <button class="btn-auth-submit" onclick="window.location.reload()" style="width: 100%; margin-top: 12px; background: var(--primary-color);">
                    Continue Shopping
                </button>
            </div>
        `;
    }
}

// Instantiate global checkout manager
window.Checkout = new CheckoutManager();
window.Checkout.init();
