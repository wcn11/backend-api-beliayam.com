const Router = require('express').Router();

// routes
const AdminRouter = require('@router/admin/admin.routes')
const AuthRouter = require('@router/auth/auth.routes')

const CategoryRouter = require('@router/category/category.routes')
const CartRouter = require('@router/cart/cart.routes')
const ChargeRouter = require('@router/charge/charge.routes')
const CheckoutRouter = require('@router/checkout/checkout.routes')
const ProductRouter = require('@router/product/product.routes')
const PromoRouter = require('@router/promo/promo.routes')
const UserRouter = require('@router/user/user.routes')
const VoucherRouter = require('@router/voucher/voucher.routes')

Router.use('/admin', AdminRouter)

Router.use('/auth', AuthRouter)

Router.use('/category', CategoryRouter)

Router.use('/cart', CartRouter)

Router.use('/charge', ChargeRouter)

Router.use('/checkout', CheckoutRouter)

Router.use('/product', ProductRouter)

Router.use('/promo', PromoRouter)

Router.use('/users', UserRouter)

Router.use('/voucher', VoucherRouter)

module.exports = Router