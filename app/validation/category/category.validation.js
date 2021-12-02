const Joi = require('joi');

const addCategory = (data) => {
    const schema = Joi.object({
        sku: Joi.string().min(1).max(20).required(),
        name: Joi.string().min(6).max(100).required(),
        position: Joi.number().min(1).max(10),
        image_category: Joi.any(),
        status: Joi.string().min(3).max(50),
        additional: Joi.string().min(3).max(50),
        description: Joi.string(),
    })

    return schema.validate(data)
}

const getAllCategory = (data) => {
    const schema = Joi.object({
        page: Joi.number().min(1).max(20).required(),
        show: Joi.number().min(1).max(100).required(),
        sortBy: Joi.string().min(1).max(10).valid('ASC', 'DESC').required(),
        orderBy: Joi.string().min(1).max(10).valid('name', 'position').required()
    })

    return schema.validate(data)
}

const deleteCategoryByCategoryId = (data) => {
    const schema = Joi.object({
        categoryId: Joi.string().max(255).required()
    })

    return schema.validate(data)
}

const getCategoryByCategoryId = (data) => {
    const schema = Joi.object({
        categoryId: Joi.string().max(255).required()
    })

    return schema.validate(data)
}

module.exports = {
    addCategory,
    getAllCategory,
    getCategoryByCategoryId,
    deleteCategoryByCategoryId
}