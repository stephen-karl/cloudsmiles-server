import mongoose from 'mongoose';

const connectToMongo = async () => {
  const dbUrl = process.env.MONGODB_DATABASE_URL + '/cloudsmiles';
  await mongoose.connect(dbUrl)
    .then(() => console.log('Successfully connected to MongoDB'))
    .catch((error: Error) => console.error('MongoDB connection error:', error));
};

export default connectToMongo;
