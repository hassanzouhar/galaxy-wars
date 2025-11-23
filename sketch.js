// =============================
// Global Variables & Constants
// =============================
// Grid layout parameters for enemies
const ENEMY_GRID_START_X = 60;
const ENEMY_GRID_START_Y = 60;
const ENEMY_SPACING_X = 60;
const ENEMY_SPACING_Y = 40;

let player; // Player object
let bullets = []; // Array to store player's bullets
let enemies = []; // Array to store enemy objects
let enemyBullets = []; // Array to store enemy bullets
let explosions = []; // Array to store explosion effects
let stars = []; // Array for the starfield background
let powerUps = []; // Array to store power-up objects

let level = 1; // Current game level
let score = 0; // Player's score
let gameOver = false; // Flag to indicate if the game is over
let showStartScreen = true; // Flag to show the start screen

let enemyDirection = 1; // Horizontal direction of enemy movement (1 for right, -1 for left)
let enemySpeed = 1; // Speed of enemy movement
let enemyShootTimer = 0; // Timer to control enemy shooting frequency

let highscore = 0; // Highest score achieved
let tripleShot = false; // Flag for triple shot power-up
let tripleTimer = 0; // Timer for triple shot duration

let shotSound, explodeSound; // Sound effects

// Mobile touch controls
let touchingLeft = false; // Flag for touching left side of screen
let touchingRight = false; // Flag for touching right side of screen
let autoShootTimer = 0; // Timer for automatic shooting
let isMobile = false; // Flag to detect mobile device

// ===================
// Asset Preloading
// ===================
// p5.js function: Called directly before setup(), assets loaded here will be ready by setup()
function preload() {
  shotSound = loadSound('shot.wav');
  explodeSound = loadSound('explode.wav');
}

// ==================
// Helper Functions
// ==================
/**
 * Draws text label on the screen.
 * @param {string} txt - The text to display.
 * @param {number} x - X-coordinate for the text.
 * @param {number} y - Y-coordinate for the text.
 * @param {number} [size=16] - Font size.
 * @param {Constant} [alignH=LEFT] - Horizontal alignment (LEFT, CENTER, RIGHT).
 */
function drawLabel(txt, x, y, size = 16, alignH = LEFT) {
  fill(255); // White color for text
  textSize(size);
  textAlign(alignH, TOP);
  text(txt, x, y);
}

// ==============
// Core Classes
// ==============

/**
 * Represents a single particle for explosion effects.
 */
class Particle {
  constructor(x, y) {
    this.pos = createVector(x, y); // Position vector
    this.vel = p5.Vector.random2D().mult(random(1, 4)); // Random velocity vector
    this.alpha = 255; // Transparency, fades out over time
    this.size = random(2, 5); // Particle size
  }

  // Updates particle position and transparency
  update() {
    this.pos.add(this.vel);
    this.alpha -= 5; // Fade out
  }

  // Draws the particle
  draw() {
    noStroke();
    fill(255, 150, 0, this.alpha); // Orange-ish color
    ellipse(this.pos.x, this.pos.y, this.size);
  }

  // Checks if the particle is still visible
  isAlive() {
    return this.alpha > 0;
  }
}

// ==================
// KamikazeEnemy Class
// ==================
class KamikazeEnemy extends Enemy {
  constructor(x, y) {
    super(x, y);
    this.health = 1;
    this.scoreValue = 15;
    this.speed = 2 + level * 0.2; // Faster than normal
    this.type = 'kamikaze';
  }

  draw() {
    push();
    translate(this.x + this.w / 2, this.y + this.h / 2);
    
    let pulse = sin(frameCount * 0.3) * 3; // Pulsating effect for size
    let bodyColor = color(255, 200, 0); // Orange-yellow
    let spikeColor = color(255, 100, 0); // Red-Orange for spikes

    // Main body
    fill(bodyColor);
    stroke(spikeColor);
    strokeWeight(2);
    ellipse(0, 0, this.w * 0.7 + pulse, this.h * 0.7 + pulse);

    // Spikes (simple lines for now)
    for (let i = 0; i < 8; i++) {
      let angle = TWO_PI / 8 * i;
      let length = this.w * 0.5 + pulse;
      line(0, 0, cos(angle) * length, sin(angle) * length);
    }
    
    pop();
  }

