
const mongoose = require('mongoose');
const CategoryModel = require('@model/category/category.model')
const ProductModel = require('@model/product/product.model')
const customId = require("custom-id");
const HttpStatus = require('@helper/http_status')
const responser = require('@responser')

var fs = require('fs');

const {
    addCategory,
    getAllCategory,
    getCategoryByCategoryId,
    deleteCategoryByCategoryId,
    getProductByCategoryIdOrSlugValidation
} = require('@validation/admin/category/category.validation')


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

            let category = await CategoryModel.find({
                isActive: req.query.status || false
            }).sort({
                orderBy: sortBy
            }).skip((parseInt(page) - 1) * parseInt(show)).limit(parseInt(show))

            return res.status(HttpStatus.OK).send(responser.success(category, "OK"));
        } catch (err) {

            return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Format Query Salah", HttpStatus.BAD_REQUEST));
        }
    }

    async getProductsBySlug(req, res) {
        try {

            let category = await CategoryModel.findOne({
                slug: req.query.key
            })

            if (!category) {
                return res.status(HttpStatus.OK).send(responser.success([], "OK"));
            }

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

            let products = await ProductModel.find({
                category: {
                    $in: [category._id]
                },
                isActive: req.query.status || 'inactive'
            }).sort({
                orderBy: sortBy
            }).skip((parseInt(page) - 1) * parseInt(show)).limit(parseInt(show))

            return res.status(HttpStatus.OK).send(responser.success(products, "OK"));

        } catch (err) {

            return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Format Query Salah", HttpStatus.BAD_REQUEST));
        }
    }

    async getProductByCategoryIdOrSlug(req, res) {

        const { error } = getProductByCategoryIdOrSlugValidation(req.query)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        let isPromoExist = false

        let isActive

        if (req.query.isActive) {
            isActive = true
        } else if (req.query.isActive === false) {
            isActive = false
        } else {
            isActive = true
        }

        const promoObject = await PromoModel.findOne({
            slug: req.params.slug,
        })

        if (!promoObject) {
            return res.status(HttpStatus.OK).send(responser.success([], "OK"));
        }

        var currentDate = moment().toDate();

        // benerin dan buat paginasi
        let promo = await ProductModel.find({
            hasPromo: {
                $in: [promoObject._id]
            },
            promoStart: {
                $lte: currentDate
            },
            promoEnd: {
                $gte: currentDate
            },
            isActive: isActive,
            platform: {
                $in: [req.query.platform]
            },
        })

        return res.status(HttpStatus.OK).send(responser.success(promo, "OK"));
    }

    async createCategory(req, res) {

        const { error } = addCategory(req.body)

        if (error) {

            this.removeFile(req)
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        const isExist = await this.getCategoryBySku(req.body.sku)

        if (isExist) {

            this.removeFile(req)
            return res.status(HttpStatus.BAD_REQUEST).send(responser.error(`SKU: ${req.body.sku} sudah ada, harap menggunakan SKU yang lain`, HttpStatus.BAD_REQUEST))
        }

        const isSlugExist = await this.getCategoryBySlug(req.body.slug)

        if (isSlugExist) {

            this.removeFile(req)
            return res.status(HttpStatus.OK).send(responser.error(`Slug sudah ada, harap menggunakan slug yang lain`, HttpStatus.OK))
        }

        try {

            let input = req.body

            let categoryObject = {
                "sku": input.sku,
                "slug": input.slug,
                "name": input.name,
                "position": input.position,
                "icon": "",
                "image": "",
                "status": input.status,
                "additional": input.additional,
                "description": input.description
            }

            if (req.files.image_category) {

                for (let i = 0; i < req.files.image_category.length; i++) {
                    categoryObject.image = req.files.image_category[i].url
                }

            }

            if (req.files.icon) {

                for (let i = 0; i < req.files.icon.length; i++) {
                    categoryObject.icon = req.files.icon[i].url
                }

            }

            let category = new CategoryModel(categoryObject)

            const savedCategory = await category.save()

            return res.status(HttpStatus.OK).send(responser.success(savedCategory, "Kategori Ditambahkan"))

        } catch (err) {

            this.removeFile(req)

            return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Tidak Dapat Menambahkan Kategori, Harap Cek Duplikasi", HttpStatus.BAD_REQUEST))

        }
    }

    async updateCategory(req, res) {

        const { error } = addCategory(req.body)

        if (error) {

            this.removeFile(req)
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        let isValid = await this.isIdValid(req.params.categoryId)

        if (!isValid) {

            this.removeFile(req)
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error("Kategori ID Tidak Valid", HttpStatus.BAD_REQUEST)
            );
        }

        const isCategoryExists = await CategoryModel.findOne({ _id: req.params.categoryId })

        if (!isCategoryExists) {

            this.removeFile(req)
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error("Kategori Tidak Ditemukan", HttpStatus.BAD_REQUEST)
            );
        }

        // try {

        let input = req.body

        let categoryObject = {
            "sku": input.sku,
            "slug": input.slug,
            "name": input.name,
            "position": input.position,
            "icon": "",
            "image": "",
            "status": input.status,
            "additional": input.additional,
            "description": input.description
        }

        if (req.files.image_category) {

            for (let i = 0; i < req.files.image_category.length; i++) {
                categoryObject.image = req.files.image_category[i].url
            }

        }

        if (req.files.icon) {

            for (let i = 0; i < req.files.icon.length; i++) {
                categoryObject.icon = req.files.icon[i].url
            }

        }

        const category = await CategoryModel.findOneAndUpdate(
            { _id: req.params.categoryId }, {
            $set: categoryObject
        }, {
            new: true
        }).select({
            "_id": 1,
            "sku": 1,
            "slug": 1,
            "name": 1,
            "position": 1,
            "image": 1,
            "icon": 1,
            "status": 1,
            "additional": 1,
            "description": 1,
            "createdAt": 1,
            "updatedAt": 1
        })

        this.removeFile(isCategoryExists, "update")

        return res.status(HttpStatus.OK).send(responser.success(category, `Kategori ${input.name} Diperbarui`))

        // } catch (err) {

        //     if (err) {
        //         if (req) {
        //             this.removeFile(req)
        //         }

        //         console.log(err)

        //         return res.status(HttpStatus.BAD_REQUEST).send(responser.error(err, HttpStatus.BAD_REQUEST))

        //     }
        // }
    }

    async deleteCategoryById(req, res) {

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

    async getCategoryBySlug(slug) {

        let category = await CategoryModel.findOne({
            slug: slug
        })

        return category
    }

    isIdValid(id) {
        if (mongoose.isValidObjectId(id)) {
            return true
        }
        return false
    }

    validateId(id) {

        if (!mongoose.isValidObjectId(id)) {
            return false
        }

    }

    removeFile(req, type = "add") {

        if (type === "add") {


            if (req.files.image_category) {

                try {
                    for (let i = 0; i < req.files.image_category.length; i++) {
                        fs.unlinkSync(req.files.image_category[i].path, function (err) {
                            if (err) return
                        })
                    }
                }
                catch (err) {
                    return
                }

            }

            if (req.files.icon) {
                try {

                    for (let i = 0; i < req.files.icon.length; i++) {
                        fs.unlinkSync(req.files.icon[i].path, function (err) {
                            if (err) return
                        })
                    }
                }
                catch (err) {
                    return
                }

            }
        }

        if (type === "update") {


            if (req.image) {
                try {

                    fs.unlink("public/" + req.image)
                }
                catch (err) {
                    return
                }

            }

            if (req.icon) {
                try {
                    fs.unlinkSync("public/" + req.icon, function (err) {
                        if (err) return
                    })
                }
                catch (err) {
                    return
                }

            }
        }
    }
}


module.exports = new CategoryController