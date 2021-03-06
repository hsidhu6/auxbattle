/**
 * Framework for AuxBattle Serverside Classes
 * Expected to be imported by sockets.js.
 * 
 * @file thegrizz.js
 * @author Harjyot Sidhu, Pirjot Atwal
 */

const fs = require('fs');

/**
 * The GameManager keeps track of a list of rooms
 * and any facilitation that the server needs to run
 * all games.
 * 
 * NOTE: On socket IDs, we will handle the disconnect and
 * reconnection of players who leave games. All connection IDs
 * (both new and old) are mapped in the connections map.
 * Thus, it is expected that the socket ID of every player in
 * any used instance variable of the GameManager remains consistennt
 * outside of the GameManager instance.
 * 
 */
 class GameManager {
    constructor() {
        this.rooms = [];
    }

    /**
     * Creates a new room from a given username and password
     * initializing the Host as a Player.
     * @param {*} username 
     * @param {*} password 
     * @returns Returns the new room settings
     */
    createRoom(username, password, socketID) {
        let newRoom = new Room(username, password, socketID);
        this.rooms.push(newRoom);
        return newRoom.settings;
    }

    /**
     * TODO
     * @param {*} hostUsername 
     * @param {*} username 
     * @param {*} password 
     * @param {*} socketID 
     */
    joinRoom(hostUsername, username, password, socketID) {
        // TODO MaxPlayers, Banned Requirement
        let room = null;
        for (let rom of this.rooms) {
            if (rom.host.username == hostUsername) {
                room = rom;
                break;
            }
        }
        if (room != null && room.players.length == room.settings.maxPlayers) {
            return {success: false, message: "The room already has the maximum number of players."};
        }
        if (room != null && room.password == password) {
            room.addPlayer(username, socketID);
            return room.settings;
        } else {
            return {success: false, message: "PASSWORD IS INCORRECT."}
        }
    }

    disconnect(socketID) {
        let room = this.getRoom(socketID);
        if (room == null) {
            return {success: false, message: "USER DOES NOT BELONG TO ANY ROOM"};
        }
        return room.disconnect(socketID, this); 
    }

    /**
     * Close the given room by removing it from the list.
     * @param {*} room 
     */
    closeRoom(room) {
        this.rooms = this.rooms.filter((rom) => rom != room);
    }

    /**
     * Reconnect a user back to a room if they belong to one.
     * @param {*} socketID 
     */
    reconnect(socketID) {
        let room = this.getRoom(socketID);
        if (room == null) {
            return {success: false, message: "USER DOES NOT BELONG TO ANY ROOM"};
        }
        return room.reconnect(socketID);
    }

    /**
     * 
     * @param {*} socketID 
     * @param {*} promptName 
     * @returns 
     */
    savePrompt(socketID, promptName) {
        let room = this.getRoom(socketID);
        if (room == null) {
            return {success: false, message: "USER DOES NOT BELONG TO ANY ROOM"};
        }
        return room.setSettings(null, promptName);
    }

    /**
     * 
     * @param {*} socketID 
     * @param {*} settings 
     * @returns 
     */
    saveSettings(socketID, settings) {
        let room = this.getRoom(socketID);
        if (room == null) {
            return {success: false, message: "USER DOES NOT BELONG TO ANY ROOM"};
        }
        if (room.host.socketID != socketID) {
            return {success: false, message: "YOU ARE NOT HOST."};
        }
        return room.setSettings(settings);
    }

    /**
     * Start the game in a room.
     * @param {*} socketID 
     */
    playGame(socketID) {
        // 1. Check that the socketID belongs to a host.
        let room = this.getRoom(socketID);
        if (room == null) {
            return {success: false, message: "ROOM DOES NOT EXIST."};
        }
        if (room.host.socketID != socketID) {
            return {success: false, message: "YOU ARE NOT HOST."};
        }
        // 2. Tell the Room to start the game.
        return room.startGame();
    }

    submitVideo(socketID, video) {
        let room = this.getRoom(socketID);
        if (room == null) {
            return {success: false, message: "ROOM DOES NOT EXIST."};
        }
        // Submit Video
        return room.submitVideo(socketID, video);
    }

    submitVote(socketID, vote) {
        let room = this.getRoom(socketID);
        if (room == null) {
            return {success: false, message: "ROOM DOES NOT EXIST."};
        }
        // Submit Vote
        return room.submitVote(socketID, vote);
    }

    /**
     * Return the room that this socket is in, return null if the
     * person is not in any room.
     * @param {*} socketID 
     * @returns {Room}
     */
    getRoom(socketID) {
        let playerRoom = null;
        for (let room of this.rooms) {
            for (let player of room.players) {
                if (player.socketID == socketID) {
                    playerRoom = room;
                    break;
                }
            }
            if (playerRoom != null) { // Shortcut
                break;
            }
        }
        return playerRoom;
    }

    /**
     * Returns the state of the room (STRIPPED).
     * @returns 
     */
    getRoomState(socketID) {
        let playerRoom = this.getRoom(socketID);
        if (playerRoom == null) { //if a player is not in a room return a false message
            return {success: false, message: "USER NOT IN ROOM"};
        }
        return playerRoom.getStrippedStatus(socketID);
    }

    /**
     * Get a list of all room hosts
     * @returns A list of all room hosts
     */
    getRoomHosts() {
        let rooms = [];
        for (let room of this.rooms) {
            rooms.push({
                host: room.host.username,
            });
        }
        return rooms;
    }

    /**
     * 
     * @param {*} socketID 
     * @returns 
     */
    lockIn(socketID) {
        let room = this.getRoom(socketID);
        if (room == null) {
            return {success: false, message: "ROOM DOES NOT EXIST."};
        }
        // Submit Vote
        return room.lockIn(socketID);
    }

    /**
     * Check if a given username has not been used yet. (not case sensitive)
     * @param {String} username
     * @returns true if unique, false otherwise.
     */
    isUniqueUsername(username) {
        for (let room of this.rooms) {
            for (let player of room.players) {
                if (player.username.toLowerCase() == username.toLowerCase()) {
                    return false;
                }
            } 
        }
        return true;
    }
}

