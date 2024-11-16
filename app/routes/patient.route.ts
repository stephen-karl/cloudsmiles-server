import { Router } from "express";
import Multer, { memoryStorage } from "multer";
import { 
  createPatient, 
  updatePatient,
  deletePatient,
  findPatients,
  getPatients,
  addDentalRecord,
  getDentalRecord,
  getPatientProfile,
  getPatientCount
} from "@controllers/patient.controller";



const router = Router()
const storage = memoryStorage();
const upload = Multer({ storage });


router.post('/create-patient', upload.single('patient_avatar'), createPatient)
router.put('/update-patient', upload.single('patient_avatar'), updatePatient)
router.delete('/delete-patient/:id', deletePatient)
router.get('/find-patients/:keywords', findPatients)
router.get('/get-patients', getPatients)
router.post('/add-dental-record', addDentalRecord)
router.get('/get-dental-record/:id', getDentalRecord)
router.get('/get-patient-profile/:id', getPatientProfile)
router.get('/get-patient-count', getPatientCount)


export default router 