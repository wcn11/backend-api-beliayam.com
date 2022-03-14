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
    destination: function (req, file, cb) {

        cb(null, path.join('public/images/promo'))

    },
    filename: function (req, file, cb) {

        if (whitelistMimeType[file.mimetype] == undefined) {

            const message = responser.validation("Format File Tidak Valid. Format yang diperbolehkan: .png, .jpg, .jpeg, .webp.", HttpStatus.BAD_REQUEST)

            cb(message, null)

        } else {
            let date = Date.now()

            let fileName = slugify(file.originalname)

            file.url = `images/promo/${date}-${fileName}`

            cb(null, date + "-" + file.originalname)
        }
    }
})
module.exports = storage