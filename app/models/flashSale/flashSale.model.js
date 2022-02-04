const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FlashSaleSchema = mongoose.Schema({
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
    banner: {
        type: String
    },
    termsAndConditions: {
        type: String,
        required: true
    },
    flashSaleStart: {
        type: Date,
        required: true
    },
    flashSaleEnd: {
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
    termsAndConditions: {
        type: String,
    },
    platform: {
        type: Object,
        enum: ['all', 'website', "mobile"],
        default: ['all']
    }

}, {
    timestamps: { Date }
})

module.exports = mongoose.model('flash_sale', FlashSaleSchema)