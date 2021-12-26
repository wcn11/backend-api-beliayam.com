const mongoose = require('mongoose');

const ChargeSchema = mongoose.Schema({
    chargeName: {
        type: String,
        required: true
    },
    chargeBy: {
        type: String,
        enum: ['percent', 'price'],
        default: 'price'
    },
    chargeValue: {
        type: Number,
        default: 0
    },
    shortDescription: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    default: {
        type: String,
        enum: ['checkout'],
        default: 'checkout',
        required: false
    },
    isPrivate: {
        private: Boolean,
        users: Object
    },
    termsAndConditions: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    platform: [{
        type: String,
        enum: ['all', 'website', "mobile"],
        default: 'all',
        required: false
    }]

}, {
    timestamps: { Date }
})

module.exports = mongoose.model('charge', ChargeSchema)