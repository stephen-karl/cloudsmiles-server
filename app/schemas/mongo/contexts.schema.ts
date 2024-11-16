import { Document, Schema, model } from 'mongoose';
import CounterModel from './counter.schema';

interface IContext extends Document {
  contextType: string,
  contextData: string;
  contextLabel: string;
  contextCategory: string;
  contextEmbeddings: number[],
  contextSerialId: string;
}

const contextsSchema = new Schema<IContext>(
  {
    contextType: { type: String, required: true },
    contextData: { type: String, required: true },
    contextLabel: { type: String, required: true },
    contextEmbeddings: { type: [Number], required: true},
    contextCategory: { type: String, required: false },
    contextSerialId: { type: String, required: false, unique: true },
  },
  {
    timestamps: true,
  },
);

contextsSchema.pre('save', async function (next) {
  const doc = this;
  if (doc.isNew) {
    const counter = await CounterModel.findOneAndUpdate(
      { sequenceName: 'context_sequence' },
      { $inc: { count: 1 } },
      { new: true, upsert: true }
    );
    doc.contextSerialId = `CNTXT${counter.count.toString().padStart(4, '0')}`;
  }
  next();
});

const contextsModel = model<IContext>('contexts', contextsSchema);
export default contextsModel;
