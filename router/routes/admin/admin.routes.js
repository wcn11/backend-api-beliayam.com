const router = require('express').Router();

// controller
const AdminController = require('@controller/Admin/Admin.controller')
// middleware
const verifyToken = require('@middleware/authAdmin/verifyToken')
const refreshToken = require('@middleware/authAdmin/refreshToken')

router.post('/auth/login', AdminController.login)
router.post('/auth/refresh-token', refreshToken, AdminController.refreshToken)
router.get('/user', verifyToken, AdminController.getCurrentSession)
// router.post('/phone', AdminController.loginByPhone)
// router.post('/phone/verify', AdminController.verifyPhoneByUserId)
// router.post('/phone/resend', AdminController.resendOtpVerifyPhone)
router.post('/authregister', AdminController.register)
// router.post('/email/verify', AdminController.verifyEmailOtp)
// router.post('/email/resend', AdminController.resendVerifyEmail)
// router.post('/password/forget', AdminController.sendEmailForgetPassword)

module.exports = router;