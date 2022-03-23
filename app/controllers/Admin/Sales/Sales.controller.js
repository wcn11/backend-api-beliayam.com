
const mongoose = require('mongoose');

const OrderModel = require('@model/order/order.model')
const ProductModel = require('@model/product/product.model')

const HttpStatus = require('@helper/http_status')
const responser = require('@responser')
const moment = require('moment')
moment.locale('id-ID');

const date = require('@helper/date')

const SalesController = class SalesController {

    async getTotalSales(req, res) {

        try {

            let countTotalOrder = await OrderModel.aggregate([
                {
                    $match: {

                        "delivery": {
                            $exists: true
                        }
                    }
                },
                {
                    $group: {
                        _id: 1,
                        totalOrder: {
                            $sum: 1,
                        },
                    }
                }
            ])

            if (countTotalOrder.length > 0) {
                countTotalOrder = countTotalOrder[0].totalOrder
            }
            let totalOrder = {
                "totalOrder": countTotalOrder,
            }
            return res.status(HttpStatus.OK).send(responser.success(totalOrder, "OK"));
        } catch (err) {

            return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Format Query Salah", HttpStatus.BAD_REQUEST));
        }


    }

    async getTotalRevenue(req, res) {

        try {

            let countTotalOrder = await OrderModel.aggregate([
                {
                    $match: {

                        "delivery": {
                            $exists: true
                        }
                    }
                }
            ])

            let totalRevenue = {
                "totalRevenue": 0,
            }

            if (countTotalOrder.length <= 0) {
                return res.status(HttpStatus.OK).send(responser.success(totalRevenue, "OK"));
            }

            let total = 0

            for (let i = 0; i < countTotalOrder.length; i++) {
                total += countTotalOrder[i].grand_total
            }

            totalRevenue.totalRevenue += total

            return res.status(HttpStatus.OK).send(responser.success(totalRevenue, "OK"));
        } catch (err) {

            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(responser.error("Terjadi Kesalahan Saat Memuat Data", HttpStatus.INTERNAL_SERVER_ERROR));
        }


    }

    async getBestSellerProduct(req, res) {

        try {

            const product = await OrderModel.aggregate([
                {
                    $match: {
                        "delivery": {
                            $exists: true,
                        }
                    }
                },
                {
                    "$unwind": "$bill.bill_items"
                },
                {
                    "$group": {
                        "_id": "$bill.bill_items.product._id",
                        "name": {
                            "$first": "$bill.bill_items.product.name"
                        },
                        "slug": {
                            "$first": "$bill.bill_items.product.slug"
                        },
                        "weight": {
                            "$first": "$bill.bill_items.product.weight"
                        },
                        "total_sales": {
                            "$sum": "$bill.bill_items.details.quantity"
                        }
                    }
                },
            ])

            return res.status(HttpStatus.OK).send(responser.success(product, "OK"));
        } catch (err) {

            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(responser.error("Terjadi Kesalahan Saat Memuat Data", HttpStatus.INTERNAL_SERVER_ERROR));
        }
    }

    async isIdValid(id) {
        if (mongoose.isValidObjectId(id)) {
            return true
        }
        return false
    }

}


module.exports = new SalesController