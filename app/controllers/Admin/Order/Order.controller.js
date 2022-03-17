
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
    cancelOrderValidation,
    completeOrderValidation,
    setDeliveryOrderStatusValidation
} = require('@validation/admin/order/order.validation')

const OrderController = class OrderController {

    async getOrders(req, res) {

        try {

            let page = req.query.page ?? 1
            let show = req.query.show ?? 10

            let sortBy;

            let orderBy = req.query.orderBy;

            if (!req.query.sortBy) {
                sortBy = 1
            }

            sortBy = req.query.sortBy == "ASC" ? 1 : -1

            if (!req.query.orderBy) {
                orderBy = "updatedAt"
            }

            let sortir = {}

            sortir[orderBy] = sortBy

            let countTotalOrder = await OrderModel.aggregate([
                {
                    $match: {

                        "delivery": {
                            $exists: false
                        }
                    }
                },
                {
                    $group: {
                        _id: 1,
                        totalOrder: {
                            $sum: 1,
                        },
                    }
                }
            ])

            if (countTotalOrder.length > 0) {
                countTotalOrder = countTotalOrder[0].totalOrder
            }

            let order = await OrderModel.aggregate([
                {
                    $match: {

                        "delivery": {
                            $exists: false
                        }
                    }
                },
                {
                    $project: {
                        order_id: 1,
                        bill: 1,
                        grand_total: 1,
                        sub_total_product: 1,
                        sub_total_charges: 1,
                        sub_total_voucher: 1,
                        charges: 1,
                        vouchers_applied: 1,
                        platform: 1,
                        payment: 1,
                        user: 1,
                        shipping_address: 1,
                        order_status: 1,
                        response: 1,
                        signature: 1
                    }
                },
                { $skip: (page - 1) * parseInt(show) },
                { $limit: parseInt(show) },
                // {
                //     $group: {
                //         _id: 1,
                //         detail: { $first: '$$ROOT' },
                //         totalOrder: {
                //             $sum: 1,
                //         },
                //     }
                // },
                // {
                //     $replaceRoot: {
                //         newRoot: { $mergeObjects: [{ totalOrder: '$totalOrder' }, '$detail'] },
                //     }
                // }
            ])

            let totalOrder = {
                "totalOrder": countTotalOrder,
                order
            }
            return res.status(HttpStatus.OK).send(responser.success(totalOrder, "OK"));
        } catch (err) {

            return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Format Query Salah", HttpStatus.BAD_REQUEST));
        }
    }

    async getOrdersByStatus(req, res) {

        try {

            let page = req.query.page ?? 1
            let show = req.query.show ?? 10

            let sortBy;

            let orderBy = req.query.orderBy;

            if (!req.query.sortBy) {
                sortBy = 1
            }

            sortBy = req.query.sortBy == "ASC" ? 1 : -1

            if (!req.query.orderBy) {
                orderBy = "updatedAt"
            }

            let sortir = {}

            sortir[orderBy] = sortBy

            let status

            if (req.query.status) {

                const isPaymentStatusExist = this.getPaymentCode(req.query.status.toUpperCase(), "name")


                if (!isPaymentStatusExist) {
                    return res.status(HttpStatus.OK).send(responser.error(`Unknown query status: ${req.body.status}`, HttpStatus.OK));
                }

                status = req.query.status.toUpperCase()
            } else {

                status = "PAYMENT_SUCCESS"
            }


            let countTotalOrder = await OrderModel.aggregate([
                {
                    $match: {
                        "order_status.status": status,
                        "delivery": {
                            $exists: false
                        }
                    }
                },
                {
                    $group: {
                        _id: 1,
                        totalOrder: {
                            $sum: 1,
                        },
                    }
                }
            ])

            if (countTotalOrder.length > 0) {
                countTotalOrder = countTotalOrder[0].totalOrder
            }

            let order = await OrderModel.aggregate([
                {
                    $match: {
                        "order_status.status": status,
                        "delivery": {
                            $exists: false
                        }
                    }
                },
                {
                    $project: {
                        order_id: 1,
                        bill: 1,
                        grand_total: 1,
                        sub_total_product: 1,
                        sub_total_charges: 1,
                        sub_total_voucher: 1,
                        charges: 1,
                        vouchers_applied: 1,
                        platform: 1,
                        payment: 1,
                        user: 1,
                        shipping_address: 1,
                        order_status: 1,
                        response: 1,
                        signature: 1
                    }
                },
                { $skip: (page - 1) * parseInt(show) },
                { $limit: parseInt(show) },
                // {
                //     $group: {
                //         _id: 1,
                //         detail: { $first: '$$ROOT' },
                //         totalOrder: {
                //             $sum: 1,
                //         },
                //     }
                // }, {
                //     $replaceRoot: {
                //         newRoot: { $mergeObjects: [{ totalOrder: '$totalOrder' }, '$detail'] },
                //     }
                // }
            ])

            let totalOrder = {
                "totalOrder": countTotalOrder,
                order
            }

            return res.status(HttpStatus.OK).send(responser.success(totalOrder, "OK"));
        } catch (err) {

            return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Format Query Salah", HttpStatus.BAD_REQUEST));
        }
    }

    async getDeliveryOrders(req, res) {

        try {

            let page = req.query.page ?? 1
            let show = req.query.show ?? 10

            let sortBy;

            let orderBy = req.query.orderBy;

            if (!req.query.sortBy) {
                sortBy = 1
            }

            sortBy = req.query.sortBy == "ASC" ? 1 : -1

            if (!req.query.orderBy) {
                orderBy = "updatedAt"
            }

            let sortir = {}

            sortir[orderBy] = sortBy

            let status

            if (req.query.status) {

                const isPaymentStatusExist = this.getPaymentCode(req.query.status.toUpperCase(), "name")


                if (!isPaymentStatusExist) {
                    return res.status(HttpStatus.OK).send(responser.error(`Unknown query status: ${req.body.status}`, HttpStatus.OK));
                }

                status = req.query.status.toUpperCase()
            } else {

                status = "PAYMENT_SUCCESS"
            }



            let countTotalOrder = await OrderModel.aggregate([
                {
                    $match: {
                        "order_status.status": "PAYMENT_SUCCESS",
                        "delivery.isDelivery": true
                    }
                },
                {
                    $group: {
                        _id: 1,
                        totalOrder: {
                            $sum: 1,
                        },
                    }
                }
            ])

            if (countTotalOrder.length > 0) {
                countTotalOrder = countTotalOrder[0].totalOrder
            }

            let order = await OrderModel.aggregate([
                {
                    $match: {
                        "order_status.status": "PAYMENT_SUCCESS",
                        "delivery.isDelivery": true
                    }
                },
                {
                    $project: {
                        order_id: 1,
                        bill: 1,
                        grand_total: 1,
                        sub_total_product: 1,
                        sub_total_charges: 1,
                        sub_total_voucher: 1,
                        charges: 1,
                        vouchers_applied: 1,
                        platform: 1,
                        payment: 1,
                        user: 1,
                        shipping_address: 1,
                        order_status: 1,
                        response: 1,
                        signature: 1
                    }
                },
                { $skip: (page - 1) * parseInt(show) },
                { $limit: parseInt(show) },
                // {
                //     $group: {
                //         _id: 1,
                //         detail: { $first: '$$ROOT' },
                //         totalOrder: {
                //             $sum: 1,
                //         },
                //     }
                // }, {
                //     $replaceRoot: {
                //         newRoot: { $mergeObjects: [{ totalOrder: '$totalOrder' }, '$detail'] },
                //     }
                // }
            ])

            let totalOrder = {
                "totalOrder": countTotalOrder,
                order
            }

            return res.status(HttpStatus.OK).send(responser.success(totalOrder, "OK"));
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

        if (isOrderExist.order_status.status === 2) {
            return res.status(HttpStatus.OK).send(responser.error("Tidak bisa membatalkan pesanan yang telah selesai", HttpStatus.OK))
        }

        const currentTime = date.time()

        try {

            if (parseInt(isOrderExist.payment.pg_code) !== 101) {

                const url = "/cvr/100005/10"

                let postDataObject = {
                    "request": "Canceling Payment",
                    "trx_id": isOrderExist.response.trx_id,
                    "merchant_id": process.env.FASPAY_MERCHANT_ID,
                    "merchant": process.env.FASPAY_MERCHANT_NAME,
                    "bill_no": isOrderExist.bill.bill_no,
                    "payment_cancel": "Pesanan dibatalkan",
                    "signature": isOrderExist.signature
                }

                const paymentGateway = await PaymentGateway.send(url, postDataObject)

                let paymentStatus = this.getPaymentCode(paymentGateway)

                await OrderModel.findOneAndUpdate(
                    {
                        "order_id": req.params.order_id,
                    }, {
                    $set: {
                        "order_status": {
                            status: paymentStatus,
                            payment_date: currentTime,
                            description: paymentGateway.response_desc,
                        },
                        "payment": {
                            pg_code: isOrderExist.payment.pg_code,
                            pg_name: isOrderExist.payment.pg_name,
                            pg_type: isOrderExist.payment.pg_type,
                            payment_status_code: parseInt(paymentGateway.payment_status_code),
                            payment_status_desc: paymentGateway.payment_status_desc,
                            payment_date: currentTime,
                            payment_reff: `Pembayaran #${isOrderExist.order_id}`,
                            payment_date: currentTime,
                            payment_channel_uid: isOrderExist.payment.payment_channel_uid,
                        }
                    }
                }, {
                    new: true
                })

                return res.status(HttpStatus.OK).send(
                    responser.error(paymentGateway.response_desc, HttpStatus.OK))
            }

            // saat di update hilang semua yang ada
            await OrderModel.findOneAndUpdate(
                {
                    "order_id": req.params.order_id,
                }, {
                $set: {
                    "order_status": {
                        status: "PAYMENT_CANCELLED",
                        payment_date: currentTime,
                        description: PaymentResponse.ORDER_CANCELLED.description
                    },
                    "payment": {
                        pg_code: isOrderExist.payment.pg_code,
                        pg_name: isOrderExist.payment.pg_name,
                        pg_type: isOrderExist.payment.pg_type,
                        payment_status_code: 8,
                        payment_status_desc: "Pesanan dibatalkan",
                        payment_reff: `Pembayaran #${isOrderExist.order_id}`,
                        payment_date: currentTime,
                        payment_channel_uid: isOrderExist.payment.payment_channel_uid,
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

    async completePayment(req, res) {

        const { error } = completeOrderValidation(req.params)

        if (error) {
            return res.status(HttpStatus.OK).send(responser.validation(error.details[0].message, HttpStatus.OK))
        }

        const isOrderExist = await this.getOrderByOrderId(req.params.order_id)

        if (!isOrderExist) {
            return res.status(HttpStatus.OK).send(responser.error("Pesanan Tidak Ditemukan", HttpStatus.OK))
        }

        if (isOrderExist.order_status.status === PaymentStatus.PAYMENT_SUCCESS.name) {
            return res.status(HttpStatus.OK).send(responser.error("Pembayaran sudah diselesaikan", HttpStatus.OK))
        }

        const currentTime = date.time().toDate()

        try {

            if (isOrderExist.payment.pg_code !== 101) {

                await OrderModel.findOneAndUpdate(
                    {
                        "order_id": req.params.order_id,
                    }, {
                    $set: {
                        "order_status": {
                            status: "PAYMENT_SUCCESS",
                            payment_date: currentTime,
                            description: PaymentStatus.PAYMENT_SUCCESS.description
                        },
                        "payment": {
                            pg_code: isOrderExist.payment.pg_code,
                            pg_name: isOrderExist.payment.pg_name,
                            pg_type: isOrderExist.payment.pg_type,
                            payment_status_code: 2,
                            payment_status_desc: "Pembayaran Berhasil",
                            payment_date: currentTime,
                            payment_reff: `Pembayaran #${isOrderExist.order_id}`,
                            payment_date: currentTime,

                        }
                    }
                }, {
                    new: true
                })

                return res.status(HttpStatus.OK).send(
                    responser.success({}, "Pembayaran Berhasil"))
            }

            await OrderModel.findOneAndUpdate(
                {
                    "order_id": req.params.order_id,
                },
                {
                    $set: {
                        "order_status": {
                            status: "PAYMENT_SUCCESS",
                            payment_date: currentTime,
                            description: PaymentResponse.PAYMENT_SUCCESS.description
                        },
                        "payment": {
                            payment_status_code: 2,
                            payment_status_desc: "Pembayaran Berhasil",
                            payment_date: currentTime,
                            payment_reff: `Pembayaran #${isOrderExist.order_id}`,
                            pg_code: isOrderExist.payment.pg_code,
                            pg_name: isOrderExist.payment.pg_name,
                            pg_type: isOrderExist.payment.pg_type,
                        }
                    }
                }, {
                new: true
            })

            return res.status(HttpStatus.OK).send(
                responser.success({}, "Pembayaran Berhasil"))

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

    async setDeliveryOrderStatus(req, res) {

        const { error } = setDeliveryOrderStatusValidation(req.body)

        if (error) {
            return res.status(HttpStatus.OK).send(responser.validation(error.details[0].message, HttpStatus.OK))
        }

        const isOrderExist = await this.getOrderByOrderId(req.body.order_id)

        if (!isOrderExist) {
            return res.status(HttpStatus.OK).send(responser.error("Pesanan Tidak Ditemukan", HttpStatus.OK))
        }

        if (parseInt(isOrderExist.payment.pg_code) !== 101) {

            if (isOrderExist.payment.payment_status_code == 0 || isOrderExist.payment.payment_status_code == 1) {
                return res.status(HttpStatus.OK).send(responser.error("Pengguna belum membayar pesanan!", HttpStatus.OK))
            }

            if (isOrderExist.order_status !== "PAYMENT_SUCCESS") {
                return res.status(HttpStatus.OK).send(responser.error("Tidak bisa meneruskan pesanan yang dibatalkan", HttpStatus.OK))
            }
        }

        const order = await OrderModel.findOneAndUpdate(
            {
                order_id: req.body.order_id,
            },
            {
                $set: {
                    delivery: {
                        isDelivery: req.body.delivery.isDelivery,
                        deliveryDate: req.body.delivery.deliveryDaute
                    }
                }

            },
            {
                new: true
            }
        )

        return res.status(HttpStatus.OK).send(responser.success(order, "Pesanan telah dikirimkan"))
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

    getPaymentCode(payment, type = "code") {

        if (type === "code") {


            const status = Object.entries(PaymentStatus).filter(status => {

                if (status[1].code === parseInt(payment.payment_status_code)) {

                    return status[1].name
                }

            })

            return status[0][1].name
        } else {


            const status = Object.entries(PaymentStatus).filter(status => {

                if (status[1].name === payment) {

                    return status[1].name
                }

            })

            return status[0][1].name
        }
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

        const md5 = crypto.createHash('md5', signature_secret)
            .update(user_id + password + bill_no)
            .digest('hex')

        const sha_signature = crypto.createHash('sha1', process.env.SIGNATURE_SECRET)
            .update(md5)
            .digest('hex')

        return sha_signature

    }

}


module.exports = new OrderController