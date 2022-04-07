/**
 * The play.js script will handle all client side events and socket events.
 * 
 * @file play.js
 * @author Pirjot Atwal, Harkamal Padda
 */

/**
 * Make a request to the server and return the response.
 * @param {String} route the route to make the call on
 * @param {JSON} body the body to stringify and send, if not supplied then call type is GET
 */
async function makeRequest(route, body=null) {
    let options = {
        method: 'GET',
        headers: {
            'Content-Type': "application/json"
        },
    };
    if (body != null) {
        options.method = 'POST';
        options.body = JSON.stringify(body)
    }
    let res = await (await fetch(route, options)).json();
    return res;
}

/**
 * Utility helper function to minimize the lines needed
 * to initialize a new document element.
 * 
 * Also provides extra help in immediately assigning classes
 * to the classList (you only need to use "class" for the
 * key of the pair in which you are assigning classes)
 * 
 * EXAMPLES: 
 * quickCreate("div", {"class": ["room"], "style": "height: auto"}, "123")
 * quickCreate("h1", null, "Hello World")
 * 
 * @param {String} tagName The name of the tag
 * @param {JSON} tags The tags in JSON format
 * @param {String} text The textContent if needed to assign
 * @author Pirjot Atwal
 */
function quickCreate(tagName, tags=null, text=null) {
    let element = document.createElement(tagName);
    if (tags != null) {
        for (let key of Object.keys(tags)) {
            if (key == "class") {
                for (let className of tags[key]) {
                    element.classList.add(className);
                }
            } else {
                element.setAttribute(key, tags[key]);
            }
        }
    }
    if (text != null) {
        element.textContent = text;
    }
    return element;
}

gapi.load('client');
// INITIALZE GAPI
async function initGAPI() {
    gapi.client.init({apiKey: "AIzaSyDZI6YC5YehHthYap8xJ_a0nMWxsn2wHFg"});
    await gapi.client.load("https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest");
}

/**
 * Searches Youtube for a query, auto initializes.
 * @param {*} query 
 * @returns 
 */
async function searchYoutube(query) {
    if (gapi.client.youtube == undefined) {
        await initGAPI();
    }

    let request = await gapi.client.youtube.search.list({
        "part": [
          "snippet"
        ],
        "q": query,
        "type": [
          "video"
        ],
        "videoEmbeddable": "true"
    });
    let result = request.result.items;
    let results = [];
    for (let item of result) {
        let videoRequest = await gapi.client.youtube.videos.list({
            "part": [
              "contentDetails"
            ],
            "id": [
                item.id.videoId
            ]
        });
        let duration = videoRequest.result.items[0].contentDetails.duration;
        let minutes = "";
        let seconds = "";
        let i = 0;
        while (isNaN(Number(duration[i]))) {
            i++;
        }
        while (!isNaN(Number(duration[i]))) {
            minutes += duration[i];
            i++;
        }
        i += 1;
        while (i < duration.length - 1) {
            seconds += duration[i];
            i++;
        }
        results.push({
            name: item.snippet.title,
            ID: item.id.videoId,
            author: item.snippet.channelTitle,
            duration: 60 * Number(minutes) + Number(seconds)
        });
    }
    return results;
}


// SOCKETS (PARTICULAR)
// TODO: UNEXPOSE FROM CLIENT
const socket = io();
let socketID = localStorage.getItem('socketID');

socket.on('connect', function () {
    // Retain user identity through lost connections.
    socket.emit('persist', socketID, (response) => {
        localStorage.setItem('socketID', response);

        socket.emit('reconnect', (response) => {
            if (response.success == true) {
                // The user can be reconnected to the room, place them in the update loop
                updateRoomState();
            }
        });
    });
});

// Show a status message for the create message modal, automatically disappears on re input (to be utilized for both create and join status modals)
function createModalShowStatus(inputs, statusID, message) {
    let statusElem = document.getElementById(statusID);
    statusElem.textContent = message;
    for (let inputID of inputs) {
        document.getElementById(inputID).addEventListener("input", (evt) => {
            statusElem.textContent = "";
        });
    }
}

// EVENT HANDLING
/**
 * TODO
 */
