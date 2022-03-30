/**
 * Framework for AuxBattle Serverside Classes
 * Expected to be imported by sockets.js.
 * 
 * @file thegrizz.js
 * @author Harjyot Sidhu, Pirjot Atwal
 */

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
    constructor(displayFunc) {
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
        let room = null;
        for (let rom of this.rooms) {
            if (rom.host.username == hostUsername) {
                room = rom;
                break;
            }
        }
        if (room.password == password) {
            room.addPlayer(username, socketID);
            return room.settings;
        } else {
            return { success: false, message: "PASSWORD IS INCORRECT." }
        }
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
        room.startGame();
    }

    /**
     * Return the room that this socket is in, return null if the
     * person is not in any socket.
     * @param {*} socketID 
     * @returns 
     */
    //if a player is not in a room return a false message
    getRoomState(socketID) {
        let state = {
            players: [],
            settings: null,
            state: null,
            roles: {
                host: playerRoom.host.username, //set to host username
                playing: [playerRoom.currentlyPlaying, playerRoom.currentlyPlaying] / [null], //set to people playing
                voting: [playerRoom.voting, playerRoom.voting, playerRoom.voting, playerRoom.voting], //set to people voting
            }
        };

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
        return playerRoom.getStrippedStatus();
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
        if (pairs.length % 2 == 1) {
            pairs.unshift(pairs.pop());
        }
        this.bracket = this.buildBracket(pairs);
    }

    buildBracket(pairs) {
        return {
            rounds: {
                1: pairs,
            },
            winner: null,
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
        if (this.bracket.rounds[roundNumber].length == 1) {
            this.bracket.winner = winner;
        } else {
            if (!Object.keys(this.bracket.rounds).includes(String(Number(roundNumber) + 1))) {
                this.bracket.rounds[Number(roundNumber) + 1] = [];
            }
            this.bracket.rounds[Number(roundNumber) + 1].push([winner]);
            this.reconstruct(this.bracket.rounds[Number(roundNumber) + 1]);
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
        array.splice(0, array.length)
        for (let pair of pairs) {
            array.push(pair);
        }
    }

    /**
     * 
     * @returns {Array<Player>} [matchup, round]
     */
    getNextMatchup() {
        if (this.bracket == undefined) {
            return false;
        }

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


/**
 * The Room keeps track of all current logged in players,
 * the host, the room settings, the current bracket,
 * the time of the current round, and the videos needed to
 * play. The Room also keeps track of the state of the game
 * in the room at any time.
 */
class Room {
    constructor(username, password, socketID) {
        this.host = new Player(username, socketID);
        this.password = password;
        this.settings = {
            maxPlayers: 32,
            promptsToPlay: [], //to be implemented 
            clipDuration: 30,
            dcTime: 60,
            voteTime: 90,
            roundTime: 10,
            messageTime: 7,
        }
        this.players = [this.host];
        this.possibleStates = ["setting", "playing", "message", "paused", "voting", "result"];
        
        // GAME VARS
        this.bracket = null;
        this.roundStatus = {
            state: "setting",
            currentlyPlaying: null,
            voting: null,
            maxRounds: null,
            currentRound: null,
            submittedVideos: null,
            timer: null,
            votes: null,
            winner: null,
            messageActive: false,
            message: {
                header: null,
                message: null
            }
        };
    }

    /**
     * Add a player to the players array.
     * @param {*} username
     * @param {*} socketID
     */
    addPlayer(username, socketID) {
        this.players.push(new Player(username, socketID));
    }

    startGame() {
        // Initialize the bracket
        this.bracket = new Bracket(this.players);
        this.roundStatus.maxRounds = this.bracket.maxRounds;
        this.roundStatus.currentRound = 1;
        // TODO: Initialize Timer
        // this.roundStatus.timer = new Timer();

        // INITIALIZE THE GAME
        console.log("STARTING GAME");
        // Start GameplayLoop()
        this.mainGameplayLoop();
    }

    mainGameplayLoop() {
        // Get the next matchup, set the currentPlaying, voting, based on the nextMatchup
        this.updateByNextMatchup();

        // Display the next matchup to the client.
        this.roundStatus.messageActive = true;
        this.roundStatus.message = {
            header: "HEADER",
            message: "MESSAGE"
        };
        
        // Set the timer, to the message time
        setInterval(() => {
            this.roundStatus.messageActive = false;
        }, this.settings.messageTime * 1000);




    }

    updateByNextMatchup() {
        let matchup = this.bracket.getNextMatchup();
        this.roundStatus.currentRound = matchup[1];
        this.roundStatus.currentlyPlaying = matchup[0];
        this.roundStatus.voting = [];

        let sockets = this.roundStatus.currentlyPlaying.map((player) => player.socketID);
        for (let player of this.players) {
            if (!sockets.includes(player.socketID)) {
                this.roundStatus.voting.push(player);
            }
        }
    }

    incrementState() {
        
    }

    /**
     * Get a stripped version of this room's status to send to
     * the client.
     */
    getStrippedStatus() {
        let players = [];
        for (let player of this.players) {
            players.push(player.username);
        }
        let status = {
            host: this.host.username,
            players,
            state: this.roundStatus.state,
            currentPlaying: this.roundStatus.currentlyPlaying && this.roundStatus.currentlyPlaying.map((player) => player.username),
            voting: this.roundStatus.voting && this.roundStatus.voting.map((player) => player.username),
            messageActive: this.roundStatus.messageActive,
            message: this.roundStatus.message
        };
        return status;
    }
}


/**
 * The Player keeps track of a player's socketID and their username.
 * All relative socket functions are held in the Player as well.
 */
class Player {
    constructor(username, socketID) {
        this.username = username;
        this.socketID = socketID;
    }
}
/**
 * Timer Class
 * 
 * On construct, keep track of a time variable. 
 * Have a start function.
 * Have a stop function.
 * Have a reset function.
 * Have a setToTime function.
 * Have a executeEventAt0 function (takes in a function and adds it to a queue of functions to execute).
 * Have a executeEverySecond function (takes in a function and adds it to a queue of functions to execute).
 * 
 * Use setInterval to update the Timer.
 * To stop a setInterval timer
 * 
 * let timer = setInterval(() => console.log("This happens every second"), 1000);
 * clearInterval(timer);
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
            if (time == 0) {
                for (let Func of this.queueEx0) {
                    Func();
                }
                clearInterval(this.timer);
                this.queueEx0 = [];
            }
            this.time -= 1;

            for (let Func of this.queueFunc) {
                Func();
            }
            this.queueFunc = [];
        }, 1000);
    }
    stopTime() {
        clearInterval(this.timer);
    }
    resetTime() {
        this.time = 0;
    }
    setTotime(setTime) {
        this.time = setTime;
    }
    addToqueue0(Func0) {
        this.queueEx0.push(Func0);
    }
    addToqueue(FunQ) {
        this.queueFunc.push(FunQ);
    }

}
module.exports = {
    GameManager, Room, Player
}