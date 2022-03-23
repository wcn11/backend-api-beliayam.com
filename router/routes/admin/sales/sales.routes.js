const router = require('express').Router();

// middleware
const verifyToken = require('@middleware/authAdmin/verifyToken')

// controller
const SalesController = require('@controller/Admin/Sales/Sales.controller')

router.get('/total', verifyToken, (req, res) => SalesController.getTotalSales(req, res))

router.get('/total/product/best-seller', verifyToken, (req, res) => SalesController.getBestSellerProduct(req, res))

router.get('/revenue', verifyToken, (req, res) => SalesController.getTotalRevenue(req, res))

module.exports = router;