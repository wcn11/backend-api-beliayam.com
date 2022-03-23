const Router = require('express').Router();

const verifyToken = require('@middleware/authAdmin/verifyToken')

// routes
// const AdminRouter = require('@router/admin/admin.routes')
const AuthRouter = require('@router/admin/auth/auth.routes')

const CategoryRouter = require('@router/admin/category/category.routes')
// const CartRouter = require('@router/cart/cart.routes')
const ChargeRouter = require('@router/admin/charge/charge.routes')
// const CheckoutRouter = require('@router/checkout/checkout.routes')
const OrderRouter = require('@router/admin/order/order.routes')
const ProductRouter = require('@router/admin/product/product.routes')
// const PaymentRouter = require('@router/payment/payment.routes')
const SalesRouter = require('@router/admin/sales/sales.routes')
const PromoRouter = require('@router/admin/promo/promo.routes')
const AdminRouter = require('@router/admin/admin/admin.routes')
const UsersRouter = require('@router/admin/users/users.routes')
const VoucherRouter = require('@router/admin/voucher/voucher.routes')

Router.use('/auth', AuthRouter)

Router.use('/charge', ChargeRouter, verifyToken)

Router.use('/category', CategoryRouter, verifyToken)

Router.use('/order', OrderRouter, verifyToken)

Router.use('/product', ProductRouter, verifyToken)

Router.use('/sales', SalesRouter, verifyToken)

Router.use('/promo', PromoRouter, verifyToken)

Router.use('/user', AdminRouter, verifyToken)

Router.use('/users', UsersRouter, verifyToken)

Router.use('/voucher', VoucherRouter, verifyToken)

module.exports = Router