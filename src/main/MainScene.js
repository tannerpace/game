import Phaser from 'phaser';

export class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
    this.highScore = this.retrieveHighScore();
    this.starfield = null;
    this.player = null;
    this.cursors = null;
    this.bulletGroup = null;
    this.obstacleGroup = null;
    this.midTierEnemies = null;
    this.enemyBulletGroup = null;
    this.backgroundSpeed = 2;
    this.playerHealth = 100;
    this.healthText = null;
    this.shootSound = null;
    this.hitSound = null;
    this.gameOverText = null;
    this.retryButton = null;
  }

  retrieveHighScore() {
    const savedScore = localStorage.getItem('highScore');
    return savedScore ? parseInt(savedScore) : 0;
  }

  reducePlayerHealth(damage) {
    this.playerHealth -= damage;
    this.healthText.setText(`Health: ${this.playerHealth}`);
    if (this.playerHealth <= 0) {
      this.playerHealth = 0;
      this.gameOver();
    }
  }

  gameOver() {
    this.physics.pause();
    this.player.setTint(0xff0000);
    this.gameOverText = this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2, 'Game Over', {
      fontSize: '40px',
      color: '#ff0000'
    }).setOrigin(0.5);
    this.backgroundSpeed = 0;

    this.retryButton = this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2 + 50, 'Retry', {
      fontSize: '30px',
      color: '#00ff00'
    }).setOrigin(0.5).setInteractive();

    this.retryButton.on('pointerdown', () => this.scene.restart());
  }

  preload() {
    const assets = {
      images: {
        starfield: 'starfield.png',
        playerShip: 'heroship.png',
        bullet: 'bulletup.png',
        bug: 'bug.png',
        cloud_obstacle: 'cloud_obstacle.png',
        low_teir_enemy: 'low_teir_enemy.png',
        mid_tier_enemy: 'heroship.png',
      },
      sounds: {
        shootSound: 'shoot.aac',
        hitSound: 'hit.aac',
        music: 'music.aac',
      },
    };

    for (const [key, file] of Object.entries(assets.images)) {
      this.load.image(key, `/assets/images/${file}`);
    }

    for (const [key, file] of Object.entries(assets.sounds)) {
      this.load.audio(key, `/assets/sounds/${file}`);
    }
  }

  create() {
    const { width, height } = this.sys.game.config;
    const music = this.sound.add('music', { loop: true });
    music.play();
    this.starfield = this.add.tileSprite(width / 2, height / 2, width, height, 'starfield');
    this.player = this.physics.add.sprite(width / 2, height - 100, 'playerShip')
      .setScale(0.1)
      .setCollideWorldBounds(true);

    this.healthText = this.add.text(10, 10, `Health: ${this.playerHealth}`, {
      fontSize: '20px',
      color: '#ffffff',
    });

    this.shootSound = this.sound.add('shootSound');
    this.hitSound = this.sound.add('hitSound');

    this.bulletGroup = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 300,
      runChildUpdate: true,
    });

    this.obstacleGroup = this.physics.add.group();
    this.obstacleGroup.setHitArea(30, () => {
      console.log("collision")
      return true;
    });
    this.midTierEnemies = this.physics.add.group();
    this.enemyBulletGroup = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 50,
      runChildUpdate: true,
    });

    this.time.addEvent({
      delay: 3000,
      loop: true,
      callback: () => {
        const types = ['bug', 'cloud_obstacle', 'low_teir_enemy'];
        const type = Phaser.Utils.Array.GetRandom(types);
        const x = Phaser.Math.Between(50, width - 50);
        const sprite = this.obstacleGroup.create(x, -50, type);
        sprite.setVelocityY(this.backgroundSpeed * 50);
        sprite.setScale(0.2);
      },
    });

    this.time.addEvent({
      delay: 5000,
      loop: true,
      callback: () => {
        const x = Phaser.Math.Between(50, width - 50);
        const enemy = this.midTierEnemies.create(x, -50, 'mid_tier_enemy');
        enemy.setVelocityY(this.backgroundSpeed * 30);

        this.time.addEvent({
          delay: 1000,
          callback: () => {
            if (enemy.active) {
              this.enemyShoot(enemy);
            }
          },
        });
      },
    });

    this.physics.add.overlap(this.bulletGroup, this.obstacleGroup, (bullet, obstacle) => {
      this.hitSound.play();
      bullet.setActive(false).setVisible(false).body.stop();
      obstacle.destroy();
    });

    this.physics.add.overlap(this.bulletGroup, this.midTierEnemies, (bullet, enemy) => {
      this.hitSound.play();
      bullet.setActive(false).setVisible(false).body.stop();
      enemy.destroy();
    });

    this.physics.add.overlap(this.enemyBulletGroup, this.player, (bullet, player) => {
      this.hitSound.play();
      bullet.setActive(false).setVisible(false).body.stop();
      this.reducePlayerHealth(10);
    });

    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-SPACE', () => this.shoot());
      this.input.keyboard.on('keydown-W', () => this.adjustBackgroundSpeed(1));
      this.input.keyboard.on('keydown-S', () => this.adjustBackgroundSpeed(-1));
      this.cursors = this.input.keyboard.createCursorKeys();
    }
  }

  shoot() {
    this.shootSound.play();
    const bulletY = this.player.y - this.player.displayHeight / 2;
    const bullet = this.bulletGroup.get(this.player.x, bulletY, 'bullet');

    if (bullet) {
      const angleRad = Phaser.Math.DegToRad(-90 + this.player.angle);
      bullet
        .setActive(true)
        .setVisible(true)
        .setPosition(this.player.x, bulletY)
        .setScale(0.3)
        .setAngle(angleRad);  //  adjusted this to the same angle as ship

      const bulletSpeed = 400;

      const velocityX = bulletSpeed * Math.cos(angleRad);
      const velocityY = bulletSpeed * Math.sin(angleRad);

      bullet.setVelocity(velocityX, velocityY);

      this.time.addEvent({
        delay: 2000,
        callback: () => {
          if (bullet.active && bullet.body) {
            bullet.setActive(false).setVisible(false).body.stop();
          }
        },
      });
    } else {
      console.warn('No bullet available.');
    }
  }

  enemyShoot(enemy) {
    const bullet = this.enemyBulletGroup.get(enemy.x, enemy.y, 'bullet');
    if (bullet) {
      bullet
        .setActive(true)
        .setVisible(true)
        .setScale(0.3)  // Consistent smaller scale for enemy bullets
        .setAngle(180);  // Rotate bullet to point downwards

      // Calculate direction from enemy to player
      const angleRad = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
      const bulletSpeed = 300;
      bullet.setVelocity(
        bulletSpeed * Math.cos(angleRad),
        bulletSpeed * Math.sin(angleRad)
      );

      this.time.addEvent({
        delay: 3000,
        callback: () => {
          if (bullet.active && bullet.body) {
            bullet.setActive(false).setVisible(false).body.stop();
          }
        },
      });
    }
  }

  adjustBackgroundSpeed(delta) {
    this.backgroundSpeed = Math.max(0, this.backgroundSpeed + delta);
    console.log('Background speed:', this.backgroundSpeed);
  }

  update() {
    this.starfield.tilePositionY -= this.backgroundSpeed;

    const steerFactor = Phaser.Math.Clamp(1 - this.backgroundSpeed / 10, 0.2, 1);

    let targetAngle = 0;
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-200 * steerFactor);
      targetAngle = -15 * steerFactor;
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(200 * steerFactor);
      targetAngle = 15 * steerFactor;
    } else {
      this.player.setVelocityX(0);
    }

    if (this.cursors.up.isDown) {
      this.player.setVelocityY(-200);
    } else if (this.cursors.down.isDown) {
      this.player.setVelocityY(200);
    } else {
      this.player.setVelocityY(0);
    }

    const currentAngleRad = Phaser.Math.DegToRad(this.player.angle);
    const targetAngleRad = Phaser.Math.DegToRad(targetAngle);
    const newAngleRad = Phaser.Math.Angle.RotateTo(currentAngleRad, targetAngleRad, 0.05);
    this.player.angle = Phaser.Math.RadToDeg(newAngleRad);
  }
}
