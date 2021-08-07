//----KONFIGURACIJA----//
const app = require('./app');
const http = require('http');
const config = require('./utils/config');
const auth = require('./utils/middleware').authCheck;

//----SERVER----//
const server = http.createServer(app);

// Bypass CORS zaštite - potencijalni test sigurnosti?
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
const USER_LOGGED_OUT = "userLoggedOut";

//----KONFIGURACIJA SOCKET.IO----//
io.on("connection", (socket) => {
    const users = [];
    for (let id of io.of("/").sockets) {
        users.push(id[0]);
    }
    console.log(users);
    console.log("connected");

    // TODO - middleware za pronalazak punog ID-a korisnika (ime i prezime) - server?
    socket.on(USER_VERIFIED, (data) => {
        console.log(data);
        socket.broadcast.emit(NEW_USER_LOGGED_IN, { notification: `User ${data.socketId} has logged in` });
    });

    socket.on(NEW_PRIVATE_MESSAGE, (data) => {
        /* console.log(`MESSAGE: TO USER >> ${data.participant} >> FROM USER >> ${socket.id}`);
        console.log(data); */

        const participant = data.participant;
        io.to(participant).emit(NEW_PRIVATE_MESSAGE, {
            sender: socket.id,
            message: data.message
        });
    });

    socket.on(NEW_CONVERSATION_STARTED, (data) => {
        /* console.log(`MESSAGE: TO USER >> ${data.participant} >> FROM USER >> ${socket.id}`); */

        const participant = data.participant;
        io.to(participant).emit(NEW_CONVERSATION_STARTED, {
            sender: socket.id
        })
    });

    socket.on("disconnect", () => {
        console.log("disconnected");
        socket.broadcast.emit(USER_LOGGED_OUT, { notification: `User ${socket.id} has logged out` });
        
        socket.disconnect();

        const users = [];
        for (let id of io.of("/").sockets) {
            users.push(id[0]);
        }
        
        console.log(users);
    });

});

server.listen(config.PORT, () => {
    console.log(`Server je pokrenut na portu ${config.PORT}`);
});