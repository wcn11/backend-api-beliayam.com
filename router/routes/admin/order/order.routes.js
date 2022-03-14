const router = require('express').Router();

// controller
const OrderController = require('@controller/Admin/Order/Order.controller')

router.get('/', (req, res) => OrderController.getOrders(req, res))

router.get('/:order_id', (req, res) => OrderController.getOrderById(req, res))

// router.get('/code/:voucherCode', (req, res) => VoucherController.getVoucherByVoucherCode(req, res))

// router.get('/:voucherId', (req, res) => VoucherController.getVoucherByVoucherId(req, res))

// router.get('/cart', (req, res) => CheckoutController.getUserCheckoutData(req, res))

router.post('/', (req, res) => OrderController.placeOrder(req, res))

router.post('/:order_id/cancel-order', (req, res) => OrderController.cancelPayment(req, res))

// router.post('/voucher/apply', (req, res) => CheckoutController.applyVoucher(req, res))

// router.post('/voucher/remove', (req, res) => CheckoutController.removeVoucher(req, res))

// router.put('/:voucherId', (req, res) => VoucherController.updateVoucherByVoucherId(req, res))

// router.delete('/:voucherId', (req, res) => VoucherController.deleteVoucherByVoucherId(req, res))

module.exports = router;