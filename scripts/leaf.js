// Get canvas and context
const canvas = document.getElementById("fallingLeavesCanvas");
const ctx = canvas.getContext("2d");

// Set canvas size to full screen
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Background image
const backgroundImage = new Image();
backgroundImage.src = '/images(backgrounds)/leafBackground.jpg'; // Replace with the path to your image

// Leaf parameters
const leaves = [];
let mouseX = 0;
let mouseY = 0;

// Function to generate leaves
function createLeaf() {
    const leaf = {
        x: Math.random() * canvas.width,
        y: Math.random() * (canvas.height / 2),
        radius: Math.random() * 5 + 3,
        speedY: Math.random() * 1 + 1,
        speedX: (Math.random() - 0.5) * 2, // Movement to the left or right
        rotation: Math.random() * 360,
    };
    leaves.push(leaf);
}

// Draw the background image
function drawBackground() {
    // Draw the image once it's loaded
    if (backgroundImage.complete) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    }
}

// Function to make a leaf move away from the mouse
function moveAwayFromMouse(leaf) {
    const distanceX = mouseX - leaf.x;
    const distanceY = mouseY - leaf.y;
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

    // If the mouse is close to the leaf, move it away
    if (distance < 100) {
        const angle = Math.atan2(distanceY, distanceX);
        const force = 2; // Adjust this value for stronger/faster fleeing
        leaf.x -= Math.cos(angle) * force;
        leaf.y -= Math.sin(angle) * force;
    }
}

// Draw the leaves
function drawLeaves() {
    ctx.fillStyle = "rgb(255, 153, 0)";
    leaves.forEach(leaf => {
        // Make the leaf move away from the mouse if it's close
        moveAwayFromMouse(leaf);

        ctx.save();
        ctx.translate(leaf.x, leaf.y);
        ctx.rotate(leaf.rotation * Math.PI / 180);
        ctx.beginPath();
        ctx.moveTo(0, -leaf.radius);
        ctx.lineTo(leaf.radius, leaf.radius);
        ctx.lineTo(-leaf.radius, leaf.radius);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Update leaf position
        leaf.y += leaf.speedY;
        leaf.x += leaf.speedX;

        // Reset leaf position if it falls below the canvas
        if (leaf.y > canvas.height) {
            leaf.y = -leaf.radius;
            leaf.x = Math.random() * canvas.width;
        }
    });
}

// Draw function to handle both the background and the leaves
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the background image
    drawBackground();

    // Draw and update the leaves
    drawLeaves();

    requestAnimationFrame(draw);
}

// Add new leaves at regular intervals
setInterval(createLeaf, 200); // Add a new leaf every 200 milliseconds

// Start the animation once the background image is loaded
backgroundImage.onload = function() {
    draw();
};

// Track mouse position
canvas.addEventListener('mousemove', (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
});
