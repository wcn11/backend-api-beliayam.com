const router = require('express').Router();

const UserController = require('@controller/Admin/Users/Users.controller')

router.get('/', (req, res) => UserController.getUsers(req, res))

router.get('/time-range/client', (req, res) => UserController.getUsersByRangeTime(req, res))

router.get('/:userId', (req, res) => UserController.getUserById(req, res))
router.put('/:user_id/active', (req, res) => UserController.updateActiveUser(req, res))

router.put('/profile/name/change', (req, res) => UserController.changeName(req, res))
router.put('/profile/email/change', (req, res) => UserController.changeEmail(req, res))

router.post('/profile/email/resend', (req, res) => UserController.resendVerifyEmail(req, res))

// router.post('/phone', (req, res) => UserController.addPhone(req, res))
// router.post('/phone/verify', (req, res) => AuthController.verifyPhoneByUserId(req, res))
router.post('/phone/resend', (req, res) => UserController.resendOtpVerifyPhone(req, res))

router.get('/:userId/address', (req, res) => { UserController.getAddressesByUserId(req, res) })
router.get('/:userId/address/:addressId', (req, res) => { UserController.getAddressByUserIdAndAddressId(req, res) })
// router.get('/address/:addressId', (req, res) => { AddressController.getAddressByUserId(req, res) })
// router.put('/address/:addressId', (req, res) => { AddressController.updateAdressByAddressId(req, res) })
// router.post('/address', (req, res) => { AddressController.storeAdressByUserId(req, res) })
// router.delete('/address/:addressId', (req, res) => { AddressController.deleteAddressByAddressId(req, res) })

router.get('/orders', (req, res) => UserController.getOrders(req, res))

router.put('/orders/:orderId/status', (req, res) => UserController.setOrderStatus(req, res))

module.exports = router;