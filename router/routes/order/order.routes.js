const router = require('express').Router();

// middleware
const verifyToken = require('@middleware/auth/verifyToken')

// controller
const OrderController = require('@controller/Order/Order.controller')

router.get('/:order_id', verifyToken, (req, res) => OrderController.getOrderById(req, res))

router.post('/', verifyToken, (req, res) => OrderController.placeOrder(req, res))

router.get('/', (req, res) => OrderController.change(req, res))

router.put('/cancel-order', verifyToken, (req, res) => OrderController.cancelPayment(req, res))

module.exports = router;