
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
const PaymentGateway = require('@service/PaymentGateway')

const moment = require('moment')
moment.locale('id-ID');

const redis = require("redis");

const {
    // calculateCheckoutValidation,
    // applyVoucherValidation,
    // removeVoucherValidation
} = require('@validation/order/order.validation')
const PaymentController = class PaymentController {

    async getAllPaymentChannel(req, res) {
        const paymentChannelList = await PaymentGateway.getListOfPaymentChannels()

        return res.status(HttpStatus.OK).send(responser.success(paymentChannelList, HttpStatus.OK));
    }


    async createPayment(req, res) {

        let currentDate = moment().toDate();

        let objectPayment = {
            "request": "Pembayaran Online Beliayam.com",
            "merchant_id": process.env.FASPAY_MERCHANT_ID,
            "merchant": process.env.FASPAY_MERCHANT_NAME,
            "bill_no": "0000000001",
            "bill_reff": "0000000001",
            "bill_date": "2021-12-13 15:42:10",
            "bill_expired": "2021-12-13 16:57:10",
            "bill_desc": "Pembayaran #0000000001",
            "bill_currency": "IDR",
            "bill_gross": "0",
            "bill_miscfee": "0",
            "bill_total": "4500000",
            "cust_no": "12",
            "cust_name": "Wahyu Chandra",
            "payment_channel": "702",
            "pay_type": "1",
            "bank_userid": "",
            "msisdn": "0895402275040",
            "email": "wahyu@beliayam.com",
            "terminal": "10",
            "billing_name": "0",
            "billing_lastname": "0",
            "billing_address": "jalan pintu air raya",
            "billing_address_city": "Jakarta Pusat",
            "billing_address_region": "DKI Jakarta",
            "billing_address_state": "Indonesia",
            "billing_address_poscode": "10710",
            "billing_msisdn": "",
            "billing_address_country_code": "ID",
            "receiver_name_for_shipping": "Wahyu Chandra",
            "shipping_lastname": "",
            "shipping_address": "jalan pintu air raya",
            "shipping_address_city": "Jakarta Pusat",
            "shipping_address_region": "DKI Jakarta",
            "shipping_address_state": "Indonesia",
            "shipping_address_poscode": "10710",
            "shipping_msisdn": "",
            "shipping_address_country_code": "ID",
            "item": [
                {
                    "product": "Dada Fillet 1.0Kg",
                    "qty": "1",
                    "amount": "4500000",
                    "payment_plan": "01",
                    "merchant_id": "34368",
                    "tenor": "00"
                }
            ],
            "reserve1": "",
            "reserve2": "",
            "signature": "237b44aefcd11ea192fff2a6fd51e4d2c7caf2e9"
        }

        const payments = await PaymentGateway.postDataTransaction(objectPayment)

        const paymentChannelList = payments.payment_channel
    }

}


module.exports = new PaymentController