
const mongoose = require('mongoose');
const CategoryModel = require('@model/category/category.model')
const customId = require("custom-id");
const HttpStatus = require('@helper/http_status')
const responser = require('@responser')


const {
    addCategory,
    getAllCategory,
    getCategoryByCategoryId,
    deleteCategoryByCategoryId
} = require('@validation/category/category.validation')


const CategoryController = class CategoryController {

    async getCategories(req, res) {

        const { error } = getAllCategory(req.query)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        try {

            let page = req.query.page ?? 1
            let show = req.query.show ?? 10

            let sortBy;

            let orderBy;

            if (!req.query.sortBy) {
                sortBy = req.query.sortBy === "ASC" ? 1 : -1
            }
            sortBy = req.query.sortBy ?? 1

            if (!req.query.orderBy) {
                orderBy = req.query.orderBy === "ASC" ? 1 : -1
            }
            orderBy = req.query.orderBy ?? 1

            let category = await CategoryModel.find({}).sort({
                orderBy: sortBy
            }).skip((parseInt(page) - 1) * parseInt(show)).limit(parseInt(show))

            return res.status(HttpStatus.OK).send(responser.success(category, "OK"));
        } catch (err) {

            return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Format Query Salah", HttpStatus.BAD_REQUEST));
        }
    }

    async createCategory(req, res) {

        const { error } = addCategory(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        const isExist = await this.getCategoryBySku(req.body.sku)

        if (isExist) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.error(`SKU: ${req.body.sku} sudah ada, harap menggunakan SKU yang lain`, HttpStatus.BAD_REQUEST))
        }

        // buat jika ada sku duplikat

        // try {

            let input = req.body

            console.log(req.file)

            let category = new CategoryModel({
                "sku": input.sku,
                "name": input.name,
                "position": input.position,
                "image": req.file ? req.file.url : "images/category/default.jpg",
                "status": input.status,
                "additional": input.additional,
                "description": input.description
            })

            const savedCategory = await category.save()

            return res.status(HttpStatus.OK).send(responser.success(savedCategory, "Kategori Ditambahkan"))

        // } catch (err) {

        //     return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Tidak Dapat Menambahkan Kategori, Harap Cek Duplikasi", HttpStatus.BAD_REQUEST))

        // }
    }

    async updateCategory(req, res) {

        const { error } = addCategory(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        let isValid = await this.isIdValid(req.params.categoryId)

        if (!isValid) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error("Kategori ID Tidak Valid", HttpStatus.BAD_REQUEST)
            );
        }

        const isCategoryExists = await CategoryModel.findOne({ _id: req.params.categoryId })

        if (!isCategoryExists) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error("Kategori Tidak Ditemukan", HttpStatus.BAD_REQUEST)
            );
        }

        // buat jika ada sku duplikat

        try {

            let input = req.body

            let categoryObject = {
                "sku": input.sku,
                "name": input.name,
                "position": input.position,
                "status": input.status,
                "additional": input.additional,
                "description": input.description
            }

            if (req.file) {
                categoryObject.image = req.file.path
            }

            const category = await CategoryModel.findOneAndUpdate(
                req.params.categoryId, {
                $set: categoryObject
            }, {
                new: true
            }).select({
                sku: 1,
                name: 1,
                position: 1,
                status: 1,
                additional: 1,
                description: 1,
            })

            return res.status(HttpStatus.OK).send(responser.success(category, `Kategori ${input.name} Diperbarui`))

        } catch (err) {

            return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Tidak Dapat Mengubah Kategori, Harap Cek Input", HttpStatus.BAD_REQUEST))

        }
    }

    async deleteCategoryById(req, res){

        const { error } = deleteCategoryByCategoryId(req.params)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        let category = await CategoryModel.findOne({
            _id: req.params.categoryId
        })

        if (!category) {
            return res.status(HttpStatus.NOT_FOUND).send(responser.validation("Kategori Tidak Ditemukan", HttpStatus.NOT_FOUND))
        }

        try {

            await CategoryModel.deleteOne({
                _id: req.params.categoryId,
            });

            return res.status(HttpStatus.OK).send(responser.validation("Kategori Telah Dihapus", HttpStatus.OK))

        } catch (err) {

            return res.status(HttpStatus.NOT_MODIFIED).send(responser.error("Tidak Bisa Menghapus Kategori", HttpStatus.NOT_MODIFIED))

        }
    }

    async getCategoryById(req, res) {

        const { error } = getCategoryByCategoryId(req.params)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        let isValid = await this.isIdValid(req.params.categoryId)

        if (!isValid) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error("Kategori ID Tidak Valid", HttpStatus.BAD_REQUEST)
            );
        }

        let category = await CategoryModel.findOne({
            _id: req.params.categoryId
        })

        if (!category) {
            return res.status(HttpStatus.NOT_FOUND).send(responser.validation("Kategori Tidak Ditemukan", HttpStatus.NOT_FOUND))
        }

        return res.status(HttpStatus.OK).send(responser.success(category, "OK"));
    }

    async getCategoryBySku(sku) {

        let category = await CategoryModel.findOne({
            sku: sku
        })

        return category
    }

    isIdValid(id) {
        if (mongoose.isValidObjectId(id)) {
            return true
        }
        return false
    }
}


module.exports = new CategoryController