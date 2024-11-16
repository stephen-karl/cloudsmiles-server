import { 
  getStocks,
  getAppointments,
  getPatients,
  getVisits,
  getPayments
} from "../controllers/dashboard.controller";
import express from "express";

const router = express.Router()

router.get('/stocks', getStocks)
router.get('/appointments', getAppointments)
router.get('/patients', getPatients)
router.get('/visits', getVisits)
router.get('/payments', getPayments)


export default router 