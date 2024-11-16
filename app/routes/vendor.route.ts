import { 
  createVendor,
  getVendors,
  editVendor,
  deleteVendor,
  getVendorCount,
} from "@controllers/vendor.controller";
import { Router } from "express";
import Multer, { memoryStorage } from "multer";




const router = Router()
const storage = memoryStorage();
const upload = Multer({ storage });


router.post('/create-vendor', upload.single('vendor_avatar'), createVendor)
router.get('/get-vendors', getVendors)
router.put('/edit-vendor',  upload.single('vendor_avatar'),editVendor)
router.delete('/delete-vendor/:id', deleteVendor)
router.get('/get-vendor-count', getVendorCount)


export default router 