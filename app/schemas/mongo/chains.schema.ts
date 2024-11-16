import { Document, Schema, model, Types } from 'mongoose';

interface IDataProgress {
  time: string,
  date: string,
  dentist: string,
  name: string,
  notes: string,
  reason: string,  
} 

interface IChain extends Document {
  chainPatientId: Types.ObjectId;
  chainFeatureName: string;
  chainDataProgress: any
  chainIsActive: boolean;
}


const chainSchema = new Schema<IChain>(
  {
    chainPatientId: { type: Schema.Types.ObjectId, required: true},
    chainFeatureName: { type: String, required: true },
    chainDataProgress: { type: Object, required: false},
    chainIsActive : { type: Boolean, required: true, default: true }
  },
  {
    timestamps: true,
  },
);


const chainModel = model<IChain>('chains', chainSchema);
export default chainModel;