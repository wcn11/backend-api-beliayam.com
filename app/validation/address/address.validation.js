const Joi = require('joi');

const maps = (data) => {
    const schema = Joi.object({
        latitude: Joi.string(),
        longitude: Joi.string()
    })

    return schema.validate(data)
}

const addAddress = (data) => {
    const schema = Joi.object({
        user_id: Joi.string().max(50).required(),
        receiver_name: Joi.string().max(50).required(),
        label: Joi.string().min(3).max(20),
        address1: Joi.string().min(6).max(255).required(),
        address2: Joi.string().min(6).max(255),
        city: Joi.string().min(3).max(50).required(),
        state: Joi.string().min(3).max(50).required(),
        district: Joi.string().min(3).max(50).required(),
        sub_district: Joi.string().min(3).max(50).required(),
        postcode: Joi.string().min(3).max(50).required(),
        phone: Joi.string().min(6).max(15).required(),
        default: Joi.boolean().default(false),
        details: Joi.string().max(100),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        maps: maps
    })

    return schema.validate(data)
}

const updateAddress = (data) => {
    const schema = Joi.object({
        _id: Joi.string().max(50).required(),
        user_id: Joi.string().max(50).required(),
        receiver_name: Joi.string().max(50).required(),
        label: Joi.string().min(3).max(20),
        address1: Joi.string().min(6).max(255).required(),
        address2: Joi.string().min(6).max(255),
        city: Joi.string().min(3).max(50).required(),
        state: Joi.string().min(3).max(50).required(),
        district: Joi.string().min(3).max(50).required(),
        sub_district: Joi.string().min(3).max(50).required(),
        postcode: Joi.string().min(3).max(50).required(),
        phone: Joi.string().min(6).max(15).required(),
        default: Joi.boolean().default(false),
        details: Joi.string().max(100),
        maps: maps,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    })

    return schema.validate(data)
}

const getAddressById = (data) => {
    const schema = Joi.object({
        address_id: Joi.string().max(255).required(),
        user_id: Joi.string().min(6).max(255).required(),
    })

    return schema.validate(data)
}

const deleteAddressByAddressId = (data) => {
    const schema = Joi.object({
        addressId: Joi.string().max(255).required()
    })

    return schema.validate(data)
}

module.exports = {
    addAddress,
    getAddressById,
    updateAddress,
    deleteAddressByAddressId
    // login
}