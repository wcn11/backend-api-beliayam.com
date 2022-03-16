const multer = require('multer');
const HttpStatus = require('@helper/http_status')
const responser = require('@responser')
const path = require('path')
var slugify = require('slugify')

const whitelistMimeType = {
    "image/png": ".png",
    "image/jpeg": ".jpeg",
    "image/jpg": ".jpg",
    "image/webp": ".webp"
}

var storage = multer.diskStorage({
    destination: function (req, files, cb) {

        if (files.fieldname === "image_category") {

            cb(null, path.join('public/images/category'))
        }

        if (files.fieldname === "icon") {

            cb(null, path.join('public/images/category/icon'))
        }

    },
    filename: function (req, files, cb) {

        const image = checkMimeType(files)

        if (!image) {

            const message = responser.validation(`Format File ${files.fieldname} Tidak Valid. Format yang diperbolehkan: .png, .jpg, .jpeg, .webp.`, HttpStatus.BAD_REQUEST)

            cb(message, null)
        }

        let date = Date.now()

        if (files.fieldname === "image_category") {

            let fileNameImageCategory = slugify(files.originalname)

            files.url = `images/category/${date}-${fileNameImageCategory}`

            cb(null, date + "-" + fileNameImageCategory)
        }

        if (files.fieldname === "icon") {

            let fileNameImageCategory = slugify(files.originalname)

            files.url = `images/category/icon/${date}-${fileNameImageCategory}`

            cb(null, date + "-" + fileNameImageCategory)
        }
    }
})

function checkMimeType(files) {


    if (whitelistMimeType[files.mimetype] == undefined) {

        return false

    }

    return true
}

module.exports = storage