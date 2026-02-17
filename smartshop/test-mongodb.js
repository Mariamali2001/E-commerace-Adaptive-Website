// Simple MongoDB Connection Test
// Run this with: node test-mongodb.js

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ ERROR: MONGODB_URI not found in .env.local');
  console.log('\n📝 Make sure your .env.local file exists and contains:');
  console.log('MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smartshop?...\n');
  process.exit(1);
}

console.log('🔍 Testing MongoDB connection...\n');
console.log('📍 Connection string format:');
console.log('   ' + MONGODB_URI.replace(/:[^:@]+@/, ':***PASSWORD***@'));
console.log('');

async function testConnection() {
  try {
    console.log('⏳ Connecting to MongoDB Atlas...');
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
    });
    
    console.log('✅ SUCCESS! MongoDB connected successfully!\n');
    console.log('📊 Connection Details:');
    console.log('   - Host:', mongoose.connection.host);
    console.log('   - Database:', mongoose.connection.name);
    console.log('   - Ready State:', mongoose.connection.readyState === 1 ? 'Connected' : 'Unknown');
    
    // Test a simple operation
    console.log('\n🧪 Testing database operation...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`   - Found ${collections.length} collection(s)`);
    
    if (collections.length > 0) {
      console.log('   - Collections:', collections.map(c => c.name).join(', '));
    }
    
    console.log('\n🎉 Everything is working! You can now run: npm run dev\n');
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ CONNECTION FAILED!\n');
    
    if (error.message.includes('bad auth') || error.message.includes('authentication failed')) {
      console.error('🔐 Authentication Error - Wrong username or password!\n');
      console.log('Solutions:');
      console.log('1. Check your MongoDB Atlas username and password');
      console.log('2. If password has special characters (@, #, %, etc.), URL-encode them');
      console.log('3. Create a NEW database user in MongoDB Atlas → Database Access');
      console.log('4. Make sure the user has "Read and write to any database" permissions\n');
      console.log('📖 Read FIX_AUTH_ERROR.md for detailed steps\n');
      
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.error('🌐 Network Error - Cannot reach MongoDB Atlas!\n');
      console.log('Solutions:');
      console.log('1. Check your internet connection');
      console.log('2. Verify the cluster address in your connection string');
      console.log('3. Make sure your cluster is not paused in MongoDB Atlas\n');
      
    } else if (error.message.includes('IP') || error.message.includes('not allowed')) {
      console.error('🚫 IP Access Error - Your IP is not whitelisted!\n');
      console.log('Solutions:');
      console.log('1. Go to MongoDB Atlas → Network Access');
      console.log('2. Add IP Address: 0.0.0.0/0 (Allow access from anywhere)');
      console.log('3. Wait a few minutes for changes to take effect\n');
      
    } else {
      console.error('Error details:', error.message);
    }
    
    console.error('\nFull error:');
    console.error(error);
    
    process.exit(1);
  }
}

testConnection();

