const Router = require('express').Router();

// routes
// const AdminRouter = require('@router/admin/admin.routes')
const AuthRouter = require('@router/admin/auth/auth.routes')

// const CategoryRouter = require('@router/category/category.routes')
// const CartRouter = require('@router/cart/cart.routes')
// const ChargeRouter = require('@router/charge/charge.routes')
// const CheckoutRouter = require('@router/checkout/checkout.routes')
// const OrderRouter = require('@router/order/order.routes')
// const ProductRouter = require('@router/product/product.routes')
// const PaymentRouter = require('@router/payment/payment.routes')
// const PromoRouter = require('@router/promo/promo.routes')
const UserRouter = require('@router/admin/user/user.routes')
// const VoucherRouter = require('@router/voucher/voucher.routes')



Router.use('/auth', AuthRouter)

Router.use('/user', UserRouter)

module.exports = Router