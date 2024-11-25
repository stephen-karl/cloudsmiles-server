import { Request, Response } from "express"
import { formatDateWithSuffix } from "../utils/date.utils"
import NotificationModel from "../schemas/mongo/notification.schema"
import AppointmentModel from "../schemas/mongo/appointment.schema"
import DentistModel from "../schemas/mongo/dentist.schema"


export const sendAppointmentReminder = async (req: Request, res: Response) => {
  const patientId = req.body.patientId;
  const appointmentId = req.body.appointmentId;
  
  const appointment = await AppointmentModel.findById(appointmentId);
  
  if (!appointment) {
    res.status(404).json({ message: "Appointment not found" });
    return;
  }
  
  const dentist = await DentistModel.findById(appointment.appointmentDentistId);
  
  if (!dentist) {
    res.status(404).json({ message: "Dentist not found" });
    return;
  }

  try {
    // Format the appointment date and time using JavaScript's built-in Date object
    const appointmentDate = new Date(appointment.appointmentDate.start);
    
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = appointmentDate.toLocaleDateString('en-US', options);
    
    const formattedTime = appointmentDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });

    const notification = await NotificationModel.create({
      notificationType: "appointment",
      notificationMessage: `You have an upcoming appointment on ${formattedDate} at ${formattedTime} with Dr. ${dentist.dentistFullName}. Please be on time.`,
      notificationPatientId: patientId,
      isRead: false,
    });

    res.status(201).json(notification);
  } catch (error) {
    res.status(400).json(error);
  }
};


export const getPatientNotifications = async (req: Request, res: Response) => {
  const patientId = req.params.id
  try {
    const notifications = await NotificationModel
    .find({ notificationPatientId: patientId })
    .populate("notificationPatientId")
    .sort({ createdAt: -1 })
    res.status(200).json(notifications)
  } catch (error) {
    res.status(500).json(error)
  }
}

export const readPatientNotification = async (req: Request, res: Response) => {
  const patientId = req.body.patientId
  try {
    const notification = await NotificationModel.updateMany({ notificationPatientId: patientId }, { isRead: true })
    res.status(200).json(notification)
  } catch (error) {
    res.status(500).json(error)
  }
}
