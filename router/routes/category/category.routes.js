const router = require('express').Router();

// middleware
const verifyToken = require('@middleware/auth/verifyToken')

const multer = require('multer');

const storage = require('@middleware/images/Image.middleware')

// controller
const CategoryController = require('@controller/Category/Category.controller')

var imageCategory = multer({ storage: storage })

router.get('/', verifyToken, (req, res) => CategoryController.getCategories(req, res))

router.get('/:categoryId', verifyToken, (req, res) => CategoryController.getCategoryById(req, res))

router.post('/', verifyToken, imageCategory.single('image_category'), (req, res) => CategoryController.createCategory(req, res))

router.put('/:categoryId', verifyToken, imageCategory.single('image_category'), (req, res) => CategoryController.updateCategory(req, res))

router.delete('/:categoryId', verifyToken, (req, res) => CategoryController.deleteCategoryById(req, res))

module.exports = router;