// Taken from https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

class Bracket {
    /**
     * Construct a Bracket from a list of players
     * Is stored in the .bracket variable.
     * @param {*} players
     */
    constructor (players) {
        this.players = players;
        shuffleArray(players);
        let pairs = [];
        for (let i = 0; i < players.length; i += 2) {
            if (i == players.length - 1) {
                pairs.push([players[i]]);
            } else {
                pairs.push([players[i], players[i + 1]]);
            }
        }
        if (players.length % 2 == 1) {
            pairs.unshift(pairs.pop());
        }
        if (Bracket.roundBool) {
            Bracket.roundBool = false;
            this.maxRounds = determineRounds(players.length);
            Bracket.roundBool = true;
        }
        this.winner = null;
        this.bracket = this.buildBracket(pairs);
    }

    /**
     * Build the template of a bracket and any associated
     * variables.
     * @param {*} pairs 
     * @returns 
     */
    buildBracket(pairs) {
        return {
            rounds: {
                1: pairs,
            },
            history: {
                "orig": pairs
            }
        }
    }

    /**
     * Play a matchup, updating the rounds and history of the bracket.
     * @param {*} roundNumber 
     * @param {*} matchup 
     * @param {*} winner 
     */
    playNextMatchup(roundNumber, matchup, winner) {
        if (this.winner != null) {
            return false;
        }

        // Default winner for bye
        if (matchup.length == 1) {
            winner = matchup[0];
        }

        // First add the matchup to history.
        if (!Object.keys(this.bracket.history).includes(String(roundNumber))) {
            this.bracket.history[roundNumber] = [];
        }
        this.bracket.history[roundNumber].push(matchup);

        // Update the bracket
        if (this.bracket.rounds[roundNumber].length == 1) { // Assumes that if there is only one pair in this round, this is the finals.
            this.winner = winner;
        } else {
            if (!Object.keys(this.bracket.rounds).includes(String(Number(roundNumber)+1))) {
                this.bracket.rounds[Number(roundNumber)+1] = [];
            }
            this.bracket.rounds[Number(roundNumber)+1].push([winner]);
            this.reconstruct(this.bracket.rounds[Number(roundNumber)+1]);
        }
    }

    /**
     * Assumes array is a list of lists, reconstructs by order
     * into a list of pairs / singles for the last element.
     * @param {*} array 
     */
    reconstruct(array) {
        let simpleArray = [];
        for (let lst of array) {
            for (let item of lst) {
                simpleArray.push(item);
            }
        }

        let pairs = [];
        for (let i = 0; i < simpleArray.length; i += 2) {
            if (i == simpleArray.length - 1) {
                pairs.push([simpleArray[i]]);
            } else {
                pairs.push([simpleArray[i], simpleArray[i + 1]]);
            }
        }

        // Clear the array, replace it
        array.splice(0, array.length);
        for (let pair of pairs) {
            array.push(pair);
        }
    }

