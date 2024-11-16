import mongoose, { Types } from 'mongoose';

const memorySchema = new mongoose.Schema(
  {
    userId: { type: Types.ObjectId, required: true },
    vserId: { type: String, required: true }, 
    embeddings: { type: [Number], required: true},
    metadata: {
      keywords: { type: String, required: true },
      context: { type: String, required: true },
    }
  },
  {
    timestamps: true,
  },
);


const memoriesModel = mongoose.model('memories', memorySchema);
export default memoriesModel;