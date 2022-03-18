const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PromoSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: true
    },
    tags: {
        type: Object,
        default: []
    },
    products: [{
        type: Schema.Types.ObjectId,
        ref: "product"
    }],
    image_promo: {
        type: String,
        required: false,
        default: ""
    },
    termsAndConditions: {
        type: String,
        required: true
    },
    promoValue: {
        type: Number,
        default: 0,
    },
    promoBy: {
        type: String,
        enum: ['percent', 'price']
    },
    promoStart: {
        type: Date,
        required: true
    },
    promoEnd: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    description: {
        type: String
    },
    platform: {
        type: Object,
        enum: ['all', 'website', "mobile"],
        default: ['all']
    },
    default: {
        type: Boolean,
        default: false
    }

}, {
    timestamps: { Date }
})

module.exports = mongoose.model('promo', PromoSchema)