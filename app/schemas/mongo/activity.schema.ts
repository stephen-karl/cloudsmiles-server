import { Document, Schema, model, Types } from 'mongoose';


interface ActivityType extends Document {
  activityAssistantId: Types.ObjectId;
  activityDescription: string;
  activityAction: string;
}


const activitySchema = new Schema<ActivityType>(
  {
    activityAssistantId: { type: Schema.Types.ObjectId, required: true, ref: 'assistant' },
    activityDescription: { type: String, required: true },
    activityAction: { type: String, required: true },


  },
  {
    timestamps: true,
  },
);


const ActivityModel = model<ActivityType>('activities', activitySchema);
export default ActivityModel;
