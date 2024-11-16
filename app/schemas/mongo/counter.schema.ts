import { Schema, model, Document } from 'mongoose';


interface ICounter extends Document {
  sequenceName: string;
  count: number;
}

const counterSchema = new Schema<ICounter>(
  {
    sequenceName: { type: String, required: true },
    count: { type: Number, required: true }
  },
  {
    timestamps: true, 
  }
);


const CounterModel = model<ICounter>('counters', counterSchema);
export default CounterModel;
