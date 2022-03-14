const router = require('express').Router();

// controller
const ChargeController = require('@controller/Admin/Charge/Charge.controller')

router.get('/', (req, res) => ChargeController.getAllCharges(req, res))

router.get('/:chargeId', (req, res) => ChargeController.getChargeByChargeId(req, res))

router.post('/', (req, res) => ChargeController.createNewCharge(req, res))

router.put('/:chargeId', (req, res) => ChargeController.updateChargeByChargeId(req, res))

router.delete('/:chargeId', (req, res) => ChargeController.deleteChargeByChargeId(req, res))

module.exports = router;