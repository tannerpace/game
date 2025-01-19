import Phaser from 'phaser';

/**
 * MainScene handles the game's background, player, bullets, obstacles, enemies, and input.
 *
 * @extends Phaser.Scene
 */
export class MainScene extends Phaser.Scene {
  /** Scrolling starfield background */
  private starfield!: Phaser.GameObjects.TileSprite;

  /** Player's ship sprite with physics */
  private player!: Phaser.Physics.Arcade.Sprite;

  /** Keyboard input for player control */
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  /** Group for managing player bullet objects */
  private bulletGroup!: Phaser.Physics.Arcade.Group;

  /** Group for obstacles (bugs, cloud obstacles, low-tier enemies) */
  private obstacleGroup!: Phaser.Physics.Arcade.Group;

  /** Group for mid-tier enemies */
  private midTierEnemies!: Phaser.Physics.Arcade.Group;

  /** Group for enemy bullets (from mid-tier enemy) */
  private enemyBulletGroup!: Phaser.Physics.Arcade.Group;

  /** Background scroll speed */
  private backgroundSpeed = 2;

  /** Initialize the scene with its key */
  constructor() {
    super({ key: 'MainScene' });
  }

  /**
   * Preloads assets for the scene.
   */
  preload(): void {
    this.load.image('starfield', '/assets/starfield.png');
    this.load.image('playerShip', '/assets/playerShip.png');
    this.load.image('bullet', '/assets/bulletup.png');
    this.load.image('bug', '/assets/bug.png');
    this.load.image('cloud_obstacle', '/assets/cloud_obstacle.png');
    this.load.image('low_teir_enemy', '/assets/low_teir_enemy.png');
    this.load.image('mid_tier_enemy', '/assets/heroship.webp'); // mid-tier enemy asset
  }

  /**
   * Sets up game objects and input listeners.
   */
  create(): void {
    const { width, height } = this.sys.game.config as { width: number; height: number };

    // Create the scrolling background
    this.starfield = this.add.tileSprite(width / 2, height / 2, width, height, 'starfield');

    // Create the player's ship
    this.player = this.physics.add.sprite(width / 2, height - 100, 'playerShip')
      .setScale(0.1)
      .setCollideWorldBounds(true);

    // Initialize the player's bullet group
    this.bulletGroup = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 130,
      runChildUpdate: true,
    });

    // Group for obstacles that can be shot (bugs, cloud obstacles, low-tier enemies)
    this.obstacleGroup = this.physics.add.group();

    // Group for mid-tier enemies
    this.midTierEnemies = this.physics.add.group();

    // Group for enemy bullets (shot by mid-tier enemies)
    this.enemyBulletGroup = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 50,
      runChildUpdate: true,
    });

    // Spawn obstacles periodically
    this.time.addEvent({
      delay: 3000,
      loop: true,
      callback: () => {
        // Randomly choose type: bug, cloud_obstacle, or low_teir_enemy
        const types = ['bug', 'cloud_obstacle', 'low_teir_enemy'];
        const type = Phaser.Utils.Array.GetRandom(types);
        const x = Phaser.Math.Between(50, width - 50);
        const sprite = this.obstacleGroup.create(x, -50, type) as Phaser.Physics.Arcade.Sprite;
        sprite.setVelocityY(this.backgroundSpeed * 50); // Adjust falling speed as desired
      },
    });

    // Spawn a mid-tier enemy that shoots bullets every few seconds
    this.time.addEvent({
      delay: 5000,
      loop: true,
      callback: () => {
        const x = Phaser.Math.Between(50, width - 50);
        const enemy = this.midTierEnemies.create(x, -50, 'mid_tier_enemy') as Phaser.Physics.Arcade.Sprite;
        enemy.setVelocityY(this.backgroundSpeed * 30);
        // Have the enemy shoot when it reaches a certain y or immediately
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

    // Set up collision between player's bullets and obstacles
    this.physics.add.overlap(this.bulletGroup, this.obstacleGroup, (bullet, obstacle) => {
      (bullet as Phaser.Physics.Arcade.Image).setActive(false).setVisible(false).body.stop();
      (obstacle as Phaser.Physics.Arcade.Sprite).destroy();
    });

    // Set up collision between player's bullets and mid-tier enemies
    this.physics.add.overlap(this.bulletGroup, this.midTierEnemies, (bullet, enemy) => {
      (bullet as Phaser.Physics.Arcade.Image).setActive(false).setVisible(false).body.stop();
      (enemy as Phaser.Physics.Arcade.Sprite).destroy();
    });

    // Set up collision between enemy bullets and the player
    this.physics.add.overlap(this.enemyBulletGroup, this.player, (bullet, player) => {
      (bullet as Phaser.Physics.Arcade.Image).setActive(false).setVisible(false).body.stop();
      // Handle player hit (e.g., end game or reduce life)
      console.log('Player hit!');
    });

    // Input handling
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-SPACE', () => this.shoot());
      this.input.keyboard.on('keydown-W', () => this.adjustBackgroundSpeed(1));
      this.input.keyboard.on('keydown-S', () => this.adjustBackgroundSpeed(-1));
      this.cursors = this.input.keyboard.createCursorKeys();
    }
  }

  /**
   * Fires a bullet from the player's position at an angle based on the ship's rotation.
   */
  shoot(): void {
    const bulletY = this.player.y - this.player.displayHeight / 2;
    const bullet = this.bulletGroup.get(this.player.x, bulletY, 'bullet') as Phaser.Physics.Arcade.Image;

    if (bullet) {
      bullet
        .setActive(true)
        .setVisible(true)
        .setPosition(this.player.x, bulletY)
        .setScale(0.5);

      const bulletSpeed = 400;
      const angleRad = Phaser.Math.DegToRad(-90 + this.player.angle);
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

  /**
   * Mid-tier enemy fires a bullet aimed at the player.
   * @param enemy - The mid-tier enemy shooting.
   */
  enemyShoot(enemy: Phaser.Physics.Arcade.Sprite): void {
    const bullet = this.enemyBulletGroup.get(enemy.x, enemy.y, 'bullet') as Phaser.Physics.Arcade.Image;
    if (bullet) {
      bullet
        .setActive(true)
        .setVisible(true)
        .setScale(0.5);

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

  /**
   * Adjusts the background scroll speed.
   * @param delta - Amount to change speed by.
   */
  adjustBackgroundSpeed(delta: number): void {
    this.backgroundSpeed = Math.max(0, this.backgroundSpeed + delta);
    console.log('Background speed:', this.backgroundSpeed);
  }

  /**
   * Updates the game state every frame.
   */
  update(): void {
    // Scroll background
    this.starfield.tilePositionY -= this.backgroundSpeed;

    /**
     * Calculate a steering factor based on background speed.
     * Divisor adjustable; clamped between 0.2 and 1.
     * @returns {number} Steering factor.
     */
    const steerFactor = Phaser.Math.Clamp(1 - this.backgroundSpeed / 10, 0.2, 1);

    /**
     * Set horizontal velocity and target tilt angle based on input and steerFactor.
     * @param {number} steerFactor - Scales movement and tilt.
     */
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

    /**
     * Set vertical velocity based on input.
     */
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
