const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TokenSchema = mongoose.Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'user'
    },
    token: {
        type: String,
        required: false,
        unique: true,
    },
    refreshToken: {
        type: String,
        required: false,
        unique: true,
    },
    status: {
        type: String,
        enum: ['logout', 'blacklist']
    }
})

module.exports = mongoose.model('token', TokenSchema)