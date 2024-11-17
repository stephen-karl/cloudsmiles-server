import { Document, Schema, Types, model } from 'mongoose';

type MedicineType = Document & {
  _id: Types.ObjectId;
  medicineProductId: Types.ObjectId;
  medicineAmount: number;
  medicineFreeAmount?: number;  
  isMedicineFree: "free" | "freeUpTo";
  prescriptionDosageAmount: number;
  prescriptionDosageType: string;
  prescriptionTimeDuration: number;
  prescriptionRepeatition: string;
  prescriptionTimeUnit: string;
  prescriptionTimeOfTheDay: string[];
  prescriptionIntakeSchedule: string[];
};

const medicineSchema = new Schema<MedicineType>(
  {
    medicineProductId: { type: Schema.Types.ObjectId, required: true, ref: "products" }, 
    medicineAmount: { type: Number, required: true },
    medicineFreeAmount: { type: Number, required: false }, 
    isMedicineFree: { type: String, enum: ["free", "freeUpTo"], required: true }, 
    prescriptionDosageAmount: { type: Number, required: true },
    prescriptionDosageType: { type: String, required: true },
    prescriptionRepeatition: { type: String, required: true },
    prescriptionTimeDuration: { type: Number, required: true },
    prescriptionTimeUnit: { type: String, required: true },
    prescriptionTimeOfTheDay: { type: [String], required: true },
    prescriptionIntakeSchedule: { type: [String], required: true },
  },
  {
    timestamps: true,
  },
);

const MedicineModel = model<MedicineType>('medicines', medicineSchema);
export default MedicineModel;
