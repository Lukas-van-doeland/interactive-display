const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Paint stream properties
const paintColors = ['#FFDD00', '#FF00FF', '#FF7F00']; // Yellow, Magenta, Orange
const numStreams = 50;
const streams = [];

// Mouse position
let mouseX = 0;
let mouseY = 0;
let isMouseDown = false;
const mouseRadius = 80;

// Create paint stream class
class PaintStream {
    constructor() {
        this.reset();
        // Initially position streams randomly across the canvas width
        this.x = Math.random() * canvas.width;
        // Set y to a random negative value to stagger entry
        this.y = Math.random() * -100;
        // Assign particles along the stream
        this.createParticles();
    }

    reset() {
        this.x = Math.random() * canvas.width;
        this.y = -20;
        this.width = Math.random() * 15 + 8;
        this.speedY = Math.random() * 2 + 2;
        this.originalSpeedY = this.speedY;
        this.color = paintColors[Math.floor(Math.random() * paintColors.length)];
        this.distortionX = 0;
        this.distortionY = 0;
        this.waveFrequency = Math.random() * 0.03 + 0.01;
        this.waveAmplitude = Math.random() * 5 + 2;
        this.streamLength = Math.floor(Math.random() * 15) + 20;
        this.particles = [];
        this.createParticles();
    }

    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.streamLength; i++) {
            this.particles.push({
                x: 0,
                y: -i * 15, // Spacing between particles in the stream
                width: this.width - (i * 0.2), // Slightly thinner as it goes up
                alpha: 1 - (i / this.streamLength) * 0.8, // Fade out toward the end
                distortionX: 0,
                distortionY: 0
            });
        }
    }

    update() {
        // Move the stream
        this.y += this.speedY;

        // Add a subtle wave motion
        this.x += Math.sin(this.y * this.waveFrequency) * 0.5;

        // Update each particle in the stream
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            const particleY = this.y + particle.y;

            // Check if particle is near mouse
            const dx = this.x - mouseX;
            const dy = particleY - mouseY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < mouseRadius) {
                // Apply distortion based on mouse position
                const angle = Math.atan2(dy, dx);
                const force = (mouseRadius - distance) / mouseRadius;

                // More distortion when mouse is pressed
                const distortionMultiplier = isMouseDown ? 5 : 2;

                particle.distortionX = Math.cos(angle) * force * 15 * distortionMultiplier;
                particle.distortionY = Math.sin(angle) * force * 8 * distortionMultiplier;

                // Slow down the stream when near mouse
                if (i === 0) { // Only adjust speed once
                    this.speedY = this.originalSpeedY * (1 - force * 0.5);
                }
            } else {
                // Gradually restore original state
                particle.distortionX *= 0.95;
                particle.distortionY *= 0.95;

                if (i === 0) { // Only adjust speed once
                    this.speedY = this.speedY * 0.95 + this.originalSpeedY * 0.05;
                }
            }
        }

        // Reset if whole stream has passed the bottom
        if (this.y - (this.particles[this.particles.length - 1].y) > canvas.height) {
            this.reset();
        }
    }

    draw() {
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            const particleY = this.y + particle.y;

            // Skip if particle is above the canvas
            if (particleY < -20) continue;

            // Skip if particle is below the canvas
            if (particleY > canvas.height + 20) continue;

            // Draw the paint stream segment
            ctx.globalAlpha = particle.alpha;

            const totalWidth = particle.width;
            const particleX = this.x + particle.distortionX;

            // Add small distortions for a more fluid look
            const leftEdge = particleX - totalWidth / 2 + Math.sin(particleY * 0.1) * 2;
            const rightEdge = particleX + totalWidth / 2 + Math.sin(particleY * 0.1 + 1) * 2;

            // Draw a quadratic curve for each segment to create a fluid effect
            ctx.beginPath();
            ctx.moveTo(leftEdge, particleY + particle.distortionY);

            // Control point for curve
            const cpX = particleX + Math.sin(particleY * 0.05) * 5;
            const cpY = particleY + 10 + particle.distortionY;

            ctx.quadraticCurveTo(cpX, cpY, rightEdge, particleY + particle.distortionY);

            // Next y position
            const nextY = particleY + 15 + particle.distortionY;

            ctx.lineTo(rightEdge, nextY);
            ctx.quadraticCurveTo(cpX, nextY + 5, leftEdge, nextY);
            ctx.closePath();

            // Fill with gradient for better fluid effect
            const gradient = ctx.createLinearGradient(
                particleX - totalWidth / 2, particleY,
                particleX + totalWidth / 2, particleY
            );

            const baseColor = this.color;
            const lighterColor = this.getLighterColor(baseColor);

            gradient.addColorStop(0, baseColor);
            gradient.addColorStop(0.5, lighterColor);
            gradient.addColorStop(1, baseColor);

            ctx.fillStyle = gradient;
            ctx.fill();
        }

        ctx.globalAlpha = 1;
    }

    // Helper function to create a lighter version of the color
    getLighterColor(hex) {
        // Convert hex to RGB
        let r = parseInt(hex.substring(1, 3), 16);
        let g = parseInt(hex.substring(3, 5), 16);
        let b = parseInt(hex.substring(5, 7), 16);

        // Lighten
        r = Math.min(255, r + 40);
        g = Math.min(255, g + 40);
        b = Math.min(255, b + 40);

        // Convert back to hex
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
}

