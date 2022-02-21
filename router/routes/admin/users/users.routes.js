const router = require('express').Router();


// middleware
const verifyToken = require('@middleware/authAdmin/verifyToken')

// controller
// const AddressController = require('@controller/Address/Address.controller')
// const AuthController = require('@controller/Auth/Auth.controller')
const UserController = require('@controller/Admin/Users/Users.controller')

router.get('/', verifyToken, (req, res) => UserController.getUsers(req, res))

router.get('/:userId', verifyToken, (req, res) => UserController.getUserById(req, res))
router.put('/active', verifyToken, (req, res) => UserController.updateActiveUser(req, res))

router.put('/profile/name/change', verifyToken, (req, res) => UserController.changeName(req, res))
router.put('/profile/email/change', verifyToken, (req, res) => UserController.changeEmail(req, res))

router.post('/profile/email/resend', verifyToken, (req, res) => UserController.resendVerifyEmail(req, res))

// router.post('/phone', verifyToken, (req, res) => UserController.addPhone(req, res))
// router.post('/phone/verify', verifyToken, (req, res) => AuthController.verifyPhoneByUserId(req, res))
router.post('/phone/resend', verifyToken, (req, res) => UserController.resendOtpVerifyPhone(req, res))

router.get('/:userId/address', verifyToken, (req, res) => { UserController.getAddressesByUserId(req, res) })
router.get('/:userId/address/:addressId', verifyToken, (req, res) => { UserController.getAddressByUserIdAndAddressId(req, res) })
// router.get('/address/:addressId', verifyToken, (req, res) => { AddressController.getAddressByUserId(req, res) })
// router.put('/address/:addressId', verifyToken, (req, res) => { AddressController.updateAdressByAddressId(req, res) })
// router.post('/address', verifyToken, (req, res) => { AddressController.storeAdressByUserId(req, res) })
// router.delete('/address/:addressId', verifyToken, (req, res) => { AddressController.deleteAddressByAddressId(req, res) })

router.get('/orders', verifyToken, (req, res) => UserController.getOrders(req, res))

router.put('/orders/:orderId/status', verifyToken, (req, res) => UserController.setOrderStatus(req, res))

module.exports = router;