
import { Document, Schema, Types, model } from 'mongoose';

export type ReviewType = Document & {
  reviewAppointmentId: Types.ObjectId;
  reviewTreatments: Types.ObjectId[];
  reviewRating: number;
  reviewComment: string;
  reviewPatientId: Types.ObjectId;
  reviewDentistId: Types.ObjectId;
}

const reviewsSchema = new Schema<ReviewType>(
  {
    reviewAppointmentId: { type: Schema.Types.ObjectId, required: true, ref: "appointments" },
    reviewPatientId: { type: Schema.Types.ObjectId, required: true, ref: "patients" },
    reviewDentistId: { type: Schema.Types.ObjectId, required: true, ref: "dentists" },
    reviewTreatments: { type: [Schema.Types.ObjectId,], required: true, ref: "treatments" },
    reviewRating: { type: Number, required: true },
    reviewComment: { type: String, required: false },
  },
  {
    timestamps: true,
  },
);

const ReviewModel = model<ReviewType>('reviews', reviewsSchema);
export default ReviewModel;