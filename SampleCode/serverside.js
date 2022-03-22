// Sample server

const express = require('express'); //Import library/module
const app = express(); // Build the app

app.use(express.static('public')); // Middleware function, Serve static files by default from the public folder


app.listen(3000, () => console.log("Now listening on port 3000")); // Serve this on port 3000