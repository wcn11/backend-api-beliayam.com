module.exports = {
    phone(value, helper, min = 7, max = 15) {

        const number = value.toString().length

        if (number >= min && number <= max) {
            return value;
        } else if (number < min) {
            return helper.message(`Nomor Telepon arus terdiri min. ${min} digit`)
        } else if (number > max) {
            return helper.message(`Nomor Telepon maks. ${max} digit`)
        } else {
            return value;
        }

    }
}