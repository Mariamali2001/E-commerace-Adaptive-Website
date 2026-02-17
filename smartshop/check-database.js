// Check Database Contents
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

async function checkDatabase() {
  try {
    console.log('🔍 Checking database contents...\n');
    await mongoose.connect(MONGODB_URI);
    
    const db = mongoose.connection.db;
    
    // Check products
    const products = await db.collection('products').find({}).limit(5).toArray();
    console.log(`📦 Products: ${await db.collection('products').countDocuments()} total`);
    if (products.length > 0) {
      products.forEach(p => {
        console.log(`   - ${p.title || p.slug || p._id}`);
      });
    } else {
      console.log('   ⚠️  No products found! Database needs seeding.');
    }
    console.log('');
    
    // Check reviews
    const reviews = await db.collection('reviews').find({}).limit(5).toArray();
    console.log(`💬 Reviews: ${await db.collection('reviews').countDocuments()} total`);
    if (reviews.length > 0) {
      reviews.forEach(r => {
        console.log(`   - ${r.author}: ${r.rating}⭐ on product ${r.productId}`);
      });
    } else {
      console.log('   ⚠️  No reviews found! Database needs seeding.');
    }
    console.log('');
    
    // Check users
    const users = await db.collection('users').find({}).toArray();
    console.log(`👥 Users: ${users.length} total`);
    if (users.length > 0) {
      users.forEach(u => {
        console.log(`   - ${u.name} (${u.email})`);
      });
    } else {
      console.log('   ⚠️  No users found! Demo user not created.');
    }
    console.log('');
    
    // Check sessions
    const sessions = await db.collection('sessions').countDocuments();
    console.log(`🔐 Active Sessions: ${sessions}`);
    console.log('');
    
    await mongoose.connection.close();
    
    if (products.length === 0 || reviews.length === 0) {
      console.log('❌ Database is empty or incomplete.');
      console.log('\n💡 Solution: Stop the server and run:');
      console.log('   node reset-database.js');
      console.log('   npm run dev\n');
    } else {
      console.log('✅ Database looks good!\n');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkDatabase();

