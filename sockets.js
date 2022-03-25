/**
 * Facilitates socket objects emit/receiving requests on the server side.
 * 
 */

// Import and initialize gameManager (Manages Games, Rooms, Players)
let classes = require("./thegrizz.js");
let gameManager = new classes.GameManager();

let connections = {}; // Maps Original Socket IDS to an array of all sockets that the user with the OG socket ID generated through reconnections

function setupSocket(socket) {
    socket.on('persist', function (ID) { // client will send what their OG ID is
        if (!Object.keys(connections).includes(ID)) { // This is a new user, tell them to save their current ID to cache
            connections[socket.id] = [socket];
            socket.emit("saveID", socket.id);
        } else { // This user reconnected, add them to the pool
            connections[ID].push(socket);
        }
    });

    // Create Room request, expects a username and room password
    socket.on('createRoom', (response) => {
        console.log(response);
        socket.emit('createdRoom')
    });
}


function setup(io) {
    io.on('connection', function (socket) {
        setupSocket(socket);
    });
}




module.exports = {
    setup
};