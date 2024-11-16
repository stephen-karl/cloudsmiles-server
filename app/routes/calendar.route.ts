import express from "express";
import Multer, { memoryStorage } from "multer";
import { 
  createDentist,
} from "@controllers/staff.controller"

const router = express.Router()
const storage = memoryStorage();
const upload = Multer({ storage });

router.post('/create-dentist', upload.single('dentist_avatar'), createDentist)

export default router 