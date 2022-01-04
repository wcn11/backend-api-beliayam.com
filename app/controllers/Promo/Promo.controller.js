const express = require('express');

const app = express();

const mongoose = require('mongoose');
const VoucherModel = require('@model/voucher/voucher.model')
const UserModel = require('@model/user/user.model')
const ProductModel = require('@model/product/product.model')
const PromoModel = require('@model/promo/promo.model')
const customId = require("custom-id");
const HttpStatus = require('@helper/http_status')
const responser = require('@responser')
const moment = require('moment')
moment.locale('id-ID');

const handleErrors = require('../../../middleware/handleErrors');


const { BadRequest } = require('@utility/errors');


const {
    createNewPromoValidation,
    getAllPromoValidation,
    getPromoByPromoIdValidation,
    updatePromoByPromoIdValidation,
    deletePromoByPromoIdValidation,
    getAllPromoProductValidation,
    updateStatusByPromoIdValidation

} = require('@validation/promo/promo.validation')

const PromoController = class PromoController {

    async getAllPromo(req, res) {

        const { error } = getAllPromoValidation(req.query)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        try {

            let page = req.query.page ?? 1
            let show = req.query.show ?? 10

            let sortBy;

            let orderBy;

            if (!req.query.sortBy) {
                sortBy = req.query.sortBy === "ASC" ? 1 : -1
            }
            sortBy = req.query.sortBy ?? 1

            if (!req.query.orderBy) {
                orderBy = req.query.orderBy ?? "name"
            }
            orderBy = req.query.orderBy ?? 1

            let currentDate = moment().add(7, 'hour').toDate()

            let isActive

            if (req.query.isActive) {
                isActive = true
            } else if (req.query.isActive === false) {
                isActive = false
            } else {
                isActive = true
            }

            let promo = await PromoModel.find({
                promoStart: {
                    $lte: currentDate
                },
                promoEnd: {
                    $gte: currentDate
                },
                isActive: isActive,
                platform: {
                    $in: [req.query.platform]
                },
            }).sort({
                orderBy: sortBy,

            }).skip((parseInt(page) - 1) * parseInt(show)).limit(parseInt(show))

            return res.status(HttpStatus.OK).send(responser.success(promo, "OK"));

        } catch (err) {

            return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Format Query Salah", HttpStatus.BAD_REQUEST));
        }
    }

    async getPromoProductByPromoId(req, res) {

        const { error } = getAllPromoProductValidation(req.query)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        let isActive

        if (req.query.isActive) {
            isActive = true
        } else if (req.query.isActive === false) {
            isActive = false
        } else {
            isActive = true
        }

        var currentDate = moment().toDate();

        // benerin dan buat paginasi
        let promo = await ProductModel.find({
            hasDicount: {
                $in: [req.params.promoId]
            },
            promoStart: {
                $lte: currentDate
            },
            promoEnd: {
                $gte: currentDate
            },
            isActive: isActive,
            platform: {
                $in: [req.query.platform]
            },
        })
        // .sort({
        //     orderBy: sortBy,

        // }).skip((parseInt(page) - 1) * parseInt(show)).limit(parseInt(show))

        return res.status(HttpStatus.OK).send(responser.success(promo, HttpStatus.OK));
    }

    async getPromoByPromoId(req, res) {

        const { error } = getPromoByPromoIdValidation(req.params)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        let input = req.params

        try {

            let isPromoExist = await this.isPromoExist(input.promoId)

            if (!isPromoExist) {
                return res.status(HttpStatus.NOT_FOUND).send(responser.validation("Promo Tidak Ditemukan", HttpStatus.NOT_FOUND))
            }

            return res.status(HttpStatus.OK).send(responser.success(isPromoExist, HttpStatus.OK));

        }
        catch (err) {
            return res.status(HttpStatus.SERVICE_UNAVAILABLE).send(responser.validation("Kesalahan Dalam Mengambil Data Promo", HttpStatus.SERVICE_UNAVAILABLE))
        }

    }

    async createNewPromo(req, res) {

        const { error } = createNewPromoValidation(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        let input = req.body

        let isPromoExist = await this.isPromoExist(input.name, 'name')

        if (isPromoExist) {
            return res.status(HttpStatus.NOT_ACCEPTABLE).send(responser.validation(`Promo '${input.name}' Telah Ada, Harap Gunakan Nama Berbeda`, HttpStatus.NOT_ACCEPTABLE))
        }

        try {

            let promoObject = {
                name: input.name,
                tags: input.tags,
                products: [],
                // banner: req.file ? req.file.path : "images/promo/default.jpg",
                termsAndConditions: input.termsAndConditions,
                promoValue: input.promoValue,
                promoBy: input.promoBy,
                promoStart: input.promoStart,
                promoEnd: input.promoEnd,
                isActive: input.isActive ?? false,
                description: input.description,
                platform: []
            }

            if (input.products.length < 0) {
                return res.status(HttpStatus.BAD_REQUEST).send(responser.validation("Minimal 1 Produk Ditambahkan", HttpStatus.BAD_REQUEST))
            }

            for (let i = 0; i < input.products.length; i++) {

                if (!this.isIdValid(input.products[i])) {
                    return res.status(HttpStatus.BAD_REQUEST).send(responser.validation("ID Produk Tidak Valid", HttpStatus.BAD_REQUEST))
                }

                // let isProductExist = this.isProductExist(input.products[i])

                // if (!isProductExist) {
                //     return res.status(HttpStatus.BAD_REQUEST).send(responser.validation("Beberapa Produk Tidak Ditemukan Atau Telah Dihapus", HttpStatus.BAD_REQUEST))
                // }

                promoObject['products'].push(input.products[i])
            }

            if (input.platform.length > 0) {

                for (let i = 0; i < input.platform.length; i++) {
                    promoObject['platform'].push(input.platform[i])
                }
            }

            let promo = new PromoModel(promoObject)

            const savedPromo = await promo.save()

            let productObject = {
                isPromo: true,
                promoId: savedPromo.id,
                name: input.name,
                tags: input.tags,
                banner: req.file ? `images/promo/${req.file.originalname}` : "",
                promoValue: input.promoValue,
                promoBy: input.promoBy,
                promoStart: input.promoStart,
                promoEnd: input.promoEnd
            }

            input.products.map(async product => {

                let productUpdate = await ProductModel.findOneAndUpdate(
                    product, {
                    $set: {
                        hasPromo: productObject
                    }
                }, {
                    new: true
                })

                console.log(productUpdate)

            })

            return res.status(HttpStatus.OK).send(responser.success(savedPromo, "Promo Ditetapkan"))

        } catch (e) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Tidak Dapat Menambah Promo", HttpStatus.BAD_REQUEST))
        }

    }

    async updatePromoByPromoId(req, res) {

        const { error } = updatePromoByPromoIdValidation(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        if (!this.isIdValid(req.params.promoId)) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation("ID Promo Tidak Valid", HttpStatus.BAD_REQUEST))
        }

        let input = req.body

        try {

            if (input.products && input.products.length < 0) {
                this.sendError("Minimal 1 Produk Ditambahkan", HttpStatus.BAD_REQUEST)
            }

            if (input.products) {
                for (let i = 0; i < input.products.length; i++) {

                    this.validateId(input.products[i], 'Produk')

                }
            }

            if (req.file) {
                req.body.banner = req.file.path
            }

            const promo = await PromoModel.findOneAndUpdate(
                req.params.promoId, {
                $set: req.body
            }, {
                new: true
            }).select({
                name: 1,
                products: 1,
                banner: 1,
                termsAndConditions: 1,
                promoStart: 1,
                promoEnd: 1,
                isActive: 1,
                description: 1,
                platform: 1
            })

            return res.status(HttpStatus.OK).send(responser.success(promo, 'Promo Diperbarui'))

        } catch (e) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Tidak Dapat Memperbarui Promo", HttpStatus.BAD_REQUEST))

        }
    }

    async updateStatusByPromoId(req, res) {

        const { error } = updateStatusByPromoIdValidation(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        if (!this.isIdValid(req.params.promoId)) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation("ID Promo Tidak Valid", HttpStatus.BAD_REQUEST))
        }

        let isPromoExist = await this.isPromoExist(req.params.promoId)

        if (!isPromoExist) {
            return res.status(HttpStatus.NOT_FOUND).send(responser.validation("Promo Tidak Ditemukan", HttpStatus.NOT_FOUND))
        }

        let message = req.body.isActive ? "Diaktifkan": "Di Non-Aktifkan"

        try {

            await PromoModel.updateOne(
                {
                    _id: req.params.promoId
                },
                {
                    $set: {
                        isActive: req.body.isActive
                    }
                }, {
                new: true
            })

            return res.status(HttpStatus.OK).send(responser.success([], `Promo ${message}`))

        } catch (e) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Tidak Dapat Memperbarui Promo", HttpStatus.BAD_REQUEST))

        }

    }

    async deletePromoByPromoId(req, res) {

        this.setConstructor(req, res);

        const { error } = deletePromoByPromoIdValidation(req.params)

        if (error) {
            return this.sendError(error.details[0].message, HttpStatus.BAD_REQUEST)
        }

        let isIdValid = this.validateId(req.params.promoId, 'Promo')

        if (!isIdValid) {
            return this.sendError(`ID Promo Tidak Valid`, HttpStatus.BAD_REQUEST)
        }

        let isPromoExist = await this.isPromoExist(req.params.promoId, "ID")

        if (!isPromoExist) {
            return this.sendError("Promo Tidak Ditemukan", HttpStatus.BAD_REQUEST)
        }

        try {

            await PromoModel.deleteOne({
                _id: req.params.promoId
            });

            this.sendSuccess([], 'Promo Dihapus')

        } catch (err) {

            this.sendError("Tidak Dapat Menghapus Promo", HttpStatus.NOT_MODIFIED)
            return
        }

    }

    async isPromoExist(value, type = 'id') {

        let promo

        if (type.toLowerCase() === "name") {
            promo = await PromoModel.findOne({
                name: value,
            })
        } else if (type.toLowerCase() === "id") {
            promo = await PromoModel.findOne({
                _id: value
            })
        }

        return promo

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

    sendSuccess(data, message, code = 200) {
        return this.res.status(code).send(responser.success(data, message, code))
    }

    sendError(message, code = 404) {
        return this.res.status(code).send(responser.validation(message, code))
    }

}

app.use(handleErrors)

module.exports = new PromoController