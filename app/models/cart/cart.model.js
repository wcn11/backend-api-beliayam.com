const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CartSchema = mongoose.Schema({
    products: [{
        _id: String,
        sku: String,
        name: String,
        price: Number,
        hasDiscount: Object,
        hasPromotion: Object,
        image: String,
        status: {
            type: String,
            default: 'active'
        },
        additional: String,
        description: String,
        quantity: 'Number',
        note: {
            type: String
        }
    }],
    users: {
        type: Schema.Types.ObjectId,
        ref: 'users'
    },
    totalQuantity: Number,
    subTotal: {
        type: Number,
        default: 0,
        required: false
    },
    baseTotal: {
        type: Number,
        default: 0,
        required: false
    },
    hasVoucher: {
        _id: String,
        name: String,
        voucher: String,
    }
}, {
    timestamps: { currentTime: () => Math.floor(Date.now() / 1000) }
})

module.exports = mongoose.model('cart', CartSchema)