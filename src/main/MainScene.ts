import Phaser from 'phaser';

/**
 * MainScene is the primary game scene handling the background,
 * player sprite, bullet mechanics, and user inputs.
 *
 * @extends Phaser.Scene
 */
export class MainScene extends Phaser.Scene {
  /**
   * The scrolling starfield background.
   *
   * @type {Phaser.GameObjects.TileSprite}
   * @private
   */
  private starfield!: Phaser.GameObjects.TileSprite;

  /**
   * The player's ship sprite with physics enabled.
   *
   * @type {Phaser.Physics.Arcade.Sprite}
   * @private
   */
  private player!: Phaser.Physics.Arcade.Sprite;

  /**
   * The keyboard cursor inputs.
   *
   * @type {Phaser.Types.Input.Keyboard.CursorKeys}
   * @private
   */
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  /**
   * A group for bullet game objects.
   *
   * @type {Phaser.Physics.Arcade.Group}
   * @private
   */
  private bulletGroup!: Phaser.Physics.Arcade.Group;

  /**
   * Controls the background scroll speed.
   *
   * @type {number}
   * @private
   */
  private backgroundSpeed = 2;

  /**
   * Creates an instance of MainScene and initializes the scene key.
   */
  constructor() {
    super({ key: 'MainScene' });
  }

  /**
   * Preloads assets needed for the scene such as images for the background,
   * player ship, bullets, and enemies.
   *
   * @returns {void}
   */
  preload(): void {
    // Background and player assets
    this.load.image('starfield', '/assets/starfield.png');
    this.load.image('playerShip', '/assets/playerShip.png');
    this.load.image('player1_ship', '/assets/player1_ship.webp');

    // Bullet asset (using bulletup.webp as the bullet)
    this.load.image('bullet', '/assets/bulletup.png');

    // Additional enemy and obstacle assets
    this.load.image('bug', '/assets/bug.webp');
    // A second bug sprite, loaded with a different key
    this.load.image('bug2', '/assets/bug.webp');

    this.load.image('cloud_obstacle', '/assets/cloud_obstacle.webp');
    this.load.image('heroship', '/assets/heroship.webp');
    this.load.image('low_teir_enemy', '/assets/low_teir_enemy.webp');
    this.load.image('small_rock', '/assets/small_rock.webp');
  }

  /**
   * Creates game objects, including the starfield background, player sprite,
   * bullet group, and sets up keyboard input listeners.
   *
   * @returns {void}
   */
  create(): void {
    const { width, height } = this.sys.game.config as { width: number; height: number; };


    // Create and add the scrolling starfield background.
    this.starfield = this.add.tileSprite(width / 2, height / 2, width, height, 'starfield');

    ///////////////////
    // PLAYER
    ///////////////////

    // Create the player's ship at the center-bottom of the screen.
    this.player = this.physics.add.sprite(width / 2, height - 100, 'playerShip');
    this.player.setScale(0.1); // Scale the ship to a smaller size.
    this.player.setCollideWorldBounds(true);

    // Create a group for bullets with a maximum size.
    this.bulletGroup = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 130,
      runChildUpdate: true
    });

    // Setup keyboard events
    if (this.input.keyboard) {
      // Shoot when SPACE is pressed.
      this.input.keyboard.on('keydown-SPACE', () => {
        this.shoot();
      });
      // Increase background speed when "W" is pressed.
      this.input.keyboard.on('keydown-W', () => {
        this.backgroundSpeed += 1;
        console.log('Increased background speed:', this.backgroundSpeed);
      });
      // Decrease background speed when "S" is pressed.
      this.input.keyboard.on('keydown-S', () => {
        this.backgroundSpeed = Math.max(0, this.backgroundSpeed - 1);
        console.log('Decreased background speed:', this.backgroundSpeed);
      });
      // Create the cursor input keys.
      this.cursors = this.input.keyboard.createCursorKeys();
    }
  }

  /**
   * Fires a bullet from the player's current position, sets its velocity,
   * and schedules its deactivation after a set lifespan.
   *
   * @returns {void}
   */
  shoot(): void {
    const bulletY = this.player.y - this.player.displayHeight / 2;

    const bullet = this.bulletGroup.get(this.player.x, bulletY, 'bullet') as Phaser.Physics.Arcade.Image;

    if (bullet) {
      bullet.setActive(true);
      bullet.setVisible(true);
      bullet.setPosition(this.player.x, bulletY);

      if (bullet.body) {
        bullet.body.reset(this.player.x, bulletY);
      }

      bullet.setVelocityY(-400);

      // Ensure correct scale or size
      bullet.setScale(0.1); // Adjust to match your asset size

      this.time.addEvent({
        delay: 2000,
        callback: () => {
          if (bullet.active && bullet.body) {
            bullet.setActive(false);
            bullet.setVisible(false);
            bullet.body.stop();
          }
        }
      });
    } else {
      console.warn('No bullet available in the group.');
    }
  }


  /**
   * The main game loop update method.
   * Scrolls the background and handles player movement based on input.
   *
   * @returns {void}
   */
  update(): void {
    // Scroll the background vertically based on the current backgroundSpeed.
    this.starfield.tilePositionY -= this.backgroundSpeed;

    // Handle player horizontal movement
    if (this.cursors!.left!.isDown) {
      this.player.setVelocityX(-200);
    } else if (this.cursors!.right!.isDown) {
      this.player.setVelocityX(200);
    } else {
      this.player.setVelocityX(0);
    }

    // Handle player vertical movement
    if (this.cursors!.up!.isDown) {
      this.player.setVelocityY(-200);
    } else if (this.cursors!.down!.isDown) {
      this.player.setVelocityY(200);
    } else {
      this.player.setVelocityY(0);
    }
  }
}