function eventHandle() {
    updateRooms(); // Automatically refreshes itself every 10 seconds

    // If the client clicks the create room button, show the modal to configure the room
    document.getElementById("create-room-button").addEventListener("click", (evt) => {
        // Show the modal (by default, display = flex)
        document.getElementById("create-room-modal").style.display = "flex";
    });

    // If the client hits the cancel button, hide the modal
    document.getElementById("create-room-cancel").addEventListener("click", (evt) => {
        // Hide the modal (by default, display = none)
        document.getElementById("create-room-modal").style.display = "none";
    });
    document.getElementById("join-room-cancel").addEventListener("click", (evt) => {
        document.getElementById("join-room-modal").style.display = "none";
    });

    // If the client submits the modal to create a room, attempt to create a room.
    document.getElementById("create-room-submit").addEventListener("click", (evt) => {
        let username = document.getElementById("create-room-user-input").value;
        let password = document.getElementById("create-room-pass-input").value;
        if (username.length < 4 || password.length < 4) {
            createModalShowStatus(["create-room-user-input", "create-room-pass-input"], "create-room-status", "Your username and room password need to be more than 4 characters long.");
        } else {
            socket.emit("createRoom", username, password, (response) => { // Returns Room Settings (default)
                if (response.success == false) {
                    createModalShowStatus(["create-room-user-input", "create-room-pass-input"], "create-room-status", "Failed creating room. STATUS: " + response.message);
                } else {
                    updateRoomState();
                    // Configure the settings
                    // configureSettings(response)
                    document.getElementById("create-room-modal").style.display = "none";
                    document.getElementById("menu1").style.display = "none";
                    document.getElementById("menu2").style.display = "block";
                }
            });
        }
    });

    document.getElementById("settings-play-button").addEventListener("click", (evt) => {
        socket.emit("play", (response) => {
            console.log(response);
            if (!response.success) {
                alert(response.message);
            } else {
                document.getElementById("menu2").style.display = "none";
                document.getElementById("menu3").style.display = "block";
            }
        });
    });


    // If the client saves the settings, send the settings object to the server
    document.getElementById("settings-save-button").addEventListener("click", (evt) => {
        let settings = {} // To implement, take settings from current GUI
        // socket.emit("saveSettings", settings);
    });

    // If the client searches a song, display the songs for selection
    let timer = null;
    document.getElementById("song-input").addEventListener("input", (evt) => {
        clearTimeout(timer);
        let songInput = document.getElementById("song-input");
        timer = setTimeout(async (evt)=> {
            await initGAPI();
            let videos = await searchYoutube(songInput.value);
            // Each video will have a select button that handles submission
            displayVideos(videos);
        },
        1000);
    });


}

/**
 * TODO
 */
async function updateRooms() {
    setTimeout(updateRooms, 3000);
    socket.emit("get-room-hosts", (response) => {
        let rooms = response;
        let table = document.getElementById("roomstable"); // GUI menu1 > Room Div

        // Clear table
        table.innerHTML = "";

        if (rooms.length == 0) {
            table.append(quickCreate("h2", {"style": "text-align: center"}, "There are no rooms, create one below!"));
            return;
        }

        for (let room of rooms) {
            let newRoom = quickCreate("div", {"class": ["room"]});
            let playerName = quickCreate("h2", null, text = room.host + "'s Room");
            let button = quickCreate("button", null,  text = "Join Room");

            // Attach Join Script to every button
            button.addEventListener("click", (evt) => {
                document.getElementById("join-room-modal").style.display = "flex";

                // We attach the event listener for the join button here to have access to the specific room username
                document.getElementById("join-room-submit").addEventListener("click", (evt) => {
                    let username = document.getElementById("join-room-user-input").value;
                    let password = document.getElementById("join-room-pass-input").value;
                    if (username.length < 4 || password.length < 4) {
                        createModalShowStatus(["join-room-user-input", "join-room-pass-input"], "join-room-status", "Your username and room password need to be more than 4 characters long.");
                    } else {
                        socket.emit("joinRoom", room.host, username, password, (response) => { // Returns Room Settings (default)
                            if (response.success == false) {
                                createModalShowStatus(["join-room-user-input", "join-room-pass-input"], "join-room-status", "Failed joining room. STATUS: " + response.message);
                            } else {
                                updateRoomState();
                                // Configure the settings
                                // JOINFUNCTION() MAKE
                                document.getElementById("join-room-modal").style.display = "none";
                                document.getElementById("menu1").style.display = "none";
                                document.getElementById("menu2").style.display = "block";
                            }
                        });
                    }
                });
            });

            newRoom.append(playerName, button);
            table.append(newRoom);
        }
    });
}

/**
 * Display all the players in the player menu.
 * @param {*} players 
 */
function displayPlayers(players) {
    let playerMenu = document.getElementById("playersmenu");
    playerMenu.innerHTML = "";
    for (let player of players) {
        let newPlayer = quickCreate("div", {"class": ["player"]});
        let playerName = quickCreate("h4", {"style": "margin: 3px;"}, player)
        let buttonGrid = quickCreate("div", {"style": "display:grid; grid-template-columns: 2fr 1fr 1fr;"});
        let kickButton = quickCreate("button", null, "Kick");
        let banButton = quickCreate("button", null, "Ban");
        // TODO Attach Scripts

        buttonGrid.append(kickButton, banButton);
        newPlayer.append(playerName, buttonGrid);
        playerMenu.append(newPlayer);
    }
}

