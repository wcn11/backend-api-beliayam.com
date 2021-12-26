const router = require('express').Router();

// controller
const AuthController = require('@controller/Auth/Auth.controller')

router.post('/login', AuthController.login)

router.post('/phone', AuthController.loginByPhone)
router.post('/phone/verify', AuthController.verifyPhoneByUserId)
router.post('/phone/resend', AuthController.resendOtpVerifyPhone)

router.post('/register', AuthController.register)
router.post('/register/phone', AuthController.registerByPhone)
router.post('/register/phone/verify', AuthController.verifySmsOtpRegister)
router.post('/register/phone/resend', AuthController.resendSmsOtpRegister)

router.post('/email/verify', AuthController.verifyEmailOtp)
router.post('/email/resend', AuthController.resendVerifyEmail)
router.post('/password/forget', AuthController.sendEmailForgetPassword)
router.post('/password/verify', AuthController.verifyLinkForgetPassword)
router.post('/password/change', AuthController.changePassword)

router.post('/social/login', AuthController.loginBySocial)

router.post('/refresh-token', AuthController.refreshToken)

router.post('/logout', AuthController.logout)

module.exports = router;