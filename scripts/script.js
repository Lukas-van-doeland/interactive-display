document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("sandCanvas");
  const ctx = canvas.getContext("2d");

  // Sand particle properties
  const particleSize = 3;
  const sandColors = [
    "#f0e6d2", // Light sand
    "#e6d2b8", // Medium light sand
    "#d9bc91", // Medium sand
    "#c9a97c", // Medium dark sand
    "#b38b5d", // Darker sand
  ];
  const maxParticles = Math.floor((canvas.width * canvas.height) / 10);

  // Initialize variables
  let particles = [];
  let lastInteractionX = 0;
  let lastInteractionY = 0;
  let grid = [];
  const gridSize = particleSize;

  // Set canvas dimensions and initialize grid
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initGrid();
    initParticles();
  }

  function initGrid() {
    const cols = Math.ceil(canvas.width / gridSize);
    const rows = Math.ceil(canvas.height / gridSize);
    grid = new Array(rows);
    for (let i = 0; i < rows; i++) {
      grid[i] = new Array(cols).fill(null);
    }
  }

  function updateGrid() {
    for (let i = 0; i < grid.length; i++) {
      grid[i].fill(null);
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const gridX = Math.floor(p.x / gridSize);
      const gridY = Math.floor(p.y / gridSize);
      if (
        gridY >= 0 &&
        gridY < grid.length &&
        gridX >= 0 &&
        gridX < grid[0].length
      ) {
        grid[gridY][gridX] = i;
      }
    }
  }

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  // Initialize particles
  function initParticles() {
    particles = [];
    for (let i = 0; i < maxParticles; i++) {
      particles.push(
        createParticle(
          Math.random() * canvas.width,
          Math.random() * canvas.height,
          0,
          0
        )
      );
    }
  }

  function createParticle(x, y, vx, vy) {
    return {
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      size: particleSize,
      color: sandColors[Math.floor(Math.random() * sandColors.length)],
    };
  }

  function getNeighbors(x, y) {
    const gridX = Math.floor(x / gridSize);
    const gridY = Math.floor(y / gridSize);
    const neighbors = [];

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const ny = gridY + dy;
        const nx = gridX + dx;
        if (ny >= 0 && ny < grid.length && nx >= 0 && nx < grid[0].length) {
          const index = grid[ny][nx];
          if (index !== null) {
            neighbors.push(particles[index]);
          }
        }
      }
    }
    return neighbors;
  }

  // Mouse move event listener for trail effect
  canvas.addEventListener("mousemove", (e) => {
    updateInteractionPosition(e.clientX, e.clientY);
  });

  canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    updateInteractionPosition(e.touches[0].clientX, e.touches[0].clientY);
  });

  function updateInteractionPosition(x, y) {
    const steps = 20;
    const dx = (x - lastInteractionX) / steps;
    const dy = (y - lastInteractionY) / steps;

    for (let i = 0; i < steps; i++) {
      const ix = lastInteractionX + dx * i;
      const iy = lastInteractionY + dy * i;
      const radius = 30;

      // Add a subtle glow effect at cursor position
      ctx.beginPath();
      const gradient = ctx.createRadialGradient(ix, iy, 0, ix, iy, radius);
      gradient.addColorStop(0, "rgba(255, 255, 255, 0.3)");
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = gradient;
      ctx.arc(ix, iy, radius, 0, Math.PI * 2);
      ctx.fill();

      const neighbors = getNeighbors(ix, iy);
      for (const p of neighbors) {
        const pdx = p.x - ix;
        const pdy = p.y - iy;
        const distance = Math.sqrt(pdx * pdx + pdy * pdy);

        if (distance < radius) {
          const angle = Math.atan2(pdy, pdx);
          const force = (1 - distance / radius) * 1.2;
          const pushX = Math.cos(angle) * force;
          const pushY = Math.sin(angle) * force;

          p.vx += pushX;
          p.vy += pushY;

          // Temporarily brighten affected particles
          p.bright = 1.0;
        }
      }
    }

    lastInteractionX = x;
    lastInteractionY = y;
  }

  function updateParticles() {
    ctx.fillStyle = "#8b6b4c";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    updateGrid();

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      p.x += p.vx;
      p.y += p.vy;

      p.vx *= 0.9;
      p.vy *= 0.9;

      // Fade brightness
      if (p.bright) {
        p.bright *= 0.95;
      }

      // Apply brightness to particle color
      if (p.bright && p.bright > 0.1) {
        // Create brighter version of the particle color
        const brighterColor = lightenColor(p.color, p.bright * 50);
        ctx.fillStyle = brighterColor;
      } else {
        ctx.fillStyle = p.color;
      }

      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }

    requestAnimationFrame(updateParticles);
  }

  // Helper function to lighten a color
  function lightenColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
    const B = Math.min(255, (num & 0x0000ff) + amt);
    return `#${((1 << 24) | (R << 16) | (G << 8) | B).toString(16).slice(1)}`;
  }

  initParticles();
  updateParticles();
});
