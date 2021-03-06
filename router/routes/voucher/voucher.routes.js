const router = require('express').Router();

// middleware
const verifyToken = require('@middleware/auth/verifyToken')

// controller
const VoucherController = require('@controller/Voucher/Voucher.controller')

const multer = require('multer');

const storage = require('@middleware/images/ImageVoucher.middleware')

var imageVoucher = multer({ storage: storage })

router.get('/', verifyToken, (req, res) => VoucherController.getAllVouchers(req, res))

router.get('/user', verifyToken, (req, res) => VoucherController.getVouchersByUser(req, res))

router.get('/code/:voucherCode', verifyToken, (req, res) => VoucherController.getVoucherByVoucherCode(req, res))

router.get('/:voucherId', verifyToken, (req, res) => VoucherController.getVoucherByVoucherId(req, res))

router.post('/', verifyToken, imageVoucher.single('image_voucher'), (req, res) => VoucherController.createNewVoucher(req, res))

router.put('/:voucherId', verifyToken, imageVoucher.single('image_voucher'), (req, res) => VoucherController.updateVoucherByVoucherId(req, res))

router.delete('/:voucherId', verifyToken, (req, res) => VoucherController.deleteVoucherByVoucherId(req, res))

module.exports = router;