const mongoose = require('mongoose');

const CheckoutSchema = mongoose.Schema({
    voucherCode: {
        type: String,
        required: true
    },
    banner: {
        type: String,
        default: false
    },
    discountBy: {
        type: String,
        enum: ['percent', 'price']
    },
    discountValue: {
        type: Number,
        default: 0,
        required: true
    },
    minimumOrderValue: {
        type: Number,
    },
    isPrivate: {
        private: Boolean,
        maxUser: Number,
        users: Object
    },
    voucherMaxUse: {
        max: Number,
    },
    termsAndConditions: {
        type: String,
        required: true
    },
    discountStart: {
        type: Date,
        required: true
    },
    disocuntEnd: {
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
    plaform: {
        type: String,
        enum: ['all', 'website', "mobile"],
        default: 'all'
    }

}, {
    timestamps: { Date }
})

module.exports = mongoose.model('checkout', CheckoutSchema)