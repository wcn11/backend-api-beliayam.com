const router = require('express').Router();

// middleware
const verifyToken = require('@middleware/auth/verifyToken')

// controller
const OrderController = require('@controller/Order/Order.controller')

router.get('/:order_id', verifyToken, (req, res) => OrderController.getOrderById(req, res))

// router.get('/code/:voucherCode', verifyToken, (req, res) => VoucherController.getVoucherByVoucherCode(req, res))

// router.get('/:voucherId', verifyToken, (req, res) => VoucherController.getVoucherByVoucherId(req, res))

// router.get('/cart', verifyToken, (req, res) => CheckoutController.getUserCheckoutData(req, res))

router.post('/', verifyToken, (req, res) => OrderController.placeOrder(req, res))

router.post('/cancel-order', verifyToken, (req, res) => OrderController.cancelPayment(req, res))

// router.post('/voucher/apply', verifyToken, (req, res) => CheckoutController.applyVoucher(req, res))

// router.post('/voucher/remove', verifyToken, (req, res) => CheckoutController.removeVoucher(req, res))

// router.put('/:voucherId', verifyToken, (req, res) => VoucherController.updateVoucherByVoucherId(req, res))

// router.delete('/:voucherId', verifyToken, (req, res) => VoucherController.deleteVoucherByVoucherId(req, res))

module.exports = router;