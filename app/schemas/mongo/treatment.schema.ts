
import { Document, Schema, Types, model } from 'mongoose';
import CounterModel from './counter.schema';

type ComponentType = Document & {
  _id: Types.ObjectId;
  componentId: Types.ObjectId
};

type MedicineType = Document & {
  _id: Types.ObjectId;
  medicineId: Types.ObjectId
};

export type TreatmentType =  Document & {
  treatmentSerialId: string;
  treatmentName: string;
  treatmentCategory: string;
  // treatmentType: "single" | "multiple";
  treatmentDescription: string;
  treatmentChargeType: string;
  treatmentCost: number;
  treatmentDuration: number;
  treatmentComponents: ComponentType[];
  treatmentMedicines: MedicineType[];
  isDeleted: boolean;
}

const treatmentSchema = new Schema<TreatmentType>(
  {
    treatmentSerialId: { type: String, required: false },
    treatmentName: { type: String, required: true },
    treatmentCategory: { type: String, required: true, },
    // treatmentType: { type: String, enum: ["single", "multiple"], default: "single" },
    treatmentChargeType: { type: String, required: true, },
    treatmentDescription: { type: String, required: true, },
    treatmentCost: { type: Number, required: true, },
    treatmentDuration: { type: Number, required: true, },
    treatmentComponents: [{
      componentId: { type: Schema.Types.ObjectId, required: true, ref: "components" },
    }],
    treatmentMedicines: [{
      medicineId: { type: Schema.Types.ObjectId, required: true, ref: "medicines" },
    }],
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);


treatmentSchema.pre('save', async function (next) {
  const doc = this;
  if (doc.isNew) {
    const counter = await CounterModel.findOneAndUpdate(
      { sequenceName: 'treatment_sequence' },
      { $inc: { count: 1 } },
      { new: true, upsert: true }
    );
    doc.treatmentSerialId = `TRT${counter.count.toString().padStart(4, '0')}`;
  }
  next();
});

const TreatmentModel = model<TreatmentType>('treatments', treatmentSchema);
export default TreatmentModel;