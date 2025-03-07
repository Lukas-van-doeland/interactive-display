const canvas = document.getElementById("rainCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const minParticles = 5000;
const maxParticles = 10000;
let t = 0; // Time variable
let maxRaindrops = minParticles; // Initial number of particles

const raindrops = [];
const splashes = [];
const umbrella = { x: 0, y: 0, radius: 50 }; // Cursor hitbox
const wind = 0; // Wind angle effect

// Reusable gradient for raindrops (do not recreate every frame)
const raindropGradient = ctx.createLinearGradient(0, 0, 0, 10);
raindropGradient.addColorStop(0, "rgba(173, 216, 230, 1)"); // Light blue
raindropGradient.addColorStop(1, "rgba(0, 0, 255, 1)"); // Deep blue

// Function to update the number of raindrops dynamically
function updateParticles() {
    t += 0.01; // Controls speed of variation
    let range = maxParticles - minParticles;
    let oscillation = (1 + Math.sin(t)) / 2; // Normalized sine wave (0 to 1)
    maxRaindrops = Math.round(minParticles + range * oscillation);

    console.log(maxRaindrops); // Log for debugging, you can remove this if unnecessary

    // Adjust the number of raindrops in the array based on maxRaindrops
    if (raindrops.length < maxRaindrops) {
        let extraRaindrops = maxRaindrops - raindrops.length;
        for (let i = 0; i < extraRaindrops; i++) {
            raindrops.push(createRaindrop()); // Create new raindrops to match the target count
        }
    } else if (raindrops.length > maxRaindrops) {
        raindrops.splice(maxRaindrops); // Remove excess raindrops if needed
    }

    requestAnimationFrame(updateParticles); // Call again to keep updating
}

// Create a raindrop object
function createRaindrop() {
    return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speedY: Math.random() * 14 + 8,  // Vertical speed
        speedX: wind + Math.random() * 1.5,  // Horizontal speed (wind effect)
        width: 2,   // Raindrop width (smaller to reduce rendering cost)
        height: Math.random() * 8 + 5, // Raindrop height (randomized)
        alpha: Math.random() * 0.5 + 0.5  // Random transparency
    };
}

// Create initial raindrops based on the initial number
for (let i = 0; i < maxRaindrops; i++) {
    raindrops.push(createRaindrop());
}

// Track mouse movement
canvas.addEventListener("mousemove", (e) => {
    umbrella.x = e.clientX;
    umbrella.y = e.clientY;
});

// Draw function (optimized)
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw raindrops using rectangles (much faster than circles)
    for (let i = 0; i < raindrops.length; i++) {
        const drop = raindrops[i];
        if (drop.y >= 0 && drop.y <= canvas.height) { // Only draw raindrops that are visible
            ctx.fillStyle = raindropGradient;
            ctx.globalAlpha = drop.alpha; // Apply transparency
            ctx.fillRect(drop.x, drop.y, drop.width, drop.height); // Fast rectangle rendering
        }
    }

    // Draw splashes (smaller number of splashes for performance)
    ctx.fillStyle = "lightblue";
    for (let i = 0; i < splashes.length; i++) {
        const splash = splashes[i];
        ctx.beginPath();
        ctx.arc(splash.x, splash.y, splash.size, 0, Math.PI * 2);
        ctx.fill();
        splash.size -= 0.1;
        if (splash.size <= 0) splashes.splice(i, 1);  // Clean up splashes
    }

    requestAnimationFrame(draw);  // Use requestAnimationFrame for smooth rendering
}

// Update function (optimized)
function update() {
    for (let i = 0; i < raindrops.length; i++) {
        const drop = raindrops[i];
        drop.y += drop.speedY;
        drop.x += drop.speedX;

        // Check if raindrop hits the umbrella
        const dx = drop.x - umbrella.x;
        const dy = drop.y - umbrella.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < umbrella.radius) {
            createSplash(drop.x, drop.y); // Create splash effect
            resetRaindrop(drop);  // Reset raindrop to the top
        }

        // Reset raindrop when it goes off-screen or hits the ground
        if (drop.y > canvas.height || drop.x > canvas.width) {
            createSplash(drop.x, canvas.height);
            resetRaindrop(drop);
        }
    }

    // Use a small delay to prevent excessive CPU usage
    setTimeout(update, 16); // Update every 16ms (60 FPS)
}

// Create splash effect (smaller number of splashes)
function createSplash(x, y) {
    for (let i = 0; i < 3; i++) { // Limit splashes to reduce calculations
        splashes.push({
            x: x + (Math.random() * 10 - 5), // Randomize splash position
            y: y + (Math.random() * 5 - 2),
            size: Math.random() * 3 + 1
        });
    }
}

// Reset raindrop to the top of the screen (recycling objects)
function resetRaindrop(drop) {
    drop.x = Math.random() * canvas.width; // Random X across the screen
    drop.y = -10; // Start from above the screen
    drop.alpha = Math.random() * 0.5 + 0.5; // Random transparency for realism
}

// Start animation loop
updateParticles(); // Start the particle update loop
draw();
update();
