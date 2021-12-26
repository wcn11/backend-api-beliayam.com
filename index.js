const express = require('express');

const app = express();

const cors = require('cors');

// const bodyParser = require('body-parser');

require('pretty-error').start();

// require('./config/redis')
require('module-alias/register')

require('./config/database')

const handleErrors = require('./middleware/handleErrors');

// const whitelist = ['http://developer1.com', 'http://developer2.com']
app.use(cors({
    origin: ['http://localhost:8080'],
    // origin: (origin, callback) => {
    //     if (whitelist.indexOf(origin) !== -1) {
    //         callback(null, true)
    //     } else {
    //         callback(new Error())
    //     }
    // },
    methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH']
}));

const PORT = 4000;

app.use(express.urlencoded({
    extended: true
}));

app.use(express.json());

const router = require('./router/bootstrap')

app.use(router)
app.use(express.static(__dirname + '/public'));

app.use(handleErrors) // Errors middleware must be the last of any routes

app.listen(PORT, () => console.log(`Listen ${PORT}`))