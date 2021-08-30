//----KONFIGURACIJA----//
const mongoose = require('mongoose');

//----SHEMA----//
const messageSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
        minlength: 1
    },

    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation'
    },

    date: Date
});

// Override metode koja vraća podatke
messageSchema.set('toJSON', {
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
const Message = mongoose.model('Message', messageSchema, 'messages');
module.exports = Message;