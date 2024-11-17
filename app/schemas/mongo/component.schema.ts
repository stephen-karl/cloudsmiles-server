import { Document, Schema, Types, model } from 'mongoose';

interface IComponent extends Document {
  _id: Types.ObjectId;
  componentProductId: Types.ObjectId;
  componentAmount: number;
  componentFreeAmount?: number;  
  isComponentFree: "free" | "freeUpTo";
}

const componentSchema = new Schema<IComponent>(
  {
    componentProductId: { type: Schema.Types.ObjectId, required: true, ref: "products" }, 
    componentAmount: { type: Number, required: true },
    componentFreeAmount: { type: Number, required: false }, 
    isComponentFree: { type: String, enum: ["free", "freeUpTo"], required: true }, 
  },
  {
    timestamps: true,
  },
);

const ComponentModel = model<IComponent>('components', componentSchema);
export default ComponentModel;
