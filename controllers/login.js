//----KONFIGURACIJA----//
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const loginRouter = require('express').Router();
const User = require('../models/user');

//----ROUTER METODE----//

loginRouter.post('/', async (req, res) => {
    const data = req.body;
   
    const user = await User.findOne({ email: data.email });
    const isPassOk = user === null ?
        false :
        await bcrypt.compare(data.pass, user.passHash);

    if (!(user && isPassOk)) {
        return res.status(401).json({
            errorShort: 'Neispravno korisničko ime ili lozinka!'
        });
    }

    const userToken = {
        user: user.firstName + " " + user.lastName,
        id: user.id
    };

    const token = jwt.sign(userToken, process.env.SECRET);

    res.status(200).send({
        token,
        email: user.email,
        phone: user.phoneNumber
    });
});

module.exports = loginRouter;