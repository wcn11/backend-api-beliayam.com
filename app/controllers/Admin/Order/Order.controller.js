
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
    getOrderByIdValidation,
    cancelOrderValidation
} = require('@validation/admin/order/order.validation')

const OrderController = class OrderController {

    async getOrders(req, res) {

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
                orderBy = req.query.orderBy === "updatedAt" ? 1 : -1
            }
            orderBy = req.query.orderBy ?? 1

            let category = await OrderModel.find({
            }).sort({
                orderBy: sortBy
            }).skip((parseInt(page) - 1) * parseInt(show)).limit(parseInt(show))

            return res.status(HttpStatus.OK).send(responser.success(category, "OK"));
        } catch (err) {

            return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Format Query Salah", HttpStatus.BAD_REQUEST));
        }
    }

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

    async cancelPayment(req, res) {

        const { error } = cancelOrderValidation(req.params)

        if (error) {
            return res.status(HttpStatus.OK).send(responser.validation(error.details[0].message, HttpStatus.OK))
        }

        const isOrderExist = await this.getOrderByOrderId(req.params.order_id)

        if (!isOrderExist) {
            return res.status(HttpStatus.OK).send(responser.error("Pesanan Tidak Ditemukan", HttpStatus.OK))
        }

        const currentTime = date.time()

        try {

            if (isOrderExist.payment.pg_code !== 101) {

                console.log(isOrderExist)

                const url = "/cvr/100005/10"

                let postDataObject = {
                    "request": "Canceling Payment",
                    "trx_id": isOrderExist.response.trx_id,
                    "merchant_id": process.env.FASPAY_MERCHANT_ID,
                    "merchant": process.env.FASPAY_MERCHANT_NAME,
                    "bill_no": isOrderExist.bill.bill_no,
                    "payment_cancel": "Pesanan dibatalkan",
                    "signature": ""
                }

                let signature = await this.getSHA1(process.env.SIGNATURE_SECRET, process.env.FASPAY_USER_ID, process.env.FASPAY_PASSWORD, req.params.bill_no)

                postDataObject.signature = signature

                const paymentGateway = await PaymentGateway.send(url, postDataObject)

                if (!paymentGateway.trx_id) {

                    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(
                        responser.error(`Tidak Dapat Membatalkan Pesanan`, HttpStatus.INTERNAL_SERVER_ERROR))
                }
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

                await this.setStockProducts(isOrderExist.bill.bill_items, "inc")

                return res.status(getHttpStatus[0][1]).send(
                    responser.success(paymentResponse[0][1].description, getHttpStatus[0][1]))
            }

            await OrderModel.findOneAndUpdate(
                req.params.order_id, {
                $set: {
                    "order_status": {
                        status: "ORDER_CANCELLED",
                        payment_date: date.time(),
                        description: PaymentResponse.ORDER_CANCELLED.description
                    }
                }
            }, {
                new: true
            })

            return res.status(HttpStatus.OK).send(
                responser.success("Pesanan Dibatalkan", HttpStatus.OK))

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