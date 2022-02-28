const router = require('express').Router();

// middleware
const verifyToken = require('@middleware/auth/verifyToken')

const multer = require('multer');

const storage = require('@middleware/images/ImageProduct.middleware')

// controller
const ProductController = require('@controller/Product/Product.controller')

var imageProduct = multer({ storage: storage })

router.get('/', (req, res) => ProductController.getProducts(req, res))

router.get('/discounts', (req, res) => ProductController.getAllProductsOnDiscount(req, res))

router.get('/category/:categoryId', (req, res) => ProductController.getProductsByCategoryId(req, res))

router.get('/:slug', (req, res) => ProductController.getProductBySlug(req, res))

router.post('/', verifyToken, imageProduct.single('image_product'), (req, res) => ProductController.createProduct(req, res))

router.put('/:productId', verifyToken, imageProduct.single('image_product'), (req, res) => ProductController.updateProductById(req, res))

router.delete('/:productId', verifyToken, (req, res) => ProductController.deleteProductById(req, res))

module.exports = router;