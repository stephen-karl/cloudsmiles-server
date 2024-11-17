import { Router } from "express";
import { createReview } from "../controllers/review.controller";

const router = Router()
router.post('/create-review/', createReview)

export default router 