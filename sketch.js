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
  }

  // Updates enemy position and behavior
  update() {
    if (this.zigzag) {
      // Sinusoidal movement for zigzag pattern
      this.x = this.origX + sin(frameCount * 0.12) * 20;
    } else {
      // Standard side-to-side movement
      this.x += enemyDirection * enemySpeed;
    }

    // If enemies hit the edge of the screen
    if (this.x < 0 || this.x + this.w > width) {
      enemyDirection *= -1; // Reverse direction for all enemies
      enemies.forEach(e => e.y += 10); // Move all enemies down
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
  }

  // Updates player position based on input
  update() {
    if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) { // 'A' key for left
      this.x -= this.speed;
    }
    if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) { // 'D' key for right
      this.x += this.speed;
    }
    // Constrain player within screen bounds
    this.x = constrain(this.x, 0, width - this.w);
  }

  // Draws the player ship
  draw() {
    push();
    translate(this.x + this.w / 2, this.y + this.h / 2); // Center drawing at player's logical center

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

  // Handle different game states (start screen, game over screen)
  if (showStartScreen) {
    drawUI('Galaxy Wars', 'Press [Space] to begin');
    return; // Skip the rest of the game loop
  }
  if (gameOver) {
    drawUI('GAME OVER', 'Press [Space] to restart');
    return; // Skip the rest of the game loop
  }

  // --- Active Gameplay ---
  player.update();
  player.draw();

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

  // Display Heads-Up Display (HUD)
  drawLabel(`Score: ${score}`, 10, 10);
  drawLabel(`Level:  ${level}`, 10, 30);
  drawLabel(`Highscore: ${highscore}`, 10, 50);
  if (tripleShot) {
    drawLabel('POWER-UP: TRIPLE SHOT', width - 250, 10);
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
    enemySpeed = min(1 + level * 0.3, 3); // Increase enemy speed, capped at 3
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

  player = new Player(); // Recreate player
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
  textSize(40);
  text(title, width / 2, height / 2 - 40);
  textSize(20);
  text(subtitle, width / 2, height / 2);
}

// ====================
// Enemy Management
// ====================

/**
 * Creates and populates the enemies array for the current level.
 */
function createEnemies() {
  enemies = []; // Clear existing enemies
  // Determine number of rows and columns based on level
  const rows = 3 + floor(level / 2);
  const cols = 5 + level;

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      // Calculate enemy position using defined constants
      const x = ENEMY_GRID_START_X + j * ENEMY_SPACING_X;
      const y = ENEMY_GRID_START_Y + i * ENEMY_SPACING_Y;
      enemies.push(new Enemy(x, y));
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
  // Create a new bullet originating from the center of the chosen enemy's bottom edge
  enemyBullets.push(new EnemyBullet(randomEnemy.x + randomEnemy.w / 2, randomEnemy.y + randomEnemy.h));
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
        enemies.splice(j, 1); // Remove the enemy

        // Create an explosion at the enemy's center
        explosions.push(new Explosion(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2));
        score += 10; // Increase score
        explodeSound.play();

        // Chance to activate triple shot power-up
        if (random() < 0.05) { // 5% chance
          activateTripleShot();
        }
        break; // Bullet can only hit one enemy per frame, so exit inner loop
      }
    }
  }

  // Enemy bullets vs. Player
  // Iterate through all enemy bullets
  for (const enemyBullet of enemyBullets) {
    if (enemyBullet.hits(player)) {
      gameOver = true; // Set game over flag
      explodeSound.play();
      break; // Game over, no need to check further collisions this frame
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
}
