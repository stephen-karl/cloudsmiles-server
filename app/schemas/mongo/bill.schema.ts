import { Schema, model, Document, Types } from 'mongoose';

// Define the type for Bill that combines with Document
type BillType = Document & {
  billAppointmentId: Types.ObjectId;
  billStatus: "pending" | "cancelled" | "success" | "failed";
  billMethod: string;
  billAmount: number;
  billNotes: string;
  billTotalCost: number;
  billIntentId: string;
  billRedirectUrl: string;
  billDueDate: Date;
  billType: string;
  createdAt: Date;
  updatedAt: Date;
};

// Create the schema for the Bill model
const billSchema = new Schema<BillType>(
  {
    billAppointmentId: { type: Schema.Types.ObjectId, required: true, ref: 'appointments' },
    billStatus: { type: String, default: 'pending' },
    billType: { type: String, required: true },
    billMethod: { type: String, required: false },
    billAmount: { type: Number, required: false },
    billNotes: { type: String, required: false },
    billTotalCost: { type: Number, required: false },
    billIntentId: { type: String, required: false },
    billDueDate: { type: Date, required: false },
    billRedirectUrl: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

// Create and export the Bill model
const BillModel = model<BillType>('bills', billSchema);
export default BillModel;
