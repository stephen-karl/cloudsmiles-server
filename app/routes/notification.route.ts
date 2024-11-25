import { 
  sendAppointmentReminder,
  getPatientNotifications,
  readPatientNotification,
} from "../controllers/notification.controller";
import express from "express";

const router = express.Router()

router.post('/send-appointment-reminder', sendAppointmentReminder)
router.get('/get-patient-notifications/:id', getPatientNotifications)
router.put('/read-patient-notification', readPatientNotification)

export default router 
