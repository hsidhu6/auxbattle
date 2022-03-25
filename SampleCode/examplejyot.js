// Taken from https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

class Bracket {
    constructor (players) {
        this.winner = null;
        // Randomize order
        shuffleArray(players);

        this.leftTree = new BracketTree(players.slice(0, players.length / 2));
        this.rightTree = new BracketTree(players.slice(players.length / 2));
    }

    findNextRound() {

    }
    
    playNextRound() {

    }

    printBracket() {
        
    }
}

class BracketTree {
    constructor (players) {
        let node = new BracketNode();
        node.buildBracket(players.length);
        fillPlayers(node);
    }

    
}

class BracketNode {
    constructor(player=null, left=null, right=null) {
        this.player = player;
        this.left = left;
        this.right = right;
        this.leaves = [];
    }
    
    buildBracket(children) {
        let power = 0;
        while (Math.pow(2, power) < children) {
            power += 1;
        }
        this.fill(power - 1);
        this.fillChildren(5);
    }

    generateLeaves() {
        if (this.left == null && this.right == null) {
            this.leaves.push(this);
        }
        this.left.generateLeaves();
        this.right.generateLeaves();
    }

    numOfLeaves() {
        if (this.left == null && this.right == null) {
            return 1;
        }
        return this.left.numOfLeaves() + this.right.numOfLeaves();
    }

    fill(depth = 0) {
        if (depth == 0) {
            return;
        }
        this.left = new BracketNode();
        this.right = new BracketNode();
        this.left.fill(depth - 1);
        this.right.fill(depth - 1);
    }

    fillChildren(children) {
        while (this.numOfLeaves() < children) {
            this.branchBigger();
        }
    }

    branchBigger() {
        let current = this;
        while (current.left != null && current.right != null) {
            if (current.left.numOfLeaves() > current.right.numOfLeaves()) {
                current = current.right;
            } else {
                current = current.left;
            }
        }
        current.right = new BracketNode();
        current.left = new BracketNode();
    }
}

class Player {
    constructor(username) {
        this.username = username;
    }
}

function runExample() {
    console.log("Bracket Example running...");

    let names = ["Namejyot", "Codejyot", "Harjyot", "Pirjot", "GurmanBestFriendOfLavi"];
    let players = [];
    for (let name of names) {
        players.push(new Player(name));
    }

    console.log("List of players:", players);
    let bracket = new Bracket(players);

    bracket.printBracket();


    console.log("Example finishing...");
}

runExample();