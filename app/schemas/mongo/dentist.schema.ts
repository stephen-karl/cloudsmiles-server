
import { Document, Schema, model } from 'mongoose';

export interface IDentist extends Document {
  dentistAvatar: string;
  dentistGender: string;
  dentistDateOfBirth: Date;
  dentistEmploymentType: string;
  dentistFullName: string;
  dentistSpecialization: string;
  dentistAddress: string;
  dentistMedicalServices: string[];
  dentistCosmeticServices: string[];
  dentistScheduleId: Schema.Types.ObjectId;
  dentistCredentialId: Schema.Types.ObjectId;
  isDeleted: boolean;
}

const dentistSchema = new Schema<IDentist>(
  {
    dentistAvatar: { type: String, required: false},
    dentistGender: { type: String, required: true },
    dentistDateOfBirth: { type: Date, required: true },
    dentistEmploymentType: { type: String, required: true },
    dentistFullName: { type: String, required: true },
    dentistSpecialization: { type: String, required: true },
    dentistAddress: { type: String, required: true },
    dentistMedicalServices: { type: [String], required: true },
    dentistCosmeticServices: { type: [String], required: true },
    isDeleted: { type: Boolean, default: false },
    dentistScheduleId: { type: Schema.Types.ObjectId, ref: 'schedules' },
    dentistCredentialId: { type: Schema.Types.ObjectId, ref: 'credentials' },
  },
  {
    timestamps: true,
  },
);

const DentistModel = model<IDentist>('dentists', dentistSchema);
export default DentistModel;