  update() {
    // Move towards the player's center
    let targetX = player.x + player.w / 2;
    let targetY = player.y + player.h / 2;
    let currentX = this.x + this.w / 2;
    let currentY = this.y + this.h / 2;

    let dir = createVector(targetX - currentX, targetY - currentY);
    dir.normalize();
    this.x += dir.x * this.speed;
    this.y += dir.y * this.speed;
    // Kamikaze enemies are not affected by global enemyDirection or y-shift from edge hits.
  }
}

// ===============
// TankEnemy Class
// ===============
class TankEnemy extends Enemy {
  constructor(x, y) {
    super(x, y);
    this.health = 3; // More health
    this.scoreValue = 30;
    this.w = 50; // Tank is wider
    this.h = 35; // Tank is a bit taller
    this.speed = enemySpeed * 0.75; // Slower than normal, relative to current global enemySpeed
    this.type = 'tank';
  }

  draw() {
    push();
    translate(this.x, this.y); // Translate to top-left for easier rect drawing

    let bodyColor = color(100, 100, 120); // Dark bluish gray
    let accentColor = color(70, 70, 90);  // Darker accent
    let cannonColor = color(50, 50, 60);  // Very dark gray for cannon

    // Main body
    fill(bodyColor);
    noStroke();
    rect(0, 0, this.w, this.h, 3); // Rounded corners

    // Tread-like accents
    fill(accentColor);
    rect(0, this.h * 0.1, this.w, this.h * 0.2);
    rect(0, this.h * 0.7, this.w, this.h * 0.2);
    
    // Cannon (simple rectangle pointing forward/down)
    fill(cannonColor);
    // Center the cannon on the front half
    rect(this.w * 0.4, this.h, this.w * 0.2, this.h * 0.4); // Small cannon stub

    pop();
  }

  update() {
    // Update speed in case global enemySpeed changes
    this.speed = enemySpeed * 0.75; 
    this.x += enemyDirection * this.speed;
    // TankEnemy does not use zigzag.
    // It will be affected by the y-shift from the base Enemy.update() if an edge is hit.
  }
}

// ==============
// PowerUp Class
// ==============
class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.w = 20;
    this.h = 20;
    this.speed = 2;
  }

  update() {
    this.y += this.speed;
  }

  draw() {
    if (this.type === 'shield') {
      fill(0, 255, 255); // Cyan color for shield power-up
      noStroke();
      rect(this.x, this.y, this.w, this.h);
    }
  }

  isOffScreen() {
    return this.y > height;
  }
}

/**
 * Represents an explosion, composed of multiple particles.
 */
class Explosion {
  constructor(x, y) {
    // Create an array of 20 particles for each explosion
    this.particles = Array.from({ length: 20 }, () => new Particle(x, y));
  }

  // Updates all particles in the explosion
  update() {
    this.particles.forEach(p => p.update());
    this.particles = this.particles.filter(p => p.isAlive()); // Remove faded particles
  }

  // Draws all particles in the explosion
  draw() {
    this.particles.forEach(p => p.draw());
  }

  // Checks if all particles have faded (explosion is finished)
  isDone() {
    return this.particles.length === 0;
  }
}

/**
 * Represents a star in the background starfield.
 */
class Star {
  constructor() {
    this.x = random(width); // Random initial x-position
    this.y = random(height); // Random initial y-position
    this.z = random(1, 3); // Depth/speed factor for parallax effect
  }

  // Updates star position (moves downwards)
  update() {
    this.y += this.z;
    // Reset star to top if it moves off screen
    if (this.y > height) {
      this.y = 0;
      this.x = random(width);
    }
  }

  // Draws the star
  draw() {
    noStroke();
    fill(255, this.z * 100); // Brighter stars appear closer/faster
    circle(this.x, this.y, this.z);
  }
}

/**
 * Represents a bullet fired by the player.
 */
class Bullet {
  constructor(x, y, speed = 7) {
    this.x = x; // X-coordinate
    this.y = y; // Y-coordinate
    this.r = 4; // Radius of the bullet
    this.speed = speed; // Speed of the bullet
  }

  // Updates bullet position (moves upwards)
  update() {
    this.y -= this.speed;
  }

