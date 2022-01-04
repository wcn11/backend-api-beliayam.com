const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderSchema = mongoose.Schema({
    cart_id: {
        type: String,
        required: true
    },
    items: [{
        product: {
            type: Schema.Types.ObjectId,
            ref: 'product'
        },
        details: {
            grand_price: {
                type: Number,
            },
            quantity: {
                type: Number,
            },
            note: {
                type: String,
            }
        }
    }],
    baseTotal: {
        type: Number,
    },
    grandTotal: {
        type: Number,
    },
    subTotalProduct: {
        type: Number,
    },
    subTotalCharges: {
        type: Number,
    },
    subTotalVoucher: {
        type: Number,
    },
    charges: [{
        type: Schema.Types.ObjectId,
        ref: 'charge'
    }],
    vouchersApplied: [{
        type: Schema.Types.ObjectId,
        ref: 'voucher'
    }],
    platform: [{
        type: String,
        enum: ['all', 'website', "mobile"],
        default: 'all'
    }],
    user: {
        type: Schema.Types.ObjectId,
        ref: 'users'
    },
    shipping: {
        address: {
            type: Schema.Types.ObjectId,
            ref: 'users.addresses'
        }
    }

}, {
    timestamps: { Date }
})

module.exports = mongoose.model('order', OrderSchema)