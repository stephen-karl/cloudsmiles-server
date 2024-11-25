import { Document, Schema, model, Types } from 'mongoose';
import CounterModel from './counter.schema';


interface ActivityType extends Document {
  activitySerialId: string;
  activityAssistantId: Types.ObjectId;
  activityDescription: string;
  activityAction: string;
}


const activitySchema = new Schema<ActivityType>(
  {
    activitySerialId: { type: String, required: false },
    activityAssistantId: { type: Schema.Types.ObjectId, required: true, ref: 'assistant' },
    activityDescription: { type: String, required: true },
    activityAction: { type: String, required: true },
  },
  {
    timestamps: true,
  },
);

activitySchema.pre('save', async function (next) {
  const doc = this;
  if (doc.isNew) {
    const counter = await CounterModel.findOneAndUpdate(
      { sequenceName: 'activity_sequence' },
      { $inc: { count: 1 } },
      { new: true, upsert: true }
    );
    doc.activitySerialId = `ACTVTY${counter.count.toString().padStart(5, '0')}`;
  }
  next();
});



const ActivityModel = model<ActivityType>('activities', activitySchema);
export default ActivityModel;