  // Draws the bullet
  draw() {
    fill(255, 255, 0); // Yellow color
    ellipse(this.x, this.y, this.r * 2); // Diameter is r*2
  }

  /**
   * Checks if this bullet hits a given enemy.
   * @param {Enemy} enemy - The enemy to check collision against.
   * @returns {boolean} True if a collision occurs, false otherwise.
   */
  hits(enemy) {
    // Simple Axis-Aligned Bounding Box (AABB) collision detection
    return this.x > enemy.x && this.x < enemy.x + enemy.w &&
           this.y > enemy.y && this.y < enemy.y + enemy.h;
  }
}

/**
 * Represents a bullet fired by an enemy.
 */
class EnemyBullet {
  constructor(x, y) {
    this.x = x; // X-coordinate
    this.y = y; // Y-coordinate
    this.r = 4; // Radius
    this.speed = 4; // Speed (slower than player bullets)
  }

  // Updates bullet position (moves downwards)
  update() {
    this.y += this.speed;
  }

  // Draws the bullet
  draw() {
    fill(255); // White color
    ellipse(this.x, this.y, this.r * 2);
  }

  /**
   * Checks if this bullet hits the player.
   * @param {Player} player - The player to check collision against.
   * @returns {boolean} True if a collision occurs, false otherwise.
   */
  hits(player) {
    // AABB collision detection
    return this.x > player.x && this.x < player.x + player.w &&
           this.y > player.y && this.y < player.y + player.h;
  }
}

/**
 * Represents an enemy ship.
 * The comment "Enemy - én 'Arrow'" seems to be a note in Norwegian,
 * possibly referring to the shape or type of enemy.
 */
class Enemy {
  constructor(x, y) {
    this.x = x; // X-coordinate
    this.y = y; // Y-coordinate
    this.w = 40; // Width
    this.h = 28; // Height
    this.origX = x; // Original x-position for zigzag pattern
    this.zigzag = (y / 40) % 2 === 0; // Determines if this enemy uses zigzag movement
    this.health = 1; // Default health
    this.scoreValue = 10; // Default score value
    this.type = 'normal'; // Default enemy type
  }

  // Updates enemy position and behavior
  update() {
    // Default movement for 'normal' type
    if (this.type === 'normal') {
      if (this.zigzag) {
        // Sinusoidal movement for zigzag pattern
        this.x = this.origX + sin(frameCount * 0.12) * 20;
      } else {
        // Standard side-to-side movement
        this.x += enemyDirection * enemySpeed;
      }
    }

    // Global edge detection and reaction
    // This part is called for every enemy, but specific types might have already updated their x,y
    // or might ignore the y-shift.
    let hitEdge = false;
    if (this.x < 0 || this.x + this.w > width) {
      // Check if this instance is the one triggering the direction change.
      // To prevent multiple direction changes in one frame if multiple enemies hit the wall.
      // This simple check might still allow multiple flips if enemies are perfectly aligned.
      // A more robust solution would be to check this once per frame in the main draw loop.
      // For now, let's assume this is okay for typical gameplay scenarios.
      if ( (this.x < 0 && enemyDirection === -1) || (this.x + this.w > width && enemyDirection === 1) ) {
        // This enemy is at the edge and moving towards it, so it's a "fresh" hit.
      } else {
        // This enemy is at the edge but the direction has already flipped, or it's moving away.
        // Do not trigger another immediate flip.
      }
       hitEdge = true; // Mark that an edge was hit by at least one enemy
    }

    if (hitEdge && ( (this.x < 0 && enemyDirection === 1) || (this.x + this.w > width && enemyDirection === -1) ) ) {
      // This condition means an enemy is at the edge, but the global direction is already set to move it away.
      // This can happen if the direction flipped in a previous enemy's update call in the same frame.
      // To prevent it from being pushed further off-screen or getting stuck, we might skip the y-shift for it.
      // Or, more simply, the global direction flip should only happen once.
      // Let's refine this: the direction flip should be handled by the game loop, not individual enemies.
      // For this iteration, we'll keep it simple: if an enemy hits an edge, it triggers the direction flip.
      // This might cause multiple flips if not careful.
    }


    // The problem of multiple direction flips and y-shifts per frame if many enemies hit the edge:
    // A better approach is to detect if *any* enemy hit an edge during the update phase,
    // then apply the direction change and y-shift *once* in the main draw loop.
    // However, the current structure calls update() on each enemy individually.

    // Simplified edge logic for now (will apply to the one that hits it):
    if (this.x < 0 || this.x + this.w > width) {
        // Only flip direction if the current direction would push it further out.
        // This prevents immediate re-flipping if multiple enemies are at the edge.
        if ((this.x < 0 && enemyDirection === -1) || (this.x + this.w > width && enemyDirection === 1)) {
            enemyDirection *= -1; // Reverse direction for all enemies
            let verticalStep = 10 + floor(level / 2) * 2; // Define vertical step based on level
            enemies.forEach(e => {
                if (e.type !== 'kamikaze') { // Kamikaze enemies ignore the group y-shift
                    e.y += verticalStep; // Use dynamic vertical step
                }
            });
        }
    }
  }