// Create splatter particles for additional effects
const splatters = [];
class Splatter {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.radius = Math.random() * 3 + 1;
        this.color = color;
        this.speedX = (Math.random() - 0.5) * 6;
        this.speedY = (Math.random() - 0.5) * 6;
        this.alpha = 1;
        this.gravity = 0.1;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += this.gravity;
        this.alpha -= 0.02;
        return this.alpha > 0;
    }

    draw() {
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// Initialize streams
for (let i = 0; i < numStreams; i++) {
    streams.push(new PaintStream());
}

// Create splatter effect
function createSplatter(x, y) {
    const color = paintColors[Math.floor(Math.random() * paintColors.length)];
    const count = Math.floor(Math.random() * 8) + 5;

    for (let i = 0; i < count; i++) {
        splatters.push(new Splatter(x, y, color));
    }
}

// Event listeners
canvas.addEventListener('mousemove', (e) => {
    const oldX = mouseX;
    const oldY = mouseY;
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Create splatters when mouse moves quickly
    const distance = Math.sqrt((mouseX - oldX) * (mouseX - oldX) + (mouseY - oldY) * (mouseY - oldY));
    if (distance > 20 && isMouseDown) {
        createSplatter(mouseX, mouseY);
    }
});

canvas.addEventListener('mousedown', () => {
    isMouseDown = true;
    createSplatter(mouseX, mouseY);
});

canvas.addEventListener('mouseup', () => {
    isMouseDown = false;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const oldX = mouseX;
    const oldY = mouseY;
    mouseX = e.touches[0].clientX;
    mouseY = e.touches[0].clientY;
    isMouseDown = true;

    // Create splatters when touch moves quickly
    const distance = Math.sqrt((mouseX - oldX) * (mouseX - oldX) + (mouseY - oldY) * (mouseY - oldY));
    if (distance > 20) {
        createSplatter(mouseX, mouseY);
    }
});

canvas.addEventListener('touchend', () => {
    isMouseDown = false;
});

// Handle window resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Animation loop
function animate() {
    // Clear canvas with slight opacity for trail effect
    ctx.fillStyle = 'rgba(18, 18, 18, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update and draw streams
    streams.forEach(stream => {
        stream.update();
        stream.draw();
    });

    // Update and draw splatters
    for (let i = splatters.length - 1; i >= 0; i--) {
        if (!splatters[i].update()) {
            splatters.splice(i, 1);
        } else {
            splatters[i].draw();
        }
    }

    requestAnimationFrame(animate);
}

animate();