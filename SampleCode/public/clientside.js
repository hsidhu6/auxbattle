console.log("Hello World"); //Print to the console (Right Click > Inspect > Console)

// Document is the HTML page
// Get elements by their ID (declared on the .html page)
// Add EventListener takes the name of the event and the callback function (declared anonymously, expected to take in some event variable)
// setInterval takes in a time (in ms) and a callback function and repeatedly calls back the callback function every interval of the time provided
// Take any object on the page and set its style parameter through .style
function cantWorkImmediatelyOnPageLoad() {
    document.getElementById("travis").addEventListener('mouseover', (evt) => {
        heightBool = true; // If true, travis is big, if false, he's not
        setInterval(() => {
            heightBool = !heightBool; // Flip the bool
            if (heightBool) { // If big, then big
                document.getElementById("travis").style.height = '500px';
            } else { // Else, small
                document.getElementById("travis").style.height = '200px';
            }
        }, 500); // Every .5 seconds
    });
}

// The above says "Once the user mouses over the element with the ID travis (the image
// on the webpage) do the following: Every 500 ms, if travis is big make him small,
// else make him big."

// Try Catch example
try {
    cantWorkImmediatelyOnPageLoad(); // throws a TypeError here
} catch (err) {
    console.error(err);
}

// What you'll notice is that Javascript that is loaded at the start of a webpage
// (often in the head of an html page) will fail to work if it depends on the existence
// of elements on the page that are loaded after it (often in the body of the html page).
// So oftentimes for client scripts to we run everything through a 
// a DOMContentLoaded listener, which ensures everything on the HTML page has been loaded
// beforehand.

document.addEventListener("DOMContentLoaded", cantWorkImmediatelyOnPageLoad);
