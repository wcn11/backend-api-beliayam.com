const Joi = require('joi');

const registerValidator = (data) => {
    const schema = Joi.object({
        name: Joi.string().min(6).max(100).required(),
        username: Joi.string().min(3).max(16).required(),
        email: Joi.string().min(6).max(255).required().email(),
        roleId: Joi.number().valid(1, 2, 3, 4, 5, 6, 7, 8, 9, 10),
        password: Joi.string().min(6).max(255).required()
    })

    return schema.validate(data)
}

const registerByPhoneValidator = (data) => {
    const schema = Joi.object({
        phone: Joi.string().min(6).max(18).required(),
        password: Joi.string().min(6).max(255).required(),
        registerBy: Joi.string().min(3).max(25),
        registerAt: Joi.string().min(3).max(25)
    })

    return schema.validate(data)
}

const loginValidator = (data) => {
    const schema = Joi.object({
        email: Joi.string().min(6).max(255).required().email(),
        password: Joi.string().min(6).max(1024).required()
    })

    return schema.validate(data)
}

const loginBySocialValidator = (data) => {
    const schema = Joi.object({
        name: Joi.string().min(6).max(100).required(),
        email: Joi.string().lowercase().min(6).max(255).required().email(),
        loginBy: Joi.string().min(3).max(25),
        loginAt: Joi.string().min(3).max(25)
    })

    return schema.validate(data)
}

const loginByPhoneValidator = (data) => {
    const schema = Joi.object({
        phone: Joi.string().min(6).max(18).required(),
        password: Joi.string().min(6).max(1024).required()
    })

    return schema.validate(data)
}

const emailVerify = (data) => {
    const schema = Joi.object({
        email: Joi.string().required().email(),
        code: Joi.string().min(2).max(6).required()
    })

    return schema.validate(data)
}

const resendSmsOtpRegisterValidator = (data) => {
    const schema = Joi.object({
        phone: Joi.string().min(6).max(18).required(),
    })

    return schema.validate(data)
}

const verifySmsOtpRegisterValidator = (data) => {
    const schema = Joi.object({
        phone: Joi.string().min(6).max(18).required(),
        code: Joi.string().min(2).max(6).required()
    })

    return schema.validate(data)
}

const resendEmailVerify = (data) => {
    const schema = Joi.object({
        email: Joi.string().required().email()
    })

    return schema.validate(data)
}

const sendEmailForgetPasswordValidator = (data) => {
    const schema = Joi.object({
        email: Joi.string().required().email()
    })

    return schema.validate(data)
}

const verifyPhoneByUserOTPValidator = (data) => {
    const schema = Joi.object({
        user_id: Joi.string().required(),
        code: Joi.string().required()
    })

    return schema.validate(data)
}

const verifyLinkForgetPasswordValidator = (data) => {
    const schema = Joi.object({
        id: Joi.required(),
        token: Joi.required(),
        signature: Joi.required(),
    })

    return schema.validate(data)
}

const resendPhoneVerify = (data) => {
    const schema = Joi.object({
        user_id: Joi.string().required(),
        phone: Joi.string().required()
    })

    return schema.validate(data)
}

const refreshTokenValidator = (data) => {
    const schema = Joi.object({
        refreshToken: Joi.required(),
    })

    return schema.validate(data)
}

const changePasswordValidator = (data) => {
    const schema = Joi.object({
        id: Joi.string().required().label('User Id')
            .messages({
                "any.required": `{{#label}} dibutuhkan`
            }),
        password: Joi.string().min(6).max(1024).required()
            .messages({
                "any.required": `{{#label}} dibutuhkan`
            }),
        password_confirmation: Joi.string().label('Konfirmasi Password').required()
            .messages({
                "any.required": `{{#label}} dibutuhkan`
            }),
    })

    return schema.validate(data)
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
    sendEmailForgetPasswordValidator,
    verifyLinkForgetPasswordValidator
}