  // Draws the enemy ship
  draw() {
    push(); // Save current drawing style
    translate(this.x + this.w / 2, this.y + this.h / 2); // Move origin to enemy center

    const flap = sin(frameCount * 0.2) * 5; // Wing flap animation, slightly increased effect
    const bodyColor = color(100, 0, 0); // Dark red for body
    const wingColor = color(200, 50, 50); // Brighter red for wings
    const accentColor = color(255, 100, 100); // For highlights or details

    // Main Body (more oval/organic)
    noStroke();
    fill(bodyColor);
    ellipse(0, 0, this.w * 0.7, this.h); // Main body ellipse

    // Wings (swept back, animated)
    fill(wingColor);
    // Left Wing
    beginShape();
    vertex(-this.w * 0.25, -this.h * 0.1); // Connects to body
    vertex(-this.w * 0.6 + flap / 3, -this.h * 0.3 - flap); // Outer top point
    vertex(-this.w * 0.5, this.h * 0.4);    // Outer bottom point
    endShape(CLOSE);

    // Right Wing
    beginShape();
    vertex(this.w * 0.25, -this.h * 0.1);  // Connects to body
    vertex(this.w * 0.6 - flap / 3, -this.h * 0.3 - flap);  // Outer top point
    vertex(this.w * 0.5, this.h * 0.4);     // Outer bottom point
    endShape(CLOSE);
    
    // "Head" or "Cockpit" area
    fill(accentColor);
    ellipse(0, -this.h * 0.35, this.w * 0.3, this.h * 0.25);

    // Engine glow (similar to before but adapted)
    blendMode(ADD);
    fill(255, 50 + flap * 5, 50, 150); // More dynamic glow
    ellipse(0, this.h * 0.45, this.w * 0.25, this.h * 0.3 + flap / 2);
    blendMode(BLEND); // Reset blend mode

    pop(); // Restore drawing style
  }
}

/**
 * Represents the player's ship.
 */
class Player {
  constructor() {
    this.w = 50; // Width
    this.h = 20; // Height
    this.x = width / 2 - this.w / 2; // Initial x-position (centered)
    this.y = height - this.h - 10; // Initial y-position (bottom of screen)
    this.speed = 5; // Movement speed
    this.shieldStrength = 3; // Player's shield strength
    this.maxShieldStrength = 3; // Maximum shield strength
  }

