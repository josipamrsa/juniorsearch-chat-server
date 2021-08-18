//----KONFIGURACIJA----//

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const auth = require('../utils/middleware').authCheck;

const userRouter = require('express').Router();

const User = require('../models/user');

//----ROUTER METODE----//

userRouter.get('/', auth, async (req, res) => {
    const users = await User.find({});
    res.json(users);
});

userRouter.put('/online/:phone', auth, async (req, res) => {
    console.log(req.params);
    console.log(req.body);
    const userPhone = req.params.phone;
    const activeSocket = req.body.socket; 
    const isOnline = req.body.onlineTag; // za uklanjanje socketa

    const user = await User.findOne({phoneNumber: userPhone});
    
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


userRouter.put('/:phone', auth, async (req, res) => {
    const userPhone = req.params.phone;
    const update = req.body;

    const user = await User.findOne({phoneNumber: userPhone});
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