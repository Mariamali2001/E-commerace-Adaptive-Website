// Fix Review Product IDs - Update old string IDs to new MongoDB ObjectIds
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

async function fixReviewProductIds() {
  try {
    console.log('🔧 Fixing review product IDs...\n');
    await mongoose.connect(MONGODB_URI);
    
    const db = mongoose.connection.db;
    const productsCollection = db.collection('products');
    const reviewsCollection = db.collection('reviews');
    
    // Get all products with their slugs
    const products = await productsCollection.find({}).toArray();
    console.log(`Found ${products.length} products\n`);
    
    // Create a mapping of old ID to new ObjectId based on slug
    // Assuming the first few products map to p1, p2, p3, etc.
    const idMapping = {};
    products.forEach((product, index) => {
      idMapping[`p${index + 1}`] = product._id.toString();
      console.log(`   p${index + 1} → ${product._id} (${product.title})`);
    });
    console.log('');
    
    // Update reviews
    let updatedCount = 0;
    for (const [oldId, newId] of Object.entries(idMapping)) {
      const result = await reviewsCollection.updateMany(
        { productId: oldId },
        { $set: { productId: newId } }
      );
      if (result.modifiedCount > 0) {
        console.log(`✅ Updated ${result.modifiedCount} reviews from ${oldId} to ${newId}`);
        updatedCount += result.modifiedCount;
      }
    }
    
    console.log(`\n🎉 Updated ${updatedCount} review(s) total!\n`);
    
    // Verify
    const reviews = await reviewsCollection.find({}).limit(5).toArray();
    console.log('Sample reviews after update:');
    reviews.forEach(r => {
      console.log(`   - ${r.author}: ${r.rating}⭐ on product ${r.productId}`);
    });
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixReviewProductIds();

