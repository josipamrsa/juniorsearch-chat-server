//----KONFIGURACIJA----//

const auth = require('../utils/middleware').authCheck;

const messageRouter = require('express').Router();

const Conversation = require('../models/conversation');
const Message = require('../models/message');
const User = require('../models/user');

//----METODE----//

messageRouter.post('/:id', auth, async (req, res) => {
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

messageRouter.get('/:id', auth, async (req, res) => {
    const convoId = req.params.id;
    const convo = await Conversation.findById(convoId).populate('messages');

    if (!convo) {
        return res.status(404).json({ errorShort: "Conversation does not exist!" });
    }

    res.json(convo);
});

module.exports = messageRouter;

