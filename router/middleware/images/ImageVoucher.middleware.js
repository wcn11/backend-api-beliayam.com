const multer = require('multer');
const HttpStatus = require('@helper/http_status')
const responser = require('@responser')
const path = require('path')

const {
    createNewVoucherValidation
} = require('@validation/admin/voucher/voucher.validation')


var storage = multer.diskStorage({
    destination: function (req, file, cb) {

        const { error } = createNewVoucherValidation(req.body)

        if (file) {

            switch (file.fieldname) {
                case "image_voucher":

                    if (error) {
                        const message = responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST)

                        cb(message, null)
                    }
                    cb(null, path.join('public/images/voucher'))
                    // cb(null, path.join(__dirname, '../../../public/images/voucher'))
                break;
            }
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
            cb(null, Date.now() + "-" + file.originalname)
        }
    }
})

module.exports = storage