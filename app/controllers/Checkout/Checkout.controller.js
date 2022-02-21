const mongoose = require('mongoose');
const CheckoutModel = require('@model/checkout/checkout.model')
const ChargeModel = require('@model/charge/charge.model')
const CartModel = require('@model/cart/cart.model')
const VoucherModel = require('@model/voucher/voucher.model')
const UserModel = require('@model/user/user.model')
const ProductModel = require('@model/product/product.model')
const HttpStatus = require('@helper/http_status')
const responser = require('@responser')
const { currentTime } = require('@helper/date')

const redis = require("redis");

const {
    calculateCheckoutValidation,
    applyVoucherValidation,
    // removeVoucherValidation
} = require('@validation/checkout/checkout.validation')

const client = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
})

const CheckoutController = class CheckoutController {

    async getUserCheckoutData(req, res) {
        let user = req.user.user

        let checkIfCheckoutIsExist = await CheckoutModel.findOne({
            user: user._id
        }).lean().populate(['charges', 'items.product', 'user'])

        if (!checkIfCheckoutIsExist) {
            return res.status(HttpStatus.NOT_FOUND).send(
                responser.error("Anda Belum Memilih Barang Untuk Dibayarkan", HttpStatus.NOT_FOUND))
        }

        checkIfCheckoutIsExist.user.otpEmail = undefined

        checkIfCheckoutIsExist.user.otpSms = undefined

        checkIfCheckoutIsExist.user.password = undefined

        checkIfCheckoutIsExist.vouchers = []

        return res.status(HttpStatus.OK).send(responser.success(checkIfCheckoutIsExist, HttpStatus.OK));

    }

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

        // if (!user.isPhoneVerified) {
        //     return res.status(HttpStatus.BAD_REQUEST).send(
        //         responser.error("Untuk Melanjutkan Checkout, Harap Mem-verifikasi Nomor Telepon Anda", HttpStatus.BAD_REQUEST))
        // }

        //check product on real inventory
        let products = await this.getProductByProductId(req.body.cart.products)

        if (!products && products.length !== req.body.cart.products.length) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error("Beberapa Produk Dalam Keranjang Anda, Sudah Tidak Tersedia", HttpStatus.BAD_REQUEST))
        }

        let calculateItem = 0
        let allProducts = []
        let objectProduct = []

        //check if product at cart exist in inventory products
        for (let i = 0; i < products.length; i++) {

            let currentDate = currentTime

            let discount = products[i].hasDiscount

            let productAtCart = await this.getProductAtCart(products[i]._id)

            if (!productAtCart) {
                return res.status(HttpStatus.BAD_REQUEST).send(
                    responser.error("Beberapa Produk Dalam Keranjang Anda, Sudah Tidak Tersedia. Mohon Cek Ketersediaan Barang", HttpStatus.BAD_REQUEST))
            }

            if (products[i].status.toLowerCase() !== "active") {
                return res.status(HttpStatus.BAD_REQUEST).send(
                    responser.error(`Produk ${products[i].name} Sedang Tidak Tidak Tersedia`, HttpStatus.BAD_REQUEST))
            }

            if (products[i].stock < 0) {
                return res.status(HttpStatus.BAD_REQUEST).send(
                    responser.error(`Produk ${products[i].name} Kehabisan Persediaan`, HttpStatus.BAD_REQUEST))
            }

            let promo = products[i].hasPromo

            if (promo) {

                for (let j = 0; j < promo.length; j++) {

                    if (promo[j].promoStart < currentDate && promo[j].promoEnd > currentDate) {

                        if (promo[j].promoBy === "percent") {

                            let promoPrice = (promo[j].promoValue / 100) * products[i].price
                            let priceAfterPromo = products[i].price - promoPrice
                            calculateItem += priceAfterPromo * productAtCart[0]['products'][0].quantity

                        } else if (promo[j].promoBy === "price") {

                            calculateItem += (productAtCart[0]['products'][0].quantity + promo[j].promoValue) * products[i].price

                        }
                    }
                }
            }
            else if (discount.isDiscount && !promo) {

                if (discount.discountStart > currentDate && discount.discountEnd < currentDate) {

                    if (discount.discountBy === "percent") {

                        let discountPrice = (discount.discount / 100) * products[i].price
                        let priceAfterDiscount = products[i].price - discountPrice
                        calculateItem += priceAfterDiscount * productAtCart[0]['products'][0].quantity

                    } else if (discount.discountBy === "price") {

                        calculateItem += (productAtCart[0]['products'][0].quantity + discount.discount) * products[i].price

                    }
                } else {

                    calculateItem += products[i].price * productAtCart[0]['products'][0].quantity
                }

            }
            else {

                calculateItem += products[i].price * productAtCart[0]['products'][0].quantity

            }

            products[i].quantity = productAtCart[0]['products'][0].quantity
            products[i].note = productAtCart[0]['products'][0].note

            allProducts.push(products[i])

            objectProduct.push({
                product: products[i]._id,
                details: {
                    grand_price: calculateItem[i],
                    quantity: productAtCart[0]['products'][0].quantity,
                    note: productAtCart[0]['products'][0].note
                }
            })
        }

        // try {

        let type = req.body.type || ""
        let platform = req.body.platform || ""
        let isActive = req.body.isActive || true

        let charges = await this.getAllCharge(type, platform, isActive)

        let chargesObjectIds = []

        const calculateCharge = charges.reduce((accumulator, charge) => {

            if (charge.chargeBy === "price") {
                chargesObjectIds.push(charge._id)
                return accumulator + parseInt(charge.chargeValue)
            }
            // else if (charge.chargeBy === "percent") {
            //     return accumulator + ((charge.chargeValue / 100) * calculateItem)
            // }
            else {
                chargesObjectIds.push(charge._id)
                return accumulator
            }
        }, 0)

        let voucherNotValid = []

        let vouchers = []

        let allVouchers = req.body.vouchers || []

        if (allVouchers && allVouchers > 0) {

            for (let i = 0; i < allVouchers.length; i++) {

                let isVoucherExist = await this.isVoucherExist(allVouchers[i], "id")

                if (!isVoucherExist && isVoucherExist === null) {

                    voucherNotValid.push(`Salah satu voucher tidak dapat digunakan, mungkin telah kadaluarsa`)

                    continue
                }

                var currentDate = currentTime

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

                vouchers.push(isVoucherExist)

            }
        }

        let checkIfCheckoutIsExist = await CheckoutModel.findOne({
            user: req.body.user_id
        })

        if (checkIfCheckoutIsExist) {
            await CheckoutModel.deleteOne({
                user: req.body.user_id
            })
        }

        let saveCheckout = new CheckoutModel({
            cart_id: req.body.cart.cart_id,
            items: objectProduct,
            baseTotal: calculateItem + calculateCharge,
            subTotalProduct: calculateItem,
            subTotalCharges: calculateCharge,
            charges: chargesObjectIds,
            platform: [req.body.platform],
            user: req.body.user_id,
        })

        await saveCheckout.save()

        let newCheckout = await CheckoutModel.findOne({
            user: req.body.user_id
        }).lean().populate([
            { path: 'charges' },
            {
                path: 'items.product',
                populate: {
                    path: 'category'
                },
                populate: {
                    path: 'hasPromo'
                },
            },
            { path: 'user' },
        ])

        newCheckout.user.otpEmail = undefined

        newCheckout.user.otpSms = undefined

        newCheckout.user.password = undefined

        newCheckout.vouchers = vouchers

        newCheckout.voucherNotValid = voucherNotValid

        return res.status(HttpStatus.OK).send(responser.success(newCheckout, HttpStatus.OK));

        // } catch (error) {
        //     return res.status(HttpStatus.BAD_REQUEST).send(responser.validation("Tidak Dapat Checkout", HttpStatus.BAD_REQUEST))
        // }

    }

    async applyVoucher(req, res) {

        const { error } = applyVoucherValidation(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        let isUserIdValid = await this.isIdValid(req.body.user_id)

        if (!isUserIdValid) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error("ID User Tidak Valid", HttpStatus.BAD_REQUEST))
        }

        let checkoutObject = await CheckoutModel.findOne({
            user: req.body.user_id
        })

        if (!checkoutObject) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error("Belum Ada Barang Untuk Diterapkan Voucher", HttpStatus.BAD_REQUEST))
        }

        if (req.user.user._id !== req.body.user_id) {
            return res.status(HttpStatus.UNAUTHORIZED).send(
                responser.error("Pengguna Tidak Sama Dengan Sesi Login Saat Ini", HttpStatus.UNAUTHORIZED))
        }

        let isVoucherExist = await this.isVoucherExist(req.body.voucherCode, "code")

        if (!isVoucherExist) {
            return res.status(HttpStatus.NOT_FOUND).send(
                responser.error("Voucher Tidak Valid", HttpStatus.NOT_FOUND))
        }

        let currentDate = currentTime

        if (!isVoucherExist.isActive) {
            return res.status(HttpStatus.OK).send(
                responser.error("Voucher Tidak Aktif", HttpStatus.OK))
        }

        if (isVoucherExist.discountStart > currentDate) {
            return res.status(HttpStatus.OK).send(
                responser.error("Voucher Belum Aktif", HttpStatus.OK))
        }

        if (isVoucherExist.discountEnd < currentDate) {
            return res.status(HttpStatus.OK).send(
                responser.error("Voucher Kadaluarsa", HttpStatus.OK))
        }

        let platform = await isVoucherExist.platform.map(value => {
            if (value === "all") {
                return true
            } else if (value.toLowerCase() === req.body.platform.toLowerCase()) {
                return true
            } else {
                return false
            }
        })

        // if (isVoucherExist.discountBy === "percent") {
        //     let priceAfterDiscount = (isVoucherExist.discountValue / 100) * checkoutObject.baseTotal
        //     discountValue = priceAfterDiscount
        //     afterPrice = checkoutObject.baseTotal - priceAfterDiscount

        // } else if (isVoucherExist.discountBy === "price") {
        //     afterPrice = checkoutObject.baseTotal - isVoucherExist.discountValue
        //     discountValue = isVoucherExist.discountValue
        // }

        if (!platform) {

            return res.status(HttpStatus.OK).send(
                responser.error(`Voucher Tidak Dapat Digunakan Diperangkat Ini`, HttpStatus.OK))
        }

        if (isVoucherExist.isPrivate.private) {
            let isUserExist = isVoucherExist.isPrivate.users.filter(user => user === req.body.user_id)

            if (isUserExist.length <= 0) {

                return res.status(HttpStatus.OK).send(
                    responser.error(`Voucher Ini Private, Tidak Dapat Digunakan Oleh Anda`, HttpStatus.OK))
            }
        }

        if (isVoucherExist.minimumOrderValue > checkoutObject.subTotalProduct) {

            return res.status(HttpStatus.OK).send(
                responser.error(`Belum Mencapai Minimum Belanja`, HttpStatus.OK))
        }

        return res.status(HttpStatus.OK).send(responser.success(isVoucherExist, "OK"));

    }

    // async removeVoucher(req, res) {

    //     const { error } = removeVoucherValidation(req.body)

    //     if (error) {
    //         return res.status(HttpStatus.BAD_REQUEST).send(
    //             responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
    //     }

    //     let isUserIdValid = await this.isIdValid(req.body.user_id)

    //     if (!isUserIdValid) {
    //         return res.status(HttpStatus.BAD_REQUEST).send(
    //             responser.error("User Tidak Valid", HttpStatus.BAD_REQUEST))
    //     }

    //     let isVoucherValid = await this.isIdValid(req.body.voucher_id)

    //     if (!isVoucherValid) {
    //         return res.status(HttpStatus.BAD_REQUEST).send(
    //             responser.error("Voucher Tidak Valid", HttpStatus.BAD_REQUEST))
    //     }

    //     if (req.user.user._id !== req.body.user_id) {
    //         return res.status(HttpStatus.UNAUTHORIZED).send(
    //             responser.error("Pengguna Tidak Sama Dengan Sesi Login Saat Ini", HttpStatus.UNAUTHORIZED))
    //     }

    //     let checkoutObject = await CheckoutModel.findOne({
    //         user: req.body.user_id
    //     })

    //     let isVoucherExistAtCheckout = checkoutObject.vouchersApplied.includes(req.body.voucher_id)

    //     if (!isVoucherExistAtCheckout) {
    //         return res.status(HttpStatus.BAD_REQUEST).send(
    //             responser.error("Voucher Belum Diterapkan", HttpStatus.BAD_REQUEST))
    //     }

    //     if (!checkoutObject) {
    //         return res.status(HttpStatus.BAD_REQUEST).send(
    //             responser.error("Belum Ada Barang Untuk Diterapkan Voucher", HttpStatus.BAD_REQUEST))
    //     }

    //     let isVoucherExist = await this.isVoucherExist(req.body.voucher_id, "id")

    //     if (!isVoucherExist) {
    //         return res.status(HttpStatus.NOT_FOUND).send(
    //             responser.error("Voucher Tidak Valid", HttpStatus.NOT_FOUND))
    //     }

    //     let afterPrice = 0

    //     if (isVoucherExist.discountBy === "percent") {
    //         afterPrice = (isVoucherExist.discountValue / 100) * checkoutObject.subTotalProduct

    //     } else if (isVoucherExist.discountBy === "price") {
    //         afterPrice = isVoucherExist.discountValue
    //     }

    //     let objectCheckout = {
    //         grandTotal: checkoutObject.grandTotal + afterPrice,
    //         subTotalVoucher: checkoutObject.subTotalVoucher - afterPrice,
    //         vouchersApplied: []
    //     }

    //     if (objectCheckout.vouchersApplied.length > 0) {

    //         let indexVoucher = checkoutObject.vouchersApplied.indexOf(req.body.voucher_id)

    //         let newVouchers = checkoutObject.vouchersApplied.splice(indexVoucher, 1);

    //         objectCheckout.vouchersApplied = newVouchers
    //     } else {
    //         objectCheckout.vouchersApplied = []
    //     }

    //     const checkout = await CheckoutModel.findOneAndUpdate(
    //         checkoutObject._id, {
    //         $set: objectCheckout
    //     }, {
    //         new: true
    //     }).select({
    //         cart_id: 1,
    //         items: 1,
    //         baseTotal: 1,
    //         grandTotal: 1,
    //         subTotalProduct: 1,
    //         subTotalCharges: 1,
    //         subTotalVoucher: 1,
    //         charges: 1,
    //         vouchersApplied: 1,
    //         platform: 1,
    //         user: 1
    //     }).populate(['charges', 'items.product', 'user', 'vouchersApplied'])

    //     return res.status(HttpStatus.OK).send(responser.success(checkout, "Voucher Dilepas"));
    // }

    async getProductAtCart(productId) {

        const products = await CartModel.find({
            "products._id": productId
        }, {
            'products.$': true
        })

        return products

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

        var currentDate = currentTime

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