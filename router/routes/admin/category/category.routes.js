const router = require('express').Router();

const multer = require('multer');

// controller
const CategoryController = require('@controller/Admin/Category/Category.controller')

const storage = require('@middleware/validation/category/category.middleware')

const limits = require('@middleware/validation/category/category.limit')

const errorHandlerImage = require('@middleware/validation/error')

var imageCategory = multer({
    storage,
    limits
})

router.get('/', (req, res) => CategoryController.getCategories(req, res))

router.get('/_s', (req, res) => CategoryController.getProductsBySlug(req, res))

router.post('/:slug/product', imageCategory.single('image_category'), errorHandlerImage, (req, res) => PromoController.getProductByCategoryIdOrSlug(req, res))

router.get('/:categoryId', (req, res) => CategoryController.getCategoryById(req, res))

router.post('/', imageCategory.single('image_category'), errorHandlerImage, (req, res) => CategoryController.createCategory(req, res))

router.put('/:categoryId', imageCategory.single('image_category'), errorHandlerImage, (req, res) => CategoryController.updateCategory(req, res))

router.delete('/:categoryId', (req, res) => CategoryController.deleteCategoryById(req, res))

module.exports = router;