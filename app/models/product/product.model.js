const mongoose = require('mongoose');

const ProductSchema = mongoose.Schema({
    category: {
        _id: String,
        sku: String,
        name: String,
        image: String,
        status: String,
        additional: String,
        description: String
    },
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
    hasPromo: {
        isPromo: {
            type: Boolean
        },
        promoId: {
            type: String,
        },
        name: {
            type: String
        },
        tags: {
            type: String
        },
        banner: {
            type: String
        },
        promoValue: {
            type: Number
        },
        promoBy: {
            type: String
        },
        promoStart: {
            type: Date
        },
        promoEnd: {
            type: Date
        }
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
    timestamps: { currentTime: () => Math.floor(Date.now() / 1000) }
})

module.exports = mongoose.model('product', ProductSchema)