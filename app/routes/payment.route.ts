import express from "express";


import { 
  createBill,
  cancelBill,
  getBills,
  checkBillStatus,
  getQRCode,
  payWithCash,
  partiallyPayWithCash,
  partiallyCheckBillStatus,
  getPayments,
  getPaymentCount,
 } from "../controllers/payment.controller";

const router = express.Router()

router.post('/create-bill', createBill)
router.post('/cancel-bill/:id', cancelBill)
router.get('/get-bills/:id', getBills)
router.get('/check-bill-status/:id', checkBillStatus)
router.get('/partially-check-bill-status/:id', partiallyCheckBillStatus)
router.post('/pay-with-cash', payWithCash)
router.post('/partially-pay-with-cash', partiallyPayWithCash)
router.get('/payments', getPayments)
router.get('/get-payment-count', getPaymentCount)
router.get('/get-qr-code/:id', getQRCode)



export default router 
