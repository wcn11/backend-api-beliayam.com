
let BASE_URL = process.env.FASPAY_PRODUCTION_BASE_URL
let FASPAY_MERCHANT_ID = process.env.FASPAY_PRODUCTION_MERCHANT_ID
let FASPAY_MERCHANT_NAME = process.env.FASPAY_PRODUCTION_MERCHANT_NAME
let FASPAY_USER_ID = process.env.FASPAY_PRODUCTION_USER_ID
let FASPAY_PASSWORD = process.env.FASPAY_PRODUCTION_PASSWORD

if (process.env.FASPAY_MODE !== 'production') {

    BASE_URL = process.env.FASPAY_DEVELOPMENT_BASE_URL
    FASPAY_MERCHANT_ID = process.env.FASPAY_DEVELOPMENT_MERCHANT_ID
    FASPAY_MERCHANT_NAME = process.env.FASPAY_DEVELOPMENT_MERCHANT_NAME
    FASPAY_USER_ID = process.env.FASPAY_DEVELOPMENT_USER_ID
    FASPAY_PASSWORD = process.env.FASPAY_DEVELOPMENT_PASSWORD

}

module.exports = {
    PAYMENT_CHANNEL: {
        baseURL: BASE_URL,
        method: 'POST',
        endpoint: "cvr/100001/10"
    },
    POST_DATA_TRANSACTION: {
        baseURL: BASE_URL,
        method: 'POST',
        endpoint: "cvr/300011/10"
    },
    CANCEL_TRANSACTION: {
        baseURL: BASE_URL,
        method: 'POST',
        endpoint: "cvr/100005/10"
    },
    BASE_URL,
    FASPAY_MERCHANT_ID,
    FASPAY_MERCHANT_NAME,
    FASPAY_USER_ID,
    FASPAY_PASSWORD
}

// module.exports = payment_uri;