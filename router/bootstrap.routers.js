const Router = require('express').Router();

// routes
const AdminRouter = require('@router/admin/bootstrap.routers')
const AuthRouter = require('@router/auth/auth.routes')

const CategoryRouter = require('@router/category/category.routes')
const CartRouter = require('@router/cart/cart.routes')
const ChargeRouter = require('@router/charge/charge.routes')
const CheckoutRouter = require('@router/checkout/checkout.routes')
const OrderRouter = require('@router/order/order.routes')
const ProductRouter = require('@router/product/product.routes')
const PaymentRouter = require('@router/payment/payment.routes')
const PromoRouter = require('@router/promo/promo.routes')
const UserRouter = require('@router/user/user.routes')
const VoucherRouter = require('@router/voucher/voucher.routes')

Router.get('/test-cors', (req, res) => {

    return res.status(200).send("Test CORS Route")
})

Router.use('/api/v1/admin', AdminRouter)

Router.use('/api/v1/auth', AuthRouter)

Router.use('/api/v1/category', CategoryRouter)

Router.use('/api/v1/cart', CartRouter)

Router.use('/api/v1/charge', ChargeRouter)

Router.use('/api/v1/checkout', CheckoutRouter)

Router.use('/api/v1/order', OrderRouter)

Router.use('/api/v1/product', ProductRouter)

Router.use('/api/v1/payment', PaymentRouter)

Router.use('/api/v1/promo', PromoRouter)

Router.use('/api/v1/users', UserRouter)

Router.use('/api/v1/voucher', VoucherRouter)

Router.all('*', function (req, res) {
    return getFallbackWrongRoute(req, res)
});

function getFallbackWrongRoute(req, res) {

    return res.status(404).send({
        message: "URL Not Found",
        error: true,
        code: 404
    })
}

module.exports = Router