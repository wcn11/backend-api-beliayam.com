
const mongoose = require('mongoose');
const CategoryModel = require('@model/category/category.model')
const ProductModel = require('@model/product/product.model')
const customId = require("custom-id");
const HttpStatus = require('@helper/http_status')
const responser = require('@responser')

var fs = require('fs');


const {
    addProductValidation,
    getProductsValidation,
    getProductBySlugValidation,
    updateProductByIdValidation,
    getProductByIdValidation,
    deleteProductByIdValidation,
    getProductsByCategoryIdValidation

} = require('@validation/admin/product/product.validation')

const ProductController = class ProductController {

    async getProducts(req, res) {

        const { error } = getProductsValidation(req.query)

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
                orderBy = req.query.orderBy ?? "name"
            }
            orderBy = req.query.orderBy ?? 1

            let products = await ProductModel.find({
                active: true,
            }).populate(['category', 'hasPromo'])
                .sort({
                    orderBy: sortBy
                }).skip((parseInt(page) - 1) * parseInt(show)).limit(parseInt(show))

            return res.status(HttpStatus.OK).send(responser.success(products));

        } catch (err) {

            return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Format Query Salah", HttpStatus.BAD_REQUEST));
        }
    }

    async getProductsByCategoryId(req, res) {

        const { error } = getProductsByCategoryIdValidation(req.query)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        let isValid = await this.isIdValid(req.params.categoryId)

        if (!isValid) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error("Produk Yang Dicari Tidak Ditemukan", HttpStatus.BAD_REQUEST)
            );
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
                orderBy = req.query.orderBy ?? "name"
            }
            orderBy = req.query.orderBy ?? 1

            let user = await ProductModel.find({
                category: {
                    $in: [req.params.categoryId]
                },
                active: true,

            }).populate(['category', 'hasPromo'])
                .sort({
                    orderBy: sortBy
                }).skip((parseInt(page) - 1) * parseInt(show)).limit(parseInt(show))

            return res.status(HttpStatus.OK).send(responser.success(user, HttpStatus.OK));

        } catch (err) {

            return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Format Query Salah", HttpStatus.BAD_REQUEST));
        }
    }

    async getProductById(req, res) {

        const { error } = getProductByIdValidation(req.params)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        let product = await ProductModel.findOne({
            _id: req.params.productId,
        }).populate(['category', 'hasPromo'])

        return res.status(HttpStatus.OK).send(responser.success(product ?? {}));
    }

    async getProductBySlug(req, res) {

        const { error } = getProductBySlugValidation(req.params)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        let product = await ProductModel.findOne({
            slug: req.params.slug
        }).populate(['category', 'hasPromo'])

        // if (!product) {
        //     return res.status(HttpStatus.NOT_FOUND).send(responser.validation("Produk Tidak Ditemukan", HttpStatus.NOT_FOUND))
        // }

        return res.status(HttpStatus.OK).send(responser.success(product ?? {}, HttpStatus.OK));
    }

    async createProduct(req, res) {

        const { error } = addProductValidation(req.body)

        if (error) {

            this.removeFile(req)

            return res.status(HttpStatus.OK).send(responser.validation(error.details[0].message, HttpStatus.OK))
        }

        if (!this.isIdValid(req.body.category_id)) {

            this.removeFile(req)

            return res.status(HttpStatus.OK).send(responser.validation("ID Produk Tidak Valid", HttpStatus.OK))
        }

        // buat jika ada sku duplikat

        try {

            let input = req.body

            let category = await this.isCategoryExists(input.category_id)

            if (!category) {
                return res.status(HttpStatus.NOT_FOUND).send(responser.validation("Kategori Tidak Ditemukan", HttpStatus.NOT_FOUND))
            }

            let productObject = {

                category: [
                    input.category_id,
                ],
                slug: input.slug,
                sku: input.sku,
                name: input.name,
                position: input.position,
                price: input.price,
                stock: input.stock,
                weight: input.weight,
                status: input.status,
                additional: input.additional,
                description: input.description
            }

            if (req.file) {
                productObject.image = req.file ? `images/product/${req.file.filename}` : "images/product/default.jpg"
            }

            if (input.isDiscount) {
                productObject.hasDiscount = {
                    isDiscount: input.isDiscount,
                    discount: input.discount,
                    discountBy: input.discountBy,
                    discountStart: input.discountStart,
                    discountEnd: input.discountEnd,
                    priceAfterDiscount: input.priceAfterDiscount,
                }
            }

            let product = new ProductModel(productObject)

            const savedProduct = await product.save()

            return res.status(HttpStatus.OK).send(responser.success(savedProduct, "Produk Ditambahkan"))

        } catch (err) {

            return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Tidak Dapat Menambahkan Produk, Harap Cek Duplikasi", HttpStatus.BAD_REQUEST))

        }
    }

    async deleteProductById(req, res) {

        const { error } = deleteProductByIdValidation(req.params)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        let product = await ProductModel.findOne({
            _id: req.params.productId
        })

        if (!product) {
            return res.status(HttpStatus.NOT_FOUND).send(responser.validation("Produk Tidak Ditemukan", HttpStatus.NOT_FOUND))
        }

        try {

            await ProductModel.deleteOne({
                _id: req.params.productId
            });

            return res.status(HttpStatus.OK).send(responser.validation("Produk Telah Dihapus", HttpStatus.OK))

        } catch (err) {

            return res.status(HttpStatus.NOT_MODIFIED).send(responser.error("Tidak Bisa Menghapus Produk", HttpStatus.NOT_MODIFIED))

        }
    }

    async updateProductById(req, res) {

        const { error } = updateProductByIdValidation(req.body)

        if (error) {

            this.removeFile(req)
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        let isValid = await this.isIdValid(req.params.productId)

        if (!isValid) {

            this.removeFile(req)

            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error("ID Produk Tidak Valid", HttpStatus.BAD_REQUEST)
            );
        }

        const isProductExist = await ProductModel.findOne({ _id: req.params.productId })

        if (!isProductExist) {

            this.removeFile(req)
            return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Produk Tidak Ditemukan", HttpStatus.BAD_REQUEST))
        }

        let category = await this.isCategoryExists(req.body.category_id)

        if (!category) {

            this.removeFile(req)
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation("Kategori Tidak Ditemukan", HttpStatus.BAD_REQUEST))
        }

        try {

        let input = req.body

        let productObject = {

            category: [
                category._id,
            ],
            sku: input.sku,
            slug: input.slug,
            name: input.name,
            position: input.position,
            price: input.price,
            stock: input.stock,
            weight: input.weight,
            status: input.status,
            additional: input.additional,
            description: input.description
        }

        if (req.file) {
            productObject.image = req.file ? `images/product/${req.file.filename}` : "images/product/default.jpg"
        }

        if (input.isDiscount) {
            productObject.hasDiscount = {
                isDiscount: input.isDiscount,
                discount: input.discount,
                discountBy: input.discountBy,
                discountStart: input.discountStart,
                discountEnd: input.discountEnd
            }
        }

        const product = await ProductModel.updateOne(
            {
                _id: req.params.productId,
            },
            {
                $set: productObject
            }, {
            new: true
        }).select({
            category: 1,
            sku: 1,
            name: 1,
            position: 1,
            image: 1,
            status: 1,
            additional: 1,
            description: 1,
            price: 1,
            stock: 1,
            hasDiscount: 1,
            hasPromotion: 1,
        })

            this.removeFile("public/" + isProductExist.image)

            return res.status(HttpStatus.OK).send(responser.success({}, "Produk Diperbarui"))

        } catch (err) {

            return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Tidak Dapat Mengubah Produk, Harap Cek Input", HttpStatus.BAD_REQUEST))

        }
    }

    async isCategoryExists(categoryId) {

        let category = await CategoryModel.findOne({
            _id: categoryId
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

    removeFile(req) {
        if (req.file) {
            fs.unlinkSync(req.file.path)
        } else {
            fs.unlinkSync(req)
        }
    }
}


module.exports = new ProductController