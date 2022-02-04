const OrderModel = require('@model/order/order.model')
const ProductModel = require('@model/product/product.model')

const crypto = require('crypto');

const currentTime = require('@helper/date')
const { BadRequest } = require('@utility/errors')
const HttpStatus = require('@helper/http_status')
const PaymentGateway = require('@service/PaymentGateway')
const PaymentResponse = require('@utility/payment/paymentResponse.lists')
const paymentStatus = require('@utility/payment/paymentStatus.lists')
const responser = require('@responser')

const date = require('@helper/date')

const PaymentController = class PaymentController {

    async getAllPaymentChannel(req, res) {
        const paymentChannelList = await PaymentGateway.getListOfPaymentChannels()

        return res.status(HttpStatus.OK).send(responser.success(paymentChannelList, "OK"));
    }

    async setBillPaymentStatus(req, res) {

        const request = req.body

        const getOrderByTrxId = await OrderModel.findOne({
            'payment.trx_id': request.trx_id,
            "bill.bill_no": request.bill_no
        }, '-__v')

        if (!getOrderByTrxId) {

            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error(`Tidak Dapat Melakukan Pembayaran, Harap Coba Kembali`, HttpStatus.BAD_REQUEST))

        }

        const signatureFromRequest = await this.getSHA1(process.env.SIGNATURE_SECRET, process.env.FASPAY_USER_ID + process.env.FASPAY_PASSWORD + request.bill_no + request.payment_status_code)

        const signatureFromDB = await this.getSHA1(process.env.SIGNATURE_SECRET, process.env.FASPAY_USER_ID + process.env.FASPAY_PASSWORD + getOrderByTrxId.response.bill_no + request.payment_status_code)

        if (signatureFromDB !== signatureFromRequest) {

            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error(`Invalid Signature`, HttpStatus.BAD_REQUEST))

        }

        let orderObject = {
            order_id: getOrderByTrxId.order_id,
            bill: getOrderByTrxId.bill,
            grand_total: getOrderByTrxId.grand_total,
            sub_total_product: getOrderByTrxId.sub_total_product,
            sub_total_charges: getOrderByTrxId.sub_total_charges,
            sub_total_voucher: getOrderByTrxId.sub_total_voucher,
            charges: getOrderByTrxId.charges,
            vouchers_applied: getOrderByTrxId.vouchers_applied,
            platform: getOrderByTrxId.platform,
            payment: getOrderByTrxId.payment,
            user: getOrderByTrxId.user,
            shipping_address: getOrderByTrxId.shipping_address,
            order_status: {},
            response: getOrderByTrxId.response
        }

        orderObject.payment.payment_reff = request.payment_reff
        orderObject.payment.payment_date = request.payment_date
        orderObject.payment.payment_status_code = request.payment_status_code
        orderObject.payment.payment_status_desc = request.payment_status_desc
        orderObject.payment.signature = request.signature

        const payment_status_code_response = parseInt(request.payment_status_code)

        let payment_response_code = {}

        switch (payment_status_code_response) {

            case paymentStatus.UNPROCESSED.code:

            case paymentStatus.IN_PROCESS.code:

                let payment_status_code = payment_status_code_response === paymentStatus.IN_PROCESS.code ? paymentStatus.IN_PROCESS.code : paymentStatus.UNPROCESSED.code

                orderObject.payment.payment_status_code = payment_status_code

                if (payment_status_code === paymentStatus.UNPROCESSED.code) {

                    orderObject.order_status = {
                        status: paymentStatus.UNPROCESSED.name,
                        payment_date: date.time(),
                        description: paymentStatus.UNPROCESSED.description
                    }

                    payment_response_code = {
                        code: PaymentResponse.SUCCESS.code,
                        description: paymentStatus.UNPROCESSED.description
                    }

                } else {

                    orderObject.order_status = {
                        status: paymentStatus.IN_PROCESS.name,
                        payment_date: date.time(),
                        description: paymentStatus.IN_PROCESS.description
                    }

                    payment_response_code = {
                        code: PaymentResponse.SUCCESS.code,
                        description: paymentStatus.IN_PROCESS.description
                    }
                }

                await OrderModel.updateOne({
                    _id: getOrderByTrxId._id
                }, {
                    $set: orderObject
                })

                break;

            case paymentStatus.PAYMENT_SUCCESS.code:

                orderObject.order_status = {
                    status: paymentStatus.PAYMENT_SUCCESS.name,
                    payment_date: date.time(),
                    description: paymentStatus.PAYMENT_SUCCESS.description
                }

                payment_response_code = {
                    code: PaymentResponse.SUCCESS.code,
                    description: paymentStatus.PAYMENT_SUCCESS.description
                }

                await OrderModel.updateOne({
                    _id: getOrderByTrxId._id
                }, {
                    $set: orderObject
                })

                break;

            case paymentStatus.PAYMENT_FAILED.code:

                if (paymentStatus.PAYMENT_FAILED.code === payment_status_code_response) {
                    orderObject.order_status = {
                        status: paymentStatus.PAYMENT_FAILED.name,
                        payment_date: date.time(),
                        description: paymentStatus.PAYMENT_FAILED.description
                    }
                }

                payment_response_code = {
                    code: PaymentResponse.ORDER_CANCELLED.code,
                    description: paymentStatus.PAYMENT_FAILED.description
                }

            case paymentStatus.NO_BILLS_FOUND.code:

                if (paymentStatus.NO_BILLS_FOUND.code === payment_status_code_response) {
                    orderObject.order_status = {
                        status: paymentStatus.NO_BILLS_FOUND.name,
                        payment_date: date.time(),
                        description: paymentStatus.NO_BILLS_FOUND.description
                    }
                }

                payment_response_code = {
                    code: PaymentResponse.INVALID_ORDER.code,
                    description: paymentStatus.NO_BILLS_FOUND.description
                }

            case paymentStatus.PAYMENT_EXPIRED.code:

                if (paymentStatus.PAYMENT_EXPIRED.code === payment_status_code_response) {
                    orderObject.order_status = {
                        status: paymentStatus.PAYMENT_EXPIRED.name,
                        payment_date: date.time(),
                        description: paymentStatus.PAYMENT_EXPIRED.description
                    }
                }

                payment_response_code = {
                    code: PaymentResponse.ORDER_EXPIRED.code,
                    description: paymentStatus.PAYMENT_EXPIRED.description
                }

            case paymentStatus.PAYMENT_CANCELLED.code:

                if (paymentStatus.PAYMENT_CANCELLED.code === payment_status_code_response) {
                    orderObject.order_status = {
                        status: paymentStatus.PAYMENT_CANCELLED.name,
                        payment_date: date.time(),
                        description: paymentStatus.PAYMENT_EXPIRED.description
                    }
                }

                payment_response_code = {
                    code: PaymentResponse.ORDER_CANCELLED.code,
                    description: paymentStatus.PAYMENT_CANCELLED.description
                }

            case paymentStatus.UNKNOWN.code:

                if (paymentStatus.UNKNOWN.code === payment_status_code_response) {
                    orderObject.order_status = {
                        status: paymentStatus.UNKNOWN.name,
                        payment_date: date.time(),
                        description: paymentStatus.UNKNOWN.description
                    }

                    payment_response_code = {
                        code: PaymentResponse.INVALID_ORDER.code,
                        description: paymentStatus.UNKNOWN.description
                    }
                }

                await OrderModel.updateOne({
                    _id: getOrderByTrxId._id
                }, {
                    $set: orderObject
                })

                await this.setStockProducts(orderObject.bill.bill_items)

                break

            default:

                orderObject.order_status = {
                    status: paymentStatus.UNKNOWN.name,
                    payment_date: date.time(),
                    description: paymentStatus.UNKNOWN.description
                }

                await OrderModel.updateOne({
                    _id: getOrderByTrxId._id
                }, {
                    $set: orderObject
                })

                await this.setStockProducts(orderObject.bill.bill_items)

                payment_response_code = {
                    code: PaymentResponse.INVALID_ORDER.code,
                    description: paymentStatus.PAYMENT_FAILED.description
                }

                break;
        }

        let responseToPaymentGateway = {
            "response": "Payment Notification",
            "trx_id": request.trx_id,
            "merchant_id": process.env.FASPAY_MERCHANT_ID,
            "merchant": process.env.FASPAY_MERCHANT_NAME,
            "bill_no": request.bill_no,
            "response_code": payment_response_code.code,
            "response_desc": payment_response_code.description,
            "response_date": currentTime.currentTime

        }

        return res.status(HttpStatus.OK).send(responser.success(responseToPaymentGateway, "OK"));

    }

    async setStockProducts(products, inc = "inc") {

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

    async getSHA1(signature_secret, user_id, password, bill_no, payment_status_code) {

        const md5 = await crypto.createHash('md5', signature_secret)
            .update(user_id + password + bill_no + payment_status_code)
            .digest('hex')

        const sha_signature = await crypto.createHash('sha1', process.env.SIGNATURE_SECRET)
            .update(md5)
            .digest('hex')

        return sha_signature

    }

}


module.exports = new PaymentController