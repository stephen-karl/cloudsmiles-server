import { Document, Schema, Types, model } from 'mongoose';

interface INotification extends Document {
  _id: Types.ObjectId;
  notificationType: string;
  notificationMessage: string;
  notificationPatientId: Types.ObjectId;
  isRead: boolean;
}

const notificationSchema = new Schema<INotification>(
  {
    notificationType: { type: String, required: true },
    notificationMessage: { type: String, required: true },
    notificationPatientId: { type: Schema.Types.ObjectId, required: true, ref: "patients" },
    isRead: { type: Boolean, required: true, default: false },
  },
  {
    timestamps: true,
  },
);

const NotificationModel = model<INotification>('notifications', notificationSchema);
export default NotificationModel;
