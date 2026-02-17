// Reset Database - Clear all collections so app can re-seed properly
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error(' ERROR: MONGODB_URI not found in .env.local');
  process.exit(1);
}

console.log('🔄 Resetting database for fresh seeding...\n');

async function resetDatabase() {
  try {
    console.log('⏳ Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!\n');

    const db = mongoose.connection.db;

    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('📋 Collections to clear:');
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    console.log('');

    // Clear products
    if (collections.some(c => c.name === 'products')) {
      const result = await db.collection('products').deleteMany({});
      console.log(`🗑️  Deleted ${result.deletedCount} products`);
    }

    // Clear reviews
    if (collections.some(c => c.name === 'reviews')) {
      const result = await db.collection('reviews').deleteMany({});
      console.log(`🗑️  Deleted ${result.deletedCount} reviews`);
    }

    // Optional: Clear users (uncomment if you want to reset users too)
    // if (collections.some(c => c.name === 'users')) {
    //   const result = await db.collection('users').deleteMany({});
    //   console.log(`🗑️  Deleted ${result.deletedCount} users`);
    // }

    // Optional: Clear sessions
    if (collections.some(c => c.name === 'sessions')) {
      const result = await db.collection('sessions').deleteMany({});
      console.log(`🗑️  Deleted ${result.deletedCount} sessions`);
    }

    console.log('\n Database reset complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Restart your server: npm run dev');
    console.log('   2. Products and reviews will be automatically seeded');
    console.log('   3. Demo user will be created\n');

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('\n Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

resetDatabase();

