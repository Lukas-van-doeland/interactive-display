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
const leafColors = ["#FF4500", "#FF8C00", "#FFD700"];

function createLeaf() {

    if (leaves.length >= 100) return;
    const leaf = {
        x: Math.random() * canvas.width,
        y: Math.random() * (canvas.height / 2),
        radius: Math.random() * 5 + 9,
        speedY: Math.random() * 0.5 + 0.5,
        speedX: (Math.random() - 0.5) * 1.5,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 2,
        sway: Math.random() * 50 + 20,
        swaySpeed: Math.random() * 1 + 0.01,
        windEffect: Math.random() * 0.5,
        color: leafColors[Math.floor(Math.random() * leafColors.length)], // Assign random color
        swayOffsetX: 0,
        swayOffsetY: 0,
    };
    leaves.push(leaf);
}

// Draw the background image
function drawBackground() {
    if (backgroundImage.complete) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    }
}

// Function to make a leaf sway smoothly away from the mouse
function swayAwayFromMouse(leaf) {
    const distanceX = mouseX - leaf.x;
    const distanceY = mouseY - leaf.y;
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

    // If the mouse is close to the leaf, sway it away
    if (distance < 100) {
        const angle = Math.atan2(distanceY, distanceX);
        const swayForce = 10; // Adjust this value to control the sway intensity
        const swaySpeed = 0.05; // Controls how smooth the sway is

        // Gradually sway the leaf away from the mouse by slowly changing the sway offsets
        leaf.swayOffsetX += Math.cos(angle + Math.PI) * swayForce;
        leaf.swayOffsetY += Math.sin(angle + Math.PI) * swayForce;

        // Smoothly reduce the sway offset to make it more natural
        leaf.swayOffsetX *= 1 - swaySpeed;
        leaf.swayOffsetY *= 1 - swaySpeed;
    }
}

function drawLeafShape(ctx, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -radius);
    ctx.bezierCurveTo(radius, -radius, radius, radius, 0, radius * 1.5);
    ctx.bezierCurveTo(-radius, radius, -radius, -radius, 0, -radius);
    ctx.closePath();
    ctx.fill();
}

// Draw the leaves
function drawLeaves() {
    leaves.forEach((leaf, index) => {
        swayAwayFromMouse(leaf); // Apply swaying effect

        ctx.save();
        ctx.translate(leaf.x + leaf.swayOffsetX, leaf.y + leaf.swayOffsetY); // Apply swaying offsets
        ctx.rotate(leaf.rotation * Math.PI / 180);
        drawLeafShape(ctx, leaf.radius, leaf.color);
        ctx.restore();

        // Update leaf movement
        leaf.y += leaf.speedY;
        leaf.x += Math.sin(leaf.swaySpeed * performance.now()) * leaf.sway * 0.01 + leaf.windEffect;
        leaf.rotation += leaf.rotationSpeed;

        // Remove leaves that have gone off-screen
        if (leaf.y > canvas.height || leaf.y < 0 || leaf.x < 0 || leaf.x > canvas.width) {
            leaves.splice(index, 1); // Remove the leaf from the array
            createLeaf(); // Create a new leaf to maintain constant leaf count
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
