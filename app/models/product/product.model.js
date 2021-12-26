const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductSchema = mongoose.Schema({
    category: [{
        type: Schema.Types.ObjectId,
        ref: 'category'
    }],
    sku: {
        type: String,
        required: true,
        min: 3,
        max: 100,
        trim: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
        min: 3,
        max: 100,
        trim: true,
        unique: true,
    },
    position: {
        type: 'Number',
        default: 1,
    },
    image: {
        type: String,
        required: false
    },
    price: {
        type: Number,
        default: 0,
        required: true
    },
    stock: {
        type: 'Number',
        default: 0,
        required: false
    },
    hasDiscount: {
        isDiscount: {
            type: Boolean,
            default: false,
        },
        discount: {
            type: Number,
            default: 0,
        },
        discountBy: {
            type: String,
            enum: ['percent', 'price']
        },
        discountStart: {
            type: Date,
            default: null
        },
        discountEnd: {
            type: Date,
            default: null
        },
        priceAfterDiscount: {
            type: 'Number',
            default: 0
        }
    },
    hasPromo: [{
        type: Schema.Types.ObjectId,
        ref: 'promo'
    }],
    status: {
        type: String,
        default: 'active'
    },
    additional: {
        type: String,
        required: false,
    },
    description: {
        type: String,
        required: false,
    }
}, {
    timestamps: { currentTime: () => Math.floor(Date.now() / 1000) }
})

module.exports = mongoose.model('product', ProductSchema)