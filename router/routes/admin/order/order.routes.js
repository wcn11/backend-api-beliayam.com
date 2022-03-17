const router = require('express').Router();

// controller
const OrderController = require('@controller/Admin/Order/Order.controller')

router.get('/', (req, res) => OrderController.getOrders(req, res))

router.get('/status', (req, res) => OrderController.getOrdersByStatus(req, res))

router.get('/:order_id', (req, res) => OrderController.getOrderById(req, res))

router.post('/', (req, res) => OrderController.placeOrder(req, res))

router.get('/delivery/fetch', (req, res) => OrderController.getDeliveryOrders(req, res))

router.put('/delivery', (req, res) => OrderController.setDeliveryOrderStatus(req, res))

router.post('/:order_id/cancel-order', (req, res) => OrderController.cancelPayment(req, res))

router.post('/:order_id/complete-order', (req, res) => OrderController.completePayment(req, res))

module.exports = router;