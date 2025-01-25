import Phaser from 'phaser';
import Player from './Player';

const assets = {
  images: {
    starfield: 'starfield.png',
    stars: 'stars2.png',
    bug: 'bug.png',
    cloud_obstacle: 'cloud_obstacle.png',
    low_tier_enemy: 'low_tier_enemy.png',
    mid_tier_enemy: 'starshipred.png',
  },
  sounds: {
    hitSound: 'hit.aac',
    music: 'music.aac',
  }
};

export class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
    this.highScore = this.retrieveHighScore();
    this.stars = null;
    this.starfieldBack = null;
    this.starfieldFront = null;
    this.player = new Player(this);
    this.backgroundSpeed = 2;
    this.gameOverText = null;
    this.retryButton = null;
  }

  retrieveHighScore() {
    const savedScore = localStorage.getItem('highScore');
    return savedScore ? parseInt(savedScore) : 0;
  }

  preload() {
    for (const [key, path] of Object.entries(assets.images)) {
      this.load.image(key, `/assets/images/${path}`);
    }
    for (const [key, path] of Object.entries(assets.sounds)) {
      this.load.audio(key, `/assets/sounds/${path}`);
    }
    this.player.preload();
  }

  create() {
    const { width, height } = this.sys.game.config;
    this.stars = this.add.tileSprite(width / 2, 0, 0, 0, 'stars');
    this.starfieldBack = this.add.tileSprite(width / 2, height / 2, width, height, 'starfield');
    this.starfieldFront = this.add.tileSprite(width / 2, height / 2, width, height, 'starfield');
    this.player.create();
    const music = this.sound.add('music', { loop: true });
    music.play();

    this.setupGroups();
    this.setupInteractions();
    this.spawnEnemies();
  }

  setupGroups() {
    this.bulletGroup = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 300,
      runChildUpdate: true
    });
    this.enemyBulletGroup = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 50,
      runChildUpdate: true
    });
    this.midTierEnemies = this.physics.add.group();
  }


  setupInteractions() {
    this.physics.add.overlap(this.bulletGroup, this.midTierEnemies, this.handleBulletEnemyCollision, null, this);
    this.physics.add.overlap(this.enemyBulletGroup, this.player.sprite, this.handleEnemyBulletPlayerCollision, null, this);
    this.physics.add.overlap(this.player.sprite, this.midTierEnemies, this.handlePlayerEnemyCollision, null, this);
  }

  handlePlayerEnemyCollision(playerSprite, enemy) {
    enemy.disableBody(true, true);
    this.sound.play('hitSound');
    this.player.takeDamage(20);// TODO : make clouds only slow
  }


  handleBulletEnemyCollision(bullet, enemy) {
    bullet.disableBody(true, true);
    enemy.disableBody(true, true);
    this.sound.play('hitSound');
  }

  handleEnemyBulletPlayerCollision(bullet) {
    bullet.disableBody(true, true);
    this.player.takeDamage(10);
  }



  spawnEnemies() {
    const enemyTypes = ['bug', 'low_tier_enemy', 'mid_tier_enemy', 'cloud_obstacle'];
    this.time.addEvent({
      delay: 3000,
      loop: true,
      callback: () => {
        const x = Phaser.Math.Between(50, this.sys.game.config.width - 50);
        const type = Phaser.Utils.Array.GetRandom(enemyTypes);
        const enemy = this.midTierEnemies.create(x, 0, type).setScale(0.15);

        // cloud obstacle effects
        if (type === 'cloud_obstacle') {
          enemy.setAlpha(Phaser.Math.FloatBetween(0.3, 0.7));
          enemy.setBlendMode(Phaser.BlendModes.ADD);
          this.tweens.add({
            targets: enemy,
            x: enemy.x + Phaser.Math.Between(-10, 10),
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
        }

        enemy.setVelocityY(100); // Vertical movement for all enemies
      }
    });
  }


  update() {
    this.player.update();
    this.stars.tilePositionY -= this.backgroundSpeed / 0.9;
    this.starfieldBack.tilePositionY -= this.backgroundSpeed * 0.5;
    this.starfieldFront.tilePositionY -= this.backgroundSpeed;
  }

  gameOver() {
    this.physics.pause();
    this.player.sprite.setTint(0xff0000);
    this.gameOverText = this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2, 'Game Over', {
      fontSize: '40px',
      color: '#ff0000'
    }).setOrigin(0.5);
    this.backgroundSpeed = 0;
    this.retryButton = this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2 + 50, 'Retry', {
      fontSize: '30px',
      color: '#00ff00'
    }).setOrigin(0.5).setInteractive();
    this.retryButton.on('pointerdown', this.restartGame, this);
  }

  restartGame() {
    this.scene.restart();
  }
}
