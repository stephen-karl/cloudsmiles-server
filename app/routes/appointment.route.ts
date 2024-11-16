import { Router } from "express";
import multer, { memoryStorage } from "multer";

import { 
  createAppointment,
  getDayAppointments,
  getWeekAppointments,
  getMonthlyAppointments,
  updateAppointmentCheckup,
  updateAppointmentSize,
  updateAppointmentPosition,
  getAppointmentCheckup,
  updateAppointmentStatus,
  getPatientMonthlyAppointments,
  getDentistMonthlyAppointments,

} from "@controllers/appointment.controller"


const router = Router()
const upload = multer({ limits: { files: 5 } });


router.post('/create-appointment', createAppointment)
router.get('/get-appointments/day/:date', getDayAppointments)
router.get('/get-appointments/week', getWeekAppointments)
router.get('/get-appointments/month/:date', getMonthlyAppointments)
router.post('/update-appointment-checkup', upload.any(), updateAppointmentCheckup)
router.put('/update-appointment-size', updateAppointmentSize)
router.put('/update-appointment-position', updateAppointmentPosition)
router.get('/get-appointment-checkup/:appointmentId', getAppointmentCheckup)
router.put('/update-appointment-status', updateAppointmentStatus)
router.get('/get-patient-monthly-appointments/:id/:date', getPatientMonthlyAppointments)
router.get('/get-dentist-monthly-appointments/:id/:date', getDentistMonthlyAppointments)
export default router 