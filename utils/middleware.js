const fs = require('fs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Korisničke greške
const ERR_HANDLER = [
    {
        errorName: "CastError",
        status: 400,
        shortMessage: "Krivi format ID parametra!"
    },

    {
        errorName: "ValidationError",
        status: 400,
        shortMessage: "Pogreška pri validaciji!"
    },

    {
        errorName: "JsonWebTokenError",
        status: 401,
        shortMessage: "Neispravni token!"
    },
];

//----MIDDLEWARE----//

// vrati info o tipu zahtjeva
const restApiInfo = (req, res, next) => {
    console.log("Metoda: ", req.method);
    console.log("Putanja: ", req.path);
    console.log("Tijelo poruke", req.body);
    console.log("=====================");
    next();
};

// korisnik se zagubio (namjerno ili slučajno, ja u to ne ulazim)
const unknownRouteInfo = (req, res) => {
    res.writeHead(200, { 'content-type': 'text/html' });
    fs.createReadStream('./res/unknown.html').pipe(res);
};

// handler za najčešće tipove korisničkih grešaka i eventualne druge greške
const errorHandler = (err, req, res, next) => {
    const error = ERR_HANDLER.find(e => e.errorName === err.name);

    if (error) {
        return res.status(error.status).send({
            errorName: error.name,
            errorShort: error.shortMessage,
            errordetailed: err.message
        });
    }

    else {
        return res.status(500).send({
            errorName: err.name,
            errorShort: "Unknown Error!",
            errorDetailed: err.message
        });
    }

    next(err);
};

const authCheck = async (req, res, next) => {
    try {
        const token = fetchToken(req);
        const decoded = jwt.verify(token, process.env.SECRET);

        if (!token || !decoded) {
            return res.status(401).json({
                errorShort: 'Token is invalid or does not exist!'
            });
        }

        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                errorShort: "User does not exist!"
            });
        }

        next();

    } catch (err) {
        res.status(401).json({
            errorShort: err
        });
    }
}

const fetchToken = req => {
    const auth = req.get('authorization');
    if (auth && auth.toLowerCase().startsWith('bearer')) {
        return auth.substring(7);
    }

    return null;
}

module.exports = {
    unknownRouteInfo,
    errorHandler,
    restApiInfo,
    authCheck
};