    /**
     * 
     * @returns {Array<Player>} [matchup, round]
     */
    getNextMatchup() {
        let nextMatchup = null;
        for (let round of Object.keys(this.bracket.rounds)) {
            let matchups = this.bracket.rounds[round];
            if (!Object.keys(this.bracket.history).includes(round)) {
                this.bracket.history[round] = [];
            }
            let matchupHistory = this.bracket.history[round];
            
            for (let matchup of matchups) {
                if (!matchupHistory.includes(matchup)) { // If this matchup has not been played yet for that round
                    nextMatchup = [matchup, round];
                    break;
                }
            }
            if (nextMatchup != null) {
                break;
            }
        }
        return nextMatchup;
    }
}
Bracket.roundBool = true;
Bracket.maxRounds = {};
function determineRounds(length) {
    if (Bracket.maxRounds[length] != undefined) {
        return Bracket.maxRounds[length];
    }
    let players = [];
    for (let i = 0; i < length; i++) {
        players.push(i);
    }
    let b = new Bracket(players);
    let i = 0;
    while (b.winner == null) {
        let res = b.getNextMatchup();
        b.playNextMatchup(res[1], res[0], res[0][0]);
        i++;
    }
    Bracket.maxRounds[length] = i;
    return i;
}

/**
 * The Room keeps track of all current logged in players,
 * the host, the room settings, the current bracket,
 * the time of the current round, and the videos needed to
 * play. The Room also keeps track of the state of the game
 * in the room at any time.
 */
class Room {
    constructor (username, password, socketID){
        console.log("NEW ROOM", password)
        this.host = new Player (username, socketID);
        this.password = password;
        this.lockedIn = [];

        // Load Settings
        this.settings = {
            maxPlayers: 10,
            clipDuration: 30,
            dcTime: 60,
            voteTime: 90,
            roundTime: 120,
            messageTime: 7,
            resultsTime: 20
        }
        this.players = [this.host];

        this.prompts = JSON.parse(fs.readFileSync("prompts.json"));
        this.packageName = "DEFAULT";
        this.package = this.prompts.filter((pac) => pac.package == this.packageName)[0].prompts.map((prompt) => prompt);
        // GAME VARS
        this.bracket = null;
        this.resetRoom();
    }

    resetRoom() {
        // this.possibleStates = ["setting", "playing", "message", "voting", "result", "ending"];
        this.roundStatus = {
            state: "setting",
            bracketLevel: null,
            prompt: null,

            timer: null,
            maxRounds: null,
            currentRound: null,

            currentlyPlaying: null,
            voting: null,
            
            submittedVideos: null,
            votes: null,
            results: null,

            winner: null,
            time: null,
            messageActive: false,
            message: {
                header: null,
                message: null
            }
        };
        this.disconnected = null;
        this.setSettings(null, this.packageName);
    }

    /**
     * Add a player to the players array.
     * @param {*} username
     * @param {*} socketID
     */
    addPlayer(username, socketID) {
        this.players.push(new Player(username, socketID));
    }

    // PROMPT FETCHING DONE AT socket.js level
    /**
     * TODO
     * @param {*} settings 
     * @param {*} package 
     * @returns 
     */
    setSettings(settings=null, pack=null) {
        if (settings) {
            this.settings = settings;
        }
        if (pack) {
            this.packageName = pack;
            this.package = this.prompts.filter((pac) => pac.package == this.packageName)[0].prompts.map((prompt) => prompt);
        }
        return {success:true, message:"Your settings have been saved!"}
    }

    startGame() {
        console.log("STARTING GAME");
        if (this.players.length < 3) {
            return {success: false, message: "NOT ENOUGH PLAYERS. NEED ATLEAST 3."};
        }
        
        // Initialize the bracket
        this.bracket = new Bracket(this.players);
        this.roundStatus.maxRounds = this.bracket.maxRounds;
        this.roundStatus.currentRound = 0;
        // Initialize Timer
        this.roundStatus.timer = new Timer();
        // Initialize Disconnect Status
        this.disconnected = [];

        // INITIALIZE THE GAME
        // Start GameplayLoop()
        this.mainGameplayLoop();
        return {success: true};
    }

    /**
     * Display a pause modal for a message.
     * 
     * Sets messageActive to true, the state to "message", and the time to the provide param.
     * @param {*} header 
     * @param {*} message 
     * @param {*} time 
     */
    displayMessage(header, message, time) {
        this.roundStatus.messageActive = true;
        this.roundStatus.state = "message";
        this.roundStatus.message = {
            header: header,
            message: message
        };
        this.roundStatus.time = time;
    }

