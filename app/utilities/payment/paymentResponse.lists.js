module.exports = {
    SUCCESS: {
        code: "00",
        name: "Success",
        type: "OK",
        description: "Sukses"
    },
    INVALID_MERCHANT: {
        code: "03",
        name: "Invalid Merchant",
        type: "BAD_REQUEST",
        description: "Merchant Salah"
    },
    INLVALID_AMOUNT: {
        code: "13",
        name: "Invalid Amount",
        type: "BAD_REQUEST",
        description: "Jumlah Tidak Valid"
    },
    INVALID_ORDER: {
        code: "14",
        name: "Invalid Order",
        type: "BAD_REQUEST",
        description: "Pesanan Tidak Valid"
    },
    ORDER_CANCELLED: {
        code: "17",
        name: "Order Cancelled by Merchant/ Customer",
        type: "OK",
        description: "Pesanan Dibatalkan"
    },
    INVALID_CUSTOMER: {
        code: "18",
        name: "Invalid Customer or MSISDN is not found",
        type: "BAD_REQUEST",
        description: "Pelanggan tidak valid atau MSISDN tidak ditemukan"
    },
    SUBSCRIPTION_EXPIRED: {
        code: "21",
        name: "Subscription is Expired",
        type: "OK",
        description: "Langganan telah kedaluwarsa"
    },
    FORMAT_ERROR: {
        code: "30",
        name: "Format Error",
        type: "BAD_REQUEST",
        description: "Format Salah"
    },
    REQUEST_NOT_SUPPORTED: {
        code: "40",
        name: "Requested Function Not Supported",
        type: "BAD_REQUEST",
        description: "Fungsi yang Diminta tidak Didukung"
    },
    ORDER_EXPIRED: {
        code: "54",
        name: "Order is Expired",
        type: "OK",
        description: "Pesanan Kedaluwarsa"
    },
    INCORRECT_AUTH: {
        code: "55",
        name: "Incorrect User/Password",
        type: "BAD_REQUEST",
        description: "Autentikasi Pengguna Atau Password Salah"
    },
    SECURITY_VIOLATION: {
        code: "56",
        name: "Security Violation (from unknown IP-Address)",
        type: "BAD_REQUEST",
        description: "Pelanggaran Keamanan (dari Alamat IP yang tidak diketahui)"
    },
    NOT_ACTIVE: {
        code: "63",
        name: "Not Active / Suspended",
        type: "FORBIDDEN",
        description: "Tidak Aktif / Ditangguhkan"
    },
    INTERNAL_ERROR: {
        code: "66",
        name: "Internal Error",
        type: "INTERNAL_SERVER_ERROR",
        description: "Kesalahan Internal Gerbang Pembayaran"
    },
    PAYMENT_REVERSAL: {
        code: "80",
        name: "Payment Was Reversal",
        type: "PAYMENT_REQUIRED",
        description: "Pembayaran Terbalik"
    },
    ALREADY_PAID: {
        code: "81",
        name: "Already Been Paid",
        type: "NOT_MODIFIED",
        description: "Sudah Dibayar"
    },
    UNREGISTERED_ENTITY: {
        code: "82",
        name: "Unregistered Entity",
        type: "BAD_REQUEST",
        description: "Entitas Tidak Terdaftar"
    },
    PARAMETER_MANDATORY: {
        code: "83",
        name: "Parameter is mandatory",
        type: "BAD_REQUEST",
        description: "Parameter Dibutuhkan"
    },
    UNREGISTERED_PARAMETERS: {
        code: "84",
        name: "Unregistered Parameters",
        type: "BAD_REQUEST",
        description: "Parameter Tidak Terdaftar"
    },
    INSUFFICIENT_PARAMETERS: {
        code: "85",
        name: "Insufficient Paramaters",
        type: "BAD_REQUEST",
        description: "Parameter Tidak Memadai"
    },
    SYSTEM_MALFUNCTION: {
        code: "96",
        name: "System Malfunction",
        type: "INTERNAL_SERVER_ERROR",
        description: "Malfungsi Sistem"
    }
}