const mongoose = require('mongoose');
require('dotenv').config()

mongoose
    .connect(process.env.DATABASE_URI, {
        useUnifiedTopology: true
    })
    .then(() => {
        console.log('Connected To Database')
    })
    .catch((err) => {
        console.log(`Error from database: ${err}`)
    })


mongoose.connection.on('connected', () => {
    console.log('Mongoose Connected To Database')
})

mongoose.connection.on('err', (err) => {
    console.log(`Error from database: ${err}`)
})

mongoose.connection.on('disconnected', () => {
    console.log(`Database Disconnected`)
})

process.on('SIGINT', async () => {
    await mongoose.connection.close()

    process.exit(0)
})