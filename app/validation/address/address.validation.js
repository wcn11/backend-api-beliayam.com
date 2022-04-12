const Joi = require('joi');
const ValidationLabel = require('@utility/validation/validationLabel')
const ValidationCustom = require('@utility/validation/validationCustom')
const ValidationMessages = require('@utility/validation/validationMessage')

const maps = (data) => {
    const schema = Joi.object({
        latitude: Joi.string().label(ValidationLabel.LATITUDE),
        longitude: Joi.string().label(ValidationLabel.LONGITUDE),
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

const addAddress = (data) => {
    const schema = Joi.object({
        user_id: Joi.string().max(50).required().label(ValidationLabel.USER_ID),
        receiver_name: Joi.string().max(50).required().label(ValidationLabel.RECEIVER_NAME),
        label: Joi.string().min(3).max(20).label(ValidationLabel.LABEL),
        address1: Joi.string().min(6).max(255).required().label(ValidationLabel.ADDRESS_1),
        address2: Joi.string().allow("").max(255).label(ValidationLabel.ADDRESS_2),
        city: Joi.object().required().label(ValidationLabel.CITY),
        state: Joi.object().required().label(ValidationLabel.STATE),
        district: Joi.object().required().label(ValidationLabel.DISTRICT),
        sub_district: Joi.object().required().label(ValidationLabel.SUB_DISTRICT),
        postcode: Joi.string().allow("").max(50).required().label(ValidationLabel.POSTCODE),
        phone: Joi.number().custom((value, helper) => ValidationCustom.phone(value, helper)).required().label(ValidationLabel.PHONE),
        default: Joi.boolean().default(false).label(ValidationLabel.DEFAULT),
        details: Joi.string().allow("").max(100).label(ValidationLabel.DETAILS),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        maps: maps
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

const updateAddress = (data) => {
    const schema = Joi.object({
        _id: Joi.string().max(50).required().label(ValidationLabel.ID),
        user_id: Joi.string().max(50).required().label(ValidationLabel.USER_ID),
        receiver_name: Joi.string().max(50).required().label(ValidationLabel.RECEIVER_NAME),
        label: Joi.string().min(3).max(20).label(ValidationLabel.LABEL),
        address1: Joi.string().min(6).max(255).required().label(ValidationLabel.ADDRESS_1),
        address2: Joi.string().allow("").max(255).label(ValidationLabel.ADDRESS_2),
        city: Joi.object().required().label(ValidationLabel.CITY),
        state: Joi.object().required().label(ValidationLabel.STATE),
        district: Joi.object().required().label(ValidationLabel.DISTRICT),
        sub_district: Joi.object().required().label(ValidationLabel.SUB_DISTRICT),
        postcode: Joi.string().allow("").max(50).required().label(ValidationLabel.POSTCODE),
        phone: Joi.number().custom((value, helper) => ValidationCustom.phone(value, helper)).required().label(ValidationLabel.PHONE),
        default: Joi.boolean().default(false),
        details: Joi.string().allow("").max(100),
        maps: maps,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

const getAddressById = (data) => {
    const schema = Joi.object({
        address_id: Joi.string().max(255).required().label(ValidationLabel.ADDRESS_ID),
        user_id: Joi.string().min(6).max(255).required().label(ValidationLabel.USER_ID),
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

const deleteAddressByAddressId = (data) => {
    const schema = Joi.object({
        addressId: Joi.string().max(255).required().label(ValidationLabel.ADDRESS_ID)
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

const updateDefaultAddressValidator = (data) => {
    const schema = Joi.object({
        address_id: Joi.string().max(255).required().label(ValidationLabel.ADDRESS_ID),
        user_id: Joi.string().min(6).max(255).required().label(ValidationLabel.USER_ID),
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

module.exports = {
    addAddress,
    getAddressById,
    updateAddress,
    deleteAddressByAddressId,
    updateDefaultAddressValidator
}