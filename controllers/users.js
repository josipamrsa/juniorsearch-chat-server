//----KONFIGURACIJA----//

//----Middleware----//
const bcrypt = require('bcrypt');
const auth = require('../utils/middleware').authCheck;

//----Router----//
const userRouter = require('express').Router();

//----Modeli----//
const User = require('../models/user');

//----METODE----//

// Dohvati sve korisnike (pomoćna/testna)
userRouter.get('/', auth, async (req, res) => {
    const users = await User.find({});
    res.json(users);
});

// Promijeni online status prijavljenog korisnika
userRouter.put('/online/:phone', auth, async (req, res) => {
    /*
        1. Dohvati potrebne podatke (korisnički broj mobitela, aktivni socket 
           identifikator i oznaka koja služi za promjenu online/offline statusa) 
        2. Pronađi korisnika i odgovori s greškom ako ne postoji
        3. Ažuriraj online status korisnika prema podatku sadržanom u isOnline
        4. Dohvati podatke korisnika i ažuriraj online status
    */

    const userPhone = req.params.phone;
    const activeSocket = req.body.socket;
    const isOnline = req.body.onlineTag;

    const user = await User.findOne({ phoneNumber: userPhone });

    if (!user) {
        return res.status(404).json({ errorShort: "User does not exist!" });
    }

    const updateOnlineStatus = {
        activeConnection: isOnline ? activeSocket : ""
    }

    const onlineUser = await User.findByIdAndUpdate(
        user._id,
        updateOnlineStatus,
        { new: true }
    );

    res.json(onlineUser);
});

// Registracija korisnika
userRouter.post('/', async (req, res) => {
    const data = req.body;
    const rounds = 10;
    const passHash = await bcrypt.hash(data.pass, rounds);

    const user = new User({
        phoneNumber: data.phoneNumber,
        email: data.email,
        passHash: passHash,
        firstName: data.firstName,
        lastName: data.lastName,
        activeConnection: "",
        currentResidence: data.location,
        conversations: []
    });

    const savedUser = await user.save();
    res.json(savedUser);
});

// Uređivanje podataka korisnika
userRouter.put('/:phone', auth, async (req, res) => {
    /*
        1. Dohvati potrebne podatke i pronađi korisnika
        2. Ako ne postoji, odgovori s greškom
        3. Ako postoji, stvori objekt s novim podacima i ažuriraj
           podatke dohvaćenog korisnika
        4. Vrati odgovor s podacima
    */

    const userPhone = req.params.phone;
    const update = req.body;

    const user = await User.findOne({ phoneNumber: userPhone });
    if (!user) {
        return res.status(404).json({ errorShort: "User does not exist!" });
    }

    const userUpdate = {
        email: update.email,
        currentResidence: update.location,
        firstName: update.firstName,
        lastName: update.lastName,
        activeConnection: user.activeConnection,
        conversations: user.conversations
    }

    const updatedUser = await User.findByIdAndUpdate(
        user._id,
        userUpdate,
        {
            new: true,           // vrati dokument s apliciranim promjenama
            runValidators: true, // da pokrene validatore, jer inače samo spremi sve (po defaultu updateovi ne koriste validaciju)
            context: 'query'     // bez ovog validatori bacaju grešku ("technical reasons")
        }
    );

    res.json(updatedUser);
});

// Brisanje korisnika (pomoćna/testna)
userRouter.delete('/:id', auth, async (req, res) => {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ errorShort: "User does not exist!" });
    }

    await User.findByIdAndRemove(userId);
    res.status(204).end();
});

module.exports = userRouter;