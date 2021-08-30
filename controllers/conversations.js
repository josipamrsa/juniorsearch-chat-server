//----KONFIGURACIJA----//

//----Middleware----//
const auth = require('../utils/middleware').authCheck;

//----Router----//
const convoRouter = require('express').Router();

//----Modeli----//
const Conversation = require('../models/conversation');
const User = require('../models/user');

//----POMOĆNE METODE----//

// Provjeri s kojim korisnicima je započet razgovor
const checkConversationHistory = (userId, history) => {
    /*
        1. Iz povijesti razgovora dohvati sve razgovore (svi detalji razgovra)
        2. Ako u određenom razgovoru postoji korisnički identifikator, vrati 
           identifikator razgovora
    */

    const convos = history.map(h => {
        if (h.users.includes(userId))
            return h._id;
    });

    return convos;
}

//----METODE----//

// Dohvati detalje razgovora (pomoćna/testna)
convoRouter.get('/', async (req, res) => {
    const convos = await Conversation.find({});
    res.json(convos);
});

// Otvori postojeći razgovor s korisnikom
convoRouter.post('/open', async (req, res) => {
    /*
        1. Dohvati dva korisnika koji imaju zajednički razgovor
        2. Ako neki od njih ne postoji, vrati obavijest o tome
        3. Ako postoje, nađi zajednički razgovor dva korisnika
            a. Uzmi razgovore prvog korisnika
            b. Za svaki razgovor profiltriraj listu drugog korisnika
            c. Ako u listi drugog postoji isti identifikator razgovora,
               korisnici onda imaju zajednički započeti razgovor
        4. Pronađi postojeći razgovor u bazi podataka i dohvati detalje
        5. Ako razgovor ne postoji, odgovori sa greškom
        6. Ako razgovor postoji, odgovori sa detaljima
    */

    const [first, second] = req.body;

    let firstUser = await User.findOne({ phoneNumber: first });
    let secondUser = await User.findOne({ phoneNumber: second });

    if (!firstUser || !secondUser) {
        return res.status(404).json({ errorShort: "One or both users do not exist!" });
    }

    const convoId = firstUser.conversations
        .filter(convo => secondUser.conversations.includes(convo));

    const currentConvo = await Conversation
        .findById(convoId)
        .populate(
            {
                path: 'messages',
                populate: { path: 'author' }
            });

    if (!currentConvo) {
        return res.status(404).json({ errorShort: "Conversation does not exist!" });
    }

    res.json(currentConvo);
});

// Dohvati postojeće korisnike za razgovor
convoRouter.get('/:phone', async (req, res) => {
    /*
        1. Preko korisnikovog broja mobitela dohvati ostale podatke
        2. Ako korisnik ne postoji, odgovori s greškom
        3. Dohvati sve ostale korisnike u aplikaciji koji nisu prijavljeni korisnik 
           (i detaljno razgovore)
        4. Profiltriraj korisnike na one s kojima je započet razgovor i s kojima 
           nije započet razgovor (koristeći pomoćnu metodu definiranu prije)
        5. Formiraj skup potrebnih podataka i pošalji kao odgovor 
    */

    const userPhone = req.params.phone;
    const user = await User.findOne({ phoneNumber: userPhone }).populate('conversations');

    if (!user) {
        return res.status(404).json({ errorShort: "User does not exist!" });
    }

    const allUsers = await User.find({
        phoneNumber: { $ne: userPhone }
    }).populate('conversations');

    const usersWhereConversed = allUsers.filter(u => {
        const convos = checkConversationHistory(user._id, u.conversations);
        if (convos.length !== 0 && !convos.includes(null)) return u;
    });

    const usersWhereNotConversed = allUsers.filter(u => {
        const convos = checkConversationHistory(user._id, u.conversations);
        if (convos.length === 0 || convos.includes(null)) return u;
    });

    const userList = {
        fullName: `${user.firstName} ${user.lastName}`,
        activeConnection: user.activeConnection,
        chatted: usersWhereConversed,
        notChatted: usersWhereNotConversed
    }

    res.json(userList);
});

// Obriši razgovor
convoRouter.delete('/:id', auth, async (req, res) => {
    /*
        1. Dohvati identifikator razgovora i povezane korisnike
        2. Pronađi korisnike i vrati eventualnu grešku ako netko ne postoji
        3. Dohvati razgovor po poslanom identifikatoru
        4. Ako ne postoji odgovori s greškom, u protivnom ukloni razgovor
        5. Profiltriraj liste oba korisnika i izbaci taj identifikator, 
           spremi promjene za oba korisnika
        6. Pošalji odgovor praznog sadržaja
    */

    const convoId = req.params.id;
    const [first, second] = req.body.users;

    let firstUser = await User.findOne({ phoneNumber: first });
    let secondUser = await User.findOne({ phoneNumber: second });

    if (!firstUser || !secondUser) {
        return res.status(404).json({ errorShort: "One or both users do not exist!" });
    }

    const convo = await Conversation.findById(convoId);
    if (!convo) {
        return res.status(404).json({ errorShort: "Conversation does not exist!" });
    }

    await Conversation.findByIdAndRemove(convoId);

    firstUser.conversations = firstUser.conversations.filter(f => f.toString() !== convoId);
    secondUser.conversations = secondUser.conversations.filter(f => f.toString() !== convoId);

    await firstUser.save();
    await secondUser.save();

    res.status(204).end();
});

// Započni razgovor
convoRouter.post('/', auth, async (req, res) => {
    /*
        1. Dohvati korisnike za razgovor, ako ne postoje vrati grešku
        2. Ako postoje, stvori novi razgovor s potrebnim detaljima
        3. Ažuriraj podatke oba korisnika s novostvorenim razgovorom
        4. Odgovori s eventualnim greškama ako su se dogodile
    */

    const [first, second] = req.body;

    let firstUser = await User.findOne({ phoneNumber: first });
    let secondUser = await User.findOne({ phoneNumber: second });

    if (!firstUser || !secondUser) {
        return res.status(404).json({ errorShort: "One or both users do not exist!" });
    }

    const newConvo = new Conversation({
        users: [firstUser, secondUser],
        messages: []
    });

    firstUser.conversations = firstUser.conversations.concat(newConvo.id);
    secondUser.conversations = secondUser.conversations.concat(newConvo.id);

    await firstUser.save();
    await secondUser.save();

    const convo = await newConvo.save();
    res.json(convo);
});

module.exports = convoRouter;

