const mongoose = require('mongoose');
const AdminModel = require('@model/admin/admin.model')
const UserModel = require('@model/user/user.model')
const HttpStatus = require('@helper/http_status')
const responser = require('@responser')
const SMSGateway = require('@service/SMS.gateway')
const date = require('@helper/date')
const bcrypt = require('bcryptjs')
const redis = require("redis");
const client = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
})

const OrderModel = require('@model/order/order.model')

const PaymentResponse = require('@utility/payment/paymentResponse.lists')
const paymentStatus = require('@utility/payment/paymentStatus.lists')

const { customAlphabet } = require('nanoid')
const nanoid = customAlphabet('1234567890', 4) // NO LETTER 

const SendVerifyEmail = require('@mailService/SendVerifyEmail.mail')

const {
    addPhone,
    changeNameUser,
    changeEmailUser,
    emailVerify,
    getOrdersValidation,
    resendEmailVerify,
    changePasswordValidator,
    updateActiveUserValidation,
    setOrderStatusValidator
} = require('@validation/admin/user/user.validation')

const UsersController = class UsersController {

    async getUsers(req, res) {

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

        try {

            let user = await UserModel.find({},
                {
                    password: 0,
                    otpEmail: 0,
                    otpSms: 0
                }).sort({
                    orderBy: sortBy
                }
                ).skip((parseInt(page) - 1) * parseInt(show)).limit(parseInt(show))

            return res.status(HttpStatus.OK).send(responser.success(user));
        } catch (err) {
            return res.status(HttpStatus.NOT_FOUND).send(responser.error("Invalid Format", HttpStatus.NOT_FOUND));
        }
    }

    async getOrders(req, res) {

        let page = parseInt(req.query.page) ?? 1
        let show = parseInt(req.query.show) ?? 10

        let sortBy;
        let orderBy = 1;

        if (req.query.sortBy) {
            sortBy = req.query.sortBy === "ASC" ? 1 : -1
        }

        if (!req.query.orderBy) {
            orderBy = req.query.orderBy === "payment_date" ? 1 : -1
        }

        orderBy = req.query.orderBy ?? 1

        let query = {
            $match: {}
        }

        let sort = {
            $sort: {}
        }

        if (req.query.status) {

            const isPaymentStatusExist = await this.checkPaymentStatusCode(parseInt(req.query.status))

            if (isPaymentStatusExist.length <= 0) {

                return res.status(HttpStatus.NOT_FOUND).send(
                    responser.error(translate('payment.unknow_payment'), HttpStatus.NOT_FOUND)
                );
            }

            query.$match['payment.payment_status_code'] = {
                $eq: parseInt(req.query.status)
            }
        }

        if (req.query.fromDate) {

            query.$match['order_status.'.concat(orderBy)] = {
                $gte: date.format(req.query.fromDate).toDate() ?? date.endOf(), $lte: date.format(req.query.toDate).toDate() ?? date.beginOf()
            }
        }

        sort.$sort[orderBy] = sortBy

        try {
            query.$match['user._id'] = {
                $eq: req.query.user_id
            }

            let user = await OrderModel.aggregate([
                query, sort,
                { $skip: (page - 1) * show },
                { $limit: show }
            ])

            return res.status(HttpStatus.OK).send(responser.success(user, "OK"));
        } catch (err) {
            return res.status(HttpStatus.NOT_FOUND).send(responser.error("Invalid Format", HttpStatus.NOT_FOUND));
        }
    }

    async changeName(req, res) {

        const { error } = changeNameUser(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        let isValid = await this.isIdValid(req.body.user_id)

        if (!isValid) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error("ID Pengguna Tidak Valid", HttpStatus.BAD_REQUEST)
            );
        }

        const userExist = await AdminModel.findOne({ _id: req.body.user_id })

        if (!userExist) {
            return res.status(HttpStatus.NOT_FOUND).send(responser.error("Pengguna Tidak Ditemukan", HttpStatus.NOT_FOUND));
        }

        try {

            await AdminModel.updateOne({
                _id: req.body.user_id
            }, {
                $set: {
                    name: req.body.name,
                }
            }, { upsert: true })
                .select({
                    otpEmail: 0,
                    otpSms: 0,
                    addresses: 0
                })

            res.status(HttpStatus.OK).send(responser.success({},
                "Nama Diperbarui",
            ))
        } catch (err) {

            res.status(HttpStatus.BAD_REQUEST).send(responser.success([],
                "Tidak Bisa Mengganti Nama",
                HttpStatus.BAD_REQUEST))
        }

    }

    async getCurrentUser(req, res) {

        try {

            const admin = req.admin

            res.status(HttpStatus.OK).send(responser.success(admin,
                "OK",
                HttpStatus.OK))
        }
        catch (err) {

            res.status(HttpStatus.UNAUTHORIZED).send(responser.success([],
                "Gagal Memuat Data",
                HttpStatus.UNAUTHORIZED))
        }
    }

    async changeEmail(req, res) {

        const { error } = changeEmailUser(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        let isValid = this.isIdValid(req.body.user_id)

        if (!isValid) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error("ID Pengguna Tidak Valid", HttpStatus.BAD_REQUEST)
            );
        }

        const userExist = await AdminModel.findOne({ _id: req.body.user_id })

        if (!userExist) {
            return res.status(HttpStatus.NOT_FOUND).send(responser.error("Pengguna Tidak Ditemukan", HttpStatus.NOT_FOUND));
        }

        if (req.body.new_email.toLowerCase() === userExist.email.toLowerCase()) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Anda Memasukkan Alamat Email Yang Sama Dengan Alamat Email Saat Ini", HttpStatus.BAD_REQUEST));
        }

        const emailExist = await AdminModel.findOne({ email: req.body.new_email })

        if (emailExist) {
            return res.status(HttpStatus.CONFLICT).send(responser.error("Alamat Email Yang Anda Masukkan Telah Terdaftar", HttpStatus.CONFLICT));
        }

        try {
            const user = await AdminModel.findOneAndUpdate(
                req.body.user_id, {
                $set: {
                    email: req.body.new_email,
                    "otpEmail": {
                        "code": 0,
                        "attempts": 0,
                        "expired": false,
                        "expiredDate": Date.now()
                    },
                    "isEmailVerified": false
                }
            }, {
                new: true
            }).select({
                otpEmail: 0,
                otpSms: 0,
                addresses: 0,
                password: 0
            })

            res.status(HttpStatus.OK).send(responser.success(user,
                "Email Diperbarui, Harap Login Kembali"
            ))
        } catch (err) {

            res.status(HttpStatus.BAD_REQUEST).send(responser.error(
                "Tidak Bisa Perbarui Email",
                HttpStatus.BAD_REQUEST))
        }

    }

    async updateActiveUser(req, res) {

        const { error } = updateActiveUserValidation(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        let isValid = this.isIdValid(req.body.user_id)

        if (!isValid) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error("User ID Tidak Valid", HttpStatus.BAD_REQUEST)
            );
        }

        const userExist = await UserModel.findOne({ _id: req.body.user_id })

        if (!userExist) {
            return res.status(HttpStatus.NOT_FOUND).send(responser.error("Pengguna Tidak Ditemukan", HttpStatus.NOT_FOUND));
        }

        let message = req.body.active ? "Akun Telah Diaktifkan" : "Akun Telah Di Non-Aktifkan"

        await UserModel.updateOne({
            _id: req.body.user_id
        }, {
            $set: {
                isActive: req.body.active

            }
        })

        client.del(`${userExist._id}`);

        return res.status(HttpStatus.OK).send(responser.success({}, message))
    }

    async changePassword(req, res) {

        const { error } = changePasswordValidator(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        const getUserById = await AdminModel.findOne({
            _id: req.body.user_id
        })

        if (!getUserById) {
            return res.status(HttpStatus.NOT_FOUND).send(responser.validation("Pengguna Tidak Ditemukan", HttpStatus.NOT_FOUND))
        }

        const salt = await bcrypt.genSalt(10);
        const newPassword = await bcrypt.hash(req.body.password, salt)
        const validPass = await bcrypt.compare(req.body.old_password, getUserById.password)

        if (!validPass) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation("Kata Sandi Lama Tidak Sesuai", HttpStatus.OK))
        }

        if (req.body.password !== req.body.password_confirmation) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation("Password Tidak Sesuai", HttpStatus.OK))
        }

        if (req.body.password === req.body.old_password) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation("Anda Memasukkan Kata Sandi Yang Sama", HttpStatus.OK))
        }

        try {

            await AdminModel.updateOne({
                _id: req.body.user_id
            }, {
                password: newPassword,
                passwordLastUpdate: Date.now()
            }, {
                upsert: true
            })

            const admin = await AdminModel.findOne({ _id: req.body.user_id })

            admin.otpEmail = undefined
            admin.otpSms = undefined
            admin.password = undefined
            admin.addresses = undefined

            res.status(HttpStatus.OK).send(responser.success(admin,
                "Kata Sandi Berhasil Di Perbarui"))

        } catch (err) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error("Tidak Bisa Mengubah Kata Sandi", HttpStatus.BAD_REQUEST)
            );
        }
    }

    async setOrderStatus(req, res) {

        const { error } = setOrderStatusValidator(req.body)

        let isValid = this.isIdValid(req.body.user_id)

        if (!isValid) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error("User ID Tidak Valid", HttpStatus.BAD_REQUEST)
            );
        }

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        const getUserById = await UserModel.findOne({
            _id: req.body.user_id
        })

        if (!getUserById) {
            return res.status(HttpStatus.NOT_FOUND).send(responser.error("Pengguna Tidak Ditemukan", HttpStatus.NOT_FOUND));
        }

        const getOrderById = await OrderModel.findOne({
            order_id: req.params.orderId,
            "user._id": req.body.user_id
        })

        if (!getOrderById) {
            return res.status(HttpStatus.NOT_FOUND).send(responser.error("Pesanan Tidak Ditemukan", HttpStatus.NOT_FOUND));
        }

        if (parseInt(req.body.order.status_code) === parseInt(paymentStatus.PAYMENT_SUCCESS.code)) {
            return res.status(HttpStatus.OK).send(responser.error("Tidak Bisa Mengubah Pesanan Yang Telah Terbayar"));
        }

        try {

            const payment = Object.entries(paymentStatus).filter(status => {

                if (parseInt(req.body.order.status_code) === status[1].code) {
                    return status
                }

            })

            if (payment.length <= 0) {
                return res.status(HttpStatus.NOT_FOUND).send(responser.error(`Status Code: ${req.body.order.status_code}, Not Found`, HttpStatus.NOT_FOUND));
            }

            await OrderModel.updateOne({
                order_id: req.params.orderId,
            }, {
                $set: {
                    'payment.payment_status_code': req.body.order.status_code,
                    'payment.payment_status_desc': req.body.order.note ?? "",
                    'order_status.status': payment[0][0],
                    'order_status.payment_date': date.time(),
                    'order_status.description': payment[0][1].description,
                }
            }, { upsert: true })

            return res.status(HttpStatus.OK).send(responser.success("Pesanan Telah Diubah"));

        } catch (err) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(responser.error("Tidak Dapat Mengubah Pembayaran", HttpStatus.INTERNAL_SERVER_ERROR));

        }

    }

    async checkPaymentStatusCode(payment_status_code_response) {

        return Object.keys(paymentStatus).filter((key) => payment_status_code_response === paymentStatus[key].code)

    }

    isIdValid(id) {
        if (mongoose.isValidObjectId(id)) {
            return true
        }
        return false
    }
}

module.exports = new UsersController