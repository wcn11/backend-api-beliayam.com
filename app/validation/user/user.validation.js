const Joi = require('joi');

const addPhone = (data) => {
    const schema = Joi.object({
        user_id: Joi.string().min(6).max(255).required()
            .messages({
                "string.required": `{{#label}} Berupa Karakter`,
                "string.required": `{{#label}} Berupa Karakter`,
            }),
        phone: Joi.string().min(6).max(255).required()
    })

    return schema.validate(data)
}

const changeNameUser = (data) => {
    const schema = Joi.object({
        user_id: Joi.string().min(6).max(255).required(),
        name: Joi.string().min(3).max(255).required()
    })

    return schema.validate(data)
}

const changeEmailUser = (data) => {
    const schema = Joi.object({
        user_id: Joi.string().min(6).max(255).required(),
        new_email: Joi.string().min(3).max(255).required().email()
    })

    return schema.validate(data)
}

const updateActiveUserValidation = (data) => {
    const schema = Joi.object({
        active: Joi.boolean().required()
    })

    return schema.validate(data)
}

const changePasswordValidator = (data) => {
    const schema = Joi.object({
        user_id: Joi.string().required().label('User Id')
            .messages({
                "any.required": `{{#label}} dibutuhkan`
            }),
        old_password: Joi.string().min(6).max(1024).required().label('Kata Sandi Lama')
            .messages({
                "any.required": `{{#label}} dibutuhkan`
            }),
        password: Joi.string().min(6).max(1024).required().label('Kata Sandi')
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

const emailVerify = (data) => {
    const schema = Joi.object({
        user_id: Joi.string().required(),
        code: Joi.string().min(2).max(6).required()
    })

    return schema.validate(data)
}

const resendEmailVerify = (data) => {
    const schema = Joi.object({
        user_id: Joi.string().required()
    })

    return schema.validate(data)
}

const getOrdersValidation = (data) => {
    const schema = Joi.object({
        page: Joi.number().min(1).max(20).required(),
        show: Joi.number().min(1).max(100).required(),
        sortBy: Joi.string().min(1).max(10).valid('ASC', 'DESC').required(),
        orderBy: Joi.string().min(1).max(10).valid('id', 'updatedAt').required(),
        platform: Joi.array()
            .items(Joi.string().valid('all', 'success', 'failed'))
    })

    return schema.validate(data)
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