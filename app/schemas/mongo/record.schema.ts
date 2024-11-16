import { Document, Schema, model, Types } from 'mongoose';

type RecordType = Document & {
  recordPatientId: Types.ObjectId;
  recordBloodPressure?: {
    mm?: number;
    hg?: number;
  };
  recordSickness?: string[];
  recordAllergies?: string[];
  recordOralData?: {
    occlusi?: string;
    torusPalatinus?: string;
    torusMandibularis?: string;
    palatum?: string;
    anomalousTeeth?: string;
    other?: string;
  };
  recordHygieneData?: {
    1?: string;
    2?: string;
    3?: string;
    4?: string;
    5?: string;
    6?: string;
    7?: string;
  };
}

const RecordSchema = new Schema<RecordType>(
  {
    recordPatientId: { type: Schema.Types.ObjectId, required: true, ref: 'patients' },
    recordBloodPressure: {
      mm: { type: Number, required: false },
      hg: { type: Number, required: false },
    },
    recordSickness: [{ type: String, required: false }],
    recordAllergies: [{ type: String, required: false }],
    recordOralData: {
      occlusi: { type: String, required: false },
      torusPalatinus: { type: String, required: false },
      torusMandibularis: { type: String, required: false },
      palatum: { type: String, required: false },
      anomalousTeeth: { type: String, required: false },
      other: { type: String, required: false },
    },
    recordHygieneData: {
      1: { type: String, required: false },
      2: { type: String, required: false },
      3: { type: String, required: false },
      4: { type: String, required: false },
      5: { type: String, required: false },
      6: { type: String, required: false },
      7: { type: String, required: false },
    },
  },
  {
    timestamps: true,
  },
);

const RecordModel = model<RecordType>('records', RecordSchema);
export default RecordModel;
