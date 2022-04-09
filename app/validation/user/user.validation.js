const Joi = require('joi');
const ValidationLabel = require('@utility/validation/validationLabel')
const ValidationCustom = require('@utility/validation/validationCustom')
const ValidationMessages = require('@utility/validation/validationMessage')

const addPhone = (data) => {
    const schema = Joi.object({
        user_id: Joi.string().min(6).max(255).required(),
        phone: Joi.number().custom((value, helper) => ValidationCustom.phone(value, helper)).required().label(ValidationLabel.PHONE),
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

const changeNameUser = (data) => {
    const schema = Joi.object({
        user_id: Joi.string().min(6).max(255).required(),
        name: Joi.string().min(3).max(255).required().label(ValidationLabel.NAME)
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

const changeEmailUser = (data) => {
    const schema = Joi.object({
        user_id: Joi.string().min(6).max(255).required(),
        new_email: Joi.string().min(3).max(255).required().email().label(ValidationLabel.NEW_EMAIL)
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

const updateActiveUserValidation = (data) => {
    const schema = Joi.object({
        active: Joi.boolean().required()
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

const changePasswordValidator = (data) => {
    const schema = Joi.object({
        user_id: Joi.string().required().label(ValidationLabel.USER_ID),
        old_password: Joi.string().min(6).max(1024).required().label(ValidationLabel.OLD_PASSWORD),
        password: Joi.string().min(6).max(1024).required().label(ValidationLabel.PASSWORD),
        password_confirmation: Joi.string().required().label(ValidationLabel.PASSWORD_CONFIRMATION),
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

const emailVerify = (data) => {
    const schema = Joi.object({
        user_id: Joi.string().required().label(ValidationLabel.USER_ID),
        code: Joi.string().min(2).max(6).required().label(ValidationLabel.CODE)
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

const resendEmailVerify = (data) => {
    const schema = Joi.object({
        user_id: Joi.string().required().label(ValidationLabel.USER_ID),
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

const getOrdersValidation = (data) => {
    const schema = Joi.object({
        page: Joi.number().min(1).max(20).required(),
        show: Joi.number().min(1).max(100).required(),
        sortBy: Joi.string().min(1).max(10).valid('ASC', 'DESC').required(),
        orderBy: Joi.string().min(1).max(10).valid('id', 'updatedAt').required(),
        platform: Joi.string().valid('all', 'success', 'failed')
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

module.exports = {
    addPhone,
    getOrdersValidation,
    changeNameUser,
    changeEmailUser,
    emailVerify,
    resendEmailVerify,
    changePasswordValidator,
    updateActiveUserValidation
}