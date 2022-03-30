const express = require('express');

const app = express();

const cors = require('cors');
var path = require('path');

// const bodyParser = require('body-parser');

require('pretty-error').start();

// require('./config/redis')
require('module-alias/register')

require('./config/database')

global.globalConfig = require('./config/main')

global.translate = require('./config/lang').trans

const handleErrors = require('./middleware/handleErrors');

const setError = require('@utility/errors')

const Whitelist = require('@utility/ipwhitelist')

const CronJob = require('@service/Cron')

CronJob.CancelPaymentExpired()

app.use(cors({
    credentials: true,
    origin: '*',
    // (origin, callback) => {
    //     if (Whitelist.indexOf(origin) !== -1) {
    //         callback(null, true)
    //     } else {
    //         callback(new setError.GeneralError("Request Has Been Blocked By CORS policy", true, 301))
    //     }
    // },
    methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH', 'OPTIONS']
}));

app.options('*', cors()) 

const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({
    extended: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const router = require('./router/bootstrap.routers')

app.use(router)
app.use(handleErrors) // Errors middleware must be the last of any routes

app.listen(PORT, () => console.log(`Listen ${PORT}`))