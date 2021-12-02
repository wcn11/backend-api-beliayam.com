const router = require('express').Router();

// middleware
const verifyToken = require('@middleware/auth/verifyToken')

const multer = require('multer');

const storage = require('@middleware/images/Image.middleware')

// controller
const ProductController = require('@controller/Product/Product.controller')

var imageProduct = multer({ storage: storage })

router.get('/', verifyToken, (req, res) => ProductController.getProducts(req, res))

router.get('/:productId', verifyToken, (req, res) => ProductController.getProductById(req, res))

router.post('/', verifyToken, imageProduct.single('image_product'), (req, res) => ProductController.createProduct(req, res))

router.put('/:productId', verifyToken, imageProduct.single('image_product'), (req, res) => ProductController.updateProductById(req, res))

router.delete('/:productId', verifyToken, (req, res) => ProductController.deleteProductById(req, res))

module.exports = router;