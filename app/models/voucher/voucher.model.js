const mongoose = require('mongoose');

const VoucherSchema = mongoose.Schema({
    voucherName: {
        type: String,
        required: true
    },
    voucherCode: {
        type: String,
        required: true
    },
    banner: {
        type: String,
        default: ""
    },
    discountBy: {
        type: String,
        enum: ['price', "percent"]
    },
    discountValue: {
        type: Number,
        default: 0,
        required: true
    },
    minimumOrderBy: {
        type: String,
        enum: ['quantity', "total"],
        default: "quantity",
        required: false
    },
    minimumOrderValue: {
        type: Number,
        default: 0,
        required: false
    },
    isPrivate: {
        private: {
            type: Boolean,
            default: false
        },
        maxUser: {
            type: Number,
            default: 0
        },
        users: {
            type: Object,
            default: []
        }
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
    discountEnd: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: false
    },
    description: {
        type: String
    },
    platform: [{
        type: String,
        enum: ['all', 'website', "mobile"],
        default: 'all'
    }]

}, {
    timestamps: { Date }
})

module.exports = mongoose.model('voucher', VoucherSchema)