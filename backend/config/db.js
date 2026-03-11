import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/civicpulsehub';
    
    console.log('📊 Attempting to connect to MongoDB...');
    
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    
    console.log('✅ Connected to MongoDB successfully');
  } catch (err) {
    console.warn('⚠️ MongoDB connection failed:', err.message);
    console.log('💡 Make sure MongoDB is running on localhost:27017');
    console.log('   Or install MongoDB Community Edition https://www.mongodb.com/try/download/community');
    
    // Continue without database - app will still work in limited mode
    console.log('📝 Continuing without database...');
  }
};

export default connectDB;
