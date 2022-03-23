const router = require('express').Router();

const ProductController = require('@controller/Admin/Product/Product.controller')

const multer = require('multer');

const storage = require('@middleware/validation/product/product.middleware')

const limits = require('@middleware/validation/product/product.limit')

const errorHandlerImage = require('@middleware/validation/error')

var imageProduct = multer({
    storage,
    limits
})

router.get('/', (req, res) => ProductController.getProducts(req, res))

router.get('/total', (req, res) => ProductController.getTotalProducts(req, res))

router.get('/discounts', (req, res) => ProductController.getAllProductsOnDiscount(req, res))

router.get('/stock/limit', (req, res) => ProductController.getStockByLimit(req, res))

router.get('/category/:categoryId', (req, res) => ProductController.getProductsByCategoryId(req, res))

router.get('/slug/:slug', (req, res) => ProductController.getProductBySlug(req, res))

router.get('/:productId', (req, res) => ProductController.getProductById(req, res))

router.post('/', imageProduct.single('image_product'), errorHandlerImage, (req, res) => ProductController.createProduct(req, res))

router.put('/:productId', imageProduct.single('image_product'), errorHandlerImage, (req, res) => ProductController.updateProductById(req, res))

router.delete('/:productId', (req, res) => ProductController.deleteProductById(req, res))

module.exports = router;