import { 
  getActivities,
  createActivity,
  getActivityCount
} from "../controllers/activity.controller";
import express from "express";

const router = express.Router()

router.get('/get-activities', getActivities)
router.post('/create-activity', createActivity)
router.get('/get-activity-count', getActivityCount)



export default router 
