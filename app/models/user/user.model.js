const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
    name: {
        type: String,
        required: false,
        min: 6,
        max: 255,
    },
    email: {
        type: String,
        required: false,
        max: 255,
        min: 6,
        trim: true,
        unique: true,
        lowercase: true,
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    otpEmail: {
        code: {
            type: 'Number',
            default: 0,
        },
        attempts: {
            type: 'Number',
            default: 0
        },
        expired: Boolean,
        expiredDate: Date
    },
    otpSms: {
        code: {
            type: 'Number',
            default: 0,
        },
        attempts: {
            type: 'Number',
            default: 0
        },
        expired: Boolean,
        expiredDate: Date
    },
    gender: {
        type: String,
        required: false,
    },
    registeredBy: {
        type: String,
        required: false,
        default: 'email'
    },
    registeredAt: {
        type: String,
        required: false,
        default: 'website'
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
    phone: {
        type: String,
        required: false,
        unique: true,
        min: 6,
        max: 20,
        trim: true
    },
    isPhoneVerified: {
        type: Boolean,
        default: false,
    },
    registeredBy: {
        type: String,
        required: false,
    },
    fcm_token: {
        type: String,
        required: false,
    },
    subscribedToNewsLetter: {
        type: Boolean,
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
    addresses: [{
        _id: String,
        label: String,
        user_id: String,
        receiver_name: String,
        address1: String,
        address2: String,
        city: String,
        state: String,
        district: String,
        sub_district: String,
        postcode: String,
        phone: String,
        default: Boolean,
        details: String,
        createdAt: Date,
        updatedAt: Date,
        maps: {
            latitude: {
                type: String,
                required: false,
            },
            longitude: {
                type: String,
                required: false,
            },
        }
    }]
})

module.exports = mongoose.model('users', UserSchema)