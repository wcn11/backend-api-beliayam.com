const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CheckoutSchema = mongoose.Schema({
    cart_id: {
        type: String,
        required: true
    },
    items: [{
        product: {
            _id: String,
            sku: String,
            slug: String,
            name: String,
            price: Number,
            hasDiscount: Object,
            hasPromotion: Object,
            image: String,
            weight: Number,
            status: {
                type: String,
                default: 'active'
            },
            additional: String,
            description: String,
            quantity: 'Number',
            note: {
                type: String,
                required: false

            },
            hasPromo: {
                type: mongoose.Types.ObjectId,
                ref: 'promo'
            },
            productOnLive: {
                type: mongoose.Types.ObjectId,
                ref: 'product'

            }
        },
        // product: {
        //     type: Schema.Types.ObjectId,
        //     ref: 'product'
        // },
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
    subTotalProduct: {
        type: Number,
    },
    subTotalCharges: {
        type: Number,
    },
    charges: [{
        type: Schema.Types.ObjectId,
        ref: 'charge'
    }],
    vouchers: {},
    subTotalVoucher: {},
    platform: [{
        type: String,
        enum: ['all', 'website', "mobile"],
        default: 'all'
    }],
    user: {
        type: Schema.Types.ObjectId,
        ref: 'users'
    }

}, {
    timestamps: { Date }
})

module.exports = mongoose.model('checkout', CheckoutSchema)