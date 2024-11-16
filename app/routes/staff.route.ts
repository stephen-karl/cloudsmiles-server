import express from "express";
import Multer, { memoryStorage } from "multer";
import { 
  createDentist,
  updateDentist,
  deleteDentist,
  getAllDentists,
  getDayDentists,
  getWeekDentists,
  getMonthlyDentists,
  getScheduledDentists,
  getDentist,
  getDentistTimeAvailability,
  getDentistDateAvailability,
  createAssistant,
  updateAssistant,
  deleteAssistant,
  getAllAssistants,
  getStaffCount,
} from "../controllers/staff.controller"

const router = express.Router()
const storage = memoryStorage();
const upload = Multer({ storage });

router.post('/create-dentist', upload.single('dentist_avatar'), createDentist)
router.put('/update-dentist', upload.single('dentist_avatar'), updateDentist)
router.delete('/delete-dentist/:id', deleteDentist)
router.get('/get-dentists', getAllDentists )
router.get('/get-dentist/:id', getDentist )
router.get('/get-day-dentist/:date', getDayDentists )
router.get('/get-week-dentist', getWeekDentists )
router.get('/get-monthly-dentist', getMonthlyDentists )
router.get('/get-scheduled-dentists/:id', getScheduledDentists )
router.get('/get-dentist-time-availability/:id', getDentistTimeAvailability )
router.get('/get-dentist-date-availability/:id', getDentistDateAvailability )
router.post('/create-assistant', upload.single('assistant_avatar'), createAssistant)
router.put('/update-assistant', upload.single('assistant_avatar'), updateAssistant)
router.delete('/delete-assistant/:id', deleteAssistant)
router.get('/get-assistants', getAllAssistants )
router.get('/get-staff-count', getStaffCount )

export default router 