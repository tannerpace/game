import Phaser from 'phaser';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
  scene: {
    preload,
    create,
    update,
  },
};

const game = new Phaser.Game(config);

function preload() {
  // Load assets
  this.load.image('starfield', '../assets/starfield.png'); // Example background
  this.load.image('playerShip', '../assets/playerShip.png'); // Example ship
}

function create() {
  // Add a scrolling background
  this.starfield = this.add.tileSprite(400, 300, 800, 600, 'starfield');

  // Add player sprite
  this.player = this.physics.add.sprite(400, 500, 'playerShip');
  this.player.setCollideWorldBounds(true);
}

function update() {
  // Scroll background for forward movement effect
  this.starfield.tilePositionY -= 2; // Adjust speed as needed
}
