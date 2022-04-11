/**
 * Facilitates socket objects emit/receiving requests on the server side.
 * 
 */

// Import and initialize gameManager (Manages Games, Rooms, Players)
let classes = require("./thegrizz.js");
let fs = require('fs');
let gameManager = new classes.GameManager();

let connections = {}; // Maps Original Socket IDS to an array of all sockets that the user with the OG socket ID generated through reconnections

function setupSocket(socket) {
    socket.on('persist', (ID, callback=()=>{}) => { // client will send what their OG ID is
        // We set the socket.userID to the OG ID, socket.id remains the same
        if (!Object.keys(connections).includes(ID)) { // This is a new user, tell them to save their current ID to cache
            connections[socket.id] = [socket.id];
            socket.userID = socket.id;
            return callback(socket.id);
        }
        // This user reconnected, add them to the pool
        connections[ID].push(socket.id);
        socket.userID = ID;
        callback(socket.userID);
    });

    // Socket Disconnect Case
    socket.on('disconnect', (reason) => {
        gameManager.disconnect(socket.userID);
    });

    // Socket Relogin Case
    socket.on('reconnect', (callback) => {
        callback(gameManager.reconnect(socket.userID));
    });

    // Get Rooms Request
    socket.on("get-room-hosts", (callback) => {
        callback(gameManager.getRoomHosts());
    });

    // Get Prompts
    socket.on("fetchPrompts", (callback) => {
        callback(JSON.parse(fs.readFileSync('prompts.json')));
    });

    // Submit Prompt Name
    socket.on("savePrompt", (promptName) => {
        gameManager.savePrompt(socket.userID, promptName);
    });

    // Submit Settings
    socket.on("saveSettings", (settings) => {
        gameManager.saveSettings(socket.userID, settings);
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
    socket.on('submitVideo', (video, callback) => {
        callback(gameManager.submitVideo(socket.userID, video));
    });

    // Submit a vote to the room.
    socket.on('submitVote', (vote, callback) => {
        callback(gameManager.submitVote(socket.userID, vote));
    });

    // Lock In
    socket.on('lockIn', (callback) => {
        callback(gameManager.lockIn(socket.userID));
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