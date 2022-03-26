/**
 * The play.js script will handle all client side events and socket events.
 * 
 * @file play.js
 * @author Pirjot Atwal, Harkamal Padda
 */

// SOCKETS (PARTICULAR)
// TODO: UNEXPOSE FROM CLIENT
const socket = io();
let socketID = localStorage.getItem('socketID');

socket.on('connect', function () {
    // Retain user identity through lost connections.
    socket.emit('persist', socketID);
    socket.on('saveID', (ID) => {
        localStorage.setItem('socketID', ID)
    });
});


// EVENT HANDLING

function eventHandle() {
    // If the client clicks the create room button, show the modal to configure the room
    document.getElementById("create-room-button").addEventListener("click", (evt) => {
        // Show the modal (by default, display = flex)
        document.getElementById("create-room-modal").style.display = "flex";
    });

    // Show a status message for the create message modal, automatically disappears on re input
    function createModalShowStatus(inputs, statusID, message) {
        let statusElem = document.getElementById(statusID);
        statusElem.textContent = message;
        for (let inputID of inputs) {
            document.getElementById(inputID).addEventListener("input", (evt) => {
                statusElem.textContent = "";
            });
        }
    }

    // If the client hits the cancel button, hide the modal
    document.getElementById("create-room-cancel").addEventListener("click", (evt) => {
        // Hide the modal (by default, display = none)
        document.getElementById("create-room-modal").style.display = "none";
    });

    // If the client submits the modal to create a room, attempt to create a room.
    document.getElementById("create-room-submit").addEventListener("click", (evt) => {
        let username = document.getElementById("create-room-user-input").value;
        let password = document.getElementById("create-room-pass-input").value;
        if (username.length < 4 || password.length < 4) {
            createModalShowStatus(["create-room-user-input", "create-room-pass-input"], "create-room-status", "Your username and room password need to be more than 4 characters long.");
        } else {
            socket.emit("createRoom", {
                username,
                password
            });
            socket.on("roomCreated", (response) => {
                console.log(response);
                // Generate the settings
                document.getElementById("create-room-modal").style.display = "none";
                document.getElementById("menu1").style.display = "none";
                document.getElementById("menu2").style.display = "block";
               // configureSettings(response)
            });
        }
    });

    document.getElementById("settings-play-button").addEventListener("click", (evt) => {
        document.getElementById("menu2").style.display = "none";
        document.getElementById("menu3").style.display = "block";

    });


    // JOIN script handled on room generation


    // If the client saves the settings, send the settings object to the server
    document.getElementById("settings-save-button").addEventListener("click", (evt) => {
        let settings = {} // To implement, take settings from current GUI
        socket.emit("saveSettings", settings);
    });

    let timer= null
    document.getElementById("song-input").addEventListener("input", (evt) => {
        clearTimeout(timer)
        let songInput=document.getElementById("song-input");
        timer= setTimeout((evt)=> {
            console.log(songInput.value)
            function loadClient() {
                gapi.client.setApiKey("AIzaSyDZI6YC5YehHthYap8xJ_a0nMWxsn2wHFg");
                return gapi.client.load("https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest")
                    .then(function() { console.log("GAPI client loaded for API"); },
                          function(err) { console.error("Error loading GAPI client for API", err); });
              }
              loadClient()
              // Make sure the client is loaded and sign-in is complete before calling this method.
              function execute() {
                return gapi.client.youtube.search.list({})
                    .then(function(response) {
                            // Handle the results here (response.result has the parsed body).
                            console.log("Response", response);
                          },
                          function(err) { console.error("Execute error", err); });
              }
        },
        1000);
    });

   // AIzaSyDZI6YC5YehHthYap8xJ_a0nMWxsn2wHFg







}

function configureSettings(settings){
    throw "not implemented"
}


document.addEventListener("DOMContentLoaded", (evt) => {
    eventHandle();
});

