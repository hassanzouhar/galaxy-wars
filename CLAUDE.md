# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Galaxy Wars is a browser-based space shooter game inspired by Galaga, built with vanilla JavaScript and p5.js. It was created as an experiment in "vibe coding" with small local LLMs.

## How to Run

This is a static web application with no build process:

1. Open `index.html` directly in a web browser
2. Or serve via any HTTP server (e.g., `python -m http.server 8000`)

No installation or build steps required - the game uses CDN-hosted libraries (p5.js and p5.sound.js).

## Architecture

### File Structure

- `index.html` - Entry point with minimal HTML structure and CDN script imports
- `sketch.js` - All game logic, classes, and p5.js lifecycle functions (~920 lines)
- `shot.wav` / `explode.wav` - Sound effect assets

### Code Organization in sketch.js

The file follows this structure (top to bottom):

1. **Global Variables & Constants** (lines 1-31)
   - Game state variables (level, score, gameOver, etc.)
   - Entity arrays (bullets, enemies, explosions, stars, powerUps)
   - Grid layout constants for enemy positioning

2. **Core Classes** (lines 63-547)
   - `Particle` - Individual explosion particle effects
   - `Enemy` - Base enemy class with zigzag/linear movement patterns
   - `KamikazeEnemy` - Homes in on player position
   - `TankEnemy` - Higher health, slower, fires triple shots
   - `PowerUp` - Shield power-ups that drop from destroyed enemies
   - `Explosion` - Manages particle-based explosion effects
   - `Star` - Background starfield with parallax scrolling
   - `Bullet` - Player projectiles
   - `EnemyBullet` - Enemy projectiles
   - `Player` - Player ship with shield mechanic

3. **p5.js Lifecycle Functions**
   - `preload()` (line 37) - Loads sound assets
   - `setup()` (line 553) - Initializes canvas, player, enemies, stars
   - `draw()` (line 569) - Main game loop (60 FPS)
   - `keyPressed()` (line 645) - Input handling for shooting and game state transitions
   - `windowResized()` (line 918) - Handles canvas resizing

4. **Game Logic Functions**
   - `createEnemies()` (line 708) - Spawns enemy waves with type variety based on level
   - `enemyShoot()` (line 769) - Random enemy firing logic
   - `checkCollisions()` (line 798) - All collision detection (bullets, enemies, powerups)
   - `resetGame()` (line 664) - Game state reset and highscore persistence

### Key Game Mechanics

**Enemy Movement System:**
- Global `enemyDirection` variable controls horizontal movement of all enemies
- When any enemy hits screen edge, ALL enemies reverse direction and move down
- Zigzag enemies (determined by row) use sinusoidal movement pattern
- Kamikaze enemies ignore global direction and home directly toward player

**Collision Detection:**
- Uses simple AABB (Axis-Aligned Bounding Box) collision detection
- Iterates arrays backwards to safely remove elements during collision checks
- TankEnemy has multi-hit health system, others are one-shot

**Progression System:**
- Level increases when all enemies defeated
- `enemySpeed` scales with level: `min(1 + level * 0.45, 4.5)`
- Enemy grid expands: `rows = 3 + floor(level / 2)`, `cols = 5 + level`
- Enemy type variety unlocks at higher levels (Tanks at level 2+, Kamikazes at level 3+)

**Shield System:**
- Player has `shieldStrength` (default 3)
- Shield power-ups drop randomly (10% chance) from destroyed enemies
- Shield absorbs hits before game over

## State Management

- Game uses simple boolean flags (`gameOver`, `showStartScreen`) to control flow
- LocalStorage persists highscore: key `'galaxy_wars_highscore'`
- Triple shot power-up uses timer-based state (`tripleShot` flag + `tripleTimer` countdown)

## Common Modifications

**Adding New Enemy Types:**
1. Create new class extending `Enemy` (see `KamikazeEnemy` or `TankEnemy` as examples)
2. Override `draw()` for custom visuals
3. Override `update()` if custom movement needed
4. Set `type`, `health`, and `scoreValue` properties in constructor
5. Add spawning logic in `createEnemies()` with level-based probability
6. Handle special behavior in `enemyShoot()` if needed
7. Add special collision handling in `checkCollisions()` if needed

**Adjusting Difficulty:**
- Modify `enemySpeed` calculation in draw loop (line 636)
- Change enemy shooting frequency in `enemyShootTimer` check (line 628)
- Adjust enemy grid dimensions in `createEnemies()` (lines 710-711)

**Adding Power-ups:**
- Create cases in `PowerUp.draw()` for new visual types
- Add drop logic in `checkCollisions()` where enemies are destroyed
- Implement pickup effects in player collision section (line 838-850)

## Browser Compatibility

The game uses:
- p5.js v1.4.2 (canvas rendering)
- p5.sound.js v1.4.2 (Web Audio API)
- LocalStorage API
- ES6+ features (arrow functions, const/let, template literals, Array.from)

Modern browsers only (Chrome, Firefox, Safari, Edge - last 2 versions).
