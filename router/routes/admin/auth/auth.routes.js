const router = require('express').Router();

// controller
const AdminController = require('@controller/Admin/Auth/Auth.controller')

router.post('/login', AdminController.login)
router.post('/refresh-token', AdminController.refreshToken)
router.post('/register', AdminController.register)

module.exports = router;