// Set up the canvas
const canvas = document.getElementById("fishCanvas");
const ctx = canvas.getContext("2d");

// Adjust the canvas size to fit the screen
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Fish properties
const fishCount = 20;
const fishArray = [];

// Mouse position
let mouseX = 0;
let mouseY = 0;

// Flee timer
const fleeDuration = 5000;

// Track mouse position
canvas.addEventListener("mousemove", (event) => {
  mouseX = event.clientX;
  mouseY = event.clientY;
});

let mouseDown = false;
let grabbedFish = null;

// Add mouse event listeners after existing mouse listener
canvas.addEventListener("mousedown", (event) => {
  mouseDown = true;
  // Try to grab a fish
  fishArray.forEach((fish) => {
    const dx = fish.x - mouseX;
    const dy = fish.y - mouseY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < 50 && !grabbedFish) {
      grabbedFish = fish;
      fish.isGrabbed = true;
      fish.isCrying = true;
    }
  });
});

canvas.addEventListener("mouseup", () => {
  mouseDown = false;
  if (grabbedFish) {
    grabbedFish.isGrabbed = false;
    grabbedFish.isCrying = false;
    grabbedFish = null;
  }
});

// Fish class
class Fish {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.width = 50;
    this.height = 30;
    this.speed = Math.random() * 2 + 1;
    this.directionX = Math.random() * 2 - 1;
    this.directionY = Math.random() * 2 - 1;
    this.isRainbow = Math.random() < 0.0000005; // one in 2 million chance
    if (this.isRainbow) {
      this.rainbowHue = 0;
      this.scale = 1.2; // Rainbow fish are slightly larger
      this.speed *= 1.5; // And faster
      this.glowIntensity = 0;
      this.glowDirection = 1;
    } else {
      const hue = Math.random() * 30 + 20; // Range from orange-red to gold
      const saturation = Math.random() * 20 + 80;
      const lightness = Math.random() * 20 + 50;
      this.color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }
    this.isFleeing = false;
    this.fleeEndTime = 0;
    this.minY = canvas.height - 50; // Keep fish above bottom of screen
    this.tailAngle = 0;
    this.tailSpeed = 0.005; // Reduced base tail speed
    this.tailAmplitude = 0.3; // Maximum tail swing
    this.angle = Math.atan2(this.directionY, this.directionX);
    this.targetAngle = this.angle;
    this.scale = Math.random() * 0.5 + 0.8; // Random size variation
    this.isGrabbed = false;
    this.isCrying = false;
    this.lastHuntTime = 0;
    this.huntingDelay = 1000;
    this.targetGrass = null;
  }

  findNearestGrass() {
    let nearest = null;
    let minDist = Infinity;

    seaGrassArray.forEach(grass => {
      if (!grass.eaten && grass.health > 0) {
        const dx = this.x - grass.x;
        const dy = this.y - grass.points[0].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < minDist) {
          minDist = distance;
          nearest = grass;
        }
      }
    });

    return nearest;
  }

  update() {
    const now = Date.now();
    
    if (this.isGrabbed) {
      this.x = mouseX;
      this.y = mouseY;
      this.angle = Math.PI; // Make fish face left when grabbed
      return;
    }

    // Only look for new grass if not fleeing and enough time has passed
    if (!this.isFleeing && now - this.lastHuntTime > this.huntingDelay) {
      this.targetGrass = this.findNearestGrass();
      this.lastHuntTime = now;
    }

    const dx = this.x - mouseX;
    const dy = this.y - mouseY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 100) {
      fishArray.forEach((f) => {
        f.isFleeing = true;
        f.fleeEndTime = Date.now() + fleeDuration;
      });
    } else if (this.targetGrass && !this.isFleeing) {
      // Move towards target grass
      const gdx = this.targetGrass.x - this.x;
      const gdy = this.targetGrass.points[0].y - this.y;
      this.targetAngle = Math.atan2(gdy, gdx);
      
      // Move faster when far from grass
      const grassDist = Math.sqrt(gdx * gdx + gdy * gdy);
      const speedMod = Math.min(grassDist / 100, 2);
      this.x += Math.cos(this.angle) * this.speed * speedMod;
      this.y += Math.sin(this.angle) * this.speed * speedMod;
    }

    // Check if fleeing has ended
    if (this.isFleeing && Date.now() > this.fleeEndTime) {
      this.isFleeing = false;
      this.targetAngle = Math.random() * Math.PI * 2;
    }

    if (this.isFleeing) {
      // Flee away from mouse
      this.targetAngle = Math.atan2(dy, dx);
      this.x += Math.cos(this.targetAngle) * this.speed * 3;
      const newY = this.y + Math.sin(this.targetAngle) * this.speed * 3;
      this.y = Math.min(Math.max(50, newY), this.minY);
    } else {
      // Regular movement with smooth turning
      this.x += Math.cos(this.angle) * this.speed;
      this.y += Math.sin(this.angle) * this.speed * 0.5;

      // Randomly change target angle occasionally
      if (Math.random() < 0.005) {
        this.targetAngle = Math.random() * Math.PI * 2;
      }

      // Bounce off borders with proper angles
      if (this.x < 0) {
        this.x = 0;
        this.targetAngle = 0;
      } else if (this.x > canvas.width) {
        this.x = canvas.width;
        this.targetAngle = Math.PI;
      }
      
      if (this.y > this.minY) {
        this.y = this.minY;
        this.targetAngle = -Math.PI / 2;
      } else if (this.y < 50) {
        this.y = 50;
        this.targetAngle = Math.PI / 2;
      }
    }

    // Smooth angle transition with improved normalization
    const angleDiff = ((this.targetAngle - this.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    this.angle += angleDiff * 0.05; // Reduced turning speed for smoother movement

    // Add grass interaction at the end of update
    this.moveNearbyGrass();
  }

  moveNearbyGrass() {
    seaGrassArray.forEach(grass => {
      grass.points.forEach(point => {
        const dx = this.x - point.x;
        const dy = this.y - point.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 50) {
          // Push grass points away from fish
          const pushForce = (50 - distance) * 0.02;
          point.vx -= (dx / distance) * pushForce;
          point.vy -= (dy / distance) * pushForce;
        }
      });
    });
  }

  updateRainbowEffect() {
    if (!this.isRainbow) return;
    
    this.rainbowHue = (this.rainbowHue + 1) % 360;
    this.glowIntensity += 0.05 * this.glowDirection;
    
    if (this.glowIntensity > 1) {
      this.glowDirection = -1;
    } else if (this.glowIntensity < 0) {
      this.glowDirection = 1;
    }
    
    this.color = `hsl(${this.rainbowHue}, 100%, 50%)`;
  }

  draw() {
    this.updateRainbowEffect();
    
    ctx.save();
    
    // Add glow effect for rainbow fish
    if (this.isRainbow) {
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 20 * this.glowIntensity;
    }

    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale); // Apply size variation
    
    // Calculate if the fish is moving right or left
    const isMovingRight = Math.cos(this.angle) > 0;
    
    if (isMovingRight) {
      ctx.scale(-1, 1);
      ctx.rotate(-this.angle); // Negative angle for right movement
    } else {
      ctx.rotate(this.angle + Math.PI);
    }

    // Calculate tail speed based on current movement
    const currentSpeed = Math.sqrt(
      Math.pow(Math.cos(this.angle) * this.speed, 2) +
      Math.pow(Math.sin(this.angle) * this.speed, 2)
    );
    
    // Update tail animation with speed-based frequency
    this.tailAngle = Math.sin(Date.now() * (this.tailSpeed + currentSpeed * 0.02)) * 
                     this.tailAmplitude * (0.5 + currentSpeed * 0.2);

    // Draw body
    ctx.beginPath();
    ctx.ellipse(0, 0, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    // Draw dorsal fin
    ctx.beginPath();
    ctx.moveTo(-this.width/4, -this.height/2);
    ctx.quadraticCurveTo(
      0, -this.height, 
      this.width/4, -this.height/2
    );
    ctx.fill();

    // Draw tail with animation
    ctx.save();
    ctx.translate(this.width/3, 0);
    ctx.rotate(this.tailAngle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(
      this.width/2, -this.height/2,
      this.width/2, -this.height
    );
    ctx.quadraticCurveTo(
      this.width/2, this.height/2,
      this.width/2, this.height
    );
    ctx.quadraticCurveTo(
      this.width/2, -this.height/2,
      0, 0
    );
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();

    // Draw side fins
    ctx.beginPath();
    ctx.moveTo(-5, 0);
    ctx.quadraticCurveTo(
      -this.width/3, -this.height/2,
      0, -this.height/3
    );
    ctx.quadraticCurveTo(
      -this.width/6, -this.height/4,
      -5, 0
    );
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-5, 0);
    ctx.quadraticCurveTo(
      -this.width/3, this.height/2,
      0, this.height/3
    );
    ctx.quadraticCurveTo(
      -this.width/6, this.height/4,
      -5, 0
    );
    ctx.fill();

    // Draw eye
    ctx.beginPath();
    ctx.arc(-this.width/6, -this.height/6, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'black';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-this.width/6 - 1, -this.height/6 - 1, 1, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();

    // Draw tears if crying
    if (this.isCrying) {
      // Draw tears
      ctx.beginPath();
      ctx.arc(-this.width/6 - 5, -this.height/6 + 2, 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(155, 222, 255, 0.8)';
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(-this.width/6 - 8, -this.height/6 + 5, 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(155, 222, 255, 0.6)';
      ctx.fill();
    }

    ctx.restore();
  }
}

class Bubble {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 8 + 4;
    this.speed = Math.random() * 1 + 0.5;
    this.wobble = Math.random() * Math.PI * 2;
    this.opacity = 1;
  }

  update() {
    this.y -= this.speed;
    this.x += Math.sin(this.wobble) * 0.3;
    this.wobble += 0.1;
    this.opacity -= 0.003;
    return this.opacity > 0;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 255, 255, ${this.opacity})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

class Clam {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = canvas.height - 20;
    this.bubbles = [];
    this.nextBubbleTime = Date.now() + Math.random() * 3000;
  }

  update() {
    // Create new bubbles
    if (Date.now() > this.nextBubbleTime) {
      this.bubbles.push(new Bubble(this.x, this.y));
      this.nextBubbleTime = Date.now() + Math.random() * 3000 + 2000;
    }

    // Update existing bubbles
    this.bubbles = this.bubbles.filter(bubble => bubble.update());
  }

  draw() {
    // Draw clam
    ctx.beginPath();
    ctx.arc(this.x, this.y, 15, Math.PI, 0);
    ctx.fillStyle = "#886655";
    ctx.fill();
    ctx.strokeStyle = "#554433";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw bubbles
    this.bubbles.forEach(bubble => bubble.draw());
  }
}

// Add after other classes but before animation code
class Sand {
  constructor() {
    this.particles = [];
    this.createParticles();
  }

  createParticles() {
    const sandHeight = 60;
    for (let i = 0; i < 1000; i++) {
      this.particles.push({
        x: Math.random() * canvas.width,
        y: canvas.height - Math.random() * sandHeight,
        size: Math.random() * 3 + 1,
        color: `hsl(45, ${Math.random() * 20 + 60}%, ${Math.random() * 20 + 70}%)`
      });
    }
  }

  draw() {
    // Draw base sand gradient
    const gradient = ctx.createLinearGradient(0, canvas.height - 60, 0, canvas.height);
    gradient.addColorStop(0, '#e6d5ac');
    gradient.addColorStop(1, '#d4c391');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, canvas.height - 60, canvas.width, 60);

    // Draw sand particles
    this.particles.forEach(particle => {
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    });
  }
}

