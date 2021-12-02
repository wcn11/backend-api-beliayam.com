const router = require('express').Router();

// controller
const AuthController = require('@controller/Auth/Auth.controller')

router.post('/login', AuthController.login)
router.post('/phone', AuthController.loginByPhone)
router.post('/phone/verify', AuthController.verifyPhoneByUserId)
router.post('/phone/resend', AuthController.resendOtpVerifyPhone)
router.post('/register', AuthController.register)
router.post('/email/verify', AuthController.verifyEmailOtp)
router.post('/email/resend', AuthController.resendVerifyEmail)
router.post('/password/forget', AuthController.sendEmailForgetPassword)

module.exports = router;