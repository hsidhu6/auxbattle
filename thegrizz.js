/**
 * Framework for AuxBattle Serverside Classes
 * Expected to be imported by sockets.js.
 * 
 * @file thegrizz.js
 * @author Harjyot Sidhu
 */

/**
 * The GameManager keeps track of a list of rooms
 * and any facilitation that the server needs to run
 * all games.
 */
class GameManager {

}

// Taken from https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

class Bracket {
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
            history: {}
        }
    }

    /**
     * 
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
            console.log("THE WINNER OF THE TOURNEY IS:  " + winner);
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

function ex() {
    let players = ["Flakejyot", "Harjyot", "Bikram Saini", "Number 1 Best", "Cool Guy Tough Guy", "NWordJyot", "TargetJyot", "Lavi", "Hark"];
    let bracket = new Bracket(players);
    for (let i = 0; i < 7; i++) {
        // break;
        let nextMatchup = bracket.getNextMatchup();
        let pair = nextMatchup[0];
        let round = nextMatchup[1];
        let winner = pair[Math.floor(Math.random() * (1 + 1))];
        if (winner == undefined) {
            winner = pair[0];
        }
        console.log("The next matchup is ", nextMatchup);
        console.log("The winner is ", winner);

        bracket.playNextMatchup(round, pair, winner);
        console.log("The updated bracket's rounds ", bracket.bracket.rounds);
        console.log("The updated history is ", bracket.bracket.history);
    }

    
}

ex();
/**
 * The Room keeps track of all current logged in players,
 * the host, the room settings, the current bracket,
 * the time of the current round, and the videos needed to
 * play. The Room also keeps track of the state of the game
 * in the room at any time.
 */
class Room {
    constructor (username, password, socket){
        this.host = new Player (username, socket);
        this.password = password;
        this.settings = {
            customPrompts: false,
            maxPlayers: 32,
            promptsToPlay: [], //to be implemented 
            clipDuration: 30,
            dcTime: 60,
            voteTime: 90,
            roundTime: 10,

        }
        this.players = [this.host];
        this.state = "setting";
        this.possibleStates = ["setting", "round", "voting", "result"];

    

}

/**
 * The Player keeps track of a player's socket and their username.
 * All relative socket functions are held in the Player as well.
 */
class Player {
    constructor (username, socket){
        this.username = username;
        this.socket = socket;

    }

}

class Round {
    
}

module.exports = {
    GameManager, Room, Player
}