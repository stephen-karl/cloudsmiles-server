import { Router } from "express";
import { 
  createReview,
  getAppointmentReview

} from "../controllers/review.controller";

const router = Router()
router.post('/create-review', createReview)
router.get('/get-appointment-review/:id', getAppointmentReview)

export default router 
