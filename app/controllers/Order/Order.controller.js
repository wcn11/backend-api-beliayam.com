
const mongoose = require('mongoose');
const CheckoutModel = require('@model/checkout/checkout.model')
const ChargeModel = require('@model/charge/charge.model')
const VoucherModel = require('@model/voucher/voucher.model')
const UserModel = require('@model/user/user.model')
const HttpStatus = require('@helper/http_status')
const responser = require('@responser')
const PaymentGateway = require('@service/PaymentGateway')

const crypto = require('crypto');

const moment = require('moment')
moment.locale('id-ID');

const redis = require("redis");

const {
    placeOrderValidation,
    // applyVoucherValidation,
    // removeVoucherValidation
} = require('@validation/order/order.validation')

const client = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
})

const OrderController = class OrderController {

    async placeOrder(req, res) {

        const { error } = placeOrderValidation(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        const currentTime = moment().add(7, 'hour').toDate()

        let isUserValid = await this.isIdValid(req.body.user_id)

        if (!isUserValid) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error("Pengguna Tidak Valid", HttpStatus.BAD_REQUEST)
            );
        }

        let user = await this.getUserById(req.body.user_id)

        if (!user) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error("Pengguna Tidak Ditemukan", HttpStatus.BAD_REQUEST)
            );
        }

        user.otpEmail = undefined

        user.otpSms = undefined

        user.password = undefined

        user.addresses = undefined

        if (req.user.user._id !== req.body.user_id) {
            return res.status(HttpStatus.UNAUTHORIZED).send(
                responser.error("Pengguna Tidak Sama Dengan Sesi Login Saat Ini", HttpStatus.UNAUTHORIZED))
        }

        const address = await this.getAddressByAddressIdAndUserId(req.body.user_id, req.body.shipping_address)

        if (address.length <= 0) {
            return res.status(HttpStatus.NOT_FOUND).send(
                responser.error(`Harap Memilih Alamat Pengiriman`, HttpStatus.NOT_FOUND))
        }

        const isPaymentGatewayExist = await this.checkPaymentGateway(req.body.payment)

        if (isPaymentGatewayExist.error) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error(isPaymentGatewayExist.message, HttpStatus.BAD_REQUEST))
        }

        if (req.body.type.toLowerCase() !== 'order') {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error(`Type: ${req.body.type}, Not Match With Action`, HttpStatus.BAD_REQUEST))
        }

        let checkout = await CheckoutModel.findOne({
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

        const url = "/cvr/300011/10"

        let now = moment().format('YYYY-MM-DD HH:mm:ss').toString()

        let later = moment().add(1, 'hour').format('YYYY-MM-DD HH:mm:ss')

        let nowDateLocale = moment().add(7, 'hour').toDate()

        const bill_no = "0000000001"

        const bill_ref = bill_no

        const postDataObject = {
            "request": "Request Payment Transaction",
            "merchant_id": process.env.FASPAY_MERCHANT_ID,
            "merchant": process.env.FASPAY_MERCHANT_NAME,
            "bill_no": bill_no,
            "bill_reff": "0000000001",
            "bill_date": now,
            "bill_expired": later,
            "bill_desc": "Pembayaran #" + bill_ref,
            "bill_currency": "IDR",
            "bill_gross": "0",
            "bill_miscfee": "0",
            "bill_total": 0,
            "cust_no": user._id,
            "cust_name": user.name || "",
            "payment_channel": req.body.payment.pg_code,
            "pay_type": "01",
            "bank_userid": "",
            "msisdn": user.phone,
            "email": user.email || "",
            "terminal": "10",
            "billing_name": user.name,
            "billing_lastname": "",
            "billing_address": address[0].address.address1,
            "billing_address_city": address[0].address.city,
            "billing_address_region": address[0].address.state,
            "billing_address_state": "Indonesia",
            "billing_address_poscode": address[0].address.postcode,
            "billing_msisdn": user.phone,
            "billing_address_country_code": "ID",
            "receiver_name_for_shipping": user.name,
            "shipping_lastname": "",
            "shipping_address": address[0].address.address1,
            "shipping_address_city": address[0].address.city,
            "shipping_address_region": address[0].address.state,
            "shipping_address_state": "Indonesia",
            "shipping_address_poscode": address[0].address.postcode,
            "shipping_msisdn": address[0].address.phone,
            "shipping_address_country_code": "ID",
            "item": [],
            "reserve1": "",
            "reserve2": "",
            "signature": ""
        }

        try {

            let base_total_products = 0

            const items = checkout.items

            for (let i = 0; i < items.length; i++) {

                let promo = items[i].product.hasPromo

                let discount = items[i].product.hasDiscount

                switch (promo) {
                    case promo.length > 0:
                        for (let j = 0; j < promo.length; j++) {

                            if (promo[j].promoStart < nowDateLocale && promo[j].promoEnd > nowDateLocale) {

                                let price = 0

                                if (promo[j].promoBy === "percent") {

                                    let promoPrice = (promo[j].promoValue / 100) * items[i].product.price
                                    let priceAfterPromo = items[i].product.price - promoPrice
                                    price = priceAfterPromo * items[i].details.quantity

                                } else if (promo[j].promoBy === "price") {

                                    price = (items[i].details.quantity + promo[j].promoValue) * items[i].product.price

                                }

                                let priceConcat = price + '00'

                                base_total_products += price

                                postDataObject.item.push({
                                    "id": items[i].product._id,
                                    "product": items[i].product.name,
                                    "qty": items[i].details.quantity,
                                    "amount": parseInt(priceConcat),
                                    "payment_plan": "01",
                                    "merchant_id": process.env.FASPAY_MERCHANT_ID,
                                    "tenor": "00"
                                })
                                break
                            }
                        }
                    case promo.length <= 0 && discount.isDiscount === true:

                        if (discount.discountStart > nowDateLocale && discount.discountEnd < nowDateLocale) {

                            let price = 0

                            if (discount.discountBy === "percent") {

                                let discountPrice = (discount.discount / 100) * items[i].product.price
                                let priceAfterDiscount = items[i].product.price - discountPrice
                                price = priceAfterDiscount * items[i].details.quantity

                            } else if (discount.discountBy === "price") {

                                price = (items[i].details.quantity + discount.discount) * items[i].product.price

                            }

                            let priceConcat = price + '00'

                            base_total_products += price

                            postDataObject.item.push({
                                "id": items[i].product._id,
                                "product": items[i].product.name,
                                "qty": items[i].details.quantity,
                                "amount": parseInt(priceConcat),
                                "payment_plan": "01",
                                "merchant_id": process.env.FASPAY_MERCHANT_ID,
                                "tenor": "00"
                            })
                        } else {

                            let price = items[i].product.price * items[i].details.quantity

                            let priceConcat = price + '00'

                            base_total_products += price

                            postDataObject.item.push({
                                "id": items[i].product._id,
                                "product": items[i].product.name,
                                "qty": items[i].details.quantity,
                                "amount": parseInt(priceConcat),
                                "payment_plan": "01",
                                "merchant_id": process.env.FASPAY_MERCHANT_ID,
                                "tenor": "00"
                            })
                        }
                        break;
                    default:

                        let price = items[i].product.price * items[i].details.quantity

                        let priceConcat = price + '00'

                        base_total_products += price

                        postDataObject.item.push({
                            "id": items[i].product._id,
                            "product": items[i].product.name,
                            "qty": items[i].details.quantity,
                            "amount": parseInt(priceConcat),
                            "payment_plan": "01",
                            "merchant_id": process.env.FASPAY_MERCHANT_ID,
                            "tenor": "00"
                        })

                        break

                }
            }

            let sub_total = 0

            let sub_total_voucher = 0

            const vouchers = req.body.vouchers

            for (let i = 0; i < vouchers.length; i++) {

                let isVoucherValid = await this.isIdValid(vouchers[i])

                if (!isVoucherValid) {
                    return res.status(HttpStatus.BAD_REQUEST).send(
                        responser.error("Voucher Tidak Valid", HttpStatus.BAD_REQUEST)
                    );
                }

                let isVoucherExist = await this.isVoucherExist(vouchers[i], "id")

                if (!isVoucherExist.isActive) {
                    return res.status(HttpStatus.OK).send(
                        responser.error(`Voucher '${isVoucherExist.voucherName}' Sudah Tidak Aktif`, HttpStatus.OK))
                }

                if (isVoucherExist.discountStart > currentTime) {
                    return res.status(HttpStatus.OK).send(
                        responser.error(`Voucher '${isVoucherExist.voucherName}' Belum Aktif`, HttpStatus.OK))
                }

                if (isVoucherExist.discountEnd < currentTime) {
                    return res.status(HttpStatus.OK).send(
                        responser.error(`Voucher '${isVoucherExist.voucherName}' Telah Kadaluarsa`, HttpStatus.OK))
                }

                if (isVoucherExist.minimumOrderValue > base_total_products) {

                    return res.status(HttpStatus.OK).send(
                        responser.error(`Voucher Tidak Dapat Digunakan. Belum Mencapai Minimal Belanja`, HttpStatus.OK))
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

                if (isVoucherExist.discountBy === "percent") {
                    let priceAfterDiscount = (isVoucherExist.discountValue / 100) * base_total_products
                    discountValue = priceAfterDiscount
                    sub_total += base_total_products - priceAfterDiscount
                    sub_total_voucher += priceAfterDiscount


                } else if (isVoucherExist.discountBy === "price") {
                    let afterPrice = base_total_products - isVoucherExist.discountValue
                    sub_total += afterPrice
                    sub_total_voucher += afterPrice
                }

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
            }

            let charges = await this.getAllCharge()

            let sub_total_charge = 0

            await charges.reduce(async (accumulator, charge) => {

                let platform = await charge.platform.map(value => {
                    if (value === "all") {
                        return true
                    } else if (value.toLowerCase() === req.body.platform.toLowerCase()) {
                        return true
                    } else {
                        return false
                    }
                })[0]

                if (platform) {

                    if (charge.chargeBy.toLowerCase() === "price") {
                        sub_total_charge += (accumulator + parseInt(charge.chargeValue))
                        return accumulator

                    }
                    // else if (charge.chargeBy === "percent") {
                    //     return accumulator + ((charge.chargeValue / 100) * calculateItem)
                    // }
                    else {
                        sub_total_charge += (accumulator + parseInt(charge.chargeValue))
                        return accumulator
                    }

                }
            }, 0)

            const grand_total = sub_total_charge + sub_total

            const grand_total_concat = grand_total + '00'

            postDataObject.bill_total = grand_total_concat

            const md5 = crypto.createHash('md5', process.env.SIGNATURE_SECRET)
                .update(process.env.FASPAY_USER_ID + process.env.FASPAY_PASSWORD + bill_no)
                .digest('hex')

            const signature = crypto.createHash('sha1', process.env.SIGNATURE_SECRET)
                .update(md5)
                .digest('hex')

            postDataObject.signature = signature

            const paymentGateway = await PaymentGateway.send(url, postDataObject)

            address[0].address.receiver_name = user.name

            const objectResponse = {
                "payment": {
                    "pg_code": isPaymentGatewayExist.data.pg_code,
                    "pg_name": isPaymentGatewayExist.data.pg_name,
                    "type": isPaymentGatewayExist.data.type
                },
                "bill": {
                    "bill_no": bill_no,
                    "bill_reff": bill_ref,
                    "bill_date": now,
                    "bill_expired": later,
                    "bill_desc": "Pembayaran #" + bill_ref,
                    "bill_total": grand_total,
                    "bill_items": items
                },
                "response": {
                    "trx_id": paymentGateway.trx_id,
                    "bill_no": paymentGateway.bill_no,
                    "merchant_id": paymentGateway.merchant_id,
                    "merchant": paymentGateway.merchant,
                    "response_code": paymentGateway.response_code,
                    "response_desc": paymentGateway.response_desc,
                    "redirect_url": paymentGateway.redirect_url
                },
                "user": user,
                "shipping_address": address[0].address
            }

            return res.status(HttpStatus.OK).send(responser.success(objectResponse, HttpStatus.OK));
        } catch (err) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(
                responser.error(`Tidak Dapat Melakukan Pembayaran, Harap Coba Kembali`, HttpStatus.INTERNAL_SERVER_ERROR))
        }
    }

    async getAddressByAddressIdAndUserId(user_id, address_id) {

        let address = await UserModel.aggregate([
            {
                $match: {
                    "addresses._id": address_id,
                    "addresses.user_id": user_id,
                }
            },
            { $unwind: "$addresses" },
            {
                $group: {
                    "_id": "$_id",
                    address: {
                        $first: "$addresses"
                    }
                }
            }
        ])

        return address
    }

    async checkPaymentGateway(data) {

        const paymentChannelList = await PaymentGateway.getListOfPaymentChannels()

        let paymentExist = {
            error: true,
            message: `Unknown Payment Channel: ${data.pg_code}`,
            data: {
                pg_code: 0,
                pg_name: "",
                type: "",
            }
        }

        for (let i = 0; i < paymentChannelList.length; i++) {

            if (parseInt(paymentChannelList[i].pg_code) === data.pg_code) {

                // if (paymentChannelList[i].pg_name.toLowerCase() !== data.pg_name.toLowerCase()) {
                //     paymentExist = {
                //         error: true,
                //         message: `Unknown Payment Gateway Name: ${data.pg_name}`
                //     }

                //     break
                // }

                if (paymentChannelList[i].type.toLowerCase() !== data.type.toLowerCase()) {
                    paymentExist = {
                        error: true,
                        message: `Unknown Payment Gateway For '${paymentChannelList[i].pg_name}', With Type: ${data.type}`,
                        data: {
                            pg_code: 0,
                            pg_name: "",
                            type: "",
                        }
                    }

                    break
                }

                paymentExist = {
                    error: false,
                    message: "",
                    data: {
                        pg_code: paymentChannelList[i].pg_code,
                        pg_name: paymentChannelList[i].pg_name,
                        type: paymentChannelList[i].type,
                    }
                }

                break
            }

        }

        return paymentExist

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

    async getUserById(userId) {

        let user = await UserModel.findOne({
            _id: userId
        })

        return user
    }

    async isIdValid(id) {
        if (mongoose.isValidObjectId(id)) {
            return true
        }
        return false
    }

    // async getUserCheckoutData(req, res) {
    //     let user = req.user.user

    //     let checkIfCheckoutIsExist = await CheckoutModel.findOne({
    //         user: user._id
    //     }).populate(['charges', 'items.product', 'user', 'vouchersApplied'])

    //     if (!checkIfCheckoutIsExist) {
    //         return res.status(HttpStatus.NOT_FOUND).send(
    //             responser.error("Anda Belum Memilih Barang Untuk Dibayarkan", HttpStatus.NOT_FOUND))
    //     }

    //     return res.status(HttpStatus.OK).send(responser.success(checkIfCheckoutIsExist, HttpStatus.OK));

    // }

    // async calculateCheckout(req, res) {

    //     const { error } = calculateCheckoutValidation(req.body)

    //     if (error) {
    //         return res.status(HttpStatus.BAD_REQUEST).send(
    //             responser.error(error.details[0].message, HttpStatus.BAD_REQUEST))
    //     }

    //     let isValid = await this.isIdValid(req.body.cart.cart_id)

    //     if (!isValid) {
    //         return res.status(HttpStatus.BAD_REQUEST).send(
    //             responser.error("ID Keranjang Tidak Valid", HttpStatus.BAD_REQUEST)
    //         );
    //     }

    //     let isCartExist = await this.isCartExist(req.body.cart.cart_id)

    //     if (!isCartExist) {
    //         return res.status(HttpStatus.BAD_REQUEST).send(
    //             responser.error("Keranjang Tidak Ditemukan", HttpStatus.BAD_REQUEST))
    //     }

    //     let isUserValid = await this.isIdValid(req.body.user_id)

    //     if (!isUserValid) {
    //         return res.status(HttpStatus.BAD_REQUEST).send(
    //             responser.error("ID Pelanggan Tidak Valid", HttpStatus.BAD_REQUEST)
    //         );
    //     }

    //     const user = await this.getUserById(req.body.user_id)

    //     if (user.addresses.length <= 0) {
    //         return res.status(HttpStatus.BAD_REQUEST).send(
    //             responser.error("Memiliki 1 Alamat Minimal Untuk Pengiriman", HttpStatus.BAD_REQUEST))
    //     }

    //     if (!user.isEmailVerified && !user.isPhoneVerified) {
    //         return res.status(HttpStatus.BAD_REQUEST).send(
    //             responser.error("Untuk Melanjutkan Checkout, Harap Mem-verifikasi Alamat Email", HttpStatus.BAD_REQUEST))
    //     }

    //     if (!user.isPhoneVerified) {
    //         return res.status(HttpStatus.BAD_REQUEST).send(
    //             responser.error("Untuk Melanjutkan Checkout, Harap Mem-verifikasi Nomor Telepon Anda", HttpStatus.BAD_REQUEST))
    //     }

    //     //check product on real inventory
    //     let products = await this.getProductByProductId(req.body.cart.products)

    //     if (!products && products.length !== req.body.cart.products.length) {
    //         return res.status(HttpStatus.BAD_REQUEST).send(
    //             responser.error("Beberapa Produk Dalam Keranjang Anda, Sudah Tidak Tersedia", HttpStatus.BAD_REQUEST))
    //     }

    //     let calculateItem = 0
    //     let allProducts = []
    //     let objectProduct = []

    //     //check if product at cart exist in inventory products
    //     // await isProductExist.map(async (product) => {
    //     for (let i = 0; i < products.length; i++) {

    //         let currentDate = moment().toDate();

    //         let discount = products[i].hasDiscount

    //         let productAtCart = await this.getProductAtCart(products[i]._id)

    //         if (!productAtCart) {
    //             return res.status(HttpStatus.BAD_REQUEST).send(
    //                 responser.error("Beberapa Produk Dalam Keranjang Anda, Sudah Tidak Tersedia. Mohon Cek Ketersediaan Barang", HttpStatus.BAD_REQUEST))
    //         }

    //         if (products[i].status.toLowerCase() !== "active") {
    //             return res.status(HttpStatus.BAD_REQUEST).send(
    //                 responser.error(`Produk ${products[i].name} Sedang Tidak Tidak Tersedia`, HttpStatus.BAD_REQUEST))
    //         }

    //         if (products[i].stock < 0) {
    //             return res.status(HttpStatus.BAD_REQUEST).send(
    //                 responser.error(`Produk ${products[i].name} Kehabisan Persediaan`, HttpStatus.BAD_REQUEST))
    //         }

    //         if (discount.isDiscount) {

    //             if (discount.discountStart > currentDate && discount.discountEnd < currentDate) {

    //                 if (discount.discountBy === "percent") {

    //                     let discountPrice = (discount.discount / 100) * products[i].price
    //                     let priceAfterDiscount = products[i].price - discountPrice
    //                     calculateItem += priceAfterDiscount * productAtCart[0]['products'][0].quantity

    //                 } else if (discount.discountBy === "price") {

    //                     calculateItem += (productAtCart[0]['products'][0].quantity * products[i].price)

    //                 }
    //             } else {

    //                 calculateItem += products[i].price * productAtCart[0]['products'][0].quantity
    //             }

    //         } else {

    //             // add more math for promo on product
    //             calculateItem += products[i].price * productAtCart[0]['products'][0].quantity

    //         }

    //         products[i].quantity = productAtCart[0]['products'][0].quantity
    //         products[i].note = productAtCart[0]['products'][0].note

    //         allProducts.push(products[i])

    //         objectProduct.push({
    //             product: products[i]._id,
    //             details: {
    //                 grand_price: calculateItem[i],
    //                 quantity: productAtCart[0]['products'][0].quantity,
    //                 note: productAtCart[0]['products'][0].note
    //             }
    //         })
    //     }

    //     try {

    //         let type = req.body.type || ""
    //         let platform = req.body.platform || ""
    //         let isActive = req.body.isActive || true

    //         let charges = await this.getAllCharge(type, platform, isActive)

    //         let chargesObjectIds = []

    //         const calculateCharge = charges.reduce((accumulator, charge) => {

    //             if (charge.chargeBy === "price") {
    //                 chargesObjectIds.push(charge._id)
    //                 return accumulator + parseInt(charge.chargeValue)
    //             }
    //             // else if (charge.chargeBy === "percent") {
    //             //     return accumulator + ((charge.chargeValue / 100) * calculateItem)
    //             // }
    //             else {
    //                 chargesObjectIds.push(charge._id)
    //                 return accumulator
    //             }
    //         }, 0)

    //         let voucherNotValid = []

    //         let vouchersApplied = []

    //         let vouchersAppliedId = []

    //         let subTotalVoucher = 0

    //         let allVouchers = req.body.vouchers

    //         for (let i = 0; i < allVouchers.length; i++) {

    //             let isVoucherExist = await this.isVoucherExist(allVouchers[i], "id")

    //             if (!isVoucherExist && isVoucherExist === null) {

    //                 voucherNotValid.push(`Salah satu voucher tidak dapat digunakan, mungkin telah kadaluarsa`)

    //                 continue
    //             }

    //             var currentDate = moment().toDate();

    //             if (isVoucherExist.discountStart > currentDate) {

    //                 let voucherName = isVoucherExist.voucherName ?? 'Anda'

    //                 voucherNotValid.push(`Voucher ${voucherName} Belum Aktif`)

    //                 continue
    //             }

    //             if (isVoucherExist.discountEnd < currentDate) {

    //                 let voucherName = isVoucherExist.voucherName ?? "Anda"

    //                 voucherNotValid.push(`Voucher ${voucherName} Telah Kadaluarsa`)

    //                 continue
    //             }

    //             if (isVoucherExist.isPrivate.private) {

    //                 let isUserExist = isVoucherExist.isPrivate.users.indexOf(req.body.user_id) != -1

    //                 let voucherName = isVoucherExist.voucherName ?? "ini Khusus"

    //                 if (!isUserExist) {

    //                     voucherNotValid.push(`Voucher ${voucherName}, Bersifat Private. Tidak Dapat Digunakan Oleh Anda`)

    //                     continue
    //                 }
    //             }

    //             vouchersApplied.push(isVoucherExist)
    //             vouchersAppliedId.push(isVoucherExist._id)

    //             if (isVoucherExist.discountBy === "percent") {
    //                 subTotalVoucher += (isVoucherExist.discountValue / 100) * calculateItem
    //             } else if (isVoucherExist.discountBy === "price") {
    //                 subTotalVoucher += isVoucherExist.discountValue
    //             }

    //         }

    //         let grandTotal = (calculateItem + calculateCharge) - subTotalVoucher

    //         let checkIfCheckoutIsExist = await CheckoutModel.findOne({
    //             user: req.body.user_id
    //         })

    //         if (checkIfCheckoutIsExist) {
    //             await CheckoutModel.deleteOne({
    //                 user: req.body.user_id
    //             })
    //         }

    //         let productObject = {
    //             cart_id: req.body.cart.cart_id,
    //             items: objectProduct,
    //             baseTotal: calculateItem + calculateCharge,
    //             grandTotal,
    //             subTotalProduct: calculateItem,
    //             subTotalCharges: calculateCharge,
    //             subTotalVoucher,
    //             charges: chargesObjectIds,
    //             vouchersApplied: vouchersAppliedId,
    //             platform: [req.body.platform],
    //             user: req.body.user_id,
    //         }

    //         let saveCheckout = new CheckoutModel(productObject)

    //         await saveCheckout.save()

    //         let newCheckout = await CheckoutModel.findOne({
    //             user: req.body.user_id
    //         }).populate(['charges', 'items.product', 'user', 'vouchersApplied'])

    //         return res.status(HttpStatus.OK).send(responser.success(newCheckout, HttpStatus.OK));

    //     } catch (error) {
    //         return res.status(HttpStatus.BAD_REQUEST).send(responser.validation("Tidak Dapat Checkout", HttpStatus.BAD_REQUEST))
    //     }

    // }

    // async getProductAtCart(productId) {

    //     const products = await CartModel.find({
    //         "products._id": productId
    //     }, {
    //         'products.$': true
    //     })

    //     return products

    // }

    // async getProductByProductId(product_ids = []) {

    //     return await ProductModel.find({
    //         "_id": {
    //             $in: product_ids
    //         }
    //     })
    // }

    // async applyVoucher(req, res) {

    //     const { error } = applyVoucherValidation(req.body)

    //     if (error) {
    //         return res.status(HttpStatus.BAD_REQUEST).send(
    //             responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
    //     }

    //     let isUserIdValid = await this.isIdValid(req.body.user_id)

    //     if (!isUserIdValid) {
    //         return res.status(HttpStatus.BAD_REQUEST).send(
    //             responser.error("ID User Tidak Valid", HttpStatus.BAD_REQUEST))
    //     }

    //     let checkoutObject = await CheckoutModel.findOne({
    //         user: req.body.user_id
    //     })

    //     if (!checkoutObject) {
    //         return res.status(HttpStatus.BAD_REQUEST).send(
    //             responser.error("Belum Ada Barang Untuk Diterapkan Voucher", HttpStatus.BAD_REQUEST))
    //     }

    //     if (checkoutObject.vouchersApplied.length >= 1) {
    //         return res.status(HttpStatus.OK).send(
    //             responser.error("Hanya 1 Voucher Yang Dapat Digunakan", HttpStatus.OK))
    //     }

    //     if (req.user.user._id !== req.body.user_id) {
    //         return res.status(HttpStatus.UNAUTHORIZED).send(
    //             responser.error("Pengguna Tidak Sama Dengan Sesi Login Saat Ini", HttpStatus.UNAUTHORIZED))
    //     }

    //     let isVoucherExist = await this.isVoucherExist(req.body.voucherCode, "code")

    //     if (!isVoucherExist) {
    //         return res.status(HttpStatus.NOT_FOUND).send(
    //             responser.error("Voucher Tidak Valid", HttpStatus.NOT_FOUND))
    //     }

    //     let isVoucherExistAtCheckout = checkoutObject.vouchersApplied.includes(isVoucherExist._id)

    //     if (isVoucherExistAtCheckout) {
    //         return res.status(HttpStatus.BAD_REQUEST).send(
    //             responser.error("Anda Memasukkan Voucher Yang Sama", HttpStatus.BAD_REQUEST))
    //     }

    //     var currentDate = moment().toDate();

    //     if (!isVoucherExist.isActive) {
    //         return res.status(HttpStatus.OK).send(
    //             responser.error("Voucher Tidak Aktif", HttpStatus.OK))
    //     }

    //     if (isVoucherExist.discountStart > currentDate) {
    //         return res.status(HttpStatus.OK).send(
    //             responser.error("Voucher Belum Aktif", HttpStatus.OK))
    //     }

    //     if (isVoucherExist.discountEnd < currentDate) {
    //         return res.status(HttpStatus.OK).send(
    //             responser.error("Voucher Kadaluarsa", HttpStatus.OK))
    //     }

    //     let platform = await isVoucherExist.platform.map(value => {
    //         if (value === "all") {
    //             return true
    //         } else if (value.toLowerCase() === req.body.platform.toLowerCase()) {
    //             return true
    //         } else {
    //             return false
    //         }
    //     })

    //     let afterPrice = 0
    //     let discountValue = 0

    //     if (isVoucherExist.discountBy === "percent") {
    //         let priceAfterDiscount = (isVoucherExist.discountValue / 100) * checkoutObject.baseTotal
    //         discountValue = priceAfterDiscount
    //         afterPrice = checkoutObject.baseTotal - priceAfterDiscount

    //     } else if (isVoucherExist.discountBy === "price") {
    //         afterPrice = checkoutObject.baseTotal - isVoucherExist.discountValue
    //         discountValue = isVoucherExist.discountValue
    //     }

    //     if (!platform) {

    //         return res.status(HttpStatus.OK).send(
    //             responser.error(`Voucher Tidak Dapat Digunakan Diperangkat Ini`, HttpStatus.OK))
    //     }

    //     if (isVoucherExist.isPrivate.private) {
    //         let isUserExist = isVoucherExist.isPrivate.users.filter(user => user === req.body.user_id)

    //         if (isUserExist.length <= 0) {

    //             return res.status(HttpStatus.OK).send(
    //                 responser.error(`Voucher Ini Private, Tidak Dapat Digunakan Oleh Anda`, HttpStatus.OK))
    //         }
    //     }

    //     if (isVoucherExist.minimumOrderValue > checkoutObject.subTotalProduct) {

    //         return res.status(HttpStatus.OK).send(
    //             responser.error(`Belum Mencapai Minimum Belanja`, HttpStatus.OK))
    //     }

    //     try {

    //         let objectCheckout = {
    //             grandTotal: afterPrice,
    //             subTotalVoucher: checkoutObject.subTotalVoucher + discountValue,
    //             vouchersApplied: []
    //         }

    //         let voucherData = checkoutObject.vouchersApplied

    //         voucherData.push(isVoucherExist._id)

    //         objectCheckout.vouchersApplied = voucherData

    //         const checkout = await CheckoutModel.findOneAndUpdate(
    //             checkoutObject._id, {
    //             $set: objectCheckout
    //         }, {
    //             new: true
    //         }).select({
    //             cart_id: 1,
    //             items: 1,
    //             baseTotal: 1,
    //             grandTotal: 1,
    //             subTotalProduct: 1,
    //             subTotalCharges: 1,
    //             subTotalVoucher: 1,
    //             charges: 1,
    //             vouchersApplied: 1,
    //             platform: 1,
    //             user: 1
    //         }).populate(['charges', 'items.product', 'user', 'vouchersApplied'])

    //         return res.status(HttpStatus.OK).send(responser.success(checkout, "Voucher Diterapkan"));

    //     } catch (err) {
    //         return res.status(HttpStatus.OK).send(
    //             responser.error(`Tidak Dapat Menerapkan Voucher`, HttpStatus.OK))
    //     }

    // }

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

    // async getAllCharge(defaultCharge = "checkout", platform = "all", isActive = true) {

    //     const charges = await ChargeModel.find(
    //         {
    //             "default": defaultCharge,
    //             "isActive": isActive,
    //             "platform": {
    //                 "$in": [platform]
    //             },
    //         }
    //     );

    //     return charges
    // }

    // async getAllVoucher(user_id, platform = "all", isActive = true) {

    //     var currentDate = moment().toDate();

    //     let voucher = await VoucherModel.aggregate([
    //         {
    //             $match: {
    //                 $or: [
    //                     {
    //                         "isPrivate.private": true,
    //                         "isPrivate.users": {
    //                             $in: [`${user_id}`]
    //                         },
    //                         platform: {
    //                             $in: [platform]
    //                         },
    //                         isActive: isActive,
    //                         discountStart: {
    //                             $lte: currentDate
    //                         },
    //                         discountEnd: {
    //                             $gte: currentDate
    //                         }

    //                     },
    //                     {
    //                         "isPrivate.private": false,
    //                         platform: {
    //                             $in: [platform]
    //                         },
    //                         isActive: isActive,
    //                         discountStart: {
    //                             $lte: currentDate
    //                         },
    //                         discountEnd: {
    //                             $gte: currentDate
    //                         }
    //                     }
    //                 ]
    //             }
    //         },
    //         {
    //             "$project": {
    //                 voucherName: 1,
    //                 voucherCode: 1,
    //                 isPrivate: 1,
    //                 platform: 1,
    //                 banner: 1,
    //                 discountBy: 1,
    //                 discountValue: 1,
    //                 minimumOrderValue: 1,
    //                 termsAndConditions: 1,
    //                 isActive: 1,
    //                 discountStart: 1,
    //                 discountEnd: 1
    //             }
    //         }
    //     ])

    //     return voucher
    // }

    // async isVoucherExist(voucherBy, type = "code") {

    //     let voucher

    //     if (type.toLowerCase() === "code") {

    //         voucher = await VoucherModel.findOne({
    //             voucherCode: voucherBy
    //         })
    //     } else if (type.toLowerCase() === "id") {

    //         voucher = await VoucherModel.findOne({
    //             _id: voucherBy
    //         })
    //     }

    //     return voucher

    // }

    // async isCartExist(cart_id) {

    //     let cart = await CartModel.findOne({
    //         _id: cart_id
    //     })

    //     return cart

    // }

    // async isProductExist(productId) {

    //     let product = await ProductModel.findOne({
    //         _id: productId
    //     })

    //     return product
    // }

    // async getUserById(userId) {

    //     let user = await UserModel.findOne({
    //         _id: userId
    //     })

    //     return user
    // }

    // isIdValid(id) {
    //     if (mongoose.isValidObjectId(id)) {
    //         return true
    //     }
    //     return false
    // }

    // setConstructor(req, res) {
    //     this.req = req
    //     this.res = res
    // }

    // sendSuccess(data, message, code = 200) {
    //     return this.res.status(code).send(responser.success(data, message, code))
    // }

    // sendError(message, code = 404) {
    //     return this.res.status(code).send(responser.validation(message, code))
    // }

}


module.exports = new OrderController