  // Updates player position based on input
  update() {
    // Keyboard controls
    if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) { // 'A' key for left
      this.x -= this.speed;
    }
    if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) { // 'D' key for right
      this.x += this.speed;
    }

    // Touch controls
    if (touchingLeft) {
      this.x -= this.speed;
    }
    if (touchingRight) {
      this.x += this.speed;
    }

    // Constrain player within screen bounds
    this.x = constrain(this.x, 0, width - this.w);
  }

  // Draws the player ship
  draw() {
    push();
    translate(this.x + this.w / 2, this.y + this.h / 2); // Center drawing at player's logical center

    // Draw shield if active
    if (this.shieldStrength > 0) {
      noStroke();
      fill(0, 255, 255, 100); // Semi-transparent cyan
      ellipse(0, 0, this.w * 0.8 * 2, this.w * 0.8 * 2); // Shield circle
    }

    // Main body (triangle)
    fill(0, 255, 255); // Cyan color
    noStroke();
    beginShape();
    vertex(0, -this.h / 2); // Nose
    vertex(-this.w / 2, this.h / 2); // Bottom-left
    vertex(this.w / 2, this.h / 2);  // Bottom-right
    endShape(CLOSE);

    // Cockpit (smaller triangle or shape) - optional enhancement
    fill(0, 150, 150); // Darker cyan
    beginShape();
    vertex(0, -this.h / 4);
    vertex(-this.w / 4, this.h / 5);
    vertex(this.w / 4, this.h / 5);
    endShape(CLOSE);
    
    // Engine flare (simple rectangle, could be animated)
    fill(255, 255, 0); // Yellow
    rectMode(CENTER);
    rect(0, this.h/2 + 3, this.w/3, 6, 2); // Engine at the back center

    pop();
  }

  // Handles player shooting action
  shoot() {
    shotSound.play();
    const bulletX = this.x + this.w / 2; // Calculate bullet's X-coordinate once
    bullets.push(new Bullet(bulletX, this.y)); // Create bullet at center of player
    if (tripleShot) {
      // Add two more bullets for triple shot, slightly offset
      bullets.push(new Bullet(bulletX - 10, this.y));
      bullets.push(new Bullet(bulletX + 10, this.y));
    }
  }
}

// ========================
// p5.js Game Setup
// ========================
// p5.js function: Called once when the program starts. Initializes the game.
function setup() {
  createCanvas(windowWidth, windowHeight); // Create full-screen canvas
  textFont('monospace'); // Set a monospaced font for UI text

  // Detect mobile device
  isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
              || (window.innerWidth <= 768);

  player = new Player(); // Create the player object
  createEnemies(); // Initialize the first wave of enemies
  stars = Array.from({ length: 100 }, () => new Star()); // Create background stars

  // Load highscore from browser's local storage
  highscore = int(localStorage.getItem('galaxy_wars_highscore') || 0);
}

// ========================
// p5.js Main Game Loop
// ========================
// p5.js function: Called continuously, rendering each frame of the game.
function draw() {
  background(0); // Black background

  // Update and draw stars
  stars.forEach(s => { s.update(); s.draw(); });

  // Update and draw explosions
  explosions.forEach(e => { e.update(); e.draw(); });
  explosions = explosions.filter(e => !e.isDone()); // Remove finished explosions

  // Update and draw power-ups
  powerUps.forEach(p => { p.update(); p.draw(); });
  powerUps = powerUps.filter(p => !p.isOffScreen()); // Remove power-ups that go off-screen

  // Handle different game states (start screen, game over screen)
  if (showStartScreen) {
    const startMsg = isMobile ? 'Tap to begin' : 'Press [Space] to begin';
    drawUI('Galaxy Wars', startMsg);
    if (isMobile) {
      drawLabel('Touch left/right to move', width / 2, height / 2 + 40, max(14, width / 50), CENTER);
      drawLabel('Auto-fires continuously', width / 2, height / 2 + 65, max(12, width / 55), CENTER);
    }
    return; // Skip the rest of the game loop
  }
  if (gameOver) {
    const restartMsg = isMobile ? 'Tap to restart' : 'Press [Space] to restart';
    drawUI('GAME OVER', restartMsg);
    return; // Skip the rest of the game loop
  }

  // --- Active Gameplay ---
  player.update();
  player.draw();

  // Auto-shoot for mobile (shoots every 15 frames / ~4 shots per second)
  if (isMobile) {
    autoShootTimer++;
    if (autoShootTimer > 15) {
      player.shoot();
      autoShootTimer = 0;
    }
  }

  // Update and draw bullets (player and enemy)
  bullets.forEach(b => { b.update(); b.draw(); });
  enemyBullets.forEach(b => { b.update(); b.draw(); });

  // Update and draw enemies
  enemies.forEach(e => { e.update(); e.draw(); });

  // Handle triple shot power-up timer
  if (tripleShot) {
    tripleTimer--;
    if (tripleTimer <= 0) {
      tripleShot = false;
    }
  }

  // Collision detection and object cleanup
  checkCollisions();
  bullets = bullets.filter(b => b.y > 0); // Remove bullets that go off-screen (top)
  enemyBullets = enemyBullets.filter(b => b.y < height); // Remove enemy bullets off-screen (bottom)

  // Display Heads-Up Display (HUD) - responsive sizing
  const hudSize = isMobile ? max(12, width / 40) : 16;
  const hudSpacing = hudSize + 4;
  drawLabel(`Score: ${score}`, 10, 10, hudSize);
  drawLabel(`Level:  ${level}`, 10, 10 + hudSpacing, hudSize);
  drawLabel(`Highscore: ${highscore}`, 10, 10 + hudSpacing * 2, hudSize);
  drawLabel(`Shield: ${player.shieldStrength}/${player.maxShieldStrength}`, 10, 10 + hudSpacing * 3, hudSize);
  if (tripleShot) {
    const powerUpText = isMobile ? 'x3 SHOT' : 'POWER-UP: TRIPLE SHOT';
    const powerUpX = isMobile ? width - 80 : width - 250;
    drawLabel(powerUpText, powerUpX, 10, hudSize);
  }

  // Mobile control hints (visual touch zones)
  if (isMobile && !gameOver && !showStartScreen) {
    drawTouchControlHints();
  }

  // Enemy shooting logic
  enemyShootTimer++;
  if (enemyShootTimer > 60) { // Enemies shoot approximately every second (60 frames)
    enemyShoot();
    enemyShootTimer = 0;
  }

  // Check for level completion
  if (enemies.length === 0) {
    level++;
    enemySpeed = min(1 + level * 0.45, 4.5); // Adjusted enemy speed scaling
    createEnemies(); // Spawn new wave of enemies
  }
}

