/**
 * AuxBattle Server file
 * 
 * Sets up and initializes the server app, its dependencies and relative get/post routes.
 * All related logic is handled in routes.js
 * 
 * @author Harjyot Sidhu, Pirjot Atwal, Harkamal Padda
 */

console.log("Welcome to AuxBattle! Setting up the server...");

const express = require('express'); // Import the express module
const app = express(); // Build the app



app.use(express.static('public')); // By default, serve static files from the public folder
app.use(express.json()); // Allow JSON GET/POST requests




// Listen on port 3000 (localhost:3000)
let listener = app.listen(process.env.PORT || 3000, () => {
    console.log("Starting to listen at localhost:" + listener.address().port);
});

//On server/process closing, perform cleanup functions
process.on('SIGINT', () => {
    console.log("\nClosing down AuxBattle server...");
    process.exit(0);
});