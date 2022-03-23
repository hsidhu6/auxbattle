/**
 * Facilitates socket objects emit/receiving requests.
 * 
 */

const { Server } = require("socket.io");
const io = new Server(server);

io.on('connection', (socket) => {
    console.log('a user connected');
});