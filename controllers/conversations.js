//----KONFIGURACIJA----//

const auth = require('../utils/middleware').authCheck;

const convoRouter = require('express').Router();

const Conversation = require('../models/conversation');
const User = require('../models/user');

const checkConversationHistory = (userId, history) => {
    const convos = history.filter(h => {
        if (h.users.includes(userId)) return h;
    });
    return convos;
}

//----METODE----//

convoRouter.get('/', async (req, res) => {
    const convos = await Conversation.find({});
    res.json(convos);
})

// Dohvati sve korisnike te podijeli na one 
// s kojima je započet razgovor i s kojima nije
convoRouter.get('/:phone', async (req, res) => {
    const userPhone = req.params.phone;
    const user = await User.findOne({ phoneNumber: userPhone }).populate('conversations');

    if (!user) {
        return res.status(404).json({ errorShort: "User does not exist!" });
    }

    const allUsers = await User.find({
        phoneNumber: { $ne: userPhone }
    }).populate('conversations');

    console.log(allUsers);

    const usersWhereConversed = allUsers.filter(u => {
        const convos = checkConversationHistory(user._id, u.conversations);
        if (convos.length !== 0) return u;
    });

    const usersWhereNotConversed = allUsers.filter(u => {
        const convos = checkConversationHistory(user._id, u.conversations);
        if (convos.length === 0) return u;
    });

    const userList = {
        chatted: usersWhereConversed,
        notChatted: usersWhereNotConversed
    }

    res.json(userList);
});

// Obriši razgovor
convoRouter.delete('/:id', auth, async (req, res) => {
    // TODO - long press za delete (klijent!!)
    const convoId = req.params.id;

    const convo = await Conversation.findById(convoId);
    if (!convo) {
        return res.status(404).json({ errorShort: "Conversation does not exist!" });
    }

    await Conversation.findByIdAndRemove(convoId);
    res.status(204).end();
});

// Započni razgovor
convoRouter.post('/', auth, async (req, res) => {
    const [first, second] = req.body.users;

    let firstUser = await User.findById(first);
    let secondUser = await User.findById(second);

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