// ====================
// Input Handling
// ====================
// p5.js function: Called once every time a key is pressed.
function keyPressed() {
  if (key === ' ') { // Spacebar
    if (showStartScreen) {
      showStartScreen = false; // Start the game
    } else if (gameOver) {
      resetGame(); // Restart the game
    } else {
      player.shoot(); // Player shoots
    }
  }
}

// ====================
// Game State Functions
// ====================

/**
 * Resets the game state to start a new game.
 */
function resetGame() {
  // Save highscore if current score is greater
  if (score > highscore) {
    localStorage.setItem('galaxy_wars_highscore', score);
    highscore = score; // Update highscore display immediately
  }
  // Reset game variables
  level = 1;
  score = 0;
  enemySpeed = 1;
  bullets = [];
  enemyBullets = [];
  explosions = [];
  powerUps = []; // Reset power-ups

  player = new Player(); // Recreate player
  player.shieldStrength = player.maxShieldStrength; // Reset shield strength
  createEnemies(); // Recreate enemies
  gameOver = false;
  tripleShot = false;
  tripleTimer = 0;
}

/**
 * Draws the UI text for start and game over screens.
 * @param {string} title - The main title text.
 * @param {string} subtitle - The instructional subtitle text.
 */
function drawUI(title, subtitle) {
  fill(255); // White text
  textAlign(CENTER, CENTER);
  const titleSize = isMobile ? max(24, width / 15) : 40;
  const subtitleSize = isMobile ? max(14, width / 30) : 20;
  textSize(titleSize);
  text(title, width / 2, height / 2 - 40);
  textSize(subtitleSize);
  text(subtitle, width / 2, height / 2);
}

/**
 * Draws visual hints for touch controls on mobile
 */
function drawTouchControlHints() {
  push();
  noStroke();

  // Semi-transparent zones showing touch areas
  fill(255, 255, 255, touchingLeft ? 40 : 15);
  rect(0, height - 150, width / 2, 150);

  fill(255, 255, 255, touchingRight ? 40 : 15);
  rect(width / 2, height - 150, width / 2, 150);

  // Arrow indicators
  fill(255, 255, 255, 100);
  textAlign(CENTER, CENTER);
  textSize(max(20, width / 25));
  text('◀', width / 4, height - 75);
  text('▶', (width * 3) / 4, height - 75);

  pop();
}

// ====================
// Enemy Management
// ====================

/**
 * Creates and populates the enemies array for the current level.
 */
