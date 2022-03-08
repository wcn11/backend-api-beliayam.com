const router = require('express').Router();

// middleware
const verifyToken = require('@middleware/authAdmin/verifyToken')

// controller
const ChargeController = require('@controller/Admin/Charge/Charge.controller')

router.get('/', verifyToken, (req, res) => ChargeController.getAllCharges(req, res))

router.get('/:chargeId', verifyToken, (req, res) => ChargeController.getChargeByChargeId(req, res))

router.post('/', verifyToken, (req, res) => ChargeController.createNewCharge(req, res))

router.put('/:chargeId', verifyToken, (req, res) => ChargeController.updateChargeByChargeId(req, res))

router.delete('/:chargeId', verifyToken, (req, res) => ChargeController.deleteChargeByChargeId(req, res))

module.exports = router;