const sand = new Sand();

// Create fish
function createFish() {
  for (let i = 0; i < fishCount; i++) {
    fishArray.push(new Fish());
  }
}

// Update fish
function updateFish() {
  fishArray.forEach((fish) => {
    fish.update();
    fish.draw();
  });
}

// Sea Grass class
class SeaGrass {
  constructor(x, y, color, scale = 1) {
    this.x = x;
    this.y = y;
    this.segments = Math.floor(Math.random() * 6) + 18;
    this.segmentLength = 15;
    this.points = Array.from({ length: this.segments }, (_, i) => ({
      x: this.x,
      y: this.y - i * this.segmentLength,
      vx: 0,
      vy: 0
    }));
    this.k = 0.05; // Reduced spring constant for softer movement
    this.damping = 0.99; // Increased damping for more stability
    this.color = color;
    this.scale = scale;
    this.maxForce = 2; // Maximum force that can be applied to grass points
  }

  update() {
    const time = Date.now() * 0.0005; // Slower wave movement
    // More subtle water current
    const baseForce = Math.sin(time) * 0.05;

    for (let i = 1; i < this.points.length; i++) {
      const point = this.points[i];
      
      // Apply forces
      let fx = baseForce;
      let fy = -0.01; // Constant gentle upward force

      // More subtle mouse interaction
      if (Math.abs(mouseX - point.x) < 40 && Math.abs(mouseY - point.y) < 40) {
        const dx = mouseX - point.x;
        const dy = mouseY - point.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        fx += dx / dist * 0.2; // Reduced mouse influence
        fy += dy / dist * 0.2;
      }

      // Update velocity
      point.vx += fx;
      point.vy += fy;

      // Apply spring forces
      const prevPoint = this.points[i - 1];
      const dx = point.x - prevPoint.x;
      const dy = point.y - prevPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const springForceX = (dx / distance) * (distance - this.segmentLength) * this.k;
      const springForceY = (dy / distance) * (distance - this.segmentLength) * this.k;

      point.vx -= springForceX;
      point.vy -= springForceY;

      // Apply damping
      point.vx *= this.damping;
      point.vy *= this.damping;

      // Limit maximum velocity
      const maxVel = 0.5;
      point.vx = Math.max(Math.min(point.vx, maxVel), -maxVel);
      point.vy = Math.max(Math.min(point.vy, maxVel), -maxVel);

      // Limit maximum force
      point.vx = Math.max(Math.min(point.vx, this.maxForce), -this.maxForce);
      point.vy = Math.max(Math.min(point.vy, this.maxForce), -this.maxForce);

      // Update position
      point.x += point.vx;
      point.y += point.vy;
    }

    // Constrain base point
    this.points[0].x = this.x;
    this.points[0].y = this.y;

    // Update segment positions to maintain length
    for (let i = 1; i < this.points.length; i++) {
      const dx = this.points[i].x - this.points[i-1].x;
      const dy = this.points[i].y - this.points[i-1].y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      
      this.points[i].x = this.points[i-1].x + Math.cos(angle) * this.segmentLength;
      this.points[i].y = this.points[i-1].y + Math.sin(angle) * this.segmentLength;
    }
  }

