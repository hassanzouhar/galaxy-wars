# Galaxy Wars

A simple Galaga clone created by "vibe coding" with Qwen3 8B. 
This was created to test the ability of small local LLMs for coding use. 

Galaxy Wars is a fast-paced space shooter game where you control a spaceship to defeat waves of enemy ships.

## Description

Galaxy Wars is a browser-based arcade-style space shooter inspired by classic games like Galaga. Navigate your ship through space, shoot down enemy ships, and avoid enemy fire while progressing through increasingly difficult levels.

## Features

- Responsive ship movement with smooth controls
- Randomly appearing triple-shot power-ups
- Progressive difficulty with increasing enemy speed and numbers
- Persistent high score tracking using local storage
- Animated explosions and particle effects
- Starfield background with parallax scrolling effect
- Multiple enemy types with different movement patterns (zigzag and linear)
- Sound effects for shooting and explosions

## Controls

- **Move Left**: Left Arrow or A key
- **Move Right**: Right Arrow or D key
- **Shoot**: Spacebar
- **Start Game/Retry**: Spacebar (on title or game over screen)

## Technologies

- HTML5
- JavaScript
- p5.js library for rendering and animation
- p5.sound.js for audio playback
- LocalStorage API for high score persistence

## Setup Instructions

1. Clone this repository to your local machine
2. Open the `galaga4.html` file in a modern web browser
3. Click the spacebar to start the game
4. No additional installation required - the game uses CDN-hosted libraries

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