    /**
     * Hide the Pause Modal on the client side.
     */
    hideMessage() {
        this.roundStatus.messageActive = false;
        this.roundStatus.message = {
            header: null,
            message: null
        }
    }

    /**
     * TODO
     */
    lockIn(socketID) {
        if (!this.lockedIn.includes(socketID)) {
            this.lockedIn.push(socketID);
            return {success: true, message: "YOU WERE LOCKED IN SUCCESSFULLY"};
        }
        return {success: true, message: "YOU ARE ALREADY LOCKED IN"};
    }

    /**
     * By utilizing timers, start the gameplay loop (essentially keeping track of the state at all times.)
     */
    mainGameplayLoop() {
        this.updateByNextMatchup();

        let thisRoom = this; // Bypass Binding

        // Bye Round Check - If entering from a by round, 

        // CREATE INITIAL MESSAGE
        let message = "ERROR with BRACKET PLAYING PAIRS";
        thisRoom.roundStatus.prompt = "BYE ROUND, NO PROMPT PROVIDED";
        if (thisRoom.roundStatus.currentlyPlaying.length == 1) {
            message = "This is a bye round for " + thisRoom.roundStatus.currentlyPlaying[0].username + ". Forwarding round.....";
            // SKIP ROUND LOGIC
            thisRoom.displayMessage("Round " + thisRoom.roundStatus.currentRound, message, thisRoom.settings.messageTime);
            thisRoom.roundStatus.timer.setTime(thisRoom.settings.messageTime);
            thisRoom.roundStatus.timer.addToQueue(() => {
                thisRoom.displayMessage("Round " + thisRoom.roundStatus.currentRound, message, thisRoom.roundStatus.timer.time);
            });
            thisRoom.roundStatus.timer.addToQueue0(() => {
                thisRoom.hideMessage();
                thisRoom.bracket.playNextMatchup(thisRoom.roundStatus.bracketLevel, thisRoom.roundStatus.currentlyPlaying, thisRoom.roundStatus.currentlyPlaying[0]);
                thisRoom.mainGameplayLoop();
            });
            thisRoom.roundStatus.timer.startTime();
            return;
        } else if (thisRoom.roundStatus.currentlyPlaying.length == 2) {
            message = "This round's matchup will be " + thisRoom.roundStatus.currentlyPlaying[0].username + " vs. " + thisRoom.roundStatus.currentlyPlaying[1].username;
            if (thisRoom.package.length == 0) { // Ran out of prompts
                thisRoom.setSettings(null, thisRoom.packageName);
            }
            // Serve next prompt randomly and cut from list
            shuffleArray(thisRoom.package);
            thisRoom.roundStatus.prompt = thisRoom.package.splice(0, 1)[0];
        }
        
        /**
         * TODO
         */
        function showSubmit() {
            thisRoom.hideMessage();
            console.log("WAITING FOR SUBMISSIONS");
            thisRoom.lockedIn = [];
            
            // Change the state to the video selection screen
            thisRoom.roundStatus.state = "playing";
            thisRoom.roundStatus.timer.setTime(thisRoom.settings.roundTime);
            thisRoom.roundStatus.timer.addToQueue(() => {
                thisRoom.roundStatus.time = thisRoom.roundStatus.timer.time;
                // LOCK IN FEATURE
                if (thisRoom.lockedIn && thisRoom.lockedIn.length == 2) {
                    thisRoom.roundStatus.timer.setTime(1);
                }
            });
            thisRoom.roundStatus.timer.addToQueue0(showVoting);
            thisRoom.roundStatus.timer.startTime();
        }
        /**
         * 
         */
        function showVoting() {
            console.log("WAITING FOR VOTES");
            // RETRIEVE SUBMITTED VIDEOS
            if (thisRoom.roundStatus.submittedVideos == null || thisRoom.roundStatus.submittedVideos.length == 0) {
                // No one submitted in time
                let message = "Neither player submitted a video in the time allotted... Ending Game."
                // SKIP ROUND LOGIC
                thisRoom.displayMessage("Round " + thisRoom.roundStatus.currentRound, message, thisRoom.settings.messageTime);
                thisRoom.roundStatus.timer.setTime(thisRoom.settings.messageTime);
                thisRoom.roundStatus.timer.addToQueue(() => {
                    thisRoom.displayMessage("Round " + thisRoom.roundStatus.currentRound, message, thisRoom.roundStatus.timer.time);
                });
                thisRoom.roundStatus.timer.addToQueue0(() => {
                    thisRoom.hideMessage();
                    thisRoom.roundStatus.state = "ending";
                    restartLogic();
                });
                thisRoom.roundStatus.timer.startTime();
                return;
            } else if (thisRoom.roundStatus.submittedVideos.length == 1) {
                // Default winner
                let message = "Only one player submitted a video... Automatically granting them the win.";
                thisRoom.roundStatus.votes = [{
                    socketID: "SERVER-GENERATED VOTE",
                    vote: {
                        from: "SERVER-GENERATED VOTE",
                        for: thisRoom.roundStatus.submittedVideos[0].socketID,
                        videoName: thisRoom.roundStatus.submittedVideos[0].video.name
                    }
                }];
                // SKIP ROUND LOGIC
                thisRoom.displayMessage("Round " + thisRoom.roundStatus.currentRound, message, thisRoom.settings.messageTime);
                thisRoom.roundStatus.timer.setTime(thisRoom.settings.messageTime);
                thisRoom.roundStatus.timer.addToQueue(() => {
                    thisRoom.displayMessage("Round " + thisRoom.roundStatus.currentRound, message, thisRoom.roundStatus.timer.time);
                });
                thisRoom.roundStatus.timer.addToQueue0(showResults);
                thisRoom.roundStatus.timer.startTime();
                return;
            }  else {
                // Two videos to review, start voting screen
                // Change the state to the voting process
                thisRoom.lockedIn = [];
                thisRoom.roundStatus.state = "voting";
                thisRoom.roundStatus.timer.setTime(thisRoom.settings.voteTime);
                thisRoom.roundStatus.timer.addToQueue(() => {
                    thisRoom.roundStatus.time = thisRoom.roundStatus.timer.time;
                    // LOCK IN FEATURE
                    if (thisRoom.lockedIn && thisRoom.lockedIn.length == thisRoom.roundStatus.voting.length) {
                        thisRoom.roundStatus.timer.setTime(1);
                    }
                });
                thisRoom.roundStatus.timer.addToQueue0(showResults);
                thisRoom.roundStatus.timer.startTime();
            }
            
        }

        function showResults() {
            thisRoom.hideMessage();
            console.log("SHOWING RESULTS");
            // RETRIEVE SUBMITTED VOTES
            // CHECK THE VOTES, DECLARE THE WINNER
            let player1 = thisRoom.roundStatus.currentlyPlaying[0];
            let player2 = thisRoom.roundStatus.currentlyPlaying[1];
            
            // Set videoName
            player1.videoName = null;
            player2.videoName = null;
            for (let video of thisRoom.roundStatus.submittedVideos) {
                if (video.socketID == player1.socketID) {
                    player1.videoName = video.video.name;
                } else if (video.socketID == player2.socketID) {
                    player2.videoName = video.video.name;
                }
            }

            // Calculate count1
            let count1 = 0;
            let count2 = 0;
            if (thisRoom.roundStatus.votes != null) {
                for (let vote of thisRoom.roundStatus.votes) {
                    if (vote.vote.for == player1.socketID) {
                        count1++;
                    } else if (vote.vote.for == player2.socketID) {
                        count2++;
                    }
                }
            }

            // IF VOTES EQUAL > DISPLAY MESSAGE FOR RANDOM WINNER
            let winner = null;
            if (count1 > count2) {
                winner = player1;
            } else if (count1 == count2) {
                winner = "tie";
            } else {
                winner = player2;
            }
            let tie = false;
            if (winner == "tie") { // RANDOMLY DETERMINE WINNER
                Math.floor(Math.random() * 2) == 0 ? winner = player1 : winner = player2;
                tie = true;
            }
            thisRoom.bracket.playNextMatchup(thisRoom.roundStatus.bracketLevel, thisRoom.roundStatus.currentlyPlaying, winner);
            thisRoom.roundStatus.results = { // RESULTS
                tie,
                winner: {
                    username: winner.username,
                    videoName: winner.videoName,
                    voteCount: winner == player1 ? count1 : count2
                },
                loser: {
                    username: (winner == player1 ? player2 : player1).username,
                    videoName: (winner == player1 ? player2 : player1).videoName,
                    voteCount: winner == player1 ? count2 : count1
                }
            }
            
            // Change the state to the results screen
            thisRoom.roundStatus.state = "results";
            thisRoom.roundStatus.timer.setTime(thisRoom.settings.resultsTime);
            thisRoom.roundStatus.timer.addToQueue(() => {
                thisRoom.roundStatus.time = thisRoom.roundStatus.timer.time;
            });
            thisRoom.roundStatus.timer.addToQueue0(restartLogic);
            thisRoom.roundStatus.timer.startTime();
        }

        function restartLogic() {
            console.log("RESTARTING LOOP...")
            // Manual Clear to avoid vote glitch
            thisRoom.roundStatus.votes = [];
            thisRoom.roundStatus.submittedVideos = [];
            thisRoom.roundStatus.results = {};
            thisRoom.roundStatus.timer.stopTime();
            thisRoom.roundStatus.timer.clearQueue();
            thisRoom.roundStatus.timer.clearQueue0();

            if (thisRoom.bracket.winner != null) {
                console.log("WINNER FOUND!", thisRoom.bracket.winner.username);
                // PRESENT WINNER SCREEN IN MESSAGE
                let message = "The winner is " + thisRoom.bracket.winner.username + ".";
                thisRoom.displayMessage("GAME OVER!", message, thisRoom.settings.messageTime);
                thisRoom.roundStatus.timer.setTime(thisRoom.settings.messageTime);
                thisRoom.roundStatus.timer.addToQueue(() => {
                    thisRoom.displayMessage("GAME OVER!", message, thisRoom.roundStatus.timer.time);
                });
                thisRoom.roundStatus.timer.addToQueue0(() => thisRoom.resetRoom());
                thisRoom.roundStatus.timer.startTime();
            } else if (thisRoom.roundStatus.state == "ending" || thisRoom.roundStatus.state == "exiting") {
                // END THE GAME, RESET THE STATE TO SETTING
                thisRoom.resetRoom();
            } else {
                thisRoom.mainGameplayLoop();
            }
        }

        // Display the next matchup to the client for the message time.
        thisRoom.displayMessage("Round " + thisRoom.roundStatus.currentRound, message, thisRoom.settings.messageTime);
        thisRoom.roundStatus.timer.setTime(thisRoom.settings.messageTime);
        thisRoom.roundStatus.timer.addToQueue(() => {
            thisRoom.displayMessage("Round " + thisRoom.roundStatus.currentRound, message, thisRoom.roundStatus.timer.time);
        });
        thisRoom.roundStatus.timer.addToQueue0(showSubmit);
        thisRoom.roundStatus.timer.startTime();
    }

