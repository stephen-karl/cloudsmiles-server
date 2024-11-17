
import { Document, Schema, model } from 'mongoose';

export interface IAssistant extends Document {
  assistantAvatar: string;
  assistantGender: string;
  assistantDateOfBirth: Date;
  assistantEmploymentType: string;
  assistantFullName: string;
  assistantAddress: string;
  assistantRole: string;
  assistantScheduleId: Schema.Types.ObjectId;
  assistantCredentialId: Schema.Types.ObjectId;
  isDeleted: boolean;
}

const assistantSchema = new Schema<IAssistant>(
  {
    assistantAvatar: { type: String, required: false},
    assistantGender: { type: String, required: true },
    assistantDateOfBirth: { type: Date, required: true },
    assistantEmploymentType: { type: String, required: true },
    assistantFullName: { type: String, required: true },
    assistantAddress: { type: String, required: true },
    assistantRole: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
    assistantScheduleId: { type: Schema.Types.ObjectId, ref: 'schedules' },
    assistantCredentialId: { type: Schema.Types.ObjectId, ref: 'credentials' },
  },
  {
    timestamps: true,
  },
);

const AssistantModel = model<IAssistant>('assistant', assistantSchema);
export default AssistantModel;