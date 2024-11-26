import express from "express";

import { 
  getAvailableComponents,
  getAvailableMedicines,
  createTreatment,
  getTreatments,
  deleteTreatment,
  editTreatment,
  getTreatmentCost,
  getTreatmentCount,
  getTopTreatments
} from "../controllers/treatment.controller";

const router = express.Router()

router.get('/get-available-components', getAvailableComponents)
router.get('/get-available-medicines', getAvailableMedicines)
router.post('/create-treatment', createTreatment)
router.get('/get-treatments', getTreatments)
router.delete('/delete-treatment/:id', deleteTreatment)
router.put('/edit-treatment', editTreatment)
router.get('/get-treatment-cost/:id', getTreatmentCost)
router.get('/get-treatment-count', getTreatmentCount)
router.get('/get-top-treatments', getTopTreatments)
export default router 