    /**
     * TODO: Handling Disconnect
     * On the event of a player disconnect, handle this through the game Manager
     * By default, end the game and restart it if the player does not return for a while
     * If the player returns, continue the game.
     * 
     * Future feature: reconstructing the bracket. Calculate all the players who
     * have yet to play a round and replace the bracket with a temporary one
     * 
     * Everyone else becomes a voter.
     * 
     * On the event of a host disconnect, close the room after an allotted time,
     * else have the host rejoin.
     */
    disconnect(socketID, manager) {
        function genMessage(room) {
            let message = "The following people are disconnected: ";
            for (let i = 0; i < room.disconnected.length; i++) {
                let username = null;
                for (let player of room.players) {
                    if (player.socketID == room.disconnected[i]) {
                        username = player.username;
                        break;
                    }
                }
                message += username;
                if (i != room.disconnected.length - 1) {
                    message += ", ";
                } else {
                    message += "."
                }
            }
            return message;
        }
        if (this.disconnected == undefined || this.disconnected == null) {
            // TODO REMOVE PLAYER FROM PLAYERS LIST
            this.players = this.players.filter((player) => player.socketID != socketID);
            // CHECK IF ROOM EMPTY
            if (this.players.length == 0) {
                manager.closeRoom(this);
            }
            return; // The game has not started yet
        }
        if (this.disconnected.length == 0) { // This is the first person that disconnected
            // 1. Store the disconnect state to be restored by the reconnect function
            this.savedState = this.roundStatus.state;
            this.savedTime = this.roundStatus.timer.time;
            this.timerQueue = this.roundStatus.timer.queueFunc;
            this.timerQueue0 = this.roundStatus.timer.queueEx0;
            this.roundStatus.timer.clearQueue();
            this.roundStatus.timer.clearQueue0();
            this.roundStatus.timer.stopTime(); // Save the state and clear the timer (to be used by reconnect function)
            this.disconnected.push(socketID);
            
            // 2. Display the disconnect notice to the users
            this.displayMessage("Disconnect Notice", genMessage(this), this.settings.dcTime);
            this.roundStatus.timer.setTime(this.settings.dcTime);
            this.roundStatus.timer.addToQueue(() => {
                this.displayMessage("Disconnect Notice", genMessage(this), this.roundStatus.timer.time);
            });
            this.roundStatus.timer.addToQueue0(()=> {
                this.players = this.players.filter((player) => !this.disconnected.includes(player.socketID)); // Remove disconnected players
                this.resetRoom();
            });
            this.roundStatus.timer.startTime();
        } else { // There is a person who is already disconnected
            this.disconnected.push(socketID);
            this.roundStatus.timer.setTime(this.settings.dcTime);

            this.roundStatus.timer.clearQueue();
            this.roundStatus.timer.addToQueue(() => {
                this.displayMessage("Disconnect Notice", genMessage(this), this.roundStatus.timer.time);
            });
        }
    }


