/**
 * Facilitates socket objects emit/receiving requests on the server side.
 * 
 */

// Import and initialize gameManager (Manages Games, Rooms, Players)
let classes = require("./thegrizz.js");
let gameManager = new classes.GameManager();

let connections = {}; // Maps Original Socket IDS to an array of all sockets that the user with the OG socket ID generated through reconnections

function setupSocket(socket) {
    socket.on('persist', (ID, callback=()=>{}) => { // client will send what their OG ID is
        if (!Object.keys(connections).includes(ID)) { // This is a new user, tell them to save their current ID to cache
            connections[socket.id] = [socket.id];
            socket.userID = socket.id;
            callback(socket.id);
        } else { // This user reconnected, add them to the pool
            connections[ID].push(socket.id);
            socket.userID = ID;
        }
    });
    // TODO: Socket relogin here

    // Get Rooms Request
    socket.on("get-room-hosts", (callback) => {
        callback(gameManager.getRoomHosts());
    });

    // Fetch the room state
    socket.on("fetch-room-state", (callback) => {
        callback(gameManager.getRoomState(socket.userID));
    });
    
    // Create Room request, expects a username and room password
    socket.on('createRoom', (username, password, callback) => {
        if (gameManager.isUniqueUsername(username)) {
            let settings = gameManager.createRoom(username, password, socket.userID);
            callback(settings);
        } else {
            callback({success: false, message: "USERNAME NOT UNIQUE"});
        }
    });

    // Join Room request, expects hostUsername, username, and room password
    socket.on('joinRoom', (hostUsername, username, password, callback) => {
        if (gameManager.isUniqueUsername(username)) {
            let status = gameManager.joinRoom(hostUsername, username, password, socket.userID);
            callback(status);
        } else {
            callback({success: false, message: "USERNAME NOT UNIQUE"});
        }
    });

    // Play Room request, start the game
    socket.on('play', (callback) => {
        callback(gameManager.playGame(socket.userID));
    });

    // Submit a video to the room.
    socket.on('submitVideo', (video) => {
        gameManager.submitVideo(socket.userID, video);
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