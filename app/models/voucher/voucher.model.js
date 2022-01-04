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
        default: false
    },
    discountBy: {
        type: String,
        enum: ['price']
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
        default: true
    },
    description: {
        type: String
    },
    platform: [{
        type: Object,
        enum: ['all', 'website', "mobile"],
        default: ['all']
    }]

}, {
    timestamps: { Date }
})

module.exports = mongoose.model('voucher', VoucherSchema)