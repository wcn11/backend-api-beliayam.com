const express = require('express');

const app = express();

const mongoose = require('mongoose');
const VoucherModel = require('@model/voucher/voucher.model')
const UserModel = require('@model/user/user.model')
const ProductModel = require('@model/product/product.model')
const PromoModel = require('@model/promo/promo.model')

var fs = require('fs');

const customId = require("custom-id");
const HttpStatus = require('@helper/http_status')
const responser = require('@responser')

const date = require('@helper/date')

const moment = require('moment')
moment.locale('id-ID');

const handleErrors = require('../../../../middleware/handleErrors');

const { BadRequest } = require('@utility/errors');

const {
    createNewPromoValidation,
    getAllPromoValidation,
    getPromoByPromoIdValidation,
    updatePromoByPromoIdValidation,
    deletePromoByPromoIdValidation,
    getAllPromoProductValidation,
    updateStatusByPromoIdValidation,
    addProductToPromoValidation,
    removeProductFromPromoValidation

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

    async getPromoBySlug(req, res) {
        try {

            let category = await PromoModel.findOne({
                slug: req.query.key
            }).populate(["products"])

            return res.status(HttpStatus.OK).send(responser.success(category, "OK"));
        } catch (err) {

            return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Format Query Salah", HttpStatus.BAD_REQUEST));
        }
    }

    async getPromoProductByPromoIdOrSlug(req, res) {

        const { error } = getAllPromoProductValidation(req.query)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        let isPromoExist = false

        let isActive

        if (req.query.isActive) {
            isActive = true
        } else if (req.query.isActive === false) {
            isActive = false
        } else {
            isActive = true
        }

        let promoObject

        if (this.validateId(req.params.slug)) {


            promoObject = await PromoModel.findOne({
                _id: req.params.slug,
            })

        } else {
            promoObject = await PromoModel.findOne({
                slug: req.params.slug,
            })
        }

        if (!promoObject) {
            return res.status(HttpStatus.OK).send(responser.error("Promo Tidak Ditemukan"));
        }

        var currentDate = date.time().toDate();

        // benerin dan buat paginasi
        let promo = await ProductModel.find({
            hasPromo: {
                $in: [promoObject._id]
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

        return res.status(HttpStatus.OK).send(responser.success(promo, "OK"));
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

            this.removeFile(req)
            return res.status(HttpStatus.NOT_ACCEPTABLE).send(responser.validation(`Promo '${input.name}' Telah Ada, Harap Gunakan Nama Berbeda`, HttpStatus.NOT_ACCEPTABLE))
        }

        let isSlugExist = await this.isPromoExist(input.slug, 'slug')

        if (isSlugExist) {

            this.removeFile(req)
            return res.status(HttpStatus.NOT_ACCEPTABLE).send(responser.validation(`Slug Telah Ada, Harap Gunakan Slug Berbeda`, HttpStatus.NOT_ACCEPTABLE))
        }

        let isTagExist = await this.isPromoExist(input.tags, 'tags')

        if (isTagExist) {

            this.removeFile(req)
            return res.status(HttpStatus.NOT_ACCEPTABLE).send(responser.validation(`Tag Telah Ada, Harap Gunakan Tag Berbeda`, HttpStatus.NOT_ACCEPTABLE))
        }

        try {
            let promoObject = {
                name: input.name,
                slug: input.slug,
                tags: input.tags,
                products: [],
                image_promo: req.file ? `images/promo/${req.file.filename}` : "",
                termsAndConditions: input.termsAndConditions,
                promoValue: input.promoValue,
                promoBy: input.promoBy,
                promoStart: input.promoStart,
                promoEnd: input.promoEnd,
                isActive: input.isActive ?? false,
                description: input.description,
                platform: []
            }
            if (input.products) {

                // if (input.products.length <= 0) {
                //     return res.status(HttpStatus.BAD_REQUEST).send(responser.validation("Minimal 1 Produk Ditambahkan", HttpStatus.BAD_REQUEST))
                // }

                for (let i = 0; i < input.products.length; i++) {

                    if (!this.isIdValid(input.products[i])) {

                        this.removeFile(req)

                        return res.status(HttpStatus.BAD_REQUEST).send(responser.validation("ID Produk Tidak Valid", HttpStatus.BAD_REQUEST))
                    }
                    promoObject['products'].push(input.products[i])
                }
            }

            if (input.platform && input.platform.length > 0) {
                promoObject['platform'] = [input.platform]
            } else {
                promoObject['platform'] = ['all']
            }

            let promo = new PromoModel(promoObject)


            const savedPromo = await promo.save()

            if (input.products && input.products.length > 0) {

                input.products.map(async product => {

                    await ProductModel.findOneAndUpdate(
                        {
                            _id: product
                        }, {
                        $set: {
                                hasPromo: [savedPromo._id],
                                hasDiscount: {
                                    isDiscount: false,
                                    discount: 0,
                                    discountBy: "price",
                                    discountStart: null,
                                    discountEnd: null,
                                    priceAfterDiscount: 0,
                                }
                        }
                    }, {
                        new: true
                    })

                })
            }


            return res.status(HttpStatus.OK).send(responser.success(savedPromo, "Promo Ditetapkan"))

        } catch (e) {
            this.removeFile(req)
            return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Tidak Dapat Menambah Promo", HttpStatus.BAD_REQUEST))
        }

    }

    async updatePromoByPromoId(req, res) {

        const { error } = updatePromoByPromoIdValidation(req.body)

        if (error) {

            this.removeFile(req)
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        if (!this.isIdValid(req.params.promoId)) {

            this.removeFile(req)
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation("ID Promo Tidak Valid", HttpStatus.BAD_REQUEST))
        }

        let input = req.body

        let isPromoExist = await this.isPromoExist(req.params.promoId, 'id')

        if (!isPromoExist) {

            this.removeFile(req)
            return res.status(HttpStatus.OK).send(responser.validation("Promo Tidak Ditemukan", HttpStatus.NOT_FOUND))
        }

        // let isSlugExist = await this.isPromoExist(input.slug, 'slug')

        // if (isSlugExist && isSlugExist._id !== req.params.promoId) {

        //     this.removeFile(req)
        //     return res.status(HttpStatus.NOT_ACCEPTABLE).send(responser.validation(`Slug Telah Ada, Harap Gunakan Slug Berbeda`, HttpStatus.NOT_ACCEPTABLE))
        // }

        // let isTagExist = await this.isPromoExist(input.tags, 'tags')

        // if (isTagExist && isTagExist._id !== req.params.promoId) {

        //     this.removeFile(req)
        //     return res.status(HttpStatus.NOT_ACCEPTABLE).send(responser.validation(`Tag Telah Ada, Harap Gunakan Tag Berbeda`, HttpStatus.NOT_ACCEPTABLE))
        // }

        // try {

        // if (input.products && input.products.length < 0) {
        //     this.sendError("Minimal 1 Produk Ditambahkan", HttpStatus.BAD_REQUEST)
        // }

        if (input.products) {
            for (let i = 0; i < input.products.length; i++) {

                const productId = this.validateId(input.products[i], 'Produk')

                if (!productId) {

                    this.removeFile(req)
                    return res.status(HttpStatus.BAD_REQUEST).send(responser.validation("Salah Satu Produk Tidak Valid", HttpStatus.BAD_REQUEST))
                }


                if (input.products && input.products.length > 0) {

                    input.products.map(async product => {

                        await ProductModel.findOneAndUpdate(
                            {
                                _id: product
                            }, {
                            $set: {
                                    hasPromo: req.params.promoId,
                                hasDiscount: {
                                    isDiscount: false,
                                    discount: 0,
                                    discountBy: "price",
                                    discountStart: null,
                                    discountEnd: null,
                                    priceAfterDiscount: 0,
                                }
                            }
                        }, {
                            new: true
                        })

                    })
                }

            }
        }


        if (req.file) {
            req.body.image_promo = req.file ? `images/promo/${req.file.filename}` : ""
        }

        await PromoModel.findOneAndUpdate(
            { _id: req.params.promoId }, {
            $set: req.body
        }, {
            new: true
        }).select({
            name: 1,
            products: 1,
            image_promo: 1,
            termsAndConditions: 1,
            promoStart: 1,
            promoEnd: 1,
            isActive: 1,
            description: 1,
            platform: 1
        })

        if (isPromoExist.image_promo) {

            this.removeFile('public/' + isPromoExist.image_promo)
        }

        return res.status(HttpStatus.OK).send(responser.success({}, 'Promo Diperbarui'))

        // } catch (e) {
        //     return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Tidak Dapat Memperbarui Promo", HttpStatus.BAD_REQUEST))

        // }
    }

    async addProductToPromo(req, res) {

        const { error } = addProductToPromoValidation(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        let promo = await this.isPromoExist(req.params.promoId)

        if (!promo) {
            return res.status(HttpStatus.OK).send(
                responser.error(translate('promo.not_found'), HttpStatus.OK))
        }

        let products = await this.getProductByProductId(req.body.product_id)

        if (!products && products.length !== req.body.cart.products.length) {
            return res.status(HttpStatus.OK).send(
                responser.error(translate('product.some_product_not_available'), HttpStatus.OK))
        }

        try {

            const product_ids = req.body.product_id.concat(promo.products)

            await PromoModel.updateOne(
                {
                    _id: req.params.promoId
                },

                { $addToSet: { products: product_ids } }
                , {
                    $project: {
                        _id: 1
                    }
                })

            await ProductModel.updateMany(
                {
                    _id: {
                        $in: [req.body.product_id]
                    }
                },
                {
                    $set: {
                        hasPromo: req.params.promoId,
                        hasDiscount: {
                            isDiscount: false,
                            discount: 0,
                            discountBy: "price",
                            discountStart: null,
                            discountEnd: null,
                            priceAfterDiscount: 0,
                        }
                    }
                }, {
                new: true
            })

            return res.status(HttpStatus.OK).send(responser.success([], translate('promo.product_updated')))
        } catch (err) {

            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(responser.error(translate('promo.cant_update_promo'), HttpStatus.INTERNAL_SERVER_ERROR))
        }
    }

    async removeProductFromPromo(req, res) {

        const { error } = removeProductFromPromoValidation(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        let promo = await this.isPromoExist(req.params.promoId)

        if (!promo) {
            return res.status(HttpStatus.OK).send(
                responser.error(translate('promo.not_found'), HttpStatus.OK))
        }

        let products = await this.getProductByProductId(req.body.product_id)

        if (!products && products.length !== req.body.cart.products.length) {
            return res.status(HttpStatus.OK).send(
                responser.error(translate('product.some_product_not_available'), HttpStatus.OK))
        }

        try {

            await PromoModel.updateMany(
                { _id: req.params.promoId },
                {
                    $pullAll: {
                        products: [req.body.product_id]
                    }
                }, {
                upsert: true
            });

            await ProductModel.updateMany(
                {
                    _id: {
                        $in: [req.body.product_id]
                    }
                },
                {
                    $pull: [{

                        hasPromo: null
                    }]
                }, {
                multi: true
            });

            await ProductModel.updateMany(
                {
                    _id: {
                        $in: [req.body.product_id]
                    }
                },
                {
                    $set: {
                        hasPromo: req.params.promoId,
                        hasDiscount: {
                            isDiscount: false,
                            discount: 0,
                            discountBy: "price",
                            discountStart: null,
                            discountEnd: null,
                            priceAfterDiscount: 0,
                        }
                    }
                }, {
                new: true
            })

            return res.status(HttpStatus.OK).send(responser.success([], translate('promo.product_updated')))
        } catch (err) {

            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(responser.error(translate('promo.cant_update_promo'), HttpStatus.INTERNAL_SERVER_ERROR))
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

        let message = req.body.isActive ? "Diaktifkan" : "Di Non-Aktifkan"

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

        const { error } = deletePromoByPromoIdValidation(req.params)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.error(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        let isIdValid = this.validateId(req.params.promoId, 'Promo')

        if (!isIdValid) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.error(`ID Promo Tidak Valid`, HttpStatus.BAD_REQUEST))
        }

        let isPromoExist = await this.isPromoExist(req.params.promoId, "ID")

        if (!isPromoExist) {

            return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Promo Tidak Ditemukan", HttpStatus.BAD_REQUEST))
        }

        try {

            await PromoModel.deleteOne({
                _id: req.params.promoId
            });

            return res.status(HttpStatus.BAD_REQUEST).send(responser.success({}, 'Promo Dihapus'))

        } catch (err) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(responser.error("Kegagalan Menghapus Promo", HttpStatus.INTERNAL_SERVER_ERROR))

        }

    }

    async isPromoExist(value, type = 'id') {

        let promo

        if (type.toLowerCase() === "name") {
            promo = await PromoModel.findOne({
                name: value,
            })
        } else if (type.toLowerCase() === "slug") {
            promo = await PromoModel.findOne({
                slug: value
            })
        } else if (type.toLowerCase() === "tags") {
            promo = await PromoModel.findOne({
                tags: value
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

    async getProductByProductId(product_ids = []) {

        let products = await ProductModel.find({
            _id: {
                $in: product_ids
            }
        }).populate({
            path: 'hasPromo'
        })

        return products
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

    validateId(id) {

        if (!mongoose.isValidObjectId(id)) {
            return false
        }

        return id

    }

    removeFile(req) {
        try {
            if (req.file) {
                fs.unlinkSync(req.file.path, function (err) {
                    if (err) return
                })
            } else {
                fs.unlinkSync(req, function (err) {
                    if (err) return
                })
            }
        }
        catch (err) {
            return
        }
    }

}

app.use(handleErrors)

module.exports = new PromoController