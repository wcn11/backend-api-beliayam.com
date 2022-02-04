const Joi = require('joi');

const register = (data) => {
    const schema = Joi.object({
        name: Joi.string().min(6).max(100).required(),
        username: Joi.string().min(3).max(16).required(),
        email: Joi.string().min(6).max(255).required().email(),
        roleId: Joi.int(),
        roleName: Joi.string().min(1).max(25),
        password: Joi.string().min(6).max(255).required()
    })

    return schema.validate(data)
}

const loginEmail = (data) => {
    const schema = Joi.object({
        email: Joi.string().min(6).max(255).required().email(),
        password: Joi.string().min(6).max(1024).required()
    })

    return schema.validate(data)
}

// const byPhone = (data) => {
//     const schema = Joi.object({
//         phone: Joi.string().min(6).max(18).required(),
//         password: Joi.string().min(6).max(1024).required()
//     })

//     return schema.validate(data)
// }

// const emailVerify = (data) => {
//     const schema = Joi.object({
//         email: Joi.string().required().email(),
//         code: Joi.string().min(2).max(6).required()
//     })

//     return schema.validate(data)
// }

// const resendEmailVerify = (data) => {
//     const schema = Joi.object({
//         email: Joi.string().required().email()
//     })

//     return schema.validate(data)
// }

// const sendEmailForgetPassword = (data) => {
//     const schema = Joi.object({
//         email: Joi.string().required().email()
//     })

//     return schema.validate(data)
// }

// const verifyPhoneByUserOTP = (data) => {
//     const schema = Joi.object({
//         user_id: Joi.string().required(),
//         code: Joi.string().required()
//     })

//     return schema.validate(data)
// }

// const resendPhoneVerify = (data) => {
//     const schema = Joi.object({
//         user_id: Joi.string().required(),
//         phone: Joi.string().required()
//     })

//     return schema.validate(data)
// }

// const changePassword = (data) => {
//     const schema = Joi.object({
//         user_id: Joi.string().required(),
//         old_password: Joi.string().min(6).max(1024).required(),
//         new_password: Joi.string().min(6).max(1024).required()
//     })

//     return schema.validate(data)
// }

module.exports = {
    loginEmail,
    // byPhone,
    register,
    // emailVerify,
    // changePassword,
    // resendPhoneVerify,
    // resendEmailVerify,
    // verifyPhoneByUserOTP,
    // sendEmailForgetPassword,
}