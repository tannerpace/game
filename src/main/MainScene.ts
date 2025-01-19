import Phaser from 'phaser';

/**
 * MainScene handles the game's background, player, bullets, and input.
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

  /** Group for managing bullet objects */
  private bulletGroup!: Phaser.Physics.Arcade.Group;

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
    this.load.image('player1_ship', '/assets/player1_ship.webp');
    this.load.image('bullet', '/assets/bulletup.png');
    this.load.image('bug', '/assets/bug.webp');
    this.load.image('bug2', '/assets/bug.webp');
    this.load.image('cloud_obstacle', '/assets/cloud_obstacle.webp');
    this.load.image('heroship', '/assets/heroship.webp');
    this.load.image('low_teir_enemy', '/assets/low_teir_enemy.webp');
    this.load.image('small_rock', '/assets/small_rock.webp');
  }

  /**
   * Sets up the game objects and input listeners.
   */
  create(): void {
    const { width, height } = this.sys.game.config as { width: number; height: number };

    // Create the scrolling background
    this.starfield = this.add.tileSprite(width / 2, height / 2, width, height, 'starfield');

    // Create the player's ship
    this.player = this.physics.add
      .sprite(width / 2, height - 100, 'playerShip')
      .setScale(0.1)
      .setCollideWorldBounds(true);

    // Initialize the bullet group
    this.bulletGroup = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 130,
      runChildUpdate: true,
    });

    // Handle keyboard input
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-SPACE', () => this.shoot());
      this.input.keyboard.on('keydown-W', () => this.adjustBackgroundSpeed(1));
      this.input.keyboard.on('keydown-S', () => this.adjustBackgroundSpeed(-1));
      this.cursors = this.input.keyboard.createCursorKeys();
    }
  }

  /**
   * Fires a bullet from the player's position.
   * The bullet is fired at an angle based on the ship's current rotation.
   */
  shoot(): void {
    const bulletY = this.player.y - this.player.displayHeight / 2;
    // Get a bullet from the pool
    const bullet = this.bulletGroup.get(this.player.x, bulletY, 'bullet') as Phaser.Physics.Arcade.Image;

    if (bullet) {
      bullet.setActive(true).setVisible(true).setPosition(this.player.x, bulletY).setScale(0.5);

      // Base bullet speed
      const bulletSpeed = 400;
      // Calculate bullet firing angle
      // The base direction is up (-90°) plus the ship's current angle.
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
   * Adjusts the background scroll speed.
   * @param delta - Amount to change speed by
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
