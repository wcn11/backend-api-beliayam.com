const mongoose = require('mongoose');
const AdminModel = require('@model/admin/admin.model')
const bcrypt = require('bcryptjs')
const jwt = require('@helper/jwtAdmin')
const HttpStatus = require('@helper/http_status')
const responser = require('@responser')
const customId = require("custom-id");
const { v4: uuidv4 } = require('uuid');
// const SMSGateway = require('@service/SMS.gateway')
// const SendVerifyEmail = require('@mailService/SendVerifyEmail.mail')
// const SendForgetPassword = require('@mailService/SendForgetPassword.mail')

// const PusherNotification = require('@service/PushNotification')
const moment = require('moment')

const redis = require("@config/redis");

const {
    loginValidator,
    byPhone,
    registerValidator,
    emailVerify,
    registerByPhone,
    resendEmailVerify,
    resendPhoneVerify,
    verifyPhoneByUserOTPValidator,
    refreshTokenValidator,
    loginBySocialValidator,
    changePasswordValidator,
    resendSmsOtpRegisterValidator,
    verifySmsOtpRegisterValidator,
    sendEmailForgetPasswordValidator,
    verifyLinkForgetPasswordValidator,
} = require('@validation/admin/auth/auth.validation')

const AdminController = class AdminController {

    async register(req, res) {

        const { error } = registerValidator(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        const emailExist = await AdminModel.findOne({ email: req.body.email })

        if (emailExist) return res.status(HttpStatus.OK).send(responser.error(translate('admin.register.email_exist'), HttpStatus.OK))

        const usernameExist = await AdminModel.findOne({ username: req.body.username })

        if (usernameExist) return res.status(HttpStatus.OK).send(responser.error(translate('admin.register.username_exist'), HttpStatus.OK))

        const salt = await bcrypt.genSalt(10);

        try {

            let setPassword = await bcrypt.hash(req.body.password, salt)

            req.body.password = setPassword

            let adminObject = req.body

            if (req.body.roleId !== NaN) {
                adminObject.role = {
                    roleId: req.body.roleId ?? 1
                }
            }

            const adminData = new AdminModel(
                adminObject
            )

            await adminData.save()

            let admin = await AdminModel.findOne({ email: req.body.email })

            admin.password = undefined

            const loggedAdmin = {
                admin
            }

            const token = jwt.sign(loggedAdmin, admin._id)

            const refreshToken = uuidv4().toUpperCase()

            jwt.setCache('admin.' + admin._id, token, refreshToken)

            const tokenList = {

                "accessToken": token,
                "refreshToken": refreshToken
            }

            loggedAdmin['token'] = tokenList

            return res.header("Authorization", token).cookie('token', token).cookie('refreshToken', refreshToken).status(HttpStatus.OK)
                .send(responser.success(
                    loggedAdmin,
                    translate('admin.account.created'),
                    HttpStatus.OK));
        } catch (err) {
            res.status(HttpStatus.BAD_REQUEST).send(responser.error("Sementara Waktu Tidak Dapat Mendaftar"))
        }
    }

    async getCurrentSession(req, res) {
        const token = req.header('Authorization').split(" ")[1]

        const decode = jwt.verify(token, process.env.TOKEN_SECRET)
        return res.status(HttpStatus.OK).send(responser.success(decode, HttpStatus.OK));

    }

    async refreshToken(req, res) {

        const { error } = refreshTokenValidator(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        if (!req.header('Authorization')) return res.status(HttpStatus.FORBIDDEN).send(responser.error("Token Not Provided", HttpStatus.FORBIDDEN))

        const token = req.header('Authorization').split(" ")[1]

        if (!token) return res.status(HttpStatus.FORBIDDEN).send(responser.error("Token Not Provided", HttpStatus.FORBIDDEN))

        const decode = jwt.decode(token);

        if (!decode) {
            return res.status(HttpStatus.FORBIDDEN).send(responser.error("Invalid Token", HttpStatus.FORBIDDEN))
        }

        const cache = await redis.get(`admin.${decode.data.admin._id}`)

        if (!cache) {
            return res.status(HttpStatus.UNAUTHORIZED).send(responser.error("Invalid Refresh Token", HttpStatus.UNAUTHORIZED))
        }

        const payload = cache

        if (token !== payload.token) {
            return res.status(HttpStatus.FORBIDDEN).send(responser.error("Token Not Match", HttpStatus.FORBIDDEN))
        }

        if (req.body.refreshToken.toUpperCase() !== payload.refreshToken.toUpperCase()) {
            return res.status(HttpStatus.NOT_ACCEPTABLE).send(responser.error("Refresh Token Not Match", HttpStatus.NOT_ACCEPTABLE))
        }

        try {

            const admin = await AdminModel.findOne({ _id: decode.data.admin._id })

            if (!admin) {
                return res.status(HttpStatus.NOT_ACCEPTABLE).send(responser.error("Invalid Payload Refresh Token", HttpStatus.NOT_ACCEPTABLE))
            }

            admin.password = undefined

            const loggedAdmin = {
                admin
            }

            const token = jwt.sign(loggedAdmin, admin._id)

            const refreshToken = uuidv4().toUpperCase()

            jwt.setCache(`admin.${admin._id}`, token, refreshToken)

            const tokenList = {

                "accessToken": token,
                "refreshToken": refreshToken
            }

            loggedAdmin['token'] = tokenList

            return res.status(HttpStatus.OK).send(responser.success(loggedAdmin, "OK", HttpStatus.OK))

        } catch (err) {
            console.error(err)
            return res.status(HttpStatus.UNAUTHORIZED).send(responser.error("Session Expired", HttpStatus.UNAUTHORIZED))
        }

    }

    async login(req, res) {

        const { error } = loginValidator(req.body)

        if (error) {

            return res.status(HttpStatus.BAD_REQUEST).send(responser.error(error.details[0].message, HttpStatus.BAD_REQUEST));
        }

        let admin = await AdminModel.findOne({ email: req.body.email })

        if (!admin) return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Email Atau Kata Sandi Salah", HttpStatus.BAD_REQUEST));

        const validPass = await bcrypt.compare(req.body.password, admin.password)

        if (!validPass) return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Email Atau Kata Sandi Salah", HttpStatus.BAD_REQUEST));

        if (!admin.active) {
            res.status(HttpStatus.BAD_REQUEST).send(responser.error("Akun Telah Di Non-Aktifkan", HttpStatus.BAD_REQUEST));
        }

        admin.password = undefined

        const loggedAdmin = {
            admin
        }

        const token = jwt.sign(loggedAdmin, `admin.${admin._id}`)

        const refreshToken = uuidv4().toUpperCase()

        jwt.setCache(`admin.${admin._id}`, token, refreshToken)

        const tokenList = {

            "accessToken": token,
            "refreshToken": refreshToken
        }

        loggedAdmin['token'] = tokenList

        return res.header("Authorization", token).status(HttpStatus.OK).send(responser.success(loggedAdmin, "OK"));

    }

    async changePassword(req, res) {

        const { error } = changePassword(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        let isValid = await this.isIdValid(req.body.user_id)

        if (!isValid) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error("User ID Tidak Valid", HttpStatus.BAD_REQUEST)
            );
        }

        const userExist = await User.findOne({ _id: req.body.user_id })

        if (!userExist) {
            return res.status(HttpStatus.NOT_FOUND).send(responser.error("Pengguna Tidak Ditemukan", HttpStatus.NOT_FOUND));
        }

        const validPass = await bcrypt.compare(req.body.old_password, userExist.password)

        if (!validPass) return res.status(HttpStatus.NOT_ACCEPTABLE).send(responser.error("Kata Sandi Salah", HttpStatus.NOT_ACCEPTABLE))

        const salt = await bcrypt.genSalt(10);
        const newPassword = await bcrypt.hash(req.body.new_password, salt)

        try {
            const user = await User.updateOne({
                _id: req.body.user_id
            }, {
                password: newPassword,
                passwordLastUpdate: Date.now()
            }, {
                upsert: true
            })

            res.status(HttpStatus.OK).send(responser.success([],
                "Kata Sandi Berhasil Di Perbarui",
                HttpStatus.OK))
        } catch (err) {

            res.status(HttpStatus.BAD_REQUEST).send(responser.success([],
                "Tidak Bisa Mengganti Kata Sandi",
                HttpStatus.BAD_REQUEST))
        }

    }

    isIdValid(id) {
        if (mongoose.isValidObjectId(id)) {
            return true
        }
        return false
    }

}

module.exports = new AdminController