import { Document, Schema, Types, model } from 'mongoose';

export type CheckupType = Document & {
  checkupPatientId: Types.ObjectId;
  checkupAppointmentId: Types.ObjectId;
  checkupType: "Tooth" | "Section" | "General";
  checkupToothNumber: number;
  checkupSection: string;
  checkupCondition: string;
  checkupStatus: string;
  checkupTreatmentId: Types.ObjectId;
  checkupNotes: string;
};

const checkupSchema = new Schema<CheckupType>(
  {
    checkupPatientId: { type: Schema.Types.ObjectId, required: true, ref: "patients" },
    checkupAppointmentId: { type: Schema.Types.ObjectId, required: true, ref: "appointments" },
    checkupTreatmentId: { type: Schema.Types.ObjectId, required: true, ref: "treatments" },
    checkupType: { type: String, enum: ["Tooth", "Section", "General"], required: true },
    checkupToothNumber: { type: Number, required: false},
    checkupSection: { type: String, required: false},
    checkupCondition: { type: String, required: false},
    checkupStatus: { type: String, required: false},
    checkupNotes: { type: String, required: false},
  },
  {
    timestamps: true,
  },
);

const CheckupModel = model<CheckupType>('checkups', checkupSchema);
export default CheckupModel;
