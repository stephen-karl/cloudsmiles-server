import  { Schema, model, Document, Types} from 'mongoose';
import CounterModel from './counter.schema';


interface IPayment extends Document {
  paymentSerialId: string;
  paymentAppointmentId: Types.ObjectId;
  paymentType: "full" | "installment";
  paymentStatus: "paid" | "notPaid" | "partial";
  paymentMethod: string;
  paymentAmount: number;
  paymentNotes: string;
  paymentTotalCost: number;
  isLastPayment: boolean;
  paymentDueDate?: Date;
  paymentHistory?: Array<{}>;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    paymentSerialId: { type: String, required: false },
    paymentStatus: { type: String, required: true, default: 'notPaid' },
    paymentType: { type: String, required: false },
    paymentAppointmentId: { type: Schema.Types.ObjectId, required: true, ref: 'appointments' },
    paymentMethod: { type: String, required: false },
    paymentAmount: { type: Number, required: false },
    paymentNotes: { type: String, required: false },
    paymentDueDate: { type: Date, required: false },
    paymentTotalCost: { type: Number, required: false },
    isLastPayment: { type: Boolean, default: true },
  },
  {
    timestamps: true, 
  }
);

paymentSchema.pre('save', async function (next) {
  const doc = this;
  if (doc.isNew) {
    const counter = await CounterModel.findOneAndUpdate(
      { sequenceName: 'payment_sequence' },
      { $inc: { count: 1 } },
      { new: true, upsert: true }
    );
    doc.paymentSerialId = `PYMNT${counter.count.toString().padStart(5, '0')}`;
  }
  next();
});

const PaymentModel = model<IPayment>('payments', paymentSchema);
export default PaymentModel;
