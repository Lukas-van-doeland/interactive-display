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
        tilt: Math.random() * 20 - 10, // Initial tilt for 3D effect
        tiltSpeed: Math.random() * 0.2 - 0.1, // Speed of tilt change
        windInfluence: Math.random() * 0.05 + 0.02, // Wind effect strength
        rotationPhase: Math.random() * Math.PI * 2, // Phase for rotation effect
        interacted: false, // Track if the leaf is being interacted with
        flutterPhase: Math.random() * Math.PI * 2, // Phase for fluttering effect
        interactionTimer: 0, // Track how long the leaf has been interacted with
        recoveryPhase: false, // Whether the leaf is recovering from interaction
        currentSpeedY: Math.random() * 0.5 + 0.5, // Current vertical speed
        targetSpeedY: Math.random() * 0.5 + 0.5,  // Target speed to reach
        acceleration: 0.05,  // Speed change rate
        interactionStrength: 0, // Track how strongly the leaf is being influenced
    };
    leaves.push(leaf);
}

function darkenColor(color) {
    // Convert hex to RGB, darken, then back to hex
    const r = parseInt(color.slice(1,3), 16) * 0.7;
    const g = parseInt(color.slice(3,5), 16) * 0.7;
    const b = parseInt(color.slice(5,7), 16) * 0.7;
    return `#${Math.round(r).toString(16).padStart(2,'0')}${Math.round(g).toString(16).padStart(2,'0')}${Math.round(b).toString(16).padStart(2,'0')}`;
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

    // Calculate interaction strength based on distance
    const targetStrength = distance < 150 ? 1 : 0;
    leaf.interactionStrength += (targetStrength - leaf.interactionStrength) * 0.1;

    if (leaf.interactionStrength > 0.01) {
        const angle = Math.atan2(distanceY, distanceX);
        const swayForce = 15 * leaf.interactionStrength;
        const swaySpeed = 0.03;

        leaf.swayOffsetX += Math.cos(angle + Math.PI) * swayForce;
        leaf.swayOffsetY += Math.sin(angle + Math.PI) * swayForce;
        leaf.swayOffsetX *= 1 - swaySpeed;
        leaf.swayOffsetY *= 1 - swaySpeed;

        // Only set interacted if interaction is strong enough
        if (leaf.interactionStrength > 0.5) {
            leaf.interacted = true;
        }
    }

    const windForce = (mouseX - canvas.width / 2) * 0.0005;
    leaf.x += windForce * leaf.windInfluence * leaf.interactionStrength;
}

function drawWindEffect() {
    const gradient = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 150);
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.5)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 150, 0, Math.PI * 2);
    ctx.fill();
}

function drawLeafShape(ctx, radius, color, rotationPhase) {
    const thinness = Math.abs(Math.sin(rotationPhase)) * 0.5 + 0.5; // Thinner when "rotating"

    // Draw the leaf body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -radius);
    ctx.bezierCurveTo(radius * thinness, -radius, radius * thinness, radius, 0, radius * 1.5);
    ctx.bezierCurveTo(-radius * thinness, radius, -radius * thinness, -radius, 0, -radius);
    ctx.closePath();
    ctx.fill();

    // Draw the stem with darker shade of leaf color
    ctx.fillStyle = darkenColor(color);
    ctx.fillRect(-1, radius * 1.5, 2, radius * 0.5);
}

function updateLeafSpeed(leaf) {
    // Smoothly transition between current and target speed
    if (Math.abs(leaf.currentSpeedY - leaf.targetSpeedY) > 0.01) {
        leaf.currentSpeedY += (leaf.targetSpeedY - leaf.currentSpeedY) * leaf.acceleration;
    }
}

// Draw the leaves
function drawLeaves() {
    leaves.forEach((leaf, index) => {
        swayAwayFromMouse(leaf);

        ctx.save();
        ctx.translate(leaf.x + leaf.swayOffsetX, leaf.y + leaf.swayOffsetY);
        ctx.rotate(leaf.rotation * Math.PI / 180);
        drawLeafShape(ctx, leaf.radius, leaf.color, leaf.rotationPhase);
        ctx.restore();

        // Update leaf movement with smooth speed transitions
        if (leaf.interactionStrength > 0.1) {
            // Move upward when interacting
            leaf.targetSpeedY = -leaf.speedY * 2 * leaf.interactionStrength;
            leaf.rotation += leaf.rotationSpeed * 2 * leaf.interactionStrength;
        } else {
            // Simply fall when not interacting
            leaf.targetSpeedY = leaf.speedY;
        }

        updateLeafSpeed(leaf);
        leaf.y += leaf.currentSpeedY;

        // Flutter effect
        leaf.x += Math.sin(leaf.flutterPhase) * 0.5;
        leaf.flutterPhase += 0.05;

        leaf.x += Math.sin(leaf.swaySpeed * performance.now()) * leaf.sway * 0.01 + leaf.windEffect;
        leaf.rotation += leaf.rotationSpeed;
        leaf.tilt += leaf.tiltSpeed; // Update tilt for 3D effect
        leaf.rotationPhase += 0.05; // Update rotation phase for thinness effect

        // Remove leaves that have gone off-screen
        if (leaf.y > canvas.height || leaf.y < 0 || leaf.x < 0 || leaf.x > canvas.width) {
            leaves.splice(index, 1); // Remove the leaf from the array
            createLeaf(); // Create a new leaf to maintain constant leaf count
        }
    });
}

// Draw function to handle both the background, wind effect, and the leaves
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the background image
    drawBackground();

    // Draw wind effect around the cursor
    drawWindEffect();

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
