// Set up the canvas
const canvas = document.getElementById("fishCanvas");
const ctx = canvas.getContext("2d");

// Adjust the canvas size to fit the screen
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Fish properties
const fishCount = 10; // Number of fish
const fishArray = [];

// Mouse position
let mouseX = 0;
let mouseY = 0;

// Flee timer
const fleeDuration = 2000; // Time to flee in milliseconds (2 seconds)

// Track mouse position
canvas.addEventListener('mousemove', (event) => {
  mouseX = event.clientX;
  mouseY = event.clientY;
});

// Create fish objects
function createFish() {
  for (let i = 0; i < fishCount; i++) {
    const fish = {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      width: 50,
      height: 30,
      speed: Math.random() * 2 + 1, // Random speed between 1 and 3
      directionX: Math.random() * 2 - 1, // Random direction
      directionY: Math.random() * 2 - 1, // Random direction
      color: 'orange',
      isFleeing: false,
      fleeEndTime: 0, // Timer for how long they need to flee
      isInvestigating: false,
      isInvestigatingTarget: false, // Track if this fish is the one investigating
    };
    fishArray.push(fish);
  }
}

// Draw the fish
function drawFish(fish) {
  ctx.beginPath();
  ctx.ellipse(fish.x, fish.y, fish.width / 2, fish.height / 2, 0, 0, Math.PI * 2);
  ctx.fillStyle = fish.color;
  ctx.fill();
  ctx.closePath();
}

// Update the position of each fish
function updateFish() {
  // Determine which fish will investigate
  let closestFish = null;
  let closestDistance = Infinity;

  // Calculate the closest fish to the mouse (for investigation)
  fishArray.forEach(fish => {
    const dx = fish.x - mouseX;
    const dy = fish.y - mouseY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < closestDistance && distance < 300 && !fish.isFleeing) {
      closestFish = fish;
      closestDistance = distance;
    }
  });

  // Now that we have the closest fish, make it investigate
  fishArray.forEach(fish => {
    // Calculate distance from fish to mouse
    const dx = fish.x - mouseX;
    const dy = fish.y - mouseY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // If any fish is too close to the mouse, make them all flee
    if (distance < 100) {
      fishArray.forEach(f => {
        f.isFleeing = true;
        f.fleeEndTime = Date.now() + fleeDuration; // Set the flee end time to 2 seconds from now
      });
    }

    if (fish.isFleeing) {
      // Move the fish away from the mouse
      const angle = Math.atan2(dy, dx);
      fish.x += Math.cos(angle) * fish.speed * 3; // Increase the flee speed
      fish.y += Math.sin(angle) * fish.speed * 3;

      // Stop fleeing after the flee duration has passed
      if (Date.now() > fish.fleeEndTime) {
        fish.isFleeing = false;
      }
    } else if (fish === closestFish && !fish.isFleeing) {
      // Make the closest fish investigate the mouse
      const angle = Math.atan2(dy, dx);
      fish.x -= Math.cos(angle) * fish.speed; // Move towards the mouse
      fish.y -= Math.sin(angle) * fish.speed;
      fish.isInvestigating = true;
    } else {
      fish.isInvestigating = false; // Reset the investigation flag

      // Move fish within a radius around the center of the screen if not fleeing or investigating
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 150; // Define the radius around the center

      // Calculate the angle from the fish to the center
      const angleToCenter = Math.atan2(centerY - fish.y, centerX - fish.x);
      const distanceToCenter = Math.sqrt((centerX - fish.x) ** 2 + (centerY - fish.y) ** 2);

      // If the fish is outside the radius, move it back toward the center
      if (distanceToCenter > radius) {
        fish.x += Math.cos(angleToCenter) * fish.speed;
        fish.y += Math.sin(angleToCenter) * fish.speed;
      } else {
        // Once the fish is near the center, let it wander randomly
        const randomAngle = Math.random() * Math.PI * 2; // Random angle for wandering
        fish.x += Math.cos(randomAngle) * fish.speed;
        fish.y += Math.sin(randomAngle) * fish.speed;
      }
    }

    // Collision detection with other fish
    fishArray.forEach(otherFish => {
      if (fish !== otherFish) {
        const dx = fish.x - otherFish.x;
        const dy = fish.y - otherFish.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // If fish are too close, move them away from each other
        if (distance < (fish.width / 2 + otherFish.width / 2)) {
          const angle = Math.atan2(dy, dx);
          fish.x += Math.cos(angle) * fish.speed;
          fish.y += Math.sin(angle) * fish.speed;

          otherFish.x -= Math.cos(angle) * otherFish.speed;
          otherFish.y -= Math.sin(angle) * otherFish.speed;
        }
      }
    });

    // Draw the fish
    drawFish(fish);
  });
}

// Start the animation
function animate() {
  // Clear the canvas and update fish positions
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updateFish();

  requestAnimationFrame(animate);
}

// Initialize fish and start animation
createFish();
animate();
