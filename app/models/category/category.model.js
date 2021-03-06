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
        default: ''
    },
    icon: {
        type: String,
        required: false,
        default: ''
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
    },

    createdAt: {
        type: Date,
        default: Date.now()
    },
    updatedAt: {
        type: Date,
        default: Date.now()
    },
}, {
    timestamps: { Date }
})

module.exports = mongoose.model('category', CategorySchema)