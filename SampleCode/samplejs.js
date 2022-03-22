let x = 1;
let y = "Hello";
let arr = [1, 2, 3, 4];
let dict = {
    23: 2, 
    32: 12
};
let z = dict[23]; // z = 2

if (true) {
    console.log("This happens"); // console.log = print
} else {
    console.log("This doesn't happen");
}

for (let i = 0; i < arr.length; i++) {
    console.log(arr[i]);
}

for (let item of arr) {
    console.log(item);
}

let i = 0;
while (i < arr.length) {
    console.log(arr[i] + 23);
    i++; // i += 1, i = i + 1
}

class Room {
    constructor(name) {
        this.name = name;
    }

    bark() {
        console.log(this.name);
    }

    static coolguy() {
        console.log("This doesn't matter on an object.")
    }
}

let obj = new Room("Pirjot");
obj.bark();
Room.coolguy();

// Direct declaration
function f(x) {
    return x + 1;
}

// Anonymous Declaration
f = (x) => x + 1;

// Take a function as a parameter
function f(g) {
    return 3 * g(3);
}


f = (g) => Math.pow((3 * g(3)), 2);
console.log(f((x) => (6 * x) / 2)); //What will this print?