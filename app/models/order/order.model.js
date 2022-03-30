const { string } = require('joi');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderSchema = mongoose.Schema({

    order_id: {
        type: String,
        unique: true
    },
    bill: {
        bill_no: String,
        bill_reff: String,
        bill_date: String,
        bill_expired: String,
        bill_desc: String,
        bill_total: Number,
        bill_items: []
    },
    grand_total: Number,
    sub_total_product: Number,
    sub_total_charges: Number,
    sub_total_voucher: Number,
    charges: [],
    vouchers_applied: [],
    platform: {
        type: String
    },
    payment: {
        pg_code: String,
        pg_name: String,
        pg_type: String,
        pg_icon: String,
        payment_reff: String,
        payment_date: Date,
        payment_status_code: Number,
        payment_status_desc: String,
        payment_channel_uid: Number,
        payment_channel: String,
        signature: String
    },
    user: {
        _id: String,
        name: String,
        email: String,
        isEmailVerified: Boolean,
        registeredBy: String,
        registeredAt: String,
        isActive: Boolean,
        isPhoneVerified: Boolean,
        createdAt: Date,
        updatedAt: Date,
        phone: String
    },
    shipping_address: {},
    order_status: {
        status: String,
        payment_date: Date,
        description: String
    },
    response: {},
    delivery: {},
    signature: String

}, {
    timestamps: { Date }
}
)

module.exports = mongoose.model('order', OrderSchema)