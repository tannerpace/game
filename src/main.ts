import Phaser from 'phaser';

class MainScene extends Phaser.Scene {
  private starfield!: Phaser.GameObjects.TileSprite;
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private bulletGroup!: Phaser.Physics.Arcade.Group;

  // A dynamic property that controls the background scroll speed
  private backgroundSpeed = 2;

  constructor() {
    super({ key: 'MainScene' });
  }

  preload(): void {
    // Background and player assets
    this.load.image('starfield', '/assets/starfield.png');

    this.load.image('playerShip', '/assets/playerShip.png');
    this.load.image('player1_ship', '/assets/player1_ship.webp');

    // Bullet asset (using bulletup.webp as the bullet)
    this.load.image('bullet', '/assets/bulletup.webp');


    this.load.image('bug', '/assets/bug.webp');
    //  a second bug sprite, load it with a different key
    this.load.image('bug2', '/assets/bug.webp');

    this.load.image('cloud_obstacle', '/assets/cloud_obstacle.webp');
    this.load.image('heroship', '/assets/heroship.webp');
    this.load.image('low_teir_enemy', '/assets/low_teir_enemy.webp');
    this.load.image('small_rock', '/assets/small_rock.webp');
  }

  create(): void {
    const { width, height } = this.sys.game.config as { width: number; height: number };

    // Create the background tile sprite
    this.starfield = this.add.tileSprite(width / 2, height / 2, width, height, 'starfield');

    ///////////////////
    // PLAYER
    ///////////////////
    // Using 'playerShip' as the key, but feel free to switch to 'player1_ship' if needed.
    this.player = this.physics.add.sprite(width / 2, height - 100, 'playerShip');
    this.player.setScale(0.1); // Adjusted scale for a smaller ship
    this.player.setCollideWorldBounds(true);

    ////////////////////////
    // Set up keyboard input
    ////////////////////////
    this.cursors = this.input.keyboard.createCursorKeys();

    ////////////////////////////////
    //  BACKGROUND SPEED CONTROL
    ////////////////////////////////
    this.input.keyboard.on('keydown-W', () => {
      this.backgroundSpeed += 1;
      console.log('Increased background speed:', this.backgroundSpeed);
    });
    this.input.keyboard.on('keydown-S', () => {
      this.backgroundSpeed = Math.max(0, this.backgroundSpeed - 1);
      console.log('Decreased background speed:', this.backgroundSpeed);
    });

    ////////////////////////////////
    //  SHOOTING WITH SPACE BAR
    ////////////////////////////////
    // Create a physics group for bullets
    this.bulletGroup = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 130,
      runChildUpdate: true
    });

    // Listen for the space bar keydown event.
    this.input.keyboard.on('keydown-SPACE', () => {
      this.shoot();
    });
  }

  shoot(): void {
    // Calculate proper bullet starting y-position using displayHeight 
    const bulletY = this.player.y - this.player.displayHeight / 2;

    // Get the bullet from the group, or create a new one if none are available.
    const bullet = this.bulletGroup.get(this.player.x, bulletY, 'bullet') as Phaser.Physics.Arcade.Image;

    if (bullet) {
      bullet.setActive(true);
      bullet.setVisible(true);

      // Set the bullet's position using the correct displayHeight value.
      bullet.setPosition(this.player.x, bulletY);

      // Reset the bullet's physics body position.
      bullet.body.reset(this.player.x, bulletY);

      // Set the upward velocity for the bullet.
      bullet.setVelocityY(-400);

      // Deactivate the bullet after a lifespan for reuse.
      this.time.addEvent({
        delay: 2000, // 2 seconds lifespan
        callback: () => {
          if (bullet.active && bullet.body) {
            bullet.setActive(false);
            bullet.setVisible(false);
            bullet.body.stop();
          }
        }
      });
    }
  }

  update(): void {
    // Scroll the background dynamically based on backgroundSpeed
    this.starfield.tilePositionY -= this.backgroundSpeed;

    // Player movement:
    if (this.cursors!.left!.isDown) {
      this.player.setVelocityX(-200);
    } else if (this.cursors!.right!.isDown) {
      this.player.setVelocityX(200);
    } else {
      this.player.setVelocityX(0);
    }

    if (this.cursors!.up!.isDown) {
      this.player.setVelocityY(-200);
    } else if (this.cursors!.down!.isDown) {
      this.player.setVelocityY(200);
    } else {
      this.player.setVelocityY(0);
    }
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
  scene: MainScene,
};

new Phaser.Game(config);
