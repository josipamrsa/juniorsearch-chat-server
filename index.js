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
const UPDATE_USERS_ONLINE_STATUS = "updateUsersOnlineStatus";
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

    socket.on(USER_VERIFIED, (data) => {
        console.log(data);
        socket.broadcast.emit(NEW_USER_LOGGED_IN, { notification: `User ${data.socketId} has logged in` });
    });

    socket.on(USER_LOGGED_OUT, (data) => {
        console.log(data);
        socket.broadcast.emit(USER_LOGGED_OUT, { notification: `User ${data.socketId} has logged out` });
    });

    socket.on(NEW_PRIVATE_MESSAGE, (data) => {
        /* const users = [];
        for (let id of io.of("/").sockets) {
            users.push(id[0]);
        }
        console.log(users); */
        console.log(data);
        const participant = data.participant;
        io.to(participant).emit(NEW_PRIVATE_MESSAGE, {
            sender: socket.id,
            message: data.message
        });
    });

    socket.on(UPDATE_USERS_ONLINE_STATUS, () => {
        socket.emit(UPDATE_USERS_ONLINE_STATUS, 0);
    });

    socket.on("disconnect", () => {
        console.log("disconnected");
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