import mongoose from 'mongoose';
import dotenv from 'dotenv';

<<<<<<< HEAD
dotenv.config();

const connectToMongo = async () => {
  const dbUrl = process.env.MONGODB_DATABASE_URL + '/cloudsmiles';
  try {
    await mongoose.connect(dbUrl)
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
=======
const connectToMongo = async () => {
  const dbUrl = process.env.MONGODB_DATABASE_URL + '/cloudsmiles';
  await mongoose.connect(dbUrl)
    .then(() => console.log('Successfully connected to MongoDB'))
    .catch((error: Error) => console.error('MongoDB connection error:', error));
>>>>>>> c0c30f4d0a2b1d248cf5135918e66b1609abf748
};

export default connectToMongo;
