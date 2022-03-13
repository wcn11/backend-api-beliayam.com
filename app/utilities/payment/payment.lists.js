var Module = require('module');
var fs = require('fs');

Module._extensions['.png'] = function (module, fn) {
    var base64 = fs.readFileSync(fn).toString('base64');
    module._compile('module.exports="data:image/png;base64,' + base64 + '"', fn);
};


payment_channels = [
    {
        "pg_code": "101",
        "pg_name": "Cash On Delivery (Bayar Di Tempat)",
        "type": "cash",
        "icon": require("@public/images/icon/payment-gateway/cash.png")

    },
    {
        "pg_code": "707",
        "pg_name": "ALFAGROUP",
        "type": "retail",
        "icon": require("@public/images/icon/payment-gateway/alfamart.png")

    },
    {
        "pg_code": "702",
        "pg_name": "BCA Virtual Account",
        "type": "va",
        "icon": require("@public/images/icon/payment-gateway/bca.png")

    },
    {
        "pg_code": "801",
        "pg_name": "BNI Virtual Account",
        "type": "va",
        "icon": require("@public/images/icon/payment-gateway/bni.png")

    },
    {
        "pg_code": "800",
        "pg_name": "BRI Virtual Account",
        "type": "va",
        "icon": require("@public/images/icon/payment-gateway/bri.png")

    },
    {
        "pg_code": "825",
        "pg_name": "CIMB VA",
        "type": "va",
        "icon": require("@public/images/icon/payment-gateway/cimb.png")

    },
    {
        "pg_code": "819",
        "pg_name": "DANA",
        "type": "emoney",
        "icon": require("@public/images/icon/payment-gateway/dana.png")

    },
    {
        "pg_code": "701",
        "pg_name": "DANAMON ONLINE BANKING",
        "type": "ibanking",
        "icon": require("@public/images/icon/payment-gateway/danamon-aja.png")

    },
    {
        "pg_code": "708",
        "pg_name": "Danamon VA",
        "type": "va",
        "icon": require("@public/images/icon/payment-gateway/danamon.png")

    },
    {
        "pg_code": "302",
        "pg_name": "LinkAja",
        "type": "emoney",
        "icon": require("@public/images/icon/payment-gateway/link.png")

    },
    {
        "pg_code": "716",
        "pg_name": "Linkaja App",
        "type": "jumpapp",
        "icon": require("@public/images/icon/payment-gateway/link-app.png")

    },
    {
        "pg_code": "802",
        "pg_name": "Mandiri Virtual Account",
        "type": "va",
        "icon": require("@public/images/icon/payment-gateway/mandiri.png")

    },
    // {
    //     "pg_code": "814",
    //     "pg_name": "Maybank2U",
    //     "type": "ibanking",
        // "icon": require("@public/images/icon/payment-gateway/maybank2u.png")

    // },
    {
        "pg_code": "408",
        "pg_name": "Maybank Virtual Account",
        "type": "va",
        "icon": require("@public/images/icon/payment-gateway/maybank.png")

    },
    {
        "pg_code": "812",
        "pg_name": "OVO",
        "type": "emoney",
        "icon": require("@public/images/icon/payment-gateway/ovo.png")

    },
    {
        "pg_code": "402",
        "pg_name": "Permata Virtual Account",
        "type": "va",
        "icon": require("@public/images/icon/payment-gateway/permata.png")

    },
    // {
    //     "pg_code": "420",
    //     "pg_name": "Permata Net",
    //     "type": "ibanking",
        // "icon": require("@public/images/icon/payment-gateway/permata.png")

    // },
    {
        "pg_code": "713",
        "pg_name": "ShopeePay App",
        "type": "emoney",
        "icon": require("@public/images/icon/payment-gateway/shopee.png")

    },
    {
        "pg_code": "711",
        "pg_name": "ShopeePay QRIS",
        "type": "qris",
        "icon": require("@public/images/icon/payment-gateway/shopee-qris.png")

    },
    {
        "pg_code": "818",
        "pg_name": "Sinarmas Virtual Account",
        "type": "va",
        "icon": require("@public/images/icon/payment-gateway/sinarmas.png")

    }
]

module.exports = payment_channels;