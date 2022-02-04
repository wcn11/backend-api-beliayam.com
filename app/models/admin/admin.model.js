const mongoose = require('mongoose');

const AdminSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        min: 6,
        max: 255,
    },
    username: String,
    email: {
        type: String,
        required: true,
        max: 255,
        min: 6,
        trim: true,
        unique: true,
    },
    role: {
        roleId: {
            default: 0,
            type: Number,
        },
        roleName: {
            default: 'Administrator',
            type: String,
        }
    },
    gender: {
        type: String,
        required: false,
    },
    password: {
        type: String,
        required: false,
        max: 1024,
        min: 6,
    },
    passwordLastUpdate: {
        type: Date,
        required: false
    },
    isActive: {
        type: Boolean,
        default: true,
        required: false,
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    updatedAt: {
        type: Date,
        default: Date.now()
    }
})

module.exports = mongoose.model('admin', AdminSchema)