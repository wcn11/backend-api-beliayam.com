const router = require('express').Router();

// middleware
const verifyToken = require('@middleware/auth/verifyToken')

// controller
const PromoController = require('@controller/Promo/Promo.controller')

const multer = require('multer');

const storage = require('@middleware/images/ImagePromo.middleware')

var imagePromo = multer({ storage: storage })

router.get('/', verifyToken, (req, res) => PromoController.getAllPromo(req, res))

router.get('/:promoId', verifyToken, (req, res) => PromoController.getPromoByPromoId(req, res))

router.get('/:promoId/product', verifyToken, (req, res) => PromoController.getPromoProductByPromoId(req, res))

router.post('/', verifyToken, imagePromo.single('image_promo'), (req, res) => PromoController.createNewPromo(req, res))

router.put('/:promoId', verifyToken, imagePromo.single('image_promo'), (req, res) => PromoController.updatePromoByPromoId(req, res))

router.put('/:promoId/active', verifyToken, (req, res) => PromoController.updateStatusByPromoId(req, res))

router.get('/:promoId', verifyToken, (req, res) => PromoController.getPromoByPromoId(req, res))

router.delete('/:promoId', verifyToken, (req, res) => PromoController.deletePromoByPromoId(req, res))

module.exports = router;