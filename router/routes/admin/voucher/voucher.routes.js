const router = require('express').Router();

// middleware
const verifyToken = require('@middleware/authAdmin/verifyToken')

// controller
const VoucherController = require('@controller/Admin/Voucher/Voucher.controller')

const multer = require('multer');

const storage = require('@middleware/images/ImageVoucher.middleware')

var imageVoucher = multer({ storage: storage })

router.get('/', verifyToken, (req, res) => VoucherController.getAllVouchers(req, res))

router.get('/user/:userId', verifyToken, (req, res) => VoucherController.getVouchersByUser(req, res))

router.get('/code/:voucherCode', verifyToken, (req, res) => VoucherController.getVoucherByVoucherCode(req, res))

router.get('/:voucherId', verifyToken, (req, res) => VoucherController.getVoucherByVoucherId(req, res))

router.post('/', verifyToken, (req, res) => VoucherController.createNewVoucher(req, res))

router.put('/:voucherId', verifyToken, (req, res) => VoucherController.updateVoucherByVoucherId(req, res))

router.delete('/:voucherId', verifyToken, (req, res) => VoucherController.deleteVoucherByVoucherId(req, res))

module.exports = router;