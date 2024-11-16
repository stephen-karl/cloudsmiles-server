import  { Schema, model, Types, Document } from 'mongoose';
import CounterModel from './counter.schema';


export type AdminType = Document & {
  adminAvatar: string;
  adminFullName: string;
  adminDateOfBirth: Date;
  adminGender: string;
  adminAddress: string;
  adminCredentialId: Types.ObjectId;
  isDeleted: boolean;
}

const adminSchema = new Schema<AdminType>(
  {
    adminAvatar: { type: String, required: false },
    adminFullName: { type: String, required: true },
    adminCredentialId: { type: Schema.Types.ObjectId, required: false, ref: 'credentials' },
    adminDateOfBirth: { type: Date, required: false },
    adminGender: { type: String, required: true },
    adminAddress: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true, 
  }
);



const AdminModel = model<AdminType>('admins', adminSchema);
export default AdminModel;
