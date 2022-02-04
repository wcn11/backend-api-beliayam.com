const multer = require('multer');
const HttpStatus = require('@helper/http_status')
const responser = require('@responser')
const path = require('path')

const {
    addProductValidation
} = require('@validation/product/product.validation')


var storage = multer.diskStorage({
    destination: function (req, file, cb) {

        const { error } = addProductValidation(req.body)

        if (file) {

            if (error) {
                const message = responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST)

                cb(message, null)
            }

            cb(null, path.join('public/images/product'))
        }

    },
    filename: function (req, file, cb) {

        var fileObj = {
            "image/png": ".png",
            "image/jpeg": ".jpeg",
            "image/jpg": ".jpg"
        };

        if (fileObj[file.mimetype] == undefined) {

            const message = responser.validation("Format File Tidak Valid", HttpStatus.BAD_REQUEST)

            cb(message, null)

        } else {
            let date = Date.now()

            cb(null, date + "-" + file.originalname)
        }
    }
})

module.exports = storage