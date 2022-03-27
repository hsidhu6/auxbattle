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
     * 
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
            return {success: false, message: "PASSWORD IS INCORRECT."}
        }
    }

    /**
     * Returns the state of the room.
     * @returns 
     */
    getRoomState(socketID) {
        let state = {
            players: [],
            settings: null,
            state: null
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
        for (let player of playerRoom.players) {
            state.players.push(player.username);
        }
        state.settings = playerRoom.settings;
        state.state = playerRoom.state;
        return state;
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
        array.splice(0, array.length)
        for (let pair of pairs) {
            array.push(pair);
        }
    }

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
    constructor (username, password, socketID){
        this.host = new Player (username, socketID);
        this.password = password;
        this.settings = {
            maxPlayers: 32,
            promptsToPlay: [], //to be implemented 
            clipDuration: 30,
            dcTime: 60,
            voteTime: 90,
            roundTime: 10,
        }
        this.players = [this.host];
        this.state = "setting";
        this.possibleStates = ["setting", "playing", "voting", "result"];
    }

    addPlayer(username, socketID) {
        this.players.push(new Player(username, socketID));
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

module.exports = {
    GameManager, Room, Player
}