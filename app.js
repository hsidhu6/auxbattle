/**
 * AuxBattle Server file
 * 
 * Sets up and initializes the server app, its dependencies and relative get/post routes.
 * All related logic is handled in routes.js
 * 
 * @author Harjyot Sidhu, Pirjot Atwal, Harkamal Padda
 */

console.log("Welcome to AuxBattle! Setting up the server...");

const sockets = require('./sockets.js');
const express = require('express'); // Import the express module
const app = express(); // Build the app


app.use(express.static('public')); // By default, serve static files from the public folder
app.use(express.json()); // Allow JSON GET/POST requests

// SERVE FAVICON TO USER
const favicon = require('serve-favicon');
const path = require('path');
app.use(favicon(path.join(__dirname, 'public', 'favicon', 'favicon.ico')));

// Listen on port 3000 (localhost:3000)
let server = app.listen(process.env.PORT || 3000, () => {
    console.log("Starting to listen at localhost:" + server.address().port);
});

const { Server } = require("socket.io");
const io = new Server(server);
sockets.setup(io);



//On server/process closing, perform cleanup functions
process.on('SIGINT', () => {
    console.log("\nClosing down AuxBattle server...");
    process.exit(0);
});