
const mongoose = require('mongoose');
const CheckoutModel = require('@model/checkout/checkout.model')
const ChargeModel = require('@model/charge/charge.model')
const CartModel = require('@model/cart/cart.model')
const VoucherModel = require('@model/voucher/voucher.model')
const UserModel = require('@model/user/user.model')
const ProductModel = require('@model/product/product.model')
const customId = require("custom-id");
const HttpStatus = require('@helper/http_status')
const responser = require('@responser')
const moment = require('moment')
moment.locale('id-ID');


const {
    calculateCheckoutValidation,
    applyVoucherValidation
} = require('@validation/checkout/checkout.validation')

const CheckoutController = class CheckoutController {

    async calculateCheckout(req, res) {

        const { error } = calculateCheckoutValidation(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        let isValid = await this.isIdValid(req.body.cart.cart_id)

        if (!isValid) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error("ID Keranjang Tidak Valid", HttpStatus.BAD_REQUEST)
            );
        }

        let isUserValid = await this.isIdValid(req.body.user_id)

        if (!isUserValid) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error("ID Pelanggan Tidak Valid", HttpStatus.BAD_REQUEST)
            );
        }

        let isCartExist = await this.isCartExist(req.body.cart.cart_id)

        if (!isCartExist) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error("Keranjang Tidak Ditemukan", HttpStatus.BAD_REQUEST))
        }

        const user = await this.getUserById(req.body.user_id)

        if (user.addresses.length < 0) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error("Belum Mempunyai Alamat, Minimal Mempunyai 1 Alamat Pengiriman", HttpStatus.BAD_REQUEST))
        }

        // if (!user.isEmailVerified && !user.isPhoneVerified) {
        //     return res.status(HttpStatus.BAD_REQUEST).send(
        //         responser.error("Untuk Melanjutkan Checkout, Harap Mem-verifikasi Alamat Email", HttpStatus.BAD_REQUEST))
        // }

        // if (!user.isPhoneVerified) {
        //     return res.status(HttpStatus.BAD_REQUEST).send(
        //         responser.error("Untuk Melanjutkan Checkout, Harap Mem-verifikasi Nomor Telepon Anda", HttpStatus.BAD_REQUEST))
        // }

        const productObject = []

        let products = await Promise.all(req.body.cart.products.map(async (product) => {

            let isProductValid = await this.isIdValid(product._id)

            if (!isProductValid) {
                return res.status(HttpStatus.BAD_REQUEST).send(
                    responser.error(`ID Produk ${product.name} Tidak Valid`, HttpStatus.BAD_REQUEST))
            }

            let productData = await ProductModel.findOne({
                _id: product._id
            })

            if (!productData) {
                return res.status(HttpStatus.BAD_REQUEST).send(
                    responser.error(`Produk ${product.name} Tidak Ditemukan`, HttpStatus.BAD_REQUEST))
            }

            if (productData.status.toLowerCase() !== "active") {
                return res.status(HttpStatus.BAD_REQUEST).send(
                    responser.error(`Produk ${product.name} Telah Di Non-aktifkan`, HttpStatus.BAD_REQUEST))
            }

            if (productData.stock < 0) {
                return res.status(HttpStatus.BAD_REQUEST).send(
                    responser.error(`Stok Produk ${product.name} Kehabisan Persediaan`, HttpStatus.BAD_REQUEST))
            }

            await productObject.push({
                _id: product._id,
                name: product.name,
                quantity: product.quantity,
                price: product.price,
                note: product.note ?? ""
            })

            return Promise.resolve(productObject)
        }))

        try {

            let charges = await this.getAllCharge()

            const calculateItem = products[0].reduce((accumulator, product) => {
                return accumulator + (product.quantity * product.price)
            }, 0)

            const calculateCharge = charges.reduce((accumulator, charge) => {

                if (charge.chargeBy === "price") {
                    return accumulator + parseInt(charge.chargeValue)
                } else if (charge.chargeBy === "percent") {
                    return accumulator + ((charge.chargeValue / 100) * calculateItem)
                } else {
                    return accumulator
                }
            }, 0)

            let voucherNotValid = []

            let vouchersApplied = []

            let subTotalVoucher = 0

            let allVouchers = req.body.vouchers

            for (let i = 0; i < allVouchers.length; i++) {

                let isVoucherExist = await this.isVoucherExist(allVouchers[i], "id")

                if (!isVoucherExist && isVoucherExist === null) {

                    voucherNotValid.push(`Salah satu voucher tidak dapat digunakan, mungkin telah kadaluarsa`)

                    continue
                }

                var currentDate = moment().toDate();

                if (isVoucherExist.discountStart > currentDate) {

                    let voucherName = isVoucherExist.voucherName ?? 'Anda'

                    voucherNotValid.push(`Voucher ${voucherName} Belum Aktif`)

                    continue
                }

                if (isVoucherExist.discountEnd > currentDate) {

                    let voucherName = isVoucherExist.voucherName ?? "Anda"

                    voucherNotValid.push(`Voucher ${voucherName} Telah Kadaluarsa`)

                    continue
                }

                if (isVoucherExist.isPrivate.private) {

                    let isUserExist = isVoucherExist.isPrivate.users.indexOf(req.body.user_id) != -1

                    let voucherName = isVoucherExist.voucherName ?? "ini Khusus"

                    if (!isUserExist) {

                        voucherNotValid.push(`Voucher ${voucherName} Privat. Tidak Dapat Digunakan Oleh Anda`)

                        continue
                    }
                }

                vouchersApplied.push(isVoucherExist)

                switch (isVoucherExist.discountBy) {
                    case "percent":
                        subTotalVoucher += (isVoucherExist.discountValue / 100) * calculateItem
                    case "price":
                        subTotalVoucher += isVoucherExist.discountValue
                }

            }

            let grandTotal = (calculateItem + calculateCharge) - subTotalVoucher

            var response = {
                products: products[0],
                charges,
                subTotalProducts: calculateItem,
                subTotalCharges: calculateCharge,
                voucherNotValid,
                vouchersApplied,
                subTotalVoucher,
                grandTotal
            }

            return res.status(HttpStatus.OK).send(responser.success(response, HttpStatus.OK));
        } catch (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation("Tidak Dapat Checkout", HttpStatus.BAD_REQUEST))
        }

    }

    async applyVoucher(req, res) {

        this.setConstructor(req, res);

        if (!req.body.voucherCode) {
            return this.sendError("Kode Voucher Tidak Valid", HttpStatus.BAD_REQUEST)
        }

        const { error } = applyVoucherValidation(req.body)

        if (error) {
            return this.sendError(error.details[0].message, HttpStatus.BAD_REQUEST)
        }

        let isCartIdValid = await this.isIdValid(req.body.cart_id)

        if (!isCartIdValid) {
            return this.sendError("ID Keranjang Tidak Valid", HttpStatus.BAD_REQUEST)
        }

        let isUserIdValid = await this.isIdValid(req.body.user_id)

        if (!isUserIdValid) {
            return this.sendError("ID User Tidak Valid", HttpStatus.BAD_REQUEST)
        }

        let isVoucherExist = await this.isVoucherExist(req.body.voucherCode, "code")

        if (!isVoucherExist) {
            return this.sendError("Voucher Tidak Aktif Atau Tidak Ditemukan", HttpStatus.BAD_REQUEST)
        }

        var currentDate = moment().toDate();

        if (!isVoucherExist.isActive) {
            return this.sendError("Voucher Tidak Aktif", HttpStatus.BAD_REQUEST)
        }

        if (isVoucherExist.discountStart > currentDate) {
            return this.sendError("Voucher Belum Aktif", HttpStatus.BAD_REQUEST)
        }

        if (isVoucherExist.discountEnd > currentDate) {
            return this.sendError("Voucher Kadaluarsa", HttpStatus.BAD_REQUEST)
        }

        let platform = isVoucherExist.platform.indexOf(req.body.platform) != -1

        if (!platform) {

            return this.sendError(`Voucher Tidak Dapat Digunakan Diperangkat Ini`, HttpStatus.BAD_REQUEST)
        }

        if (isVoucherExist.isPrivate.private) {
            let isUserExist = isVoucherExist.isPrivate.users.indexOf(req.body.user_id) != -1

            if (!isUserExist) {
                return this.sendError(`Voucher Ini Tidak Dapat Digunakan Oleh Anda`, HttpStatus.BAD_REQUEST)
            }
        }

        this.sendSuccess(isVoucherExist, "Voucher Diterapkan")

    }

    async getAllCharge(defaultCharge = "checkout", platform = "all", isActive = true) {

        const charges = await ChargeModel.find(
            {
                "default": defaultCharge,
                "plaform": platform,
                "isActive": isActive
            }
        );

        return charges
    }

    async getAllVoucher(user_id, platform = "all", isActive = true) {

        var currentDate = moment().toDate();

        let voucher = await VoucherModel.aggregate([
            {
                $match: {
                    $or: [
                        {
                            "isPrivate.private": true,
                            "isPrivate.users": {
                                $in: [`${user_id}`]
                            },
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

                        },
                        {
                            "isPrivate.private": false,
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
                        }
                    ]
                }
            },
            {
                "$project": {
                    voucherName: 1,
                    voucherCode: 1,
                    isPrivate: 1,
                    platform: 1,
                    banner: 1,
                    discountBy: 1,
                    discountValue: 1,
                    minimumOrderValue: 1,
                    termsAndConditions: 1,
                    isActive: 1,
                    discountStart: 1,
                    discountEnd: 1
                }
            }
        ])

        return voucher
    }

    async isVoucherExist(voucherBy, type = "code") {

        let voucher

        if (type.toLowerCase() === "code") {

            voucher = await VoucherModel.findOne({
                voucherCode: voucherBy
            })
        } else if (type.toLowerCase() === "id") {

            voucher = await VoucherModel.findOne({
                _id: voucherBy
            })
        }

        return voucher

    }

    async isCartExist(cart_id) {

        let cart = await CartModel.findOne({
            _id: cart_id
        })

        return cart

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

    sendSuccess(data, message, code = 200) {
        return this.res.status(code).send(responser.success(data, message, code))
    }

    sendError(message, code = 404) {
        return this.res.status(code).send(responser.validation(message, code))
    }

}


module.exports = new CheckoutController