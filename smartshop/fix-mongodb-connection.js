// MongoDB Connection Troubleshooting Script
// Run: node fix-mongodb-connection.js

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ ERROR: MONGODB_URI not found in .env.local\n');
  console.log('📝 Create .env.local file with:');
  console.log('MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smartshop\n');
  process.exit(1);
}

console.log('🔍 MongoDB Connection Troubleshooting\n');
console.log('📍 Current connection string:');
console.log('   ' + MONGODB_URI.replace(/:[^:@]+@/, ':***PASSWORD***@'));
console.log('');

// Check if it's SRV connection
const isSRV = MONGODB_URI.startsWith('mongodb+srv://');

if (isSRV) {
  console.log('⚠️  Using SRV connection (mongodb+srv://)');
  console.log('   SRV requires DNS resolution which may be failing.\n');
  console.log('💡 Try these solutions:\n');
  console.log('1. Check MongoDB Atlas Dashboard:');
  console.log('   → Is your cluster paused? Resume it if so');
  console.log('   → Is your cluster deleted? Create a new one\n');
  console.log('2. Get a fresh connection string:');
  console.log('   → MongoDB Atlas → Connect → Connect your application');
  console.log('   → Copy the NEW connection string\n');
  console.log('3. Check Network Access:');
  console.log('   → MongoDB Atlas → Network Access');
  console.log('   → Add IP: 0.0.0.0/0 (Allow from anywhere)\n');
  console.log('4. Try direct connection (see below)\n');
}

async function testConnection() {
  console.log('⏳ Attempting connection...\n');
  
  try {
    // Try with longer timeout
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ SUCCESS! Connected to MongoDB!\n');
    console.log('📊 Connection Details:');
    console.log('   - Host:', mongoose.connection.host);
    console.log('   - Database:', mongoose.connection.name);
    console.log('   - Ready State:', mongoose.connection.readyState === 1 ? 'Connected' : 'Unknown');
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ CONNECTION FAILED!\n');
    
    if (error.message.includes('ENOTFOUND') || error.message.includes('querySrv')) {
      console.error('🌐 DNS Resolution Error\n');
      console.log('This means your system cannot find the MongoDB cluster.\n');
      console.log('🔧 IMMEDIATE FIXES:\n');
      console.log('1. Check MongoDB Atlas Dashboard:');
      console.log('   https://cloud.mongodb.com/');
      console.log('   → Is cluster "cluster0.auuy63f" active?');
      console.log('   → If paused: Click "Resume" and wait 2-3 minutes\n');
      console.log('2. Get Fresh Connection String:');
      console.log('   → MongoDB Atlas → Your Cluster → Connect');
      console.log('   → "Connect your application" → Copy new string\n');
      console.log('3. Verify Network Access:');
      console.log('   → MongoDB Atlas → Network Access');
      console.log('   → Make sure 0.0.0.0/0 is whitelisted\n');
      console.log('4. Check Internet/VPN:');
      console.log('   → Try disconnecting VPN');
      console.log('   → Check firewall settings\n');
      console.log('5. Create New Cluster (if old one is deleted):');
      console.log('   → MongoDB Atlas → Create → Free Cluster');
      console.log('   → Wait 3-5 minutes for deployment\n');
      
    } else if (error.message.includes('bad auth') || error.message.includes('authentication failed')) {
      console.error('🔐 Authentication Error\n');
      console.log('Wrong username or password!\n');
      console.log('Solutions:');
      console.log('1. Reset password in MongoDB Atlas → Database Access');
      console.log('2. URL-encode special characters in password');
      console.log('3. Create new database user\n');
      
    } else if (error.message.includes('IP') || error.message.includes('not allowed')) {
      console.error('🚫 IP Access Error\n');
      console.log('Your IP is not whitelisted!\n');
      console.log('Fix: MongoDB Atlas → Network Access → Add IP: 0.0.0.0/0\n');
      
    } else {
      console.error('Error:', error.message);
    }
    
    console.log('\n📖 For detailed solutions, see: MONGODB_CONNECTION_FIX.md\n');
    process.exit(1);
  }
}

testConnection();


