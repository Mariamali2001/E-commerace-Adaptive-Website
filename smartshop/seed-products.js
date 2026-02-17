// Seed Products Script - Add products across multiple categories
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

const products = [
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
];

async function seedProducts() {
  try {
    console.log('🌱 Seeding products to MongoDB...\n');
    await mongoose.connect(MONGODB_URI);
    
    const db = mongoose.connection.db;
    const productsCollection = db.collection('products');
    
    // Clear existing products
    await productsCollection.deleteMany({});
    console.log('✓ Cleared existing products\n');
    
    // Insert new products
    await productsCollection.insertMany(products);
    console.log(`✅ Successfully seeded ${products.length} products!\n`);
    
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
    
    console.log('🎉 Done! Restart your server to see the new products.\n');
    console.log('Categories available:');
    console.log('   - electronics (phones, laptops, accessories)');
    console.log('   - fashion (clothing for men and women)');
    console.log('   - beauty (fragrances, skincare, haircare)');
    console.log('   - accessories (jewelry, bags, sunglasses)\n');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    process.exit(1);
  }
}

seedProducts();

