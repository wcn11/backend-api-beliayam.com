const router = require('express').Router();

// middleware
const verifyToken = require('@middleware/auth/verifyToken')

// controller
const UserController = require('@controller/User/User.controller')

router.get('/', verifyToken, (req, res) => UserController.getOrders(req, res))

module.exports = router;