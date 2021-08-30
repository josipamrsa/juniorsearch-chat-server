//----KONFIGURACIJA----//

//----Middleware----//
const auth = require('../utils/middleware').authCheck;

//----Router----//
const messageRouter = require('express').Router();

//----Modeli----//
const Conversation = require('../models/conversation');
const Message = require('../models/message');
const User = require('../models/user');

//----METODE----//

// Pošalji novu poruku u razgovor
messageRouter.post('/:id', auth, async (req, res) => {
    /*
        1. Dohvati identifikator razgovora, podatke i broj mobitela autora
        2. Provjeri postoje li korisnik i razgovor, te odgovori s greškom ako ne
        3. Ako postoje, stvori novu poruku, spremi je kao objekt i kao dio objekta razgovora
        4. Vrati odgovor s podacima
    */

    const convoId = req.params.id;
    const data = req.body;
    const userPhone = data.author;

    const convo = await Conversation.findById(convoId);
    const user = await User.findOne({ phoneNumber: userPhone });

    if (!convo) {
        return res.status(404).json({ errorShort: "Conversation does not exist!" });
    }

    if (!user) {
        return res.status(404).json({ errorShort: "User does not exist!" });
    }

    const message = new Message({
        content: data.content,
        author: user._id,
        date: Date.parse(data.dateSent),
        conversation: convoId
    });

    const newMessage = await message.save();
    convo.messages = convo.messages.concat(newMessage._id);
    
    const updatedConvo = await convo.save();
    res.json(updatedConvo); 
});

// Dohvati poruke vezane uz razgovor
messageRouter.get('/:id', auth, async (req, res) => {
    const convoId = req.params.id;
    const convo = await Conversation.findById(convoId).populate('messages');

    if (!convo) {
        return res.status(404).json({ errorShort: "Conversation does not exist!" });
    }

    res.json(convo);
});

// Brisanje svih poruka (testna/pomoćna metoda - ukloniti kasnije)
messageRouter.delete('/', async (req, res) => {
    await Message.deleteMany({}, () => console.log("deleted"));
    res.status(204).end();
}); 

module.exports = messageRouter;

