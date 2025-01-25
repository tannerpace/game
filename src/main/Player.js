import Phaser from 'phaser';
import { transform } from 'typescript';
const assets = {
  images: {
    falc: 'falc.png',
    bullet: 'bulletup .png',
  },
  sounds: {
    shootSound: 'shoot.aac',
  },
};
export default class Player {
  constructor(scene) {
    this.scene = scene;
    this.sprite = null;
    this.health = 100;
    this.healthText = null;
    this.shootSound = null;
  }

  preload() {
    for (const [key, file] of Object.entries(assets.images)) {
      this.scene.load.image(key, `/assets/images/${file}`);
    }

    for (const [key, file] of Object.entries(assets.sounds)) {
      this.scene.load.audio(key, `/assets/sounds/${file}`);
    }
  }

  create() {
    const { width, height } = this.scene.sys.game.config;
    this.sprite = this.scene.physics.add.sprite(width / 2, height - 100, 'falc')
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
      console.log("No player sprite available for shooting.");
      return;
    }

    this.shootSound.play();
    const bulletY = this.sprite.y - this.sprite.displayHeight / 13;
    const bullet = this.scene.bulletGroup.get(this.sprite.x, bulletY, 'bullet');

    if (bullet) {
      console.log("Bullet created at:", this.sprite.x, bulletY);
      bullet.setActive(true);
      bullet.setVisible(true);
      bullet.setVelocityY(-340);
    } else {
      console.log("Failed to create bullet.");
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
