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

/**
 * The Room keeps track of all current logged in players,
 * the host, the room settings, the current bracket,
 * the time of the current round, and the videos needed to
 * play. The Room also keeps track of the state of the game
 * in the room at any time.
 */
class Room {

}

/**
 * The Player keeps track of a player's socket and their username.
 * All relative socket functions are held in the Player as well.
 */
class Player {

}

module.exports = {
    GameManager, Room, Player
}