const router = require('express').Router();

const multer = require('multer');

const storage = require('@middleware/images/ImageProduct.middleware')

const errorHandlerImage = require('@middleware/validation/error')

// controller
const ProductController = require('@controller/Admin/Product/Product.controller')

var imageProduct = multer({ storage: storage })

router.get('/', (req, res) => ProductController.getProducts(req, res))

router.get('/category/:categoryId', (req, res) => ProductController.getProductsByCategoryId(req, res))

router.get('/slug/:slug', (req, res) => ProductController.getProductBySlug(req, res))

router.get('/:productId', (req, res) => ProductController.getProductById(req, res))

router.post('/', imageProduct.single('image_product'), errorHandlerImage, (req, res) => ProductController.createProduct(req, res))

router.put('/:productId', imageProduct.single('image_product'), errorHandlerImage, (req, res) => ProductController.updateProductById(req, res))

router.delete('/:productId', (req, res) => ProductController.deleteProductById(req, res))

module.exports = router;