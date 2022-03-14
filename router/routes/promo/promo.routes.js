const router = require('express').Router();

// middleware
const verifyToken = require('@middleware/auth/verifyToken')

router.get('/', (req, res) => PromoController.getAllPromo(req, res))

router.get('/_s', (req, res) => PromoController.getPromoBySlug(req, res))

router.get('/:promoId', verifyToken, (req, res) => PromoController.getPromoByPromoId(req, res))

router.get('/:slug/product', (req, res) => PromoController.getPromoProductByPromoIdOrSlug(req, res))

router.get('/:promoId', verifyToken, (req, res) => PromoController.getPromoByPromoId(req, res))

module.exports = router;