// List all products with their current images
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

async function listProducts() {
  try {
    console.log('📋 Listing all products...\n');
    await mongoose.connect(MONGODB_URI);
    
    const db = mongoose.connection.db;
    const productsCollection = db.collection('products');
    
    const products = await productsCollection.find({}).toArray();
    
    console.log(`Total products: ${products.length}\n`);
    console.log('─'.repeat(80));
    
    products.forEach((p, index) => {
      console.log(`\n${index + 1}. ${p.title}`);
      console.log(`   Slug: ${p.slug}`);
      console.log(`   Brand: ${p.brand}`);
      console.log(`   Images: ${p.images.length} image(s)`);
      p.images.forEach((img, i) => {
        const isLocal = img.startsWith('/images');
        const isURL = img.startsWith('http');
        const status = isLocal ? '🏠 Local' : isURL ? '🌐 URL' : '❓ Unknown';
        console.log(`      ${i + 1}. ${status} - ${img.substring(0, 60)}${img.length > 60 ? '...' : ''}`);
      });
    });
    
    console.log('\n' + '─'.repeat(80));
    console.log('\n💡 To update images, edit update-product-images.js\n');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error listing products:', error);
    process.exit(1);
  }
}

listProducts();

