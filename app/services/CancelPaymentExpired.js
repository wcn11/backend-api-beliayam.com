
const OrderModel = require('@model/order/order.model')
const ProductModel = require('@model/product/product.model')

const date = require('@helper/date')

const CancelPaymentExpired = class CancelPaymentExpired {

    async cancel() {

        const currentTime = date.format()

        try {

            const orders = await OrderModel.aggregate([
                {
                    $match: {
                        "delivery": {
                            $exists: false
                        },
                        "payment.pg_type": {
                            $ne: "cash"
                        },
                        "payment.payment_status_code": {
                            $lt: 2
                        },
                        "bill.bill_expired": {
                            $lt: currentTime
                        }
                    },
                }

            ])

            if (orders.length > 0) {

                await OrderModel.updateMany(
                    {
                        "delivery": {
                            $exists: false
                        },
                        "payment.pg_type": {
                            $ne: "cash"
                        },
                        "payment.payment_status_code": {
                            $lt: 2
                        },
                        "bill.bill_expired": {
                            $lt: currentTime
                        }
                    }, {
                    $set: {
                        "order_status.status": "PAYMENT_EXPIRED",
                        "order_status.description": "Pesanan Kadaluarsa",
                        "payment.payment_status_code": 7,
                        "payment.payment_status_desc": "Pesanan Kadaluarsa",
                        "payment.payment_date": currentTime

                    }
                }, {
                    new: true,
                    upsert: true
                })

                await this.setStockProducts(orders.bill.bill_items, "inc")

                console.log("Pesanan Dibatalkan")

            }

            console.log("Tidak Ada Pesanan Dibatalkan")

        } catch (err) {

            console.log(err)

            console.log(`Tidak Dapat Membatalkan Pesanan`)

        }
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
}

module.exports = new CancelPaymentExpired