    reconnect(socketID) {
        if (this.disconnected == undefined || this.disconnected == null || !this.disconnected.includes(socketID)) {
            // The user does not belong to this room or is not disconnected
            return {success: false, message: "USER IS NOT DISCONNECTED"};
        } // The user needs to be reconnected
        this.disconnected = this.disconnected.filter((id) => id != socketID); // Remove socketID from the array
        // Perform a check and reestablish the state the game was originally in
        if (this.disconnected.length == 0) {
            // Reestablish State of game
            this.roundStatus.timer.clearQueue();
            this.roundStatus.timer.clearQueue0();
            this.roundStatus.timer.stopTime();

            this.roundStatus.state = this.savedState;
            this.hideMessage();
            this.roundStatus.timer.setTime(this.savedTime || 30);
            this.roundStatus.timer.queueFunc = this.timerQueue;
            this.roundStatus.timer.queueEx0 = this.timerQueue0;
            this.roundStatus.timer.startTime();
        }
        return {success: true, message: "USER RECONNECT"};
    }

    /**
     * TODO
     */
    updateByNextMatchup() {
        let matchup = this.bracket.getNextMatchup();
        this.roundStatus.currentRound++;
        this.roundStatus.currentlyPlaying = matchup[0];
        this.roundStatus.bracketLevel = matchup[1];
        this.roundStatus.voting = [];
        this.roundStatus.submittedVideos = [];

        let sockets = this.roundStatus.currentlyPlaying.map((player) => player.socketID);
        for (let player of this.players) {
            if (!sockets.includes(player.socketID)) {
                this.roundStatus.voting.push(player);
            }
        }
    }

