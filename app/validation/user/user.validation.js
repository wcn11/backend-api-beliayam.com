const Joi = require('joi');

const addPhone = (data) => {
    const schema = Joi.object({
        user_id: Joi.string().min(6).max(255).required(),
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
        user_id: Joi.string().min(6).max(255).required(),
        active: Joi.boolean().required()
    })

    return schema.validate(data)
}

module.exports = {
    addPhone,
    changeNameUser,
    changeEmailUser,
    updateActiveUserValidation
}