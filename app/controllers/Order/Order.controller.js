
const mongoose = require('mongoose');

const CheckoutModel = require('@model/checkout/checkout.model')
const ChargeModel = require('@model/charge/charge.model')
const OrderModel = require('@model/order/order.model')
const ProductModel = require('@model/product/product.model')
const UserModel = require('@model/user/user.model')
const VoucherModel = require('@model/voucher/voucher.model')

const HttpStatus = require('@helper/http_status')
const responser = require('@responser')
const PaymentGateway = require('@service/PaymentGateway')
const PaymentResponse = require('@utility/payment/paymentResponse.lists')
const PaymentStatus = require('@utility/payment/paymentStatus.lists')

const { customAlphabet } = require('nanoid')
const crypto = require('crypto');

const moment = require('moment')
moment.locale('id-ID');

const date = require('@helper/date')

const redis = require("redis");

const nanoid = customAlphabet('1234567890ABCDEFGHIJKLMNPQRSTUVWXYZ', 12) // NO LETTER O 

const {
    placeOrderValidation,
    getOrderByIdValidation,
    cancelOrderValidation
} = require('@validation/order/order.validation')

const client = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
})

const OrderController = class OrderController {

    async getOrderById(req, res) {

        const { error } = getOrderByIdValidation(req.params)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        try {
            let isOrderExist = await OrderModel.findOne({
                order_id: req.params.order_id
            })

            let isOrderSuccessExist = await OrderModel.findOne({
                order_id: req.params.order_id
            })

            let order = {}

            if (!isOrderExist && !isOrderSuccessExist) {
                return res.status(HttpStatus.NOT_FOUND).send(
                    responser.error("Pesanan Tidak Ditemukan", HttpStatus.NOT_FOUND))
            }

            if (isOrderExist) {
                order = isOrderExist
            } else {
                order = isOrderSuccessExist
            }

            return res.status(HttpStatus.OK).send(responser.success(order, "OK"));
        } catch (e) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(responser.error("Terjadi Kesalahan, harap muat ulang", HttpStatus.INTERNAL_SERVER_ERROR))
        }
    }


    // saat user melakukan pembayaran, maka stok produk berdasarkan quantity di update menjadi berkurang dahulu, jika pembayaran tidak berhasil maka kembalikan stok ke persediaan awal
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

        const countOrderSize = await this.countOrderSize() + 1

        const bill_no = nanoid()

        const bill_reff = `0000${countOrderSize}-${bill_no}`

        const postDataObject = {
            "request": "Request Payment Transaction",
            "merchant_id": process.env.FASPAY_MERCHANT_ID,
            "merchant": process.env.FASPAY_MERCHANT_NAME,
            "bill_no": bill_no,
            "bill_reff": bill_reff,
            "bill_date": now,
            "bill_expired": later,
            "bill_desc": "Pembayaran #" + bill_reff,
            "bill_currency": "IDR",
            "bill_gross": "0",
            "bill_miscfee": "0",
            "bill_total": 0,
            "cust_no": user._id,
            "cust_name": user.name,
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
            "billing_msisdn": address[0].address.phone,
            "billing_address_country_code": "ID",
            "receiver_name_for_shipping": address[0].address.receiver_name,
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

                const isProductStillExist = await this.getProductByProductId(items[i].product._id)

                if (!isProductStillExist[0]) {
                    return res.status(HttpStatus.BAD_REQUEST).send(
                        responser.error("Beberapa Produk Dalam Keranjang Anda, Sudah Tidak Tersedia", HttpStatus.BAD_REQUEST))
                }

                if (isProductStillExist[0].stock < items[i].details.quantity) {

                    return res.status(HttpStatus.OK).send(
                        responser.error(`Kuantitas Pembelian '${items[i].product.name}' Melebihi Persediaan Saat Ini`, HttpStatus.OK))
                }

                let promo = items[i].product.hasPromo

                let discount = items[i].product.hasDiscount

                if (promo) {

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
            }

            let sub_total = checkout.baseTotal

            let sub_total_voucher = 0

            let all_voucher = []

            const vouchers = req.body.vouchers

            if (vouchers) {

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
                        sub_total_voucher += isVoucherExist.discountValue
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

                    all_voucher.push(isVoucherExist)
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

            const objectResponse = {
                "bill": {
                    "bill_no": bill_no,
                    "bill_reff": bill_reff,
                    "bill_date": now,
                    "bill_expired": later,
                    "bill_desc": "Pembayaran #" + bill_reff,
                    "bill_total": grand_total,
                    "bill_items": items
                },
                "user": user,
                "shipping_address": address[0].address
            }

            let signature_temp = ""

            switch (isPaymentGatewayExist.data.type.toLowerCase()) {
                case "cash":
                    objectResponse.payment = {
                        "pg_code": isPaymentGatewayExist.data.pg_code,
                        "pg_name": isPaymentGatewayExist.data.pg_name,
                        "type": isPaymentGatewayExist.data.type
                    }

                    objectResponse.response = {
                        "trx_id": 0,
                        "bill_no": bill_no,
                        "merchant_id": process.env.FASPAY_MERCHANT_ID,
                        "merchant": process.env.FASPAY_MERCHANT,
                        "response_code": HttpStatus.OK,
                        "response_desc": `Metode Pembayaran Dengan ${isPaymentGatewayExist.data.pg_name}`,
                        "redirect_url": ""
                    }

                    break
                case "va":
                case "ibanking":
                case "retail":
                case "emoney":
                case "emoney":
                case "emoney":
                case "jumpapp":
                case "qris":

                    objectResponse.payment = {
                        "pg_code": isPaymentGatewayExist.data.pg_code,
                        "pg_name": isPaymentGatewayExist.data.pg_name,
                        "type": isPaymentGatewayExist.data.type
                    }

                    const md5 = crypto.createHash('md5', process.env.SIGNATURE_SECRET)
                        .update(process.env.FASPAY_USER_ID + process.env.FASPAY_PASSWORD + bill_no)
                        .digest('hex')

                    const signature = crypto.createHash('sha1', process.env.SIGNATURE_SECRET)
                        .update(md5)
                        .digest('hex')

                    signature_temp = signature

                    postDataObject.signature = signature

                    postDataObject.bill_total = grand_total_concat

                    console.log(postDataObject)

                    const paymentGateway = await PaymentGateway.send(url, postDataObject)

                    if (!paymentGateway.trx_id) {

                        return res.status(HttpStatus.REQUEST_TIMEOUT).send(
                            responser.error(`Server Pembayaran Sedang Sibuk, Harap Coba Kembali`, HttpStatus.REQUEST_TIMEOUT))
                    }

                    objectResponse.response = {
                        "trx_id": paymentGateway.trx_id,
                        "bill_no": paymentGateway.bill_no,
                        "merchant_id": paymentGateway.merchant_id,
                        "merchant": paymentGateway.merchant,
                        "response_code": paymentGateway.response_code,
                        "response_desc": paymentGateway.response_desc
                    }

                    if (req.body.payment.pg_code == 713) {
                        objectResponse.response.deeplink = paymentGateway.deeplink
                        objectResponse.response.web_url = paymentGateway.web_url
                        objectResponse.response.redirect_url = paymentGateway.redirect_url
                    } else if (req.body.payment.pg_code == 711 || req.body.payment.pg_code == 716) {
                        objectResponse.response.web_url = paymentGateway.web_url
                        objectResponse.response.redirect_url = paymentGateway.redirect_url
                    }
                    else {
                        objectResponse.response.redirect_url = paymentGateway.redirect_url
                    }

                    address[0].address.receiver_name = user.name
                    break
            }

            const orderObject = {
                order_id: bill_no,
                bill: {
                    bill_no: bill_no,
                    bill_reff: bill_reff,
                    bill_date: now,
                    bill_expired: later,
                    bill_desc: postDataObject.bill_desc,
                    bill_total: grand_total,
                    bill_items: items,
                },
                grand_total: grand_total,
                sub_total_product: base_total_products,
                sub_total_charges: sub_total_charge,
                sub_total_voucher: sub_total_voucher,
                charges: charges,
                vouchers_applied: all_voucher,
                platform: req.body.platform,
                payment: {
                    pg_code: isPaymentGatewayExist.data.pg_code,
                    pg_name: isPaymentGatewayExist.data.pg_name,
                    pg_type: isPaymentGatewayExist.data.type,
                    // status: PaymentStatus.IN_PROCESS,
                    payment_reff: "",
                    payment_date: "",
                    payment_status_code: PaymentStatus.IN_PROCESS.code,
                    payment_status_desc: "",
                    payment_channel_uid: parseInt(isPaymentGatewayExist.data.pg_code),
                    payment_channel: isPaymentGatewayExist.data.pg_name,
                    signature: ""
                },
                user: {
                    _id: user._id,
                    name: user._name,
                    email: user.email,
                    isEmailVerified: user.isEmailVerified,
                    registeredBy: user.registeredBy,
                    registeredAt: user.registeredAt,
                    isActive: user.isActive,
                    isPhoneVerified: user.isPhoneVerified,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                    phone: user.phone
                },
                shipping_address: address[0].address,
                order_status: {
                    status: "IN_PROCESS",
                    payment_date: date.time(),
                    description: "Waiting for payment"
                },
                response: objectResponse.response
            }

            let saveOrder = new OrderModel(orderObject)

            await saveOrder.save()

            await this.setStockProducts(items)

            orderObject.signature = signature_temp

            await CheckoutModel.deleteOne({
                user: user._id
            })
            return res.status(HttpStatus.OK).send(responser.success(orderObject, "OK"));
        } catch (err) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(
                responser.error(`Tidak Dapat Melakukan Pembayaran, Harap Coba Kembali`, HttpStatus.INTERNAL_SERVER_ERROR))
        }
    }

    async cancelPayment(req, res) {

        const { error } = cancelOrderValidation(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        const isOrderExist = await this.getOrderByOrderId(req.body.order_id)

        if (!isOrderExist) {
            return res.status(HttpStatus.NOT_FOUND).send(responser.error("Pesanan Tidak Ditemukan", HttpStatus.NOT_FOUND))
        }

        const currentTime = moment().add(7, 'hour').toDate()

        try {

            const url = "/cvr/100005/10"

            let postDataObject = {
                "request": "Canceling Payment",
                "trx_id": req.body.trx_id,
                "merchant_id": process.env.FASPAY_MERCHANT_ID,
                "merchant": process.env.FASPAY_MERCHANT_NAME,
                "bill_no": req.body.bill_no,
                "payment_cancel": "Barang Habis",
                "signature": ""
            }

            let signature = await this.getSHA1(process.env.SIGNATURE_SECRET, process.env.FASPAY_USER_ID, process.env.FASPAY_PASSWORD, req.body.bill_no)

            postDataObject.signature = signature

            const paymentGateway = await PaymentGateway.send(url, postDataObject)

            if (!paymentGateway.trx_id) {

                return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(
                    responser.error(`Tidak Dapat Membatalkan Pesanan`, HttpStatus.INTERNAL_SERVER_ERROR))
            }

            await this.setStockProducts(isOrderExist.bill.bill_items, "inc")

            let responseObject = {
                order_id: isOrderExist.order_id,
                bill: isOrderExist.bill,
                grand_total: isOrderExist.grand_total,
                sub_total_product: isOrderExist.sub_total_product,
                sub_total_charges: isOrderExist.sub_total_charges,
                sub_total_voucher: isOrderExist.sub_total_voucher,
                charges: isOrderExist.charges,
                vouchers_applied: isOrderExist.vouchers_applied,
                platform: isOrderExist.platform,
                payment: isOrderExist.payment,
                user: isOrderExist.user,
                shipping_address: isOrderExist.shipping_address,
                order_status: {},
                response: isOrderExist.response
            }

            const paymentResponse = Object.entries(PaymentResponse).filter(response => {

                if (response[1].code.toString() === paymentGateway.response_code.toString()) {

                    responseObject.payment.reff = ""
                    responseObject.payment.date = currentTime
                    responseObject.payment.payment_status_code = response[1].code.toString()
                    responseObject.payment.payment_status_desc = paymentGateway.response_desc
                    responseObject.payment.signature = signature

                    responseObject.response.response_code = response[1].code.toString()
                    responseObject.response.response_desc = response[1].description

                    Object.entries(PaymentStatus).filter(status => {

                        if (status[1].code.toString() === paymentGateway.payment_status_code.toString()) {
                            return responseObject.order_status = {
                                status: status[1].name,
                                payment_date: status[1].payment_date,
                                description: status[1].description
                            }
                        }

                    })

                    return response[1]
                }

            })

            const getHttpStatus = Object.entries(HttpStatus).filter(status => {

                if ((status[0].toUpperCase() === paymentResponse[0][1].type.toUpperCase())) {
                    return status[0]
                }

            })

            if (getHttpStatus[0][1] === 200) {

                return res.status(getHttpStatus[0][1]).send(responser.success(responseObject, getHttpStatus[0][0]));

            }

            return res.status(getHttpStatus[0][1]).send(
                responser.error(paymentResponse[0][1].description, getHttpStatus[0][1]))

        } catch (err) {

            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(
                responser.error(`Tidak Dapat Membatalkan Pesanan`, HttpStatus.INTERNAL_SERVER_ERROR))

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

    async countOrderSize() {

        return await OrderModel.findOne({}).count()
    }

    async getProductByProductId(product_id) {

        let products = await ProductModel.find({
            _id: product_id,
            status: "active"
        })

        return products
    }

    async setStockProducts(products, inc = "dec") {

        await products.map(async product => {

            if (inc.toLowerCase() === "inc") {

                await ProductModel.updateOne({
                    _id: product.product._id
                }, {
                    $inc: {
                        'stock': product.details.quantity
                    }
                })
            } else {

                await ProductModel.updateOne({
                    _id: product.product._id
                }, {
                    $inc: {
                        'stock': -product.details.quantity
                    }
                })
            }
        })

    }

    async getOrderByOrderId(order_id) {

        return await OrderModel.findOne({
            order_id: order_id
        })
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

    async getSHA1(signature_secret, user_id, password, bill_no, payment_status_code = "") {

        let md5 = ""

        if (payment_status_code === "") {

            md5 = crypto.createHash('md5', signature_secret)
                .update(user_id + password + bill_no)
                .digest('hex')

        } else {

            md5 = crypto.createHash('md5', signature_secret)
                .update(user_id + password + bill_no + payment_status_code)
                .digest('hex')
        }

        const sha_signature = crypto.createHash('sha1', process.env.SIGNATURE_SECRET)
            .update(md5)
            .digest('hex')

        return sha_signature

    }

}


module.exports = new OrderController