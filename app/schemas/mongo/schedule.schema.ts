import { Document, Schema, model, Types } from 'mongoose';

interface ISchedule {
  day: string;
  start: string;
  end: string;
}

interface IScheduleModel extends Document {
  assistantId: Types.ObjectId;
  dentistId: Types.ObjectId;
  schedules: ISchedule[];
}

const scheduleSchema = new Schema<ISchedule>(
  {
    day: { type: String, required: true },
    start: { type: String, required: true },
    end: { type: String, required: true },
  },
  {
    _id: false, 
  },
);

const schedulesSchema = new Schema<IScheduleModel>(
  {
    assistantId: { type: Schema.Types.ObjectId, ref: 'assistants', required: false },
    dentistId: { type: Schema.Types.ObjectId, ref: 'dentists', required: false },
    schedules: { type: [scheduleSchema], required: true },
  },
  {
    timestamps: true, 
  },
);

const ScheduleModel = model<IScheduleModel>('schedules', schedulesSchema);

export default ScheduleModel;
