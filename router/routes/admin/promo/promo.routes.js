const router = require('express').Router();

// middleware
const verifyToken = require('@middleware/authAdmin/verifyToken')

// controller
const PromoController = require('@controller/Admin/Promo/Promo.controller')

const multer = require('multer');

const storage = require('@middleware/images/ImagePromo.middleware')

var imagePromo = multer({ storage: storage })

router.get('/', (req, res) => PromoController.getAllPromo(req, res))

router.get('/_s', (req, res) => PromoController.getPromoBySlug(req, res))

router.get('/:promoId', verifyToken, (req, res) => PromoController.getPromoByPromoId(req, res))

router.get('/:slug/product', (req, res) => PromoController.getPromoProductByPromoIdOrSlug(req, res))

router.post('/', verifyToken, imagePromo.single('image_promo'), (req, res) => PromoController.createNewPromo(req, res))

router.put('/:promoId', verifyToken, imagePromo.single('image_promo'), (req, res) => PromoController.updatePromoByPromoId(req, res))

router.put('/:promoId/product', verifyToken, (req, res) => PromoController.addProductToPromo(req, res))

router.post('/:promoId/product', verifyToken, (req, res) => PromoController.removeProductFromPromo(req, res))

router.put('/:promoId/active', verifyToken, (req, res) => PromoController.updateStatusByPromoId(req, res))

router.get('/:promoId', verifyToken, (req, res) => PromoController.getPromoByPromoId(req, res))

router.delete('/:promoId', verifyToken, (req, res) => PromoController.deletePromoByPromoId(req, res))

module.exports = router;