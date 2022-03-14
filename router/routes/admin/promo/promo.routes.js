const router = require('express').Router();

// controller
const PromoController = require('@controller/Admin/Promo/Promo.controller')

const multer = require('multer');

const storage = require('@middleware/validation/promo/promo.middleware')

const limits = require('@middleware/validation/promo/promo.limit')

const errorHandlerImage = require('@middleware/validation/error')

var imagePromo = multer({
    storage,
    limits
})

router.get('/', (req, res) => PromoController.getAllPromo(req, res))

router.get('/_s', (req, res) => PromoController.getPromoBySlug(req, res))

router.get('/:promoId', (req, res) => PromoController.getPromoByPromoId(req, res))

router.get('/:slug/product', (req, res) => PromoController.getPromoProductByPromoIdOrSlug(req, res))

router.post('/', imagePromo.single('image_promo'), errorHandlerImage, (req, res) => PromoController.createNewPromo(req, res))

router.put('/:promoId', imagePromo.single('image_promo'), errorHandlerImage, (req, res) => PromoController.updatePromoByPromoId(req, res))

router.put('/:promoId/product', errorHandlerImage, (req, res) => PromoController.addProductToPromo(req, res))

router.post('/:promoId/product', errorHandlerImage, (req, res) => PromoController.removeProductFromPromo(req, res))

router.put('/:promoId/active', errorHandlerImage, (req, res) => PromoController.updateStatusByPromoId(req, res))

router.get('/:promoId', (req, res) => PromoController.getPromoByPromoId(req, res))

router.delete('/:promoId', (req, res) => PromoController.deletePromoByPromoId(req, res))

module.exports = router; 