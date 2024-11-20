import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectToMongo = async () => {
  const dbUrl = process.env.MONGODB_DATABASE_URL + '/cloudsmiles';
  try {
    await mongoose.connect(dbUrl)
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

export default connectToMongo;
