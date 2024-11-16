import  { Schema, model, Document } from 'mongoose';
import CounterModel from './counter.schema';


export type VendorType = Document & {
  vendorAvatar: string;
  vendorSerialId: string;
  vendorCompanyName: string;
  vendorType: string;
  vendorContactPerson: string;
  vendorEmail: string;
  vendorPhoneNumber: string;
  vendorAddress: string;
  isDeleted: boolean;
}

const vendorSchema = new Schema<VendorType>(
  {
    vendorAvatar: { type: String, required: false },
    vendorSerialId: { type: String, required: false },
    vendorCompanyName: { type: String, required: true },
    vendorType: { type: String, required: true },
    vendorContactPerson: { type: String, required: true },
    vendorEmail: { type: String, required: true },
    vendorPhoneNumber: { type: String, required: true },
    vendorAddress: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true, 
  }
);

vendorSchema.pre('save', async function (next) {
  const doc = this;
  if (doc.isNew) {
    const counter = await CounterModel.findOneAndUpdate(
      { sequenceName: 'vendor_sequence' },
      { $inc: { count: 1 } },
      { new: true, upsert: true }
    );
    doc.vendorSerialId = `VNDR${counter.count.toString().padStart(5, '0')}`;
  }
  next();
});

const VendorModel = model<VendorType>('vendors', vendorSchema);
export default VendorModel;
