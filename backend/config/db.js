import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/civicpulsehub';
    
    console.log('📊 Attempting to connect to MongoDB...');
    console.log(`📍 Connection URI: ${uri}`);
    
    // Simple connection without complex options
    await mongoose.connect(uri);
    
    console.log('✅ Connected to MongoDB successfully');
    console.log(`🗄️  Database: ${mongoose.connection.name}`);
    
    // Test the connection with a simple ping
    await mongoose.connection.db.admin().ping();
    console.log('🏓 Database ping successful');
    
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.log('💡 Make sure MongoDB is running on localhost:27017');
    console.log('   Or install MongoDB Community Edition https://www.mongodb.com/try/download/community');
    
    // Exit the process if database connection fails
    console.log('🚨 Exiting - Database connection is required for this application');
    process.exit(1);
  }
};

export default connectDB;
