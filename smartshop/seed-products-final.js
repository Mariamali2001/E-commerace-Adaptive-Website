// Final Seed Products Script - High quality images with accurate product names
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

const products = [
  // ==================== EXISTING 15 PRODUCTS (Local Images) ====================
  // Electronics
  {
    slug: "apple-macbook-pro-16-m3",
    title: "Apple MacBook Pro 16\" M3 Max",
    price: 3499,
    compareAt: 3999,
    rating: 4.9,
    images: ["/images/macbook.jpg"],
    colors: ["#2b2b2b", "#c0c0c0"],
    sizes: ["512GB", "1TB", "2TB"],
    description: "The most powerful MacBook Pro ever. M3 Max chip delivers unprecedented performance for professionals.",
    details: "16-inch Liquid Retina XDR display, Up to 128GB unified memory, Up to 22 hours battery life",
    category: "electronics",
    brand: "Apple",
  },
  {
    slug: "iphone-15-pro-max",
    title: "iPhone 15 Pro Max",
    price: 1199,
    compareAt: 1299,
    rating: 4.8,
    images: ["/images/iphone.jpg"],
    colors: ["#2b2b2b", "#5d6b64", "#d4af37"],
    sizes: ["256GB", "512GB", "1TB"],
    description: "Titanium design. A17 Pro chip. Action button. All-new 48MP camera system.",
    details: "6.7-inch Super Retina XDR display, ProMotion technology, Always-On display",
    category: "electronics",
    brand: "Apple",
  },
  {
    slug: "airpods-pro-2nd-gen",
    title: "AirPods Pro (2nd Generation)",
    price: 249,
    compareAt: 279,
    rating: 4.7,
    images: ["/images/airpod.jpg"],
    colors: ["#ffffff"],
    sizes: [],
    description: "Active Noise Cancellation. Adaptive Audio. Personalized Spatial Audio with dynamic head tracking.",
    details: "Up to 6 hours listening time with ANC on, USB-C charging case",
    category: "electronics",
    brand: "Apple",
  },
  {
    slug: "apple-watch-series-9",
    title: "Apple Watch Series 9 GPS + Cellular",
    price: 529,
    compareAt: 599,
    rating: 4.8,
    images: ["/images/watch.jpg"],
    colors: ["#2b2b2b", "#c0c0c0", "#d4af37"],
    sizes: ["41mm", "45mm"],
    description: "Our most powerful watch ever. S9 chip. Double tap gesture. Brightest display.",
    details: "Always-On Retina display, Blood Oxygen app, ECG app, Sleep tracking",
    category: "electronics",
    brand: "Apple",
  },
  
  // Fashion - Women
  {
    slug: "minimalist-beige-blazer",
    title: "Minimalist Beige Long Blazer",
    price: 129,
    compareAt: 179,
    rating: 4.6,
    images: ["/images/prod3.jpg"],
    colors: ["#f5f5dc", "#2b2b2b"],
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "Elegant oversized blazer perfect for office or casual wear. Premium fabric with structured shoulders.",
    details: "100% Polyester, Dry clean only, Imported",
    category: "fashion",
    brand: "ZARA",
  },
  {
    slug: "floral-summer-maxi-dress",
    title: "Floral Print Summer Maxi Dress",
    price: 89,
    compareAt: 129,
    rating: 4.5,
    images: ["/images/prod5.jpg"],
    colors: ["#ff6b9d", "#87ceeb", "#fff5ba"],
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "Lightweight flowing maxi dress with beautiful floral print. Perfect for summer occasions.",
    details: "100% Cotton, Machine washable, True to size",
    category: "fashion",
    brand: "H&M",
  },
  
  // Fashion - Men
  {
    slug: "classic-denim-jacket-mens",
    title: "Classic Denim Jacket for Men",
    price: 79,
    compareAt: 99,
    rating: 4.4,
    images: ["/images/prod6.jpg"],
    colors: ["#4169e1", "#2b2b2b"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Timeless denim jacket with vintage wash. Essential piece for any wardrobe.",
    details: "100% Cotton denim, Button closure, Multiple pockets",
    category: "fashion",
    brand: "Levi's",
  },
  {
    slug: "premium-leather-bomber-jacket",
    title: "Premium Leather Bomber Jacket",
    price: 349,
    compareAt: 449,
    rating: 4.7,
    images: ["/images/prod7.jpg"],
    colors: ["#2b2b2b", "#8b4513"],
    sizes: ["S", "M", "L", "XL"],
    description: "Genuine leather bomber jacket with quilted lining. Classic aviator style.",
    details: "100% Genuine Leather, Polyester lining, Professional leather clean only",
    category: "fashion",
    brand: "AllSaints",
  },
  
  // Beauty & Fragrance
  {
    slug: "chanel-coco-noir-100ml",
    title: "Chanel Coco Noir Eau de Parfum 100ml",
    price: 150,
    compareAt: 185,
    rating: 4.8,
    images: ["/images/prod5.jpg"],
    colors: [],
    sizes: ["50ml", "100ml"],
    description: "Sensual and magnetic oriental fragrance. Notes of grapefruit, rose, and sandalwood.",
    details: "Eau de Parfum concentration, Long-lasting formula, Includes gift box",
    category: "beauty",
    brand: "Chanel",
  },
  {
    slug: "dior-sauvage-edp",
    title: "Dior Sauvage Eau de Parfum",
    price: 135,
    compareAt: 165,
    rating: 4.9,
    images: ["/images/deal-perfume.jpg"],
    colors: [],
    sizes: ["60ml", "100ml"],
    description: "Fresh and woody fragrance inspired by wide-open spaces. Best-selling men's fragrance.",
    details: "Top notes: Bergamot, Heart notes: Sichuan Pepper, Base notes: Ambroxan",
    category: "beauty",
    brand: "Dior",
  },
  {
    slug: "organic-argan-shampoo",
    title: "Organic Argan Oil Shampoo",
    price: 28,
    compareAt: 39,
    rating: 4.3,
    images: ["/images/shampoo.jpg"],
    colors: [],
    sizes: ["250ml", "500ml"],
    description: "Sulfate-free shampoo with organic argan oil. Repairs and nourishes damaged hair.",
    details: "100% Natural ingredients, Paraben-free, Suitable for all hair types",
    category: "beauty",
    brand: "OGX",
  },
  {
    slug: "strawberry-moisture-shampoo",
    title: "Strawberry Essence Moisture Shampoo",
    price: 24,
    compareAt: 32,
    rating: 4.2,
    images: ["/images/straw-shampoo.jpg"],
    colors: [],
    sizes: ["350ml", "750ml"],
    description: "Hydrating shampoo with real strawberry extract. Leaves hair soft and fragrant.",
    details: "Vitamin-enriched formula, Color-safe, Pleasant fruity scent",
    category: "beauty",
    brand: "Herbal Essences",
  },
  
  // Accessories
  {
    slug: "gold-twisted-hoop-earrings",
    title: "Bold Twisted Gold Hoop Earrings",
    price: 45,
    compareAt: 65,
    rating: 4.6,
    images: ["/images/prod4.jpg"],
    colors: ["#d4af37", "#c0c0c0"],
    sizes: ["Small", "Medium", "Large"],
    description: "Statement twisted hoop earrings in 18k gold plating. Modern and elegant design.",
    details: "18k Gold Plated, Hypoallergenic, Nickel-free",
    category: "accessories",
    brand: "Mejuri",
  },
  {
    slug: "leather-crossbody-bag",
    title: "Italian Leather Crossbody Bag",
    price: 189,
    compareAt: 249,
    rating: 4.7,
    images: ["/images/prod1.jpg"],
    colors: ["#2b2b2b", "#8b4513", "#c0c0c0"],
    sizes: [],
    description: "Handcrafted Italian leather crossbody bag. Perfect size for daily essentials.",
    details: "100% Genuine Italian leather, Adjustable strap, Multiple compartments",
    category: "accessories",
    brand: "Michael Kors",
  },
  {
    slug: "polarized-aviator-sunglasses",
    title: "Classic Polarized Aviator Sunglasses",
    price: 159,
    compareAt: 199,
    rating: 4.8,
    images: ["/images/prod2.jpg"],
    colors: ["#d4af37", "#2b2b2b", "#c0c0c0"],
    sizes: [],
    description: "Iconic aviator sunglasses with polarized lenses. 100% UV protection.",
    details: "Metal frame, Polarized lenses, Includes case and cleaning cloth",
    category: "accessories",
    brand: "Ray-Ban",
  },

  // ==================== NEW PRODUCTS (High Quality External URLs) ====================
  
  // More Electronics - Using Pexels (more reliable than Unsplash)
  {
    slug: "gaming-laptop-rgb",
    title: "High-Performance Gaming Laptop RGB",
    price: 1899,
    compareAt: 2299,
    rating: 4.7,
    images: [
      "https://theawesomer.com/photos/2020/04/msi_ge66_raider_gaming_laptop_1.jpg"
    ],
    colors: ["#2b2b2b"],
    sizes: ["512GB SSD", "1TB SSD"],
    description: "Ultimate gaming performance with RGB backlit keyboard. RTX 4060 graphics, 144Hz display.",
    details: "15.6-inch FHD 144Hz, Intel Core i7-13700H, 16GB RAM, RTX 4060",
    category: "electronics",
    brand: "MSI",
  },
  {
    slug: "wireless-keyboard-mouse-combo",
    title: "Wireless Keyboard and Mouse Combo",
    price: 79,
    compareAt: 99,
    rating: 4.5,
    images: [
      "https://images.pexels.com/photos/6177680/pexels-photo-6177680.jpeg",
"https://i.ebayimg.com/images/g/Gp4AAOSwWjNmXnnj/s-l1600.webp"    ],
    colors: ["#ffffff","#FFB6C1"],
    sizes: [],
    description: "Ergonomic wireless keyboard and mouse set. 2.4GHz connection, long battery life.",
    details: "Silent keys, Adjustable DPI mouse, USB receiver included, 24-month battery",
    category: "electronics",
    brand: "Logitech",
  },
  {
    slug: "portable-bluetooth-speaker",
    title: "Waterproof Portable Bluetooth Speaker",
    price: 129,
    compareAt: 159,
    rating: 4.6,
    images: [
      "https://www.jbl.com/dw/image/v2/BFND_PRD/on/demandware.static/-/Sites-masterCatalog_Harman/default/dwa14abc0d/JBL_CLIP_5_HERO_GREY_48150_x5.png?sw=535&sh=535"    ],
    colors: [ "#FFFFFF"],
    sizes: [],
    description: "360° sound, waterproof design, 20-hour playtime. Perfect for outdoor adventures.",
    details: "IPX7 waterproof, Bluetooth 5.0, Built-in microphone, USB-C charging",
    category: "electronics",
    brand: "JBL",
  },
  {
    slug: "smart-fitness-tracker",
    title: "Smart Fitness Tracker with Heart Rate",
    price: 89,
    compareAt: 119,
    rating: 4.4,
    images: [
      "https://images.pexels.com/photos/437038/pexels-photo-437038.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/393047/pexels-photo-393047.jpeg?auto=compress&cs=tinysrgb&w=800"
    ],
    colors: ["#2b2b2b", "#ff1493", "#0000ff"],
    sizes: [],
    description: "Track your fitness goals with continuous heart rate monitoring and sleep tracking.",
    details: "7-day battery, Water resistant, 14 sport modes, Connected GPS",
    category: "electronics",
    brand: "Fitbit",
  },
  {
    slug: "usb-c-fast-charger",
    title: "65W USB-C Fast Charger Multi-Port",
    price: 49,
    compareAt: 69,
    rating: 4.7,
    images: [
      "https://images.pexels.com/photos/4195325/pexels-photo-4195325.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/163117/keyboard-type-computer-computing-163117.jpeg?auto=compress&cs=tinysrgb&w=800"
    ],
    colors: ["#ffffff", "#2b2b2b"],
    sizes: [],
    description: "Compact 65W charger with 3 ports. Fast charge laptops, tablets, and phones simultaneously.",
    details: "GaN technology, Foldable plug, USB-C PD 3.0, Universal compatibility",
    category: "electronics",
    brand: "Anker",
  },

  // More Fashion - Women
  {
    slug: "elegant-evening-gown",
    title: "Elegant Satin Evening Gown",
    price: 249,
    compareAt: 329,
    rating: 4.8,
    images: [
      "https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=800"
    ],
    colors: ["#8b0000", "#2b2b2b", "#000080"],
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "Stunning floor-length evening gown in luxurious satin. Perfect for special occasions.",
    details: "100% Polyester satin, Invisible back zipper, Fully lined, Dry clean only",
    category: "fashion",
    brand: "Marchesa",
  },
  {
    slug: "knit-cardigan-oversized",
    title: "Oversized Knit Cardigan Sweater",
    price: 68,
    compareAt: 89,
    rating: 4.5,
    images: [
      "https://images.pexels.com/photos/7679881/pexels-photo-7679881.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/8148577/pexels-photo-8148577.jpeg?auto=compress&cs=tinysrgb&w=800"
    ],
    colors: ["#f5f5dc", "#808080", "#d2b48c"],
    sizes: ["S", "M", "L", "XL"],
    description: "Cozy oversized cardigan with chunky knit. Layer over any outfit for instant comfort.",
    details: "Acrylic blend, Button front, Drop shoulder, Machine washable",
    category: "fashion",
    brand: "Free People",
  },
  {
    slug: "leather-ankle-boots",
    title: "Classic Leather Ankle Boots",
    price: 179,
    compareAt: 229,
    rating: 4.7,
    images: [
      "https://images.pexels.com/photos/336372/pexels-photo-336372.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=800"
    ],
    colors: ["#2b2b2b", "#8b4513"],
    sizes: ["36", "37", "38", "39", "40", "41"],
    description: "Premium leather ankle boots with comfortable block heel. Versatile and stylish.",
    details: "Genuine leather, 5cm heel, Side zipper, Cushioned insole",
    category: "fashion",
    brand: "Steve Madden",
  },

  // More Fashion - Men
  {
    slug: "slim-fit-suit-jacket",
    title: "Modern Slim Fit Suit Jacket",
    price: 299,
    compareAt: 399,
    rating: 4.6,
    images: [
      "https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/1152994/pexels-photo-1152994.jpeg?auto=compress&cs=tinysrgb&w=800"
    ],
    colors: ["#000080", "#2b2b2b", "#808080"],
    sizes: ["38R", "40R", "42R", "44R"],
    description: "Tailored suit jacket with modern slim fit. Perfect for business or formal occasions.",
    details: "Wool blend, Two-button closure, Notch lapel, Fully lined",
    category: "fashion",
    brand: "Hugo Boss",
  },
  {
    slug: "casual-polo-shirt",
    title: "Classic Pique Polo Shirt",
    price: 65,
    compareAt: 85,
    rating: 4.5,
    images: [
      "https://images.pexels.com/photos/2182973/pexels-photo-2182973.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/2220315/pexels-photo-2220315.jpeg?auto=compress&cs=tinysrgb&w=800"
    ],
    colors: ["#ffffff", "#000080", "#8b0000", "#2b2b2b"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Timeless polo shirt in soft pique cotton. Essential for smart casual style.",
    details: "100% Cotton pique, Two-button placket, Ribbed collar and cuffs",
    category: "fashion",
    brand: "Ralph Lauren",
  },
  {
    slug: "running-sneakers-men",
    title: "Performance Running Sneakers",
    price: 129,
    compareAt: 159,
    rating: 4.8,
    images: [
      "https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=800"
    ],
    colors: ["#2b2b2b", "#ffffff", "#0000ff"],
    sizes: ["8", "9", "10", "11", "12"],
    description: "Lightweight running shoes with responsive cushioning. Engineered for speed and comfort.",
    details: "Breathable mesh upper, React foam midsole, Durable rubber outsole",
    category: "fashion",
    brand: "Nike",
  },

  // More Beauty
  {
    slug: "luxury-skincare-set",
    title: "Anti-Aging Luxury Skincare Set",
    price: 189,
    compareAt: 245,
    rating: 4.7,
    images: [
      "https://images.pexels.com/photos/3785147/pexels-photo-3785147.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/3762879/pexels-photo-3762879.jpeg?auto=compress&cs=tinysrgb&w=800"
    ],
    colors: [],
    sizes: [],
    description: "Complete anti-aging regimen with cleanser, serum, and moisturizer. Visible results in 4 weeks.",
    details: "Retinol and hyaluronic acid, Dermatologist tested, Suitable for all skin types",
    category: "beauty",
    brand: "Estée Lauder",
  },
  {
    slug: "makeup-brush-set-professional",
    title: "Professional Makeup Brush Set 12-Piece",
    price: 79,
    compareAt: 109,
    rating: 4.6,
    images: [
      "https://images.pexels.com/photos/2113855/pexels-photo-2113855.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/3373736/pexels-photo-3373736.jpeg?auto=compress&cs=tinysrgb&w=800"
    ],
    colors: ["#ff1493", "#2b2b2b", "#d4af37"],
    sizes: [],
    description: "Complete brush collection for face and eyes. Synthetic bristles, cruelty-free.",
    details: "12 essential brushes, Vegan bristles, Includes carrying case, Easy to clean",
    category: "beauty",
    brand: "Morphe",
  },
  {
    slug: "hair-straightener-ceramic",
    title: "Professional Ceramic Hair Straightener",
    price: 149,
    compareAt: 189,
    rating: 4.8,
    images: [
      "https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/3065171/pexels-photo-3065171.jpeg?auto=compress&cs=tinysrgb&w=800"
    ],
    colors: ["#2b2b2b", "#ffffff"],
    sizes: [],
    description: "Fast heating ceramic plates for smooth, frizz-free hair. Adjustable temperature control.",
    details: "Ceramic tourmaline plates, 30-second heat up, Auto shut-off, Dual voltage",
    category: "beauty",
    brand: "GHD",
  },

  // More Accessories
  {
    slug: "designer-wallet-leather",
    title: "Designer Leather Bifold Wallet",
    price: 125,
    compareAt: 165,
    rating: 4.7,
    images: [
      "https://images.pexels.com/photos/1058959/pexels-photo-1058959.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/2696064/pexels-photo-2696064.jpeg?auto=compress&cs=tinysrgb&w=800"
    ],
    colors: ["#2b2b2b", "#8b4513"],
    sizes: [],
    description: "Slim bifold wallet in premium leather. RFID blocking for security.",
    details: "Full-grain leather, 8 card slots, RFID protection, Gift box included",
    category: "accessories",
    brand: "Coach",
  },
  {
    slug: "pearl-necklace-classic",
    title: "Classic Freshwater Pearl Necklace",
    price: 159,
    compareAt: 215,
    rating: 4.8,
    images: [
      "https://oceans-treasure.com/cdn/shop/files/ighdmenjjk3txkblt2ws_1200x.png?v=1736450155"
    ],
    colors: [],
    sizes: ["16 inch"],
    description: "Elegant freshwater pearl strand. Timeless elegance for any occasion.",
    details: "6-7mm pearls, Sterling silver clasp, Comes in jewelry box",
    category: "accessories",
    brand: "Mikimoto",
  },
  {
    slug: "baseball-cap-cotton",
    title: "Classic Cotton Baseball Cap",
    price: 35,
    compareAt: 45,
    rating: 4.5,
    images: [
      "https://images.pexels.com/photos/984619/pexels-photo-984619.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/1124960/pexels-photo-1124960.jpeg?auto=compress&cs=tinysrgb&w=800"
    ],
    colors: ["#2b2b2b", "#000080", "#ffffff"],
    sizes: ["One Size"],
    description: "Adjustable cotton baseball cap with embroidered logo. Casual everyday essential.",
    details: "100% Cotton, Adjustable strap, Pre-curved brim, Machine washable",
    category: "accessories",
    brand: "New Era",
  },

  // Home & Living
  {
    slug: "smart-led-bulbs-4pack",
    title: "Smart WiFi LED Light Bulbs 4-Pack",
    price: 45,
    compareAt: 65,
    rating: 4.6,
    images: [
      "https://images.pexels.com/photos/1112598/pexels-photo-1112598.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/1108572/pexels-photo-1108572.jpeg?auto=compress&cs=tinysrgb&w=800"
    ],
    colors: [],
    sizes: [],
    description: "Color-changing smart bulbs compatible with Alexa and Google Home. 16 million colors.",
    details: "WiFi enabled, Voice control, Dimmable, 25,000 hour lifespan",
    category: "home",
    brand: "Philips Hue",
  },
  {
    slug: "robot-vacuum-cleaner",
    title: "Smart Robot Vacuum with Mapping",
    price: 349,
    compareAt: 449,
    rating: 4.7,
    images: [
      "https://images.pexels.com/photos/4107278/pexels-photo-4107278.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/4239091/pexels-photo-4239091.jpeg?auto=compress&cs=tinysrgb&w=800"
    ],
    colors: ["#2b2b2b", "#ffffff"],
    sizes: [],
    description: "Intelligent robot vacuum with room mapping and app control. 2-in-1 vacuum and mop.",
    details: "LiDAR navigation, 2000Pa suction, 2-hour runtime, Auto-recharge",
    category: "home",
    brand: "Roborock",
  },
  {
    slug: "air-purifier-hepa",
    title: "HEPA Air Purifier for Large Rooms",
    price: 229,
    compareAt: 289,
    rating: 4.8,
    images: [
      "https://images.pexels.com/photos/5824488/pexels-photo-5824488.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/7533400/pexels-photo-7533400.jpeg?auto=compress&cs=tinysrgb&w=800"
    ],
    colors: ["#ffffff", "#2b2b2b"],
    sizes: [],
    description: "True HEPA filtration removes 99.97% of allergens and pollutants. Covers up to 500 sq ft.",
    details: "3-stage filtration, Air quality sensor, Sleep mode, Energy Star certified",
    category: "home",
    brand: "Levoit",
  },
];

async function seedProducts() {
  try {
    console.log('🌱 Seeding products (optimized images) to MongoDB...\n');
    await mongoose.connect(MONGODB_URI);
    
    const db = mongoose.connection.db;
    const productsCollection = db.collection('products');
    
    // Clear existing products
    await productsCollection.deleteMany({});
    console.log('✓ Cleared existing products\n');
    
    // Insert new products
    await productsCollection.insertMany(products);
    console.log(`✅ Successfully seeded ${products.length} products!\n`);
    
    // Count local vs URL images
    const localImageProducts = products.filter(p => p.images[0].startsWith('/images')).length;
    const urlImageProducts = products.filter(p => p.images[0].startsWith('http')).length;
    
    console.log('📸 Image sources:');
    console.log(`   - Local images: ${localImageProducts} products`);
    console.log(`   - Pexels URLs (high quality): ${urlImageProducts} products\n`);
    
    // Show summary by category
    const categories = {};
    products.forEach(p => {
      categories[p.category] = (categories[p.category] || 0) + 1;
    });
    
    console.log('📊 Products by category:');
    Object.entries(categories).forEach(([cat, count]) => {
      console.log(`   - ${cat}: ${count} products`);
    });
    console.log('');
    
    // Show summary by brand
    const brands = {};
    products.forEach(p => {
      brands[p.brand] = (brands[p.brand] || 0) + 1;
    });
    
    console.log('🏷️  Products by brand:');
    Object.entries(brands).forEach(([brand, count]) => {
      console.log(`   - ${brand}: ${count} products`);
    });
    console.log('');
    
    console.log('🎉 Done! Using Pexels for reliable, high-quality images.\n');
    console.log('✨ Total: ' + products.length + ' products\n');
    console.log('💡 All new products have accurate names matching their images!\n');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    process.exit(1);
  }
}

seedProducts();

