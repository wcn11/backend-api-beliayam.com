module.exports = {
    UNPROCESSED: {
        code: 0,
        name: "UNPROCESSED",
        type: "CHECKOUT",
        description: "Pembayaran Belum Di Proses"
    },
    IN_PROCESS: {
        code: 1,
        name: "IN_PROCESS",
        type: "CHECKOUT",
        description: "Pembayaran Dalam Proses"
    },
    PAYMENT_SUCCESS: {
        code: 2,
        name: "PAYMENT_SUCCESS",
        type: "CHECKOUT",
        description: "Pembayaran Berhasil"
    },
    PAYMENT_FAILED: {
        code: 3,
        name: "PAYMENT_FAILED",
        type: "CHECKOUT",
        description: "Pembayaran Gagal"
    },
    PAYMENT_REVERSAL: {
        code: 4,
        name: "PAYMENT_REVERSAL",
        type: "REFUND",
        description: "Pengembalian Dana"
    },
    NO_BILLS_FOUND: {
        code: 5,
        name: "NO_BILLS_FOUND",
        type: "CHECKOUT",
        description: "Pembayaran Gagal, Tidak Ditemukan Tagihan"
    },
    PAYMENT_EXPIRED: {
        code: 7,
        name: "PAYMENT_EXPIRED",
        type: "CHECKOUT",
        description: "Pembayaran Kadaluarsa"
    },
    PAYMENT_CANCELLED: {
        code: 8,
        name: "PAYMENT_CANCELLED",
        type: "CHECKOUT",
        description: "Pembayaran Dibatalkan"
    },
    UNKNOWN: {
        code: 9,
        name: "UNKNOWN",
        type: "CHECKOUT",
        description: "Tipe Pembayaran Tidak Diketahui"
    }
}