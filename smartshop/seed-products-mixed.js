// Mixed Seed Products Script - Local images for first 15, URLs for new products
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
    images: ["/images/prod2.jpg"],
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

  // ==================== NEW PRODUCTS (External Image URLs) ====================
  
  // More Electronics
  {
    slug: "dell-xps-15-laptop",
    title: "Dell XPS 15 OLED Laptop",
    price: 1899,
    compareAt: 2199,
    rating: 4.7,
    images: [
      "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&q=80",
      "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&q=80"
    ],
    colors: ["#c0c0c0", "#2b2b2b"],
    sizes: ["512GB", "1TB"],
    description: "Premium laptop with stunning OLED display. Perfect for creators and professionals.",
    details: "15.6-inch OLED 3.5K display, Intel Core i7, NVIDIA RTX 4050",
    category: "electronics",
    brand: "Dell",
  },
  {
    slug: "samsung-galaxy-s24-ultra",
    title: "Samsung Galaxy S24 Ultra",
    price: 1299,
    compareAt: 1399,
    rating: 4.8,
    images: [
      "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80",
      "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=800&q=80"
    ],
    colors: ["#2b2b2b", "#5d6b64", "#8b7355"],
    sizes: ["256GB", "512GB", "1TB"],
    description: "The ultimate flagship with S Pen. 200MP camera, AI features, titanium frame.",
    details: "6.8-inch Dynamic AMOLED 2X display, Snapdragon 8 Gen 3, 5000mAh battery",
    category: "electronics",
    brand: "Samsung",
  },
  {
    slug: "sony-wh1000xm5-headphones",
    title: "Sony WH-1000XM5 Wireless Headphones",
    price: 399,
    compareAt: 449,
    rating: 4.9,
    images: [
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80",
      "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&q=80"
    ],
    colors: ["#2b2b2b", "#c0c0c0"],
    sizes: [],
    description: "Industry-leading noise cancellation. Premium sound quality. All-day comfort.",
    details: "30-hour battery life, Multipoint connection, Touch controls",
    category: "electronics",
    brand: "Sony",
  },
  {
    slug: "ipad-pro-12-9-m2",
    title: "iPad Pro 12.9\" M2 Chip",
    price: 1099,
    compareAt: 1199,
    rating: 4.8,
    images: [
      "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80",
      "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&q=80"
    ],
    colors: ["#c0c0c0", "#2b2b2b"],
    sizes: ["128GB", "256GB", "512GB", "1TB"],
    description: "The ultimate iPad experience with M2 chip. Stunning Liquid Retina XDR display.",
    details: "12.9-inch Liquid Retina XDR display, Apple Pencil hover, ProRes video recording",
    category: "electronics",
    brand: "Apple",
  },
  {
    slug: "sony-a7-iv-camera",
    title: "Sony Alpha a7 IV Mirrorless Camera",
    price: 2499,
    compareAt: 2798,
    rating: 4.9,
    images: [
      "https://images.unsplash.com/photo-1606980639874-0037c20b0d89?w=800&q=80",
      "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80"
    ],
    colors: ["#2b2b2b"],
    sizes: ["Body Only", "Kit Lens"],
    description: "Professional hybrid camera. 33MP full-frame sensor. 4K 60fps video.",
    details: "33MP BSI CMOS sensor, 759-point phase detection AF, 5-axis stabilization",
    category: "electronics",
    brand: "Sony",
  },

  // More Fashion
  {
    slug: "silk-midi-slip-dress",
    title: "Silk Charmeuse Midi Slip Dress",
    price: 198,
    compareAt: 248,
    rating: 4.7,
    images: [
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&q=80",
      "https://images.unsplash.com/photo-1612336307429-8a898d10e223?w=800&q=80"
    ],
    colors: ["#2b2b2b", "#8b0000", "#c0c0c0"],
    sizes: ["XS", "S", "M", "L"],
    description: "Luxurious silk slip dress with cowl neckline. Effortlessly elegant.",
    details: "100% Silk, Dry clean recommended, Adjustable straps",
    category: "fashion",
    brand: "Reformation",
  },
  {
    slug: "cashmere-turtleneck-sweater",
    title: "Pure Cashmere Turtleneck Sweater",
    price: 169,
    compareAt: 229,
    rating: 4.8,
    images: [
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80",
      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&q=80"
    ],
    colors: ["#f5f5dc", "#2b2b2b", "#8b4513"],
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "Soft and cozy 100% cashmere turtleneck. A wardrobe essential.",
    details: "100% Pure Cashmere, Hand wash cold, Imported from Scotland",
    category: "fashion",
    brand: "Everlane",
  },
  {
    slug: "high-waisted-wide-leg-jeans",
    title: "High-Waisted Wide Leg Jeans",
    price: 98,
    compareAt: 128,
    rating: 4.5,
    images: [
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80",
      "https://images.unsplash.com/photo-1582418702059-97ebafb35d09?w=800&q=80"
    ],
    colors: ["#4169e1", "#2b2b2b"],
    sizes: ["24", "25", "26", "27", "28", "29", "30"],
    description: "Vintage-inspired wide leg jeans with flattering high waist. Comfortable stretch denim.",
    details: "98% Cotton, 2% Elastane, Machine washable, Made in USA",
    category: "fashion",
    brand: "Madewell",
  },
  {
    slug: "oxford-white-dress-shirt",
    title: "Classic Oxford White Dress Shirt",
    price: 79,
    compareAt: 95,
    rating: 4.6,
    images: [
      "https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=800&q=80",
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80"
    ],
    colors: ["#ffffff", "#87ceeb", "#ff6b9d"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Crisp cotton oxford shirt. Perfect for business or smart casual.",
    details: "100% Cotton, Button-down collar, Machine washable",
    category: "fashion",
    brand: "Brooks Brothers",
  },
  {
    slug: "merino-wool-crewneck-sweater",
    title: "Merino Wool Crewneck Sweater",
    price: 98,
    compareAt: 128,
    rating: 4.7,
    images: [
      "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&q=80",
      "https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?w=800&q=80"
    ],
    colors: ["#2b2b2b", "#000080", "#808080"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Soft merino wool sweater. Breathable, temperature-regulating, and odor-resistant.",
    details: "100% Merino Wool, Hand wash cold, New Zealand wool",
    category: "fashion",
    brand: "J.Crew",
  },

  // More Beauty
  {
    slug: "tom-ford-oud-wood",
    title: "Tom Ford Oud Wood Eau de Parfum",
    price: 285,
    compareAt: 340,
    rating: 4.9,
    images: [
      "https://images.unsplash.com/photo-1592853612411-ccd9b5a7ada1?w=800&q=80",
      "https://images.unsplash.com/photo-1557170334-a9632e77c22e?w=800&q=80"
    ],
    colors: [],
    sizes: ["50ml", "100ml"],
    description: "Rare oud wood with rich spices. Sophisticated and sensual.",
    details: "Woody aromatic fragrance, Unisex, Long-lasting performance",
    category: "beauty",
    brand: "Tom Ford",
  },
  {
    slug: "la-mer-moisturizing-cream",
    title: "La Mer The Moisturizing Cream",
    price: 195,
    compareAt: 230,
    rating: 4.7,
    images: [
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80",
      "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800&q=80"
    ],
    colors: [],
    sizes: ["30ml", "60ml", "100ml"],
    description: "Luxurious face cream with Miracle Broth. Soothes, softens, and hydrates.",
    details: "Suitable for all skin types, Paraben-free, Dermatologist tested",
    category: "beauty",
    brand: "La Mer",
  },
  {
    slug: "dyson-supersonic-hair-dryer",
    title: "Dyson Supersonic Hair Dryer",
    price: 429,
    compareAt: 479,
    rating: 4.8,
    images: [
      "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=800&q=80",
      "https://images.unsplash.com/photo-1619451334792-150fd785ee74?w=800&q=80"
    ],
    colors: ["#ff1493", "#2b2b2b", "#c0c0c0"],
    sizes: [],
    description: "Intelligent heat control protects hair from extreme heat damage. Fast drying.",
    details: "Multiple magnetic attachments, Negative ions, 3 speed settings",
    category: "beauty",
    brand: "Dyson",
  },

  // More Accessories
  {
    slug: "leather-belt-mens",
    title: "Full Grain Leather Belt",
    price: 65,
    compareAt: 85,
    rating: 4.6,
    images: [
      "https://images.unsplash.com/photo-1624222247344-550fb60583c2?w=800&q=80",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80"
    ],
    colors: ["#2b2b2b", "#8b4513"],
    sizes: ["32", "34", "36", "38", "40"],
    description: "Classic leather belt with silver buckle. Timeless accessory for any outfit.",
    details: "100% Full Grain Leather, Silver buckle, Made in Italy",
    category: "accessories",
    brand: "Coach",
  },
  {
    slug: "silk-scarf-floral",
    title: "Luxurious Silk Floral Scarf",
    price: 89,
    compareAt: 115,
    rating: 4.7,
    images: [
      "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800&q=80",
      "https://images.unsplash.com/photo-1612722432474-b971cdcea546?w=800&q=80"
    ],
    colors: ["#ff6b9d", "#87ceeb", "#d4af37"],
    sizes: ["90x90cm"],
    description: "Hand-painted floral silk scarf. Adds elegance to any ensemble.",
    details: "100% Mulberry Silk, Hand-rolled edges, Made in France",
    category: "accessories",
    brand: "Hermès",
  },
  {
    slug: "minimalist-watch-automatic",
    title: "Minimalist Automatic Watch",
    price: 449,
    compareAt: 599,
    rating: 4.8,
    images: [
      "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&q=80",
      "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=800&q=80"
    ],
    colors: ["#c0c0c0", "#2b2b2b", "#d4af37"],
    sizes: ["40mm", "42mm"],
    description: "Swiss automatic movement. Sapphire crystal. Minimalist design philosophy.",
    details: "Stainless steel case, Leather strap, Water resistant 50m",
    category: "accessories",
    brand: "Daniel Wellington",
  },

  // Home & Living
  {
    slug: "dyson-v15-vacuum",
    title: "Dyson V15 Detect Cordless Vacuum",
    price: 649,
    compareAt: 749,
    rating: 4.8,
    images: [
      "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&q=80",
      "https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=800&q=80"
    ],
    colors: ["#4b0082", "#2b2b2b"],
    sizes: [],
    description: "Laser reveals invisible dust. Powerful suction. LCD screen shows what you've picked up.",
    details: "60 minutes run time, HEPA filtration, Multiple attachments included",
    category: "home",
    brand: "Dyson",
  },
  {
    slug: "nespresso-vertuo-coffee-maker",
    title: "Nespresso Vertuo Plus Coffee Maker",
    price: 179,
    compareAt: 219,
    rating: 4.6,
    images: [
      "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&q=80",
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80"
    ],
    colors: ["#2b2b2b", "#c0c0c0", "#8b0000"],
    sizes: [],
    description: "One-touch brewing system. Makes 5 cup sizes. Centrifusion technology.",
    details: "40 oz water tank, Used capsule container, Energy saving mode",
    category: "home",
    brand: "Nespresso",
  },
];

async function seedProducts() {
  try {
    console.log('🌱 Seeding products (mixed local/URL images) to MongoDB...\n');
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
    console.log(`   - External URLs: ${urlImageProducts} products\n`);
    
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
    
    console.log('🎉 Done! First 15 products use local images, new ones use Unsplash URLs.\n');
    console.log('✨ Total: ' + products.length + ' products across all categories\n');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    process.exit(1);
  }
}

seedProducts();

