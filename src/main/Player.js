import Phaser from 'phaser';
const assets = {
  images: {
    playerShip: 'heroship.png',
    bullet: 'bulletup.png', // Presuming you need this for the bullet sprite later
  },
  sounds: {
    shootSound: 'shoot.aac',
  },
};
export default class Player {
  constructor(scene) {
    this.scene = scene; // Link to the Phaser scene to access game methods and properties
    this.sprite = null; // Placeholder for the player's sprite
    this.health = 100; // Starting health for the player
    this.healthText = null; // Text display for health
    this.shootSound = null; // Sound effect for shooting
  }

  preload() {
    // Use this.scene.load to access the correct Phaser loader context
    for (const [key, file] of Object.entries(assets.images)) {
      this.scene.load.image(key, `/assets/images/${file}`);
    }

    for (const [key, file] of Object.entries(assets.sounds)) {
      this.scene.load.audio(key, `/assets/sounds/${file}`);
    }
  }

  create() {
    const { width, height } = this.scene.sys.game.config;
    this.sprite = this.scene.physics.add.sprite(width / 2, height - 100, 'playerShip')
      .setScale(0.1)
      .setCollideWorldBounds(true);

    this.healthText = this.scene.add.text(10, 10, `Health: ${this.health}`, {
      fontSize: '20px',
      color: '#ffffff',
    });

    this.shootSound = this.scene.sound.add('shootSound');
    this.scene.input.keyboard.on('keydown-SPACE', () => this.shoot());
    this.cursors = this.scene.input.keyboard.createCursorKeys();
  }

  update() {
    this.handleMovement();
    this.updateHealthDisplay();
  }

  handleMovement() {
    const speed = 200;
    const steerFactor = Phaser.Math.Clamp(1 - this.scene.backgroundSpeed / 10, 0.2, 1);

    if (this.cursors.left.isDown) {
      this.sprite.setVelocityX(-speed * steerFactor);
    } else if (this.cursors.right.isDown) {
      this.sprite.setVelocityX(speed * steerFactor);
    } else {
      this.sprite.setVelocityX(0);
    }

    if (this.cursors.up.isDown) {
      this.sprite.setVelocityY(-speed);
    } else if (this.cursors.down.isDown) {
      this.sprite.setVelocityY(speed);
    } else {
      this.sprite.setVelocityY(0);
    }
  }

  shoot() {
    if (!this.sprite) {
      return;
    }

    this.shootSound.play();
    const bulletY = this.sprite.y - this.sprite.displayHeight / 2;
    const bullet = this.scene.bullets.getBullet(this.sprite.x, bulletY);

    if (bullet) {
      bullet.fire(this.sprite.x, bulletY, -90);
    }
  }

  updateHealthDisplay() {
    this.healthText.setText(`Health: ${this.health}`);
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.scene.gameOver();
    }
  }
}
