import { Document, Schema, Types, model } from 'mongoose';

interface IMessage extends Document {
  messagePatientId: Types.ObjectId,
  messageText: string;
  messageRole: string;
  messageComponent: string,
  messageDidError: boolean,
  messageChainId: Types.ObjectId,
}

const messageSchema = new Schema<IMessage>(
  {
    messagePatientId: { type: Schema.Types.ObjectId, required: true, ref: "patients" },
    messageChainId: { type: Schema.Types.ObjectId, required: false, ref: "chains" },
    messageText: { type: String, required: true },
    messageRole: { type: String, required: true },
    messageComponent: { type: String, required: false },
    messageDidError: { type: Boolean, required: false },
  },
  {
    timestamps: true,
  },
);


const messageModel = model<IMessage>('messages', messageSchema);
export default messageModel;