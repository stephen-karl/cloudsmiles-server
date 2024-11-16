import { Document, Schema, model } from 'mongoose';
import CounterModel from './counter.schema';

interface IRequest extends Document {
  requestSerialId: string;
  requestLabel: string;
  requestStatus: string;
  requestEmbeddings: number[];
}

const requestsSchema = new Schema<IRequest>(
  {
    requestSerialId: { type: String, required: false, unique: true },
    requestLabel: { type: String, required: true},
    requestEmbeddings: { type: [Number], required: true},
    requestStatus: { type: String, required: true },
  },
  {
    timestamps: true,
  },
);

requestsSchema.pre('save', async function (next) {
  const doc = this;
  if (doc.isNew) {
    const counter = await CounterModel.findOneAndUpdate(
      { sequenceName: 'request_sequence' },
      { $inc: { count: 1 } },
      { new: true, upsert: true }
    );
    doc.requestSerialId = `RQST${counter.count.toString().padStart(4, '0')}`;
  }
  next();
});


const requestsModel = model<IRequest>('requests', requestsSchema);
export default requestsModel;




