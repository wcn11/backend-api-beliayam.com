const router = require('express').Router();

// controller
const AdminController = require('@controller/Admin/Auth/Auth.controller')

router.post('/login', AdminController.login)
router.post('/refresh-token', AdminController.refreshToken)
// router.get('/user', verifyToken, AdminController.getCurrentSession)
// router.post('/phone', AdminController.loginByPhone)
// router.post('/phone/verify', AdminController.verifyPhoneByUserId)
// router.post('/phone/resend', AdminController.resendOtpVerifyPhone)
router.post('/register', AdminController.register)
// router.post('/email/verify', AdminController.verifyEmailOtp)
// router.post('/email/resend', AdminController.resendVerifyEmail)
// router.post('/password/forget', AdminController.sendEmailForgetPassword)

module.exports = router;