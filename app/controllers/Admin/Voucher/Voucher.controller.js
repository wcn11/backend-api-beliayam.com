
const mongoose = require('mongoose');
const VoucherModel = require('@model/voucher/voucher.model')
const UserModel = require('@model/user/user.model')
const ProductModel = require('@model/product/product.model')
const customId = require("custom-id");
const HttpStatus = require('@helper/http_status')
const responser = require('@responser')
const date = require('@helper/date')

const moment = require('moment')
moment.locale('id-ID');


const {
    createNewVoucherValidation,
    getAllVouchersValidation,
    getVoucherByVoucherCodeValidation,
    getVoucherByVoucherIdValidation,
    updateVoucherByVoucherIdValidation,
    deleteVoucherByVoucherIdValidation,
    getAllVouchersByUserValidation

} = require('@validation/admin/voucher/voucher.validation')

const VoucherController = class VoucherController {

    async getAllVouchers(req, res) {

        const { error } = getAllVouchersValidation(req.query)

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
                orderBy = req.query.orderBy ?? "voucherCode"
            }
            orderBy = req.query.orderBy ?? 1

            let user = await VoucherModel.find({}).sort({
                orderBy: sortBy
            }).skip((parseInt(page) - 1) * parseInt(show)).limit(parseInt(show))

            return res.status(HttpStatus.OK).send(responser.success(user, HttpStatus.OK));

        } catch (err) {

            return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Format Query Salah", HttpStatus.BAD_REQUEST));
        }
    }

    async getVouchersByUser(req, res) {

        const { error } = getAllVouchersByUserValidation(req.query)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        // try {

        let page = req.query.page ?? 1
        let show = req.query.show ?? 10

        let sortBy;

        let orderBy;

        if (!req.query.sortBy) {
            sortBy = req.query.sortBy === "ASC" ? 1 : -1
        } else {
            sortBy = 1
        }

        if (!req.query.orderBy) {
            orderBy = req.query.orderBy ?? "voucherCode"
        }
        orderBy = req.query.orderBy ?? 1

        var currentDate = date.time(7)

        if (req.query.sortBy) {
            sortBy = req.query.sortBy === "ASC" ? 1 : -1
        }

        let sort = {
            $sort: {
                "voucherCode": sortBy,
            }
        }

        const userId = req.params.userId

        if (!userId) {
            return res.status(HttpStatus.OK).send(responser.validation("ID Pengguna Dibutuhkan", HttpStatus.OK));
        }

        // const platform = req.query.platform

        const isActive = req.query.isActive ?? false
        const voucher = await VoucherModel.find({
            $or: [
                {
                    "isPrivate.private": true,
                    "isPrivate.users": {
                        $in: [`${userId}`]
                    },
                },
                {
                    "isPrivate.private": false,
                },
            ],
            platform: {
                $in: [platform]
            },
            isActive: isActive,
            discountStart: {
                $lte: currentDate
            },
            discountEnd: {
                $gte: currentDate
            }
        }).sort({
            orderBy: sortBy
        }).skip((parseInt(page) - 1) * parseInt(show)).limit(parseInt(show))

        return res.status(HttpStatus.OK).send(responser.success(voucher, "OK"));

        // } catch (err) {

        //     return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Format Query Salah", HttpStatus.BAD_REQUEST));
        // }
    }

    async getVoucherByVoucherCode(req, res) {

        const { error } = getVoucherByVoucherCodeValidation(req.params)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        let input = req.params

        try {

            let isVoucherExist = await this.isVoucherExist(input.voucherCode)

            if (!isVoucherExist) {
                return res.status(HttpStatus.NOT_FOUND).send(responser.validation("Voucher Tidak Ditemukan", HttpStatus.NOT_FOUND))
            }

            return res.status(HttpStatus.OK).send(responser.success(isVoucherExist, HttpStatus.OK));

        }
        catch (err) {
            return res.status(HttpStatus.SERVICE_UNAVAILABLE).send(responser.validation("Kesalahan Dalam Mengambil Data Voucher", HttpStatus.SERVICE_UNAVAILABLE))
        }

    }

    async getVoucherByVoucherId(req, res) {

        const { error } = getVoucherByVoucherIdValidation(req.params)

        if (error) {
            return res.status(HttpStatus.OK).send(responser.validation(error.details[0].message, HttpStatus.OK))
        }

        let input = req.params

        let isValid = await this.isIdValid(input.voucherId)

        if (!isValid) {
            return res.status(HttpStatus.OK).send(
                responser.error("Voucher ID Tidak Valid", HttpStatus.OK)
            );
        }

        try {

            let isVoucherExist = await this.isVoucherExist(input.voucherId, "id")

            if (!isVoucherExist) {
                return res.status(HttpStatus.OK).send(responser.validation("Voucher Tidak Ditemukan", HttpStatus.OK))
            }

            return res.status(HttpStatus.OK).send(responser.success(isVoucherExist, HttpStatus.OK));

        }
        catch (err) {
            return res.status(HttpStatus.SERVICE_UNAVAILABLE).send(responser.validation("Kesalahan Dalam Mengambil Data Voucher", HttpStatus.SERVICE_UNAVAILABLE))
        }

    }

    async createNewVoucher(req, res) {

        const { error } = createNewVoucherValidation(req.body)

        if (error) {
            return res.status(HttpStatus.OK).send(responser.validation(error.details[0].message, HttpStatus.OK))
        }

        let input = req.body

        let isVoucherExist = await this.isVoucherExist(input.voucherCode)

        if (isVoucherExist) {
            return res.status(HttpStatus.OK).send(responser.validation("Kode Voucher Telah Digunakan", HttpStatus.OK))
        }

        // if (!isIdValid) {
        //     return res.status(HttpStatus.BAD_REQUEST).send(responser.validation("ID Produk Tidak Valid", HttpStatus.BAD_REQUEST))
        // }

        try {

            let voucherObject = {
                voucherName: input.voucherName,
                voucherCode: input.voucherCode,
                // banner: req.file ? `images/voucher/${req.file.filename}` : "images/voucher/default.jpg", //req.file ? req.file.path : "images/voucher/default.jpg",
                discountBy: input.discountBy,
                discountValue: input.discountValue,
                minimumOrderBy: input.minimumOrderBy,
                minimumOrderValue: input.minimumOrderValue,
                max: input.max,
                termsAndConditions: input.termsAndConditions,
                discountStart: input.discountStart,
                discountEnd: input.discountEnd,
                isActive: input.isActive ?? false,
                platform: "",
            }

            if (input.private) {
                voucherObject.isPrivate = {
                    private: input.private,
                    maxUser: input.maxUser,
                    users: input.user_id
                }
            }

            if (input.platform) {
                voucherObject['platform'] = input.platform
            } else {
                voucherObject['platform'] = 'all'
            }

            let voucher = new VoucherModel(voucherObject)

            const savedVoucher = await voucher.save()

            return res.status(HttpStatus.OK).send(responser.success(savedVoucher, "Voucher Ditambahkan"))

        } catch (e) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Tidak Dapat Membuat Voucher", HttpStatus.BAD_REQUEST))
        }

    }

    async updateVoucherByVoucherId(req, res) {

        const { error } = updateVoucherByVoucherIdValidation(req.body)

        if (error) {
            return res.status(HttpStatus.OK).send(responser.validation(error.details[0].message, HttpStatus.OK))
        }

        let isValid = await this.isIdValid(req.params.voucherId)

        if (!isValid) {
            return res.status(HttpStatus.OK).send(
                responser.error("Voucher ID Tidak Valid", HttpStatus.OK)
            );
        }

        let input = req.body

        let isVoucherExist = await this.isVoucherExist(req.params.voucherId, "ID")

        if (!isVoucherExist) {
            return res.status(HttpStatus.NOT_FOUND).send(responser.validation("Voucher Tidak Ditemukan", HttpStatus.NOT_FOUND))
        }

        try {


            const voucher = await VoucherModel.findOneAndUpdate(
                req.params.voucherId, {
                $set: {
                    voucherName: req.body.voucherName,
                        voucherCode: req.body.voucherCode,
                    // banner: req.body.banner,
                    discountBy: req.body.discountBy,
                    discountValue: req.body.discountValue,
                        minimumOrderBy: input.minimumOrderBy,
                    minimumOrderValue: req.body.minimumOrderValue,
                    isPrivate: {
                        private: input.private ?? false,
                        maxUser: input.maxUser,
                        users: input.user_id
                    },
                    voucherMaxUse: {
                        max: req.body.max
                    },
                    termsAndConditions: req.body.termsAndConditions,
                    discountStart: req.body.discountStart,
                    discountEnd: req.body.discountEnd,
                    isActive: req.body.isActive,
                    description: req.body.description
                }
            }, {
                new: true
            }).select({
                voucherName: 1,
                voucherCode: 1,
                banner: 1,
                discountBy: 1,
                discountValue: 1,
                minimumOrderBy: 1,
                minimumOrderValue: 1,
                isPrivate: 1,
                voucherMaxUse: 1,
                termsAndConditions: 1,
                discountStart: 1,
                discountEnd: 1,
                isActive: 1,
                description: 1,
            })

            return res.status(HttpStatus.OK).send(responser.success(voucher, "Voucher Diperbarui"))

        } catch (e) {
            return res.status(HttpStatus.NOT_MODIFIED).send(responser.error("Tidak Dapat Mengubah Voucher", HttpStatus.NOT_MODIFIED))
        }
    }

    async deleteVoucherByVoucherId(req, res) {

        const { error } = deleteVoucherByVoucherIdValidation(req.params)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        let isValid = await this.isIdValid(req.params.voucherId)

        if (!isValid) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error("Voucher ID Tidak Valid", HttpStatus.BAD_REQUEST)
            );
        }

        let input = req.params

        let isVoucherExist = await this.isVoucherExist(input.voucherId, "ID")

        if (!isVoucherExist) {
            return res.status(HttpStatus.NOT_FOUND).send(responser.validation("Voucher Tidak Ditemukan", HttpStatus.NOT_FOUND))
        }

        try {

            await VoucherModel.deleteOne({
                _id: req.params.voucherId
            });

            return res.status(HttpStatus.OK).send(responser.validation("Voucher Dihapus", HttpStatus.OK))

        } catch (err) {

            return res.status(HttpStatus.NOT_MODIFIED).send(responser.error("Tidak Bisa Menghapus Voucher", HttpStatus.NOT_MODIFIED))

        }

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

        let product = await Voucher.findOne({
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

}


module.exports = new VoucherController