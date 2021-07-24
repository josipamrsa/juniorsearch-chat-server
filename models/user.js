//----KONFIGURACIJA----//
const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

//----POMOĆNE METODE----//

// Provjera ispravnosti email adrese
const validateEmail = (email) => {
    var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return re.test(email);
}

// Schema korisnika
const userSchema = new mongoose.Schema({
    // broj telefona (moguće način autentifikacije)
    phoneNumber: {
        type: String,
        unique: true,
        required: true,
        minlength: 1
    },

    // email adresa (sigurno način autentifikacije uz šifru)
    email: {
        type: String,
        unique: true,
        required: true,
        minlength: 1,
        validate: [validateEmail, 'E-mail adresa treba biti oblika prvi@drugi.domena']
    },

    // šifra korisnika
    passHash: {
        type: String,
        minlength: 6,
        required: true
    },

    // osobni podaci - ime
    firstName: {
        type: String,
        minlength: 3,
        required: true,
    },

    // osobni podaci - prezime
    lastName:  {
        type: String,
        minlength: 3,
        required: true,
    },

    activeConnection: {
        type: String
    },

    currentResidence: {
        type: String,
        minlength: 1
    },

    /* // trenutno mjesto boravišta
    
    // je li poslodavac ili posloprimac
    isEmployer: {
        type: Boolean,
        required: true
    },
    
    // navođenje skillova za posloprimca primarno
    skillSet: [],

    // link na detaljni CV
    cvLink: String,

    // ako je posloprimac negdje već zaposlen, ali primarno 
    // za poslodavca da se vidi gdje radi
    currentlyEmployed: String, */

    // povijest razgovora
    conversationHistory: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Conversation'
        }
    ]
});

// Provjeri jedinstvene vrijednosti
userSchema.plugin(uniqueValidator);

// Override metode koja vraća podatke
userSchema.set('toJSON', {
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
const User = mongoose.model('User', userSchema, 'users');
module.exports = User;