    /**
     * A client-based function where someone can submit a video ID to a certain socket if
     * they are currently playing.
     */
    submitVideo (socketID, video) {
        // PERFORM CHECK FOR IF STATE == PLAYING AND SOCKETID BELONGS TO PLAYER
        if (this.roundStatus.state != "playing" || !this.roundStatus.currentlyPlaying.map((player) => player.socketID).includes(socketID)) {
            return {success:false, message: "ERROR IN SUBMITTING VIDEO"};
        }

        // REPLACE VIDEO IF NOT NEEDED
        if (this.roundStatus.submittedVideos == null) {
            this.roundStatus.submittedVideos = [];
        } else {
            // Replace video if already submitted
            for (let i = 0; i < this.roundStatus.submittedVideos.length; i++) {
                if (this.roundStatus.submittedVideos[i].socketID == socketID) {
                    this.roundStatus.submittedVideos[i].video = video;
                    return {success: true, message: "YOUR VIDEO WAS REPLACED"};
                }
            }
        }

        // FETCH PLAYER FOR USERNAME
        let player = null;
        for (let play of this.roundStatus.currentlyPlaying) {
            if (play.socketID == socketID) {
                player = play;
                break;
            }
        }

        this.roundStatus.submittedVideos.push({
            socketID,
            username: player.username,
            video
        });
        return {success: true, message: "YOUR VIDEO WAS SUBMITTED"};
    }

