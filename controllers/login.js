//----KONFIGURACIJA----//

//----Middleware----//
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

//----Router----//
const loginRouter = require('express').Router();

//----Modeli----//
const User = require('../models/user');

//----METODE----//

// Autentifikacija korisnika
loginRouter.post('/', async (req, res) => {
    /*
        1. Dohvati podatke te pronađi korisnika
        2. Ako je korisnik pronađen, provjeri hash šifre
        3. Ako nema korisnika ili je šifra neispravna, odgovori s greškom
        4. U protivnom spremi podatke za generiranje u token
        5. Generiraj token, te pošalji podatke u odgovoru
    */
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