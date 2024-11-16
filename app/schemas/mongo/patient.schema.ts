import  { Schema, model, Types, Document } from 'mongoose';
import CounterModel from './counter.schema';


export interface IPatient extends Document {
  patientAvatar: string;
  patientSerialId: string;
  patientFullName: string;
  patientDateOfBirth: Date
  patientGender: string;
  patientAddress: string;
  patientStatus: string;
  patientCredentialId: Types.ObjectId;
  isDeleted: boolean;
}

const patientSchema = new Schema<IPatient>(
  {
    patientAvatar: { type: String, required: false },
    patientCredentialId: { type: Schema.Types.ObjectId, required: false, ref: 'credentials' },
    patientSerialId: { type: String, required: false },
    patientFullName: { type: String, required: true },
    patientDateOfBirth: { type: Date, required: false },
    patientGender: { type: String, required: true },
    patientAddress: { type: String, required: true },
    patientStatus: { type: String, default: 'Verified' },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true, 
  }
);

patientSchema.pre('save', async function (next) {
  const doc = this;
  if (doc.isNew) {
    const counter = await CounterModel.findOneAndUpdate(
      { sequenceName: 'patient_sequence' },
      { $inc: { count: 1 } },
      { new: true, upsert: true }
    );
    doc.patientSerialId = `PT${counter.count.toString().padStart(5, '0')}`;
  }
  next();
});

const PatientModel = model<IPatient>('patients', patientSchema);
export default PatientModel;
