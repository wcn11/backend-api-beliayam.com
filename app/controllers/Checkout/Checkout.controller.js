
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
const { BadRequest } = require('@utility/errors')


const moment = require('moment')
moment.locale('id-ID');

const redis = require("redis");

const {
    calculateCheckoutValidation,
    applyVoucherValidation
} = require('@validation/checkout/checkout.validation')

const client = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
})

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

        let isCartExist = await this.isCartExist(req.body.cart.cart_id)

        if (!isCartExist) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error("Keranjang Tidak Ditemukan", HttpStatus.BAD_REQUEST))
        }

        let isUserValid = await this.isIdValid(req.body.user_id)

        if (!isUserValid) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error("ID Pelanggan Tidak Valid", HttpStatus.BAD_REQUEST)
            );
        }

        const user = await this.getUserById(req.body.user_id)

        if (user.addresses.length <= 0) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error("Memiliki 1 Alamat Minimal Untuk Pengiriman", HttpStatus.BAD_REQUEST))
        }

        if (!user.isEmailVerified && !user.isPhoneVerified) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error("Untuk Melanjutkan Checkout, Harap Mem-verifikasi Alamat Email", HttpStatus.BAD_REQUEST))
        }

        if (!user.isPhoneVerified) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error("Untuk Melanjutkan Checkout, Harap Mem-verifikasi Nomor Telepon Anda", HttpStatus.BAD_REQUEST))
        }

        //check product on real inventory
        let isProductExist = await this.getProductByProductId(req.body.cart.products, req.body.cart.cart_id)

        if (!isProductExist && isProductExist.length !== req.body.cart.products.length) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error("Beberapa Produk Dalam Keranjang Anda, Sudah Tidak Tersedia", HttpStatus.BAD_REQUEST))
        }

        let calculateItem = 0
        let productDiscount = 0
        let allProducts = []

        //check if product at cart exist in inventory products
        const products = await isProductExist.map(async (product) => {

            let isProductAtCartExist = await req.body.cart.products.includes(product._id)

            if (!isProductAtCartExist) {
                return res.status(HttpStatus.BAD_REQUEST).send(
                    responser.error("Beberapa Produk Dalam Keranjang Anda, Sudah Tidak Tersedia. Mohon Cek Ketersediaan Barang", HttpStatus.BAD_REQUEST))
            }

            if (product.status.toLowerCase() !== "active") {
                return res.status(HttpStatus.BAD_REQUEST).send(
                    responser.error(`Produk ${product.name} Sedang Tidak Tidak Tersedia`, HttpStatus.BAD_REQUEST))
            }

            if (product.stock < 0) {
                return res.status(HttpStatus.BAD_REQUEST).send(
                    responser.error(`Produk ${product.name} Kehabisan Persediaan`, HttpStatus.BAD_REQUEST))
            }

            var currentDate = moment().toDate();

            let discount = product.hasDiscount

            var productAtCart = await this.getProductAtCart(req.body.cart.cart_id, product._id)

            if (discount.isDiscount) {
                if (discount.discountStart <= currentDate && discount.discountEnd >= currentDate) {

                    if (discount.discountBy === "percent") {

                        calculateItem += ((discount.discount / 100) * product.price) * productAtCart.quantity
                        productDiscount += 1

                    } else if (discount.discountBy === "price") {

                        calculateItem += (productAtCart.quantity * product.price)
                        productDiscount += 1

                    }
                }
            } else {

                // add more math for promo on product
                calculateItem += product.price * productAtCart.quantity
            }

            product.quantity = productAtCart.quantity
            product.note = productAtCart.note

            allProducts.push(product)
        })

        try {

            let type = req.body.type || ""
            let platform = req.body.platform || ""
            let isActive = req.body.isActive || true

            let charges = await this.getAllCharge(type, platform, isActive)

            const calculateCharge = charges.reduce((accumulator, charge) => {

                if (charge.chargeBy === "price") {
                    return accumulator + parseInt(charge.chargeValue)
                }
                // else if (charge.chargeBy === "percent") {
                //     return accumulator + ((charge.chargeValue / 100) * calculateItem)
                // }
                else {
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

                if (isVoucherExist.discountEnd < currentDate) {

                    let voucherName = isVoucherExist.voucherName ?? "Anda"

                    voucherNotValid.push(`Voucher ${voucherName} Telah Kadaluarsa`)

                    continue
                }

                if (isVoucherExist.isPrivate.private) {

                    let isUserExist = isVoucherExist.isPrivate.users.indexOf(req.body.user_id) != -1

                    let voucherName = isVoucherExist.voucherName ?? "ini Khusus"

                    if (!isUserExist) {

                        voucherNotValid.push(`Voucher ${voucherName}, Bersifat Private. Tidak Dapat Digunakan Oleh Anda`)

                        continue
                    }
                }

                vouchersApplied.push(isVoucherExist)

                if (isVoucherExist.discountBy === "percent") {
                    subTotalVoucher += (isVoucherExist.discountValue / 100) * calculateItem
                } else if (isVoucherExist.discountBy === "price") {
                    subTotalVoucher += isVoucherExist.discountValue
                }

            }

            let grandTotal = (calculateItem + calculateCharge) - subTotalVoucher

            var response = {
                products: allProducts,
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

    async getProductAtCart(cart_id, productId) {

        const products = await CartModel.findOne({
            _id: cart_id
        })

        const product = products.products.filter(prod => prod._id === productId)[0]

        return product

    }

    async getProductByProductId(product_ids = [], cart_id) {

        // if (product_ids instanceof Array) {
        //     return new Error("Product ID's Not An Array")
        // }

        return new Promise((resolve) => {

            client.get(`checkout.${cart_id}`, async function (err, data) {
                if (err) {
                    resolve(null)
                }
                else {
                    if (!data) {

                        const products = await ProductModel.find({
                            "_id": {
                                $in: product_ids
                            }

                        })

                        // expire at 10 minutes on seconds
                        client.set(`checkout.${cart_id}`, JSON.stringify(products), 'EX', 600);

                        resolve(products)
                    }

                    resolve(JSON.parse(data))
                }
            })
        })

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

        let isUserIdValid = await this.isIdValid(req.body.cart.user_id)

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
                "isActive": isActive,
                "platform": {
                    "$in": [platform]
                },
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