//----KONFIGURACIJA----//
const config = require('./utils/config');
const express = require('express');
require('express-async-errors');
const app = express();
const cors = require('cors');

//----CONTROLLERI----//
const loginRouter = require('./controllers/login');
const userRouter = require('./controllers/users');
const convoRouter = require('./controllers/conversations');
const messageRouter = require('./controllers/messages');

//----MIDDLEWARE----//
const middleware = require('./utils/middleware');
const mongoose = require('mongoose');

//----SPAJANJE NA BAZU----//
const databaseConnect = async () => {
    // TODO - whitelistat periodično sve adrese (0.0.0.0/0)

    // UnhandledPromiseRejectionWarning: MongooseServerSelectionError: 
    // Could not connect to any servers in your MongoDB Atlas cluster. 
    // One common reason is that you're trying to access the database 
    // from an IP that isn't whitelisted.

    console.log("Čekam spajanje na bazu...");

    await mongoose.connect(config.DB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false
    });

    console.log("Spojen sam na bazu.");
}

databaseConnect();

//----UKLJUČIVANJE MIDDLEWAREA----//
app.use(cors());
app.use(express.json());
app.use(middleware.restApiInfo);

//----RUTE ZA KONTROLLERE----//
app.use('/api/login', loginRouter);
app.use('/api/users', userRouter);
app.use('/api/convo', convoRouter);
app.use('/api/message', messageRouter);

//----CUSTOM MIDDLEWARE----//
app.use(middleware.unknownRouteInfo);
app.use(middleware.errorHandler);

module.exports = app;