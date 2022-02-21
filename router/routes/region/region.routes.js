const router = require('express').Router();

// middleware
const verifyToken = require('@middleware/auth/verifyToken')

// controller
const RegionController = require('@controller/Region/Region.controller')

router.get('/provinces', (req, res) => RegionController.getAllProvince(req, res))

router.get('/province/:provinceId', (req, res) => RegionController.getProvince(req, res))

router.get('/regency/:regencyId', (req, res) => RegionController.getRegency(req, res))

router.get('/district/:districtId', (req, res) => RegionController.getDistrict(req, res))

router.get('/village/:villageId', (req, res) => RegionController.getVillage(req, res))

module.exports = router;