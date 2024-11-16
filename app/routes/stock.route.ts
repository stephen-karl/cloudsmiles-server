import { Router } from "express";
import Multer, { memoryStorage } from "multer";


import { 
  createProduct,
  validateSku,
  findvendors,
  getProducts,
  getStocks,
  getVendors,
  deleteProduct,
  editProduct,
  findProducts,
  createOrder,
  receiveOrder,
  getOrders,
  deleteOrder,
  updateOrder
} from "../controllers/stock.controller";

const router = Router()
const storage = memoryStorage();
const upload = Multer({ storage });


router.post('/create-product', upload.single('product_avatar'), createProduct)
router.put('/edit-product', upload.single('product_avatar'), editProduct)
router.get('/validate-sku/:sku', validateSku)
router.get('/find-vendors/:keywords', findvendors)
router.get('/find-products/:keywords',findProducts)
router.get('/get-products', getProducts)
router.get('/get-stocks', getStocks)
router.get('/get-vendors', getVendors)
router.get('/get-orders', getOrders)
router.post('/create-order', createOrder)
router.post('/receive-order', receiveOrder)
router.delete('/delete-product/:id', deleteProduct)
router.delete('/delete-order/:id', deleteOrder)
router.put('/update-order', updateOrder)


export default router 