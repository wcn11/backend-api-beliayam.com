const Joi = require('joi');
const ValidationLabel = require('@utility/validation/validationLabel')
const ValidationCustom = require('@utility/validation/validationCustom')
const ValidationMessages = require('@utility/validation/validationMessage')

const registerValidator = (data) => {
    const schema = Joi.object({
        name: Joi.string().min(2).max(100).required().label(ValidationLabel.USER_ID),
        email: Joi.string().lowercase().min(6).max(255).required().email().required().label(ValidationLabel.EMAIL),
        password: Joi.string().min(6).max(255).required().label(ValidationLabel.PASSWORD),
        registerBy: Joi.string().min(3).max(25).label(ValidationLabel.REGISTER_BY),
        registerAt: Joi.string().min(3).max(25).label(ValidationLabel.REGISTER_AT)
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

const registerByPhoneValidator = (data) => {
    const schema = Joi.object({
        phone: Joi.number().custom((value, helper) => ValidationCustom.phone(value, helper)).required().label(ValidationLabel.PHONE),
        password: Joi.string().min(6).max(100).required().label(ValidationLabel.PASSWORD),
        registerBy: Joi.string().min(3).max(25).label(ValidationLabel.REGISTER_BY),
        registerAt: Joi.string().min(3).max(25).label(ValidationLabel.REGISTER_AT)
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err, value) {
        if (err) {
            return catched(err.message);
        }
    });

    // return schema.validate(data).messages(ValidationMessages.messages)
}

const loginValidator = (data) => {
    const schema = Joi.object({
        email: Joi.string().min(6).max(255).required().email().label(ValidationLabel.EMAIL),
        password: Joi.string().min(6).max(1024).required().label(ValidationLabel.PASSWORD)
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err, value) {
        if (err) {
            return catched(err.message);
        }
    });
}

const loginBySocialValidator = (data) => {
    const schema = Joi.object({
        name: Joi.string().min(2).max(100).required().label(ValidationLabel.NAME),
        email: Joi.string().lowercase().min(6).max(255).required().email().label(ValidationLabel.EMAIL),
        loginBy: Joi.string().min(3).max(25).label(ValidationLabel.LOGIN_BY),
        loginAt: Joi.string().min(3).max(25).label(ValidationLabel.LOGIN_AT)
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

const loginByPhoneValidator = (data) => {
    const schema = Joi.object({
        phone: Joi.number().custom((value, helper) => ValidationCustom.phone(value, helper)).required().label(ValidationLabel.PHONE),
        password: Joi.string().min(6).max(1024).required().label(ValidationLabel.PASSWORD)
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

const emailVerify = (data) => {
    const schema = Joi.object({
        email: Joi.string().required().email().label(ValidationLabel.EMAIL),
        code: Joi.string().min(2).max(6).required().label(ValidationLabel.CODE)
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

const resendSmsOtpRegisterValidator = (data) => {
    const schema = Joi.object({
        phone: Joi.number().custom((value, helper) => ValidationCustom.phone(value, helper)).required().label(ValidationLabel.PHONE),
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

const verifySmsOtpRegisterValidator = (data) => {
    const schema = Joi.object({
        phone: Joi.number().custom((value, helper) => ValidationCustom.phone(value, helper)).required().label(ValidationLabel.PHONE),
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
        email: Joi.string().required().email().label(ValidationLabel.EMAIL)
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

const sendEmailForgetPasswordValidator = (data) => {
    const schema = Joi.object({
        email: Joi.string().required().email().label(ValidationLabel.EMAIL)
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

const sendOtpForgetPasswordValidator = (data) => {
    const schema = Joi.object({
        phone: Joi.number().custom((value, helper) => ValidationCustom.phone(value, helper)).required().label(ValidationLabel.PHONE),
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

const verifyPhoneByUserOTPValidator = (data) => {
    const schema = Joi.object({
        user_id: Joi.string().required().label(ValidationLabel.USER_ID),
        code: Joi.string().required().label(ValidationLabel.CODE)
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

const verifyLinkForgetPasswordValidator = (data) => {
    const schema = Joi.object({
        id: Joi.required().label(ValidationLabel.ID),
        token: Joi.required().label(ValidationLabel.TOKEN),
        signature: Joi.required().label(ValidationLabel.SIGNATURE),
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

const resendPhoneVerify = (data) => {
    const schema = Joi.object({
        user_id: Joi.string().required().label(ValidationLabel.USER_ID),
        phone: Joi.number().custom((value, helper) => ValidationCustom.phone(value, helper)).required().label(ValidationLabel.PHONE),
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

const refreshTokenValidator = (data) => {
    const schema = Joi.object({
        refreshToken: Joi.required().label(ValidationLabel.REFRESH_TOKEN),
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

const changePasswordValidator = (data) => {
    const schema = Joi.object({
        _id: Joi.string().required().label(ValidationLabel.ID),
        password: Joi.string().min(6).max(1024).required().label(ValidationLabel.PASSWORD),
        password_confirmation: Joi.string().label('Konfirmasi Password').required().label(ValidationLabel.PASSWORD_CONFIRMATION),
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

module.exports = {
    loginValidator,
    loginByPhoneValidator,
    registerValidator,
    emailVerify,
    registerByPhoneValidator,
    resendPhoneVerify,
    resendEmailVerify,
    verifyPhoneByUserOTPValidator,
    refreshTokenValidator,
    loginBySocialValidator,
    changePasswordValidator,
    resendSmsOtpRegisterValidator,
    verifySmsOtpRegisterValidator,
    sendOtpForgetPasswordValidator,
    sendEmailForgetPasswordValidator,
    verifyLinkForgetPasswordValidator
}