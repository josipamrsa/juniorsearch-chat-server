//----KONFIGURACIJA----//
const mongoose = require('mongoose');

//----SHEMA----//
const conversationSchema = new mongoose.Schema({
    users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    messages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    }],
});

// Override metode koja vraća podatke
conversationSchema.set('toJSON', {
    transform: (doc, ret) => {
        // transformacija ID-a u tip string
        ret.id = ret._id.toString();

        // vrijednosti koje ne želim vraćati
        delete ret._id;
        delete ret.__v;
        delete ret.passHash;

        return ret;
    }
});

// Stvaranje modela za kolekciju u bazi podataka
const Conversation = mongoose.model('Conversation', conversationSchema, 'conversations');
module.exports = Conversation;