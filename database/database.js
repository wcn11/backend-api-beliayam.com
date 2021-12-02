const mongoose = require('mongoose');
require('dotenv').config()

mongoose.Promise = global.Promise

const database = mongoose.connect(process.env.DATABASE_URI, {
    useUnifiedTopology: true
}).then((results) => {
    console.log('Connected To Database')
}).catch((err) => {
    console.log(`Error: ${err}`)
})

module.exports = database