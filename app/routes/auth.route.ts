import express from "express";
import passport from "passport";
import { 
  signUpLocal,
  googleAuth,
  googleAuthCallback,
  verifyUser, 
  validateEmail,
  resendOTP,
  logout,
  loginLocal,
  getPatient,
  recoverAccount,
  verifyRecoveryToken,
  resetPassword,
  changePassword,
  verifyLoginToken,
  verifyOtp
} from "@controllers/auth.controller"

const router = express.Router()


router.get('/google', googleAuth)

router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: '/auth/v1/failed' 
  }), 
  googleAuthCallback
);

router.get('/validate-email/:email', validateEmail)
router.get('/verify-user/', verifyUser)
router.post('/sign-up/local', signUpLocal)
router.post('/verify-otp', verifyOtp)
router.post('/resend-otp', resendOTP)

router.post('/recover-account', recoverAccount)
router.get('/verify-recovery-token/:token', verifyRecoveryToken)
router.get('/verify-login-token/:token', verifyLoginToken)
router.post('/reset-password', resetPassword)
router.post('/change-password', changePassword)
router.post('/verify-otp', verifyOtp)

router.post('/logout', logout)
router.post('/login-local', loginLocal)
router.get('/get-patient', getPatient)


export default router 