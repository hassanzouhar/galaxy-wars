# Galaxy Wars

A simple Galaga clone created by "vibe coding" with Qwen3 8B. 
This was created to test the ability of small local LLMs for coding use. 

Galaxy Wars is a fast-paced space shooter game where you control a spaceship to defeat waves of enemy ships.

## Description

Galaxy Wars is a browser-based arcade-style space shooter inspired by classic games like Galaga. Navigate your ship through space, shoot down enemy ships, and avoid enemy fire while progressing through increasingly difficult levels.

## Features

- **Mobile-First Design** with touch controls and auto-firing
- Responsive ship movement with smooth controls
- Randomly appearing triple-shot power-ups
- Progressive difficulty with increasing enemy speed and numbers
- Persistent high score tracking using local storage
- Animated explosions and particle effects
- Starfield background with parallax scrolling effect
- Multiple enemy types with different movement patterns (zigzag and linear)
- Sound effects for shooting and explosions
- Adaptive UI that scales for different screen sizes
- Visual touch control indicators for mobile play

## Controls

### Desktop Controls
- **Move Left**: Left Arrow or A key
- **Move Right**: Right Arrow or D key
- **Shoot**: Spacebar
- **Start Game/Retry**: Spacebar (on title or game over screen)

### Mobile Controls (Mobile-First Design!)
- **Move Left**: Touch and hold left side of screen
- **Move Right**: Touch and hold right side of screen
- **Shoot**: Automatic continuous firing (no manual shooting needed)
- **Start Game/Retry**: Tap anywhere on screen

Visual touch zones appear at the bottom of the screen to guide your fingers. The game automatically detects mobile devices and optimizes the interface accordingly.

## Technologies

- HTML5
- JavaScript
- p5.js library for rendering and animation
- p5.sound.js for audio playback
- LocalStorage API for high score persistence

## Setup Instructions

1. Clone this repository to your local machine
2. Open the `index.html` file in a modern web browser (desktop or mobile)
3. Press spacebar (desktop) or tap anywhere (mobile) to start the game
4. No additional installation required - the game uses CDN-hosted libraries

**For best mobile experience**: Add to your home screen on iOS/Android for fullscreen gameplay!

## Asset Credits

The game uses the following sound assets:
- `shot.wav`: Sound effect for player shooting
- `explode.wav`: Sound effect for explosions

## Development

The game is written in plain JavaScript using the p5.js library for rendering. The main game code is contained within the `galaga4.html` file.

Key game mechanics include:
- Object-oriented design with classes for game entities
- Collision detection between bullets and game objects
- Power-up system with timers
- Level progression system

