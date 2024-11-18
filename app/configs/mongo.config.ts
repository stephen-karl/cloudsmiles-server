import mongoose from 'mongoose';

const connectToMongo = async () => {
  const dbUrl = process.env.MONGODB_DATABASE_URL + '/cloudsmiles';

  try {
    await mongoose.connect(dbUrl, {
      useNewUrlParser: true,            // Ensures MongoDB URI parsing is modern
      useUnifiedTopology: true,        // Uses the new unified topology engine
      useCreateIndex: true,            // Ensures indexes are created automatically (if necessary)
      poolSize: 10,                    // Connection pool size (default is 5)
      serverSelectionTimeoutMS: 5000,  // Timeout for finding a MongoDB server (5 seconds)
      socketTimeoutMS: 45000,          // Timeout for idle connections (45 seconds)
    });
    console.log('Successfully connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1); // Exit the process if MongoDB connection fails (optional)
  }
};

export default connectToMongo;
