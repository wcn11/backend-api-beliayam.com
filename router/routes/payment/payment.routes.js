const router = require('express').Router();

// middleware
const verifyToken = require('@middleware/auth/verifyToken')

// controller
const PaymentController = require('@controller/Payment/Payment.controller')

// router.get('/', verifyToken, (req, res) => VoucherController.getAllVouchers(req, res))

// router.get('/code/:voucherCode', verifyToken, (req, res) => VoucherController.getVoucherByVoucherCode(req, res))

// router.get('/:voucherId', verifyToken, (req, res) => VoucherController.getVoucherByVoucherId(req, res))

// router.get('/cart', verifyToken, (req, res) => CheckoutController.getUserCheckoutData(req, res))

router.get('/', verifyToken, (req, res) => PaymentController.getAllPaymentChannel(req, res))

router.post('/pay', verifyToken, (req, res) => PaymentController.createPayment(req, res))

// router.post('/voucher/remove', verifyToken, (req, res) => CheckoutController.removeVoucher(req, res))

// router.put('/:voucherId', verifyToken, (req, res) => VoucherController.updateVoucherByVoucherId(req, res))

// router.delete('/:voucherId', verifyToken, (req, res) => VoucherController.deleteVoucherByVoucherId(req, res))

module.exports = router;