const router = require('express').Router();

// middleware
const verifyToken = require('@middleware/auth/verifyToken')

// controller
const CartController = require('@controller/Cart/Cart.controller')

router.get('/', verifyToken, (req, res) => CartController.getCarts(req, res))

// router.get('/:productId', verifyToken, (req, res) => CartController.getProductAtById(req, res))

router.post('/', verifyToken, (req, res) => CartController.addToCart(req, res))

router.put('/update/quantity', verifyToken, (req, res) => CartController.updateProductQuantityByProductId(req, res))

router.put('/update/note', verifyToken, (req, res) => CartController.updateProductNoteByProductId(req, res))

router.delete('/:user_id/product/:product_id', verifyToken, (req, res) => CartController.deleteProductAtCartByProductId(req, res))

module.exports = router;