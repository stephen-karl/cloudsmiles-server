import { Types } from "mongoose";

export type DocumentResponseType = {
  _id: Types.ObjectId;
  documentAppointmentId: Types.ObjectId;
  documentName: string;
  documentUrl: string;
  documentResourceType: string;
}