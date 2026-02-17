// Script to update individual product images
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

// ============================================
// UPDATE YOUR PRODUCT IMAGES HERE
// ============================================

const imageUpdates = [
  {
    slug: "tom-ford-oud-wood",
    images: [
      "YOUR_IMAGE_URL_HERE",
      "YOUR_IMAGE_URL_HERE_2"
    ]
  },
  {
    slug: "sony-a7-iv-camera",
    images: [
      "YOUR_IMAGE_URL_HERE",
      "YOUR_IMAGE_URL_HERE_2"
    ]
  },
  // Add more products here...
];

// ============================================

async function updateImages() {
  try {
    console.log('🖼️  Updating product images...\n');
    await mongoose.connect(MONGODB_URI);
    
    const db = mongoose.connection.db;
    const productsCollection = db.collection('products');
    
    let updated = 0;
    let notFound = 0;
    
    for (const update of imageUpdates) {
      const result = await productsCollection.updateOne(
        { slug: update.slug },
        { $set: { images: update.images } }
      );
      
      if (result.matchedCount > 0) {
        console.log(`✅ Updated: ${update.slug}`);
        updated++;
      } else {
        console.log(`❌ Not found: ${update.slug}`);
        notFound++;
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   - Updated: ${updated} products`);
    console.log(`   - Not found: ${notFound} products`);
    console.log('\n🎉 Done!\n');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating images:', error);
    process.exit(1);
  }
}

updateImages();

