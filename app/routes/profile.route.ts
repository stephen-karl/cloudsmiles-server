import express from "express";
import Multer, { memoryStorage } from "multer";
import { editProfile } from "../controllers/profile.controller";

const router = express.Router()
const storage = memoryStorage();
const upload = Multer({ storage });

router.post('/edit-profile/', upload.single('avatar'), editProfile)

export default router 