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
    slug: {
        type: String,
        required: true,
        min: 1,
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
        required: false,
        default: ''
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
    weight: {
        type: 'Number',
        default: 0,
        required: true
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
            enum: ['percent', 'price'],
            default: 'price',
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
        },
    },
    hasPromo: {
        type: Schema.Types.ObjectId,
        ref: 'promo'
    },
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
    timestamps: { Date }
})

module.exports = mongoose.model('product', ProductSchema)