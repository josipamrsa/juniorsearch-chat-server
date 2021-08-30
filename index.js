//----KONFIGURACIJA----//
const app = require('./app');
const http = require('http');
const config = require('./utils/config');
const fs = require('fs');

//----SERVER----//
const server = http.createServer(app);

// Bypass CORS 
const io = require('socket.io')(server, {
    cors: {
        origin: "*"
    }
});

//----SOCKET.IO DOGAĐAJI----//
const USER_VERIFIED = "userVerified";
const NEW_USER_LOGGED_IN = "newUserLoggedIn";
const NEW_CONVERSATION_STARTED = "newConversationStarted";
const NEW_PRIVATE_MESSAGE = "newPrivateMessage";
const CONVERSATION_DELETED = "conversationDeleted";
const USER_LOGGED_OUT = "userLoggedOut";

//----KONFIGURACIJA SOCKET.IO----//
io.on("connection", (socket) => {
    // Nađi listu trenutno spojenih klijenata na server (pomoćna/testna)
    const users = [];

    for (let id of io.of("/").sockets) {
        users.push(id[0]);
    }

    console.log(users);
    console.log("connected");

    // Kad je korisnik verificiran, vrati obavijest o prijavi na aplikaciju
    socket.on(USER_VERIFIED, (data) => {
        console.log(data);
        socket.broadcast.emit(NEW_USER_LOGGED_IN, { notification: `User ${data.socketId} has logged in` });
    });

    // Kad korisnik šalje novu poruku, vrati drugom sudioniku detalje o poruci
    socket.on(NEW_PRIVATE_MESSAGE, (data) => {
        const participant = data.participant;

        io.to(participant).emit(NEW_PRIVATE_MESSAGE, {
            sender: socket.id,
            message: data.message,
            name: data.senderName
        });
    });

    // Kad korisnik pokrene razgovor s drugim, obavijesti drugog korisnika
    socket.on(NEW_CONVERSATION_STARTED, (data) => {
        const participant = data.participant;

        io.to(participant).emit(NEW_CONVERSATION_STARTED, {
            sender: socket.id,
            name: data.senderName
        })
    });

    // Kad korisnik obriše razgovor s drugim, obavijesti drugog korisnika
    socket.on(CONVERSATION_DELETED, (data) => {
        const participant = data.participant;

        io.to(participant).emit(CONVERSATION_DELETED, {
            sender: socket.id,
            name: data.senderName
        })
    });

    // Kad se korisnik odspoji s aplikacije, vrati obavijest o odjavi s aplikacije
    socket.on("disconnect", () => {
        socket.broadcast.emit(USER_LOGGED_OUT, { notification: `User ${socket.id} has logged out` });
        socket.disconnect();

        const users = [];
        for (let id of io.of("/").sockets) {
            users.push(id[0]);
        }

        console.log(users);
    });

});

// Pokreni server
server.listen(config.PORT, () => {
    console.log(`Server je pokrenut na portu ${config.PORT}`);
});