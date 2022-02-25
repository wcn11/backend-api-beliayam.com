const mongoose = require('mongoose');

const CategorySchema = mongoose.Schema({
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
        min: 3,
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
        // extraSmall: {
        //     type: String
        // },
        // small: {
        //     type: String
        // },
        // medium: {
        //     type: String
        // },
        // large: {
        //     type: String
        // },
    },
    status: {
        type: String,
        default: 'active'
    },
    additional: {
        type: String,
        default: "",
        required: false,
    },
    description: {
        type: String,
        required: false,
    }
}, {
    timestamps: { currentTime: () => Math.floor(Date.now() / 1000) }
})

module.exports = mongoose.model('category', CategorySchema)