    /**
     * A client-based function where someone can submit a vote for a certain video.
     */
    submitVote (socketID, videoID) {
        let thisRoom = this;
        function makeVote(videoID) {
            let vote = {
                from: socketID
            };
            for (let video of thisRoom.roundStatus.submittedVideos) {
                if (video.video.ID == videoID) {
                    vote.for = video.socketID;
                    vote.videoName = video.video.name;
                    break;
                }
            }
            return vote;
        }

        // PERFORM CHECK FOR STATE == VOTING AND SOCKETID BELONGS TO VOTER
        if (this.roundStatus.state != "voting" || !this.roundStatus.voting.map((player) => player.socketID).includes(socketID)) {
            return {success:false, message: "ERROR IN SUBMITTING VOTE"};
        }

        // INITIALIZE VOTES AND REPLACE VOTE IF NEEDED
        if (this.roundStatus.votes == null) {
            this.roundStatus.votes = [];
        } else {
            // Replace vote if already submitted
            for (let i = 0; i < this.roundStatus.votes.length; i++) {
                if (this.roundStatus.votes[i].socketID == socketID) {
                    this.roundStatus.votes[i].vote = makeVote(videoID);
                    return {success: true, message: "YOUR VOTE WAS REPLACED"};
                }
            }
        }

        // FETCH USER VOTING FOR BASED ON VIDEO ID
        this.roundStatus.votes.push({
            socketID,
            vote: makeVote(videoID)
        });
        return {success: true, message: "YOUR VOTE WAS SUCCESSFULLY SUBMITTED."};
    }

    /**
     * Get a stripped version of this room's status to send to
     * the client.
     */
    getStrippedStatus(socketID) {
        let status = {}; // Return me

        // Add player usernames
        let players = [];
        for (let player of this.players) {
            players.push(player.username);
        }

        // Set Role based on state and roundStatus variables
        let role = "DEFAULT";
        if (this.roundStatus.state == "playing") {
            if (this.roundStatus.currentlyPlaying.map((player) => player.socketID).includes(socketID)) {
                role = "player";
            } else {
                role = "waiter";
                manualDisplay("WAIT YOUR TURN!", "Relax while the players submit their videos...");
            }
        } else if (this.roundStatus.state == "voting") {
            if (this.roundStatus.voting.map((player) => player.socketID).includes(socketID)) {
                role = "voter";
            } else {
                role = "waiter";
                manualDisplay("WAIT FOR THE RESULTS!", "Well done! Good luck as the votes are cast on the better music choice...");
            }
        }

        // INITIALIZE STATE
        status.host = this.host.username;
        status.players = players;
        status.state = this.roundStatus.state;
        status.currentPlaying = this.roundStatus.currentlyPlaying && this.roundStatus.currentlyPlaying.map((player) => player.username);
        status.voting = this.roundStatus.voting && this.roundStatus.voting.map((player) => player.username);
        status.messageActive = this.roundStatus.messageActive;
        status.message = this.roundStatus.message;
        status.specificMessage = status.specificMessage || null;
        status.time = this.roundStatus.time;
        status.role = role;
        status.settings = this.settings;
        status.videos = [];
        status.results = null;
        status.prompt = this.roundStatus.prompt;
        
        /**
         * Player Specific Display, does not override room rules (which are global).
         */
        function manualDisplay (header, message) {
            status.specificMessage = {header, message};
        }

        // Append stripped videos for voting process
        if (this.roundStatus.submittedVideos != null) {
            for (let video of this.roundStatus.submittedVideos) {
                status.videos.push({
                    videoID: video.video.ID,
                    start: Number(video.video.startingPosition),
                    author: video.video.author,
                    duration: video.video.duration,
                    name: video.video.name
                });
            }
        }

        // Append stripped votes for results
        status.results = this.roundStatus.results;
        return status;
    }
}


/**
 * The Player keeps track of a player's socketID and their username.
 * All relative socket functions are held in the Player as well.
 */
class Player {
    constructor (username, socketID){
        this.username = username;
        this.socketID = socketID;
    }
}


/**
 * Timer Class
 * Keeps track of functions and automates setInterval timer.
 * 
 * @author Harjyot Sidhu
 */
class Timer {
    constructor(timeT = 0) {
        this.time = timeT;
        this.queueEx0 = [];
        this.queueFunc = [];
        this.timer = null;

    }
    startTime() {
        this.timer = setInterval(() => {
            if (this.time == 0) {
                this.stopTime();
                let dummyQueue = this.queueEx0;
                this.queueEx0 = [];
                this.queueFunc = [];
                for (let Func of dummyQueue) {
                    Func();
                }
                return;
            }
            for (let Func of this.queueFunc) {
                Func();
            }
            this.time -= 1;
        }, 1000);
    }
    stopTime() {
        clearInterval(this.timer);
        this.timer = null;
    }
    resetTime() {
        this.time = 0;
    }
    setTime(time) {
        this.time = time;
    }
    addToQueue0(func) {
        this.queueEx0.push(func);
    }
    addToQueue(func) {
        this.queueFunc.push(func);
    }
    clearQueue0() {
        this.queueEx0 = [];
    }
    clearQueue() {
        this.queueFunc = [];
    }
}



module.exports = {
    GameManager, Room, Player
}