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
const NEW_CHAT_MESSAGE_EVENT = "newChatMessage";
const USER_VERIFIED = "userVerified";
const NEW_USER_LOGGED_IN = "newUserLoggedIn";

//----KONFIGURACIJA SOCKET.IO----//
io.on("connection", (socket) => {
    /* const users = [];
    for (let id of io.of("/").sockets) {
        users.push(id[0]);
    }
    console.log(users); */
    
    console.log("connected");

    // TODO - kad je korisnik verificiran - event
    socket.on(USER_VERIFIED, (data) => {
        console.log(data);
        io.emit(NEW_USER_LOGGED_IN, { notification: `User ${data.socketId} has logged in` });
    });

    socket.on("disconnect", () => {
        console.log("disconnected");
        socket.disconnect();

        /* const users = [];
        for (let id of io.of("/").sockets) {
            users.push(id[0]);
        }
        console.log(users); */
    });

});

server.listen(config.PORT, () => {
    console.log(`Server je pokrenut na portu ${config.PORT}`);
});