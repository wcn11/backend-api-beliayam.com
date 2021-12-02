const multer = require('multer');
const HttpStatus = require('@helper/http_status')
const responser = require('@responser')
const { BadRequest } = require('@utility/errors');
const path = require('path')

const {
    createNewPromoValidation,
    updatePromoByPromoIdValidation
} = require('@validation/promo/promo.validation')


var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file) {

            switch (file.fieldname) {
                case "image_promo":

                    if (req.method === "POST") {

                        const { error } = createNewPromoValidation(req.body)

                        if(error) {
                            cb(new BadRequest(error.details[0].message, HttpStatus.BAD_REQUEST), null)
                        }

                    } else if (req.method.toUpperCase() === "PUT") {

                        const { error } = updatePromoByPromoIdValidation(req.body)

                        if (error) {
                            cb(new BadRequest(error.details[0].message, HttpStatus.BAD_REQUEST), null)
                        }

                    }

                    cb(null, path.join(__dirname, '../../../public/images/promo'))
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