function createEnemies() {
  enemies = [];
  const rows = 3 + floor(level / 2);
  const cols = 5 + level;

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const x = ENEMY_GRID_START_X + j * ENEMY_SPACING_X;
      const y = ENEMY_GRID_START_Y + i * ENEMY_SPACING_Y;
      
      let enemyTypeChance = random();

      // Higher chance for normal enemies, especially at low levels
      if (level < 3 && enemyTypeChance < 0.8) { // 80% chance for normal at level < 3
        enemies.push(new Enemy(x, y)); 
      } else if (level >= 2 && enemyTypeChance < 0.20) { // 20% chance for Tank (if level >=2)
         // Try to avoid spawning too many tanks in one row, or ensure they have space
        if (j % 3 === 0) { // Example: spawn a tank every 3rd column position if chance hits
             enemies.push(new TankEnemy(x, y));
        } else {
             enemies.push(new Enemy(x,y)); // Default to normal if not spawning tank
        }
      } else if (level >= 3 && enemyTypeChance < 0.15) { // 15% chance for Kamikaze (if level >=3)
        // Kamikazes are more dangerous, spawn them less frequently initially
        enemies.push(new KamikazeEnemy(x, y));
      } else { // Default to normal enemy
        enemies.push(new Enemy(x, y));
      }
    }
  }
  // Ensure not too many Kamikazes are spawned, e.g. cap them.
  let kamikazeCount = enemies.filter(e => e.type === 'kamikaze').length;
  const maxKamikazes = 2 + floor(level / 2); // Max kamikazes allowed
  while (kamikazeCount > maxKamikazes) {
      const kamikazeIndex = enemies.findIndex(e => e.type === 'kamikaze');
      if (kamikazeIndex !== -1) {
          const oldKamikaze = enemies[kamikazeIndex];
          enemies.splice(kamikazeIndex, 1, new Enemy(oldKamikaze.x, oldKamikaze.y)); // Replace with normal
          kamikazeCount--;
      } else {
          break; 
      }
  }
   // Similar cap for Tanks
  let tankCount = enemies.filter(e => e.type === 'tank').length;
  const maxTanks = 2 + floor(level / 3); 
  while (tankCount > maxTanks) {
      const tankIndex = enemies.findIndex(e => e.type === 'tank');
      if (tankIndex !== -1) {
          const oldTank = enemies[tankIndex];
          enemies.splice(tankIndex, 1, new Enemy(oldTank.x, oldTank.y)); // Replace with normal
          tankCount--;
      } else {
          break;
      }
  }
}

/**
 * Makes a random enemy shoot a bullet.
 */
function enemyShoot() {
  // Ensure there are enemies to shoot from
  if (!enemies.length) {
    return; // Do nothing if no enemies are on screen
  }

  const randomEnemy = random(enemies); // p5.js function to pick a random element from an array

  if (randomEnemy.type === 'tank') {
    // TankEnemy fires a burst of three bullets
    const bulletX = randomEnemy.x + randomEnemy.w / 2;
    const bulletY = randomEnemy.y + randomEnemy.h;
    enemyBullets.push(new EnemyBullet(bulletX, bulletY));
    enemyBullets.push(new EnemyBullet(bulletX - 10, bulletY + 5));
    enemyBullets.push(new EnemyBullet(bulletX + 10, bulletY + 5));
  } else if (randomEnemy.type !== 'kamikaze') {
    // Normal enemies (and any other future types that aren't kamikaze) fire a single bullet
    enemyBullets.push(new EnemyBullet(randomEnemy.x + randomEnemy.w / 2, randomEnemy.y + randomEnemy.h));
  }
  // Kamikaze enemies (randomEnemy.type === 'kamikaze') do not fire.
}

// ========================
// Collision Detection
// ========================

/**
 * Checks for and handles collisions between game objects.
 */
