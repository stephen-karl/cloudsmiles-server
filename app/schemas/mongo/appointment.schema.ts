import  { Schema, model, Document, Types} from 'mongoose';
import CounterModel from './counter.schema';

interface IAppointment extends Document {
  appointmentSerialId: string;
  appointmentPatientId: Types.ObjectId;
  appointmentDentistId: Types.ObjectId;
  appointmentPaymentId: Types.ObjectId;
  appointmentReasonForVisit: string;
  appointmentDate: {
    start: Date;
    end: Date;
  };
  appointmentStatus: string;
}

const appointmentSchema = new Schema<IAppointment>(
  {
    appointmentSerialId: { type: String, required: false },
    appointmentPatientId: { type: Schema.Types.ObjectId, ref: 'patients' },
    appointmentDentistId: { type: Schema.Types.ObjectId, ref: 'dentists' },
    appointmentPaymentId: { type: Schema.Types.ObjectId, ref: 'payments' },
    appointmentReasonForVisit: { type: String, required: true },
    appointmentDate: {  
      start: { type: Date, required: true },
      end: { type: Date, required: true },
    },
    appointmentStatus: { type: String, default: "Scheduled" },
  },
  {
    timestamps: true, 
  }
);

appointmentSchema.pre('save', async function (next) {
  const doc = this;
  if (doc.isNew) {
    const counter = await CounterModel.findOneAndUpdate(
      { sequenceName: 'appointment_sequence' },
      { $inc: { count: 1 } },
      { new: true, upsert: true }
    );
    doc.appointmentSerialId = `APMNT${counter.count.toString().padStart(5, '0')}`;
  }
  next();
});

const AppointmentModel = model<IAppointment>('appointments', appointmentSchema);
export default AppointmentModel;
