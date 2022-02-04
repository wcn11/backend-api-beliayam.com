const express = require('express');

const app = express();

const mongoose = require('mongoose');
const VoucherModel = require('@model/voucher/voucher.model')
const UserModel = require('@model/user/user.model')
const ProductModel = require('@model/product/product.model')
const FlashSaleModel = require('@model/flashSale/flashSale.model')
const HttpStatus = require('@helper/http_status')
const responser = require('@responser')
const handleErrors = require('../../../middleware/handleErrors');

const {
    createNewFlashSaleValidation,

} = require('@validation/flashSale/flashSale.validation')

const FlashSaleController = class FlashSaleController {

    async getFlashSale(req, res) {

        let page = parseInt(req.query.page) ?? 1
        let show = parseInt(req.query.show) ?? 10

        let sortBy;
        let orderBy = 1;

        if (req.query.sortBy) {
            sortBy = req.query.sortBy === "ASC" ? 1 : -1
        }

        if (!req.query.orderBy) {
            orderBy = req.query.orderBy === "name" ? 1 : -1
        }

        orderBy = req.query.orderBy ?? 1

        const isFlashSaleExist = await FlashSaleModel.findOne({})

        try {

            let flashSale = await ProductModel.find({
                "hasFlashSale.flashSale": {
                    $in: isFlashSaleExist._id
                }
            }).populate(['category'])
                .sort({
                    orderBy: sortBy
                }).skip((parseInt(page) - 1) * parseInt(show)).limit(parseInt(show))

            const response = {
                flashSale: isFlashSaleExist,
                products: flashSale
            }

            return res.status(HttpStatus.OK).send(responser.success(response, "OK"));
        } catch (err) {
            return res.status(HttpStatus.NOT_FOUND).send(responser.error("Invalid Format", HttpStatus.NOT_FOUND));
        }
    }

    async createNewFlashSale(req, res) {

        const { error } = createNewFlashSaleValidation(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        let input = req.body

        let isFlashSaleExist = await this.isFlashSaleExist()

        if (isFlashSaleExist > 0) {
            return res.status(HttpStatus.OK).send(responser.validation(translate('flash_sale.exists'), HttpStatus.OK))
        }

        try {

            let flashSaleObject = {
                name: input.name,
                slug: input.slug,
                tags: input.tags,
                banner: req.file ? `images/flash-sale/${req.file.filename}` : "images/flash-sale/default.jpg",
                termsAndConditions: input.termsAndConditions,
                isActive: input.isActive ?? false,
                promoStart: input.promoStart,
                promoEnd: input.promoEnd,
                description: input.description,
                platform: []
            }

            if (input.platform.length > 0) {

                for (let i = 0; i < input.platform.length; i++) {
                    flashSaleObject['platform'].push(input.platform[i])
                }
            }

            let promo = new FlashSaleModel(flashSaleObject)

            const savedFlashSale = await promo.save()

            return res.status(HttpStatus.OK).send(responser.success(savedFlashSale, translate('flash_sale.created')))

        } catch (e) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.error(translate('flash_sale.cant_add_flash_sale'), HttpStatus.BAD_REQUEST))
        }

    }

    async updateFlashSaleById(req, res) {

        const { error } = createNewFlashSaleValidation(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        const isFlashSaleExist = await FlashSaleModel.findOne({})

        let input = req.body

        try {

            let flashSaleObject = {
                name: input.name,
                slug: input.slug,
                tags: input.tags,
                termsAndConditions: input.termsAndConditions,
                isActive: input.isActive ?? false,
                flashSaleStart: input.flashSaleStart,
                flashSaleEnd: input.flashSaleEnd,
                description: input.description,
                platform: []
            }

            if (input.platform.length > 0) {

                for (let i = 0; i < input.platform.length; i++) {
                    flashSaleObject['platform'].push(input.platform[i])
                }
            }

            if (req.file) {
                flashSaleObject.banner = `images/flash-sale/${req.file.filename}`
            }

            const flashSale = await FlashSaleModel.findOneAndUpdate(
                isFlashSaleExist._id, {
                $set: flashSaleObject
            }, {
                new: true
            })

            return res.status(HttpStatus.OK).send(responser.success(flashSale, translate('flash_sale.created')))

        } catch (e) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.error(translate('flash_sale.cant_update'), HttpStatus.BAD_REQUEST))

        }
    }

    async isFlashSaleExist() {

        const flashSale = await FlashSaleModel.find({}).count()

        return flashSale

    }

    async isVoucherExist(voucherCode, type = "code") {

        let voucher

        if (type.toLowerCase() === "code") {
            voucher = await VoucherModel.findOne({
                voucherCode: voucherCode,
            })
        } else if (type.toLowerCase() === "id") {
            voucher = await VoucherModel.findOne({
                _id: voucherCode
            })
        }

        return voucher

    }

    async isProductExist(productId) {

        let product = await ProductModel.findOne({
            _id: productId
        })

        return product
    }

    async getUserById(userId) {

        let user = await UserModel.findOne({
            _id: userId
        })

        return user
    }

    isIdValid(id) {
        if (mongoose.isValidObjectId(id)) {
            return true
        }
        return false
    }

    setConstructor(req, res) {
        this.req = req
        this.res = res
    }

    validateId(id) {

        if (!mongoose.isValidObjectId(id)) {
            return false
        }

        return true
    }
}

app.use(handleErrors)

module.exports = new FlashSaleController