function checkCollisions() {
  // Player bullets vs. Enemies
  // Iterate backwards to safely remove elements from arrays during collision
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    for (let j = enemies.length - 1; j >= 0; j--) {
      const enemy = enemies[j];
      if (bullet.hits(enemy)) {
        bullets.splice(i, 1); // Remove the bullet

        if (enemy.type === 'tank') {
          enemy.health--;
          if (enemy.health <= 0) {
            enemies.splice(j, 1); // Remove the tank only when health is 0
            explosions.push(new Explosion(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2));
            score += enemy.scoreValue; // Use enemy's specific score value
            explodeSound.play();
            // Power-up chance
            if (random() < 0.1) { // 10% chance (adjust as needed)
              powerUps.push(new PowerUp(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, 'shield'));
            }
          } else {
            // Optional: Play a different sound for tank hit but not destroyed
            // shotSound.play(); // Or a specific "clink" sound if available
          }
        } else { // For 'normal' and 'kamikaze' enemies (1 hit kill)
          enemies.splice(j, 1); // Remove the enemy
          explosions.push(new Explosion(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2));
          score += enemy.scoreValue; // Use enemy's specific score value
          explodeSound.play();
          // Power-up chance (Kamikazes can also drop power-ups)
          if (random() < 0.1) {
            powerUps.push(new PowerUp(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, 'shield'));
          }
        }
        break; // Bullet can only hit one enemy per frame
      }
    }
  }

  // Player collision with power-ups
  for (let i = powerUps.length - 1; i >= 0; i--) {
    const p = powerUps[i];
    if (player.x < p.x + p.w &&
        player.x + player.w > p.x &&
        player.y < p.y + p.h &&
        player.y + player.h > p.y) {
      if (p.type === 'shield') {
        player.shieldStrength = min(player.shieldStrength + 1, player.maxShieldStrength);
      }
      powerUps.splice(i, 1); // Remove the power-up
    }
  }

  // Enemy bullets vs. Player
  // Iterate through all enemy bullets using a reverse loop to allow safe removal
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const enemyBullet = enemyBullets[i];
    if (enemyBullet.hits(player)) {
      if (player.shieldStrength > 0) {
        player.shieldStrength--; // Decrease shield strength
        enemyBullets.splice(i, 1); // Remove the bullet
        shotSound.play(); // Play a sound for shield hit
      } else {
        gameOver = true; // Set game over flag
        explodeSound.play();
        break; // Game over, no need to check further collisions this frame
      }
    }
  }

  // Direct enemy collision with player
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    // Using a simple AABB collision check for player vs enemy:
    if (player.x < enemy.x + enemy.w &&
        player.x + player.w > enemy.x &&
        player.y < enemy.y + enemy.h &&
        player.y + player.h > enemy.y) {

      if (enemy.type === 'kamikaze') {
        // Kamikaze explodes, damages player, and is destroyed
        explosions.push(new Explosion(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2));
        enemies.splice(i, 1); // Remove Kamikaze
        
        // Damage player (shield or game over)
        if (player.shieldStrength > 0) {
          player.shieldStrength--;
          shotSound.play(); // Sound for shield hit
        } else {
          gameOver = true;
          explodeSound.play();
        }
        // If game over, no need to check further collisions this frame
        if (gameOver) break; 

      } else { 
        // Optional: What happens if a normal/tank enemy collides? 
        // For now, let's keep it simple: only kamikazes do collision damage.
      }
    }
  }
}

// ====================
// Power-ups
// ====================

/**
 * Activates the triple shot power-up.
 */
function activateTripleShot() {
  tripleShot = true;
  tripleTimer = 300; // Lasts for 300 frames (approx. 5 seconds at 60 FPS)
}

// ========================
// Window Event Handling
// ========================
// p5.js function: Called once every time the browser window is resized.
function windowResized() {
  resizeCanvas(windowWidth, windowHeight); // Adjust canvas size to new window dimensions
  // Re-detect mobile on resize
  isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
              || (window.innerWidth <= 768);
}

// ====================
// Touch Event Handling
// ====================
// p5.js function: Called when a touch starts
function touchStarted() {
  handleTouch();
  return false; // Prevent default
}

// p5.js function: Called when a touch moves
function touchMoved() {
  handleTouch();
  return false; // Prevent default
}

// p5.js function: Called when a touch ends
function touchEnded() {
  touchingLeft = false;
  touchingRight = false;
  return false; // Prevent default
}

/**
 * Handles touch input for movement and game state
 */
function handleTouch() {
  // Handle game state transitions (start/restart)
  if (showStartScreen) {
    showStartScreen = false;
    return;
  }
  if (gameOver) {
    resetGame();
    return;
  }

  // Handle movement during active gameplay
  touchingLeft = false;
  touchingRight = false;

  for (let i = 0; i < touches.length; i++) {
    const touch = touches[i];
    if (touch.x < width / 2) {
      touchingLeft = true;
    } else {
      touchingRight = true;
    }
  }
}