  draw() {
    // Add glow effect
    ctx.shadowColor = this.glowColor;
    ctx.shadowBlur = 10;
    
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    this.points.forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 3 * this.scale;
    ctx.stroke();
    
    ctx.shadowBlur = 0; // Reset shadow
  }
}

// Create multiple layers of sea grass
const grassLayers = [
  {
    color: '#003300', // Darkest back layer
    scale: 0.7,
    spacing: 15,
    yOffset: -20
  },
  {
    color: '#004d00', // Middle layer
    scale: 0.85,
    spacing: 12,
    yOffset: -10
  },
  {
    color: '#008000', // Front layer (original green)
    scale: 1,
    spacing: 10,
    yOffset: 0
  }
];

const seaGrassArray = [];

// Modified grass creation to extend beyond screen
grassLayers.forEach(layer => {
  // Add extra grass to extend beyond screen edges
  const extraGrass = 4; // Number of extra grass elements on each side
  const count = Math.floor(canvas.width / layer.spacing) + (extraGrass * 2);
  for (let i = 0; i < count; i++) {
    const hue = 120 + Math.random() * 30 - 15; // Green with variation
    const saturation = Math.random() * 20 + 60;
    const lightness = Math.random() * 20 + 30;
    const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    
    seaGrassArray.push(
      new SeaGrass(
        (i - extraGrass) * layer.spacing + Math.random() * 5,
        canvas.height + layer.yOffset,
        color,
        layer.scale
      )
    );
  }
});

const clams = Array.from({ length: 5 }, () => new Clam());

function updateSeaGrass() {
  seaGrassArray.forEach((grass) => grass.update());
}

// Simplify grass drawing function
function drawSeaGrassLayer(startIndex, endIndex) {
  for (let i = startIndex; i < endIndex; i++) {
    seaGrassArray[i].draw();
  }
}

// Animation loop
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  sand.draw();
  
  updateFish();
  updateSeaGrass();

  // Calculate indices for each grass layer
  const grassPerLayer = Math.floor(seaGrassArray.length / 3);
  
  // Draw back grass layers (first 2 layers)
  drawSeaGrassLayer(0, grassPerLayer * 2);
  
  // Draw clams between grass layers
  clams.forEach(clam => {
    clam.update();
    clam.draw();
  });
  
  // Draw front grass layer
  drawSeaGrassLayer(grassPerLayer * 2, seaGrassArray.length);
  
  requestAnimationFrame(animate);
}

// Initialize
createFish();
animate();