let player = null;
function initYoutube() {
    let dummyDIV = document.createElement("div");
    dummyDIV.id = "dummyDIV";
    dummyDIV.style.display = "none";
    document.body.append(dummyDIV);
    player = new YT.Player("dummyDIV", {
        playerVars: {
            "playsinline" : 1,
            "showinfo":0,
            "autoplay":1,
            "origin" : "https://www.youtube.com",
            "controls" : 0,
            "enablejsapi": 1,
            "rel": 0,
            "iv_load_policy": 3,
            "cc_load_policy":1
        },
    });
}

/**
 * Creates a iframe for the given youtube video embed, hides it,
 * and then creates an icon tied to the frame and returns it.
 */
function createPlayVideoIcon(videoID="LoE3X_KpzTU", start=20, stop=120) {
    if(player == null) {
        initYoutube();
    }
    
    let icon = quickCreate("i", {"class": ["fa", "fa-3x", "fa-play"], "style": "cursor: pointer"});
    let playPause = true; // True = Play, False = Stop
    icon.addEventListener("click", (evt) => {
        if (playPause) {
            player.loadVideoById({
                videoId: videoID,
                startSeconds: start,
                endSeconds: stop
            });
            player.setVolume(playerVolume);
            icon.classList.remove("fa-play");
            icon.classList.add("fa-pause");
        } else {
            player.stopVideo();
            icon.classList.remove("fa-pause");
            icon.classList.add("fa-play");
        }
        playPause = !playPause;
    });
    return icon;
}

let clipDuration = undefined; // Set by fetch room state
/**
 * TODO
 * @param {*} videos 
 */
function displayVideos(videos) {
    let videoTable = document.getElementById("videostable");
    videoTable.innerHTML = "";
    for (let video of videos) {
        let videoDIV = quickCreate("div", {"class": ["video"]});
        let icon = createPlayVideoIcon(video.ID, 0, video.duration);
        
        let outerDIV = quickCreate("div");
        let name = quickCreate("p", null, video.name);
        let author = quickCreate("p", null, "By " + video.author);
        outerDIV.append(name, author);
        
        let selectButton = quickCreate("button", null, "Select");
        // Attach submission script
        selectButton.addEventListener("click", (evt) => {
            displayClipModal(video, clipDuration);
        });

        videoDIV.append(icon, outerDIV, selectButton);
        videoTable.append(videoDIV);
    }
}

/**
 * TODO
 * @param {*} videos 
 */
function displayVotes(videos, clipDuration) {
    let voteTable = document.getElementById("votestable");
    voteTable.innerHTML = "";
    let rand = Math.floor(Math.random() * 2); // Assume 2 videos
    for (let i = 0; i < 2; i++) {
        let video = videos[rand];
        rand = 1 - rand;
        let voteDiv = quickCreate("div", {"class": "vote"});
        let playButton = createPlayVideoIcon(video.videoID, video.start, video.start + clipDuration);
        let title = quickCreate("h2", null, video.name);
        let author = quickCreate("h2", null, "By " + video.author);
        let voteButton = quickCreate("button", null, "Vote");
        // Attach script
        voteButton.addEventListener("click", (evt) => {
            socket.emit("submitVote", video.videoID);
        });

        voteDiv.append(playButton, title, author, voteButton);
        voteTable.append(voteDiv);
    }
}

/**
 * TODO
 * @param {*} results 
 */
function displayResults(results) {
    console.log("DISPLAYING RESULTS", results);

    let resultsTable = document.getElementById("resultstable");
    resultsTable.innerHTML = "";
    let resultDiv = quickCreate("div", {"class": "result"});

    resultDiv.append(title, name, count);
    resultsTable.append(resultDiv);
}


/**
 * TODO
 * @param {*} video 
 * @param {*} clipDuration 
 */
function displayClipModal(video, clipDuration=30) {
    console.log("DISPLAYING FOR...", video, clipDuration);
    document.getElementById("clip-video-modal").style.display = "flex";

    // Set duration
    document.getElementById("clip-duration").textContent = clipDuration;
    document.getElementById("clip-select-slider").max = video.duration;

    // Set on slider change
    let slider = document.getElementById("clip-select-slider"); 
    slider.onchange = (evt) => {
        document.getElementById("clip-select-time").value = slider.value;

        // CHANGE PLAY PAUSE BUTTON
        let div = document.getElementById("clip-select-play");
        div.innerHTML = "<h4>Preview Clip: </h4>";
        div.appendChild(createPlayVideoIcon(video.ID, slider.value, Number(slider.value) + clipDuration));
    };

    // Button Scripts
    document.getElementById("clip-video-submit").onclick = (evt) => {
        video.startingPosition = slider.value;
        socket.emit("submitVideo", video);
        document.getElementById("clip-video-modal").style.display = "none";
    };
    document.getElementById("clip-video-cancel").onclick = (evt) => {
        document.getElementById("clip-video-modal").style.display = "none";
        if (player) {
            player.stopVideo();
        }
    };
    
}

