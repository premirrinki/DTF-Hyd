/**
 * DTF Hyderabad - Store & Product Configuration File
 * Use this file to manage store settings, products, discounts, COD, stock levels, and integration keys.
 */

const StoreConfig = {
    // -------------------------------------------------------------
    // 1. INTEGRATION SETTINGS & CONTACTS
    // -------------------------------------------------------------
    
    // WhatsApp number to receive order updates (with country code, no space/symbols)
    whatsappNumber: "919876543210", 
    
    // Razorpay Key ID (For online payments. If set to "", it uses a beautiful simulation mode)
    razorpayKeyId: "", // Put your "rzp_test_..." or "rzp_live_..." key here
    
    // EmailJS Credentials (Optional: Setup a free account at emailjs.com to send emails)
    emailjs: {
        enabled: false,              // Set to true once you set up EmailJS
        publicKey: "YOUR_PUBLIC_KEY", // Get from Account Settings
        serviceId: "YOUR_SERVICE_ID", // Get from Email Services
        templateId: "YOUR_TEMPLATE_ID" // Get from Email Templates
    },

    // -------------------------------------------------------------
    // 2. PAYMENT CONFIGURATIONS
    // -------------------------------------------------------------
    enableCOD: true,      // Set to true to allow Cash on Delivery, false to hide it
    enableOnline: true,   // Set to true to allow Online Payments (Razorpay/Mock), false to hide it
    
    // Shipping configurations
    freeShippingThreshold: 999, // Free shipping on orders above this amount (INR)
    flatShippingFee: 99,       // Default shipping cost if total is below threshold
    taxRate: 0.18,             // GST tax percentage (18%)

    // -------------------------------------------------------------
    // 3. WHOLESALE / BULK B2B PRICING TIERS
    // -------------------------------------------------------------
    // Customize your B2B pricing logic. For a specific sheet quantity, define the per-sheet price.
    wholesaleTiers: [
        { minQuantity: 1000, pricePerSheet: 149 },
        { minQuantity: 500,  pricePerSheet: 179 },
        { minQuantity: 100,  pricePerSheet: 229 },
        { minQuantity: 0,    pricePerSheet: 299 } // Default pricing
    ],

    // -------------------------------------------------------------
    // 4. PRODUCT DATABASE
    // -------------------------------------------------------------
    // Add, remove, or modify items here.
    // To mark an item Out Of Stock, change stock: 0 or isAvailable: false.
    products: [
        {
            id: 1,
            title: "Standard A3 DTF Gang Sheet",
            price: 299,
            oldPrice: 499,
            discount: "40% OFF",
            rating: 4.9,
            reviews: 142,
            img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&width=400&auto=format&fit=crop",
            stock: 150,           // Number of items in stock
            isAvailable: true,    // True = show in store, False = hide from store
            category: "gang_sheet"
        },
        {
            id: 2,
            title: "Custom Meter Gang Sheet (100x58cm)",
            price: 599,
            oldPrice: 999,
            discount: "40% OFF",
            rating: 5.0,
            reviews: 218,
            img: "https://images.unsplash.com/photo-1513346033051-5b651127b04a?q=80&width=400&auto=format&fit=crop",
            stock: 80,
            isAvailable: true,
            category: "gang_sheet"
        },
        {
            id: 3,
            title: "Corporate Brand Logo Sheets (Set of 50)",
            price: 349,
            oldPrice: 600,
            discount: "42% OFF",
            rating: 4.8,
            reviews: 93,
            img: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&width=400&auto=format&fit=crop",
            stock: 120,
            isAvailable: true,
            category: "logo_prints"
        },
        {
            id: 4,
            title: "Fluorescent Neon Event Transfer Pack",
            price: 449,
            oldPrice: 799,
            discount: "43% OFF",
            rating: 4.9,
            reviews: 67,
            img: "https://images.unsplash.com/photo-1562157873-818bc0726f68?q=80&width=400&auto=format&fit=crop",
            stock: 35,
            isAvailable: true,
            category: "neon_prints"
        },
        {
            id: 5,
            title: "Premium Metallic Gold Accent Sheet",
            price: 399,
            oldPrice: 650,
            discount: "38% OFF",
            rating: 4.7,
            reviews: 54,
            img: "https://images.unsplash.com/photo-1508851413543-c52ef996f57a?q=80&width=400&auto=format&fit=crop",
            stock: 60,
            isAvailable: true,
            category: "metallic_prints"
        },
        {
            id: 6,
            title: "Athletic Numbering Kit (Jersey Pack)",
            price: 499,
            oldPrice: 899,
            discount: "44% OFF",
            rating: 4.9,
            reviews: 110,
            img: "https://images.unsplash.com/photo-1578269174936-2709b6aeb913?q=80&width=400&auto=format&fit=crop",
            stock: 15, // Low stock
            isAvailable: true,
            category: "sports_jerseys"
        },
        {
            id: 7,
            title: "Kids Ultra-Soft Organic Print Pack",
            price: 249,
            oldPrice: 399,
            discount: "37% OFF",
            rating: 5.0,
            reviews: 88,
            img: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?q=80&width=400&auto=format&fit=crop",
            stock: 200,
            isAvailable: true,
            category: "kids_wear"
        },
        {
            id: 8,
            title: "Vintage Distressed Graphic Sheets",
            price: 329,
            oldPrice: 550,
            discount: "40% OFF",
            rating: 4.6,
            reviews: 41,
            img: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&width=400&auto=format&fit=crop",
            stock: 90,
            isAvailable: true,
            category: "custom_prints"
        },
        {
            id: 9,
            title: "Anime & Pop Culture Multi-Sheet",
            price: 379,
            oldPrice: 599,
            discount: "36% OFF",
            rating: 4.9,
            reviews: 132,
            img: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&width=400&auto=format&fit=crop",
            stock: 140,
            isAvailable: true,
            category: "custom_prints"
        },
        {
            id: 10,
            title: "Heavy Duty Workwear Typography Prints",
            price: 429,
            oldPrice: 699,
            discount: "38% OFF",
            rating: 4.8,
            reviews: 59,
            img: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&width=400&auto=format&fit=crop",
            stock: 110,
            isAvailable: true,
            category: "custom_prints"
        },
        {
            id: 11,
            title: "Streetwear Oversized Drop Shoulder Set",
            price: 549,
            oldPrice: 899,
            discount: "39% OFF",
            rating: 5.0,
            reviews: 174,
            img: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&width=400&auto=format&fit=crop",
            stock: 75,
            isAvailable: true,
            category: "custom_prints"
        },
        {
            id: 12,
            title: "Snapback Cap/Hat Curved Panel Transfers",
            price: 199,
            oldPrice: 350,
            discount: "43% OFF",
            rating: 4.5,
            reviews: 33,
            img: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&width=400&auto=format&fit=crop",
            stock: 300,
            isAvailable: true,
            category: "custom_prints"
        },
        {
            id: 13,
            title: "Gym & Fitness Motivation Quote Sheet",
            price: 299,
            oldPrice: 499,
            discount: "40% OFF",
            rating: 4.8,
            reviews: 91,
            img: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&width=400&auto=format&fit=crop",
            stock: 160,
            isAvailable: true,
            category: "custom_prints"
        },
        {
            id: 14,
            title: "Biker Club Skull & Back Prints",
            price: 459,
            oldPrice: 750,
            discount: "38% OFF",
            rating: 4.7,
            reviews: 62,
            img: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&width=400&auto=format&fit=crop",
            stock: 22,
            isAvailable: true,
            category: "custom_prints"
        },
        {
            id: 15,
            title: "Sneaker Customization Detail Mini-Sheets",
            price: 220,
            oldPrice: 400,
            discount: "45% OFF",
            rating: 4.9,
            reviews: 29,
            img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&width=400&auto=format&fit=crop",
            stock: 0, // OUT OF STOCK
            isAvailable: true,
            category: "custom_prints"
        },
        {
            id: 16,
            title: "Abstract Minimalist Line Art Trans",
            price: 310,
            oldPrice: 500,
            discount: "38% OFF",
            rating: 4.6,
            reviews: 45,
            img: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&width=400&auto=format&fit=crop",
            stock: 85,
            isAvailable: true,
            category: "custom_prints"
        },
        {
            id: 17,
            title: "Retro 90s Aesthetic Colorways Set",
            price: 349,
            oldPrice: 599,
            discount: "41% OFF",
            rating: 4.8,
            reviews: 83,
            img: "https://images.unsplash.com/photo-1566207274740-0f8cf6b7d5a5?q=80&width=400&auto=format&fit=crop",
            stock: 95,
            isAvailable: true,
            category: "custom_prints"
        },
        {
            id: 18,
            title: "Sublimation-Look Gradient Fusion Sheets",
            price: 479,
            oldPrice: 800,
            discount: "40% OFF",
            rating: 4.9,
            reviews: 71,
            img: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&width=400&auto=format&fit=crop",
            stock: 44,
            isAvailable: true,
            category: "custom_prints"
        },
        {
            id: 19,
            title: "Eco-Friendly Water-Based Elastic Transfers",
            price: 389,
            oldPrice: 650,
            discount: "40% OFF",
            rating: 5.0,
            reviews: 50,
            img: "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&width=400&auto=format&fit=crop",
            stock: 120,
            isAvailable: true,
            category: "custom_prints"
        },
        {
            id: 20,
            title: "Full Jacket Back Extended Print Sheet",
            price: 699,
            oldPrice: 1200,
            discount: "41% OFF",
            rating: 4.9,
            reviews: 104,
            img: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&width=400&auto=format&fit=crop",
            stock: 30,
            isAvailable: true,
            category: "custom_prints"
        }
    ]
};

// Export config for browser use (using standard variables since it runs in the global window context)
window.StoreConfig = StoreConfig;