/**
 * TODO
 * @param {*} show 
 * @param {*} message 
 * @param {*} time 
 * @returns 
 */
function displayPauseModal(show, message, time, specificMessage) {
    console.log(time);
    let modal = document.getElementById("pause-modal");
    if (!show && specificMessage == null) {
        modal.style.display = "none";
        return;
    }

    let header = document.getElementById("pause-modal-header");
    let timer = document.getElementById("pause-modal-timer");
    let messageP = document.getElementById("pause-modal-message");
    timer.value = time;
    if (show) {
        header.textContent = message.header;
        messageP.textContent = message.message;
    } else {
        header.textContent = specificMessage.header;
        messageP.textContent = specificMessage.message;
    }

    modal.style.display = "flex";
}

let lastState = "unset"; // Needed for voting display
let playerVolume = 50; // Needed for setting player volume
function updateRoomState() {
    setTimeout(updateRoomState, 1000);
    socket.emit("fetch-room-state", (response) => {
        console.log(response);
        displayPauseModal(response.messageActive, response.message, response.time, response.specificMessage); // For Messages / Waiters / Pausing
        displayPlayers(response.players); // For the Room Menu
        
        // Display top elements
        document.getElementById("bracket-button").style.display = "block";
        document.getElementById("player-volume").style.display = "flex";
        
        // Top Elements scripts
        document.getElementById("bracket-button").onclick = (evt) => {
            console.log("DISPLAY BRACKET"); // TODO
        };
        
        let input = document.getElementById("player-volume-input");
        input.onchange = (evt) => {
            playerVolume = Number(input.value);
            if (player != null) {
                player.setVolume(playerVolume);
            }
        };


        // Set global variables
        clipDuration = response.clipDuration;

        /**
         * 
         * @param {Array<String>} showThese IDs of menus to show, hides everything else on the screen
         */
        function robustDisplay(showThese) {
            let menuIDs = [
                "menu1", // Room Menu
                "menu2", // Room Settings
                "menu3", // Video Select Menu
                "menu4", // Voting Menu
                "menu5", // Results Screen
            ];
            
            // For all elements needed to show, show them, otherwise turn all the rest off
            for (let id of showThese) {
                if (menuIDs.includes(id)) {
                    document.getElementById(id).style.display = "block";
                }
            }
            // Hide all others
            for (let id of menuIDs) {
                if (!showThese.includes(id)) {
                    document.getElementById(id).style.display = "none";
                }
            }
        }
        if (response.role != "player" && response.role != "voter" && player != null) { // Pause background player
            player.stopVideo();
        }
        // Update all timers to time
        let timerIDs = [
            "playing-time",
            "clip-time",
            "vote-time",
            "results-time",
            "pause-modal-timer"
        ];
        for (let timerID of timerIDs) {
            document.getElementById(timerID).value = response.time;
        }

        if (response.state == "playing") {
            if (response.role == "player") {
                // Configure view for player, submission would be completed on click of button
                robustDisplay(["menu3"]);
            } else {
                // Configure view for waiter, waits until timer is done
                // Assumes messageActive = true.
                robustDisplay(["menu4"]);
            }

        } else if (response.state == "voting") {
            if (response.role == "voter") {
                // Configure view for voter, submission would be completed on click of button
                robustDisplay(["menu4"]);
                if (lastState != "voting") {
                    displayVotes(response.videos, response.settings.clipDuration);
                }
            } else {
                // Configure view for waiter, waits until time is done
                // Assumes messageActive = true.
                robustDisplay(["menu5"]);
            }
        } else if (response.state == "results") {
            // View the results
            robustDisplay(["menu5"]);
            if (response.results != null) {
                displayResults(response.results);
            }
        } else if (response.state == "setting") {
            // Revert back to settings
            robustDisplay(["menu2"]);
        }

        lastState = response.state;
    });
}

/**
 * Display the given settings through the on-screen settings menu (assumes that the
 * settings are received always in the same format.)
 * @param {*} settings 
 */
async function configureSettings(settings) {
    throw "not implemented"
}

document.addEventListener("DOMContentLoaded", async (evt) => {
    eventHandle();
});

