import Phaser from 'phaser';

export class MainScene extends Phaser.Scene {
  private starfield!: Phaser.GameObjects.TileSprite;
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private bulletGroup!: Phaser.Physics.Arcade.Group;
  private obstacleGroup!: Phaser.Physics.Arcade.Group;
  private midTierEnemies!: Phaser.Physics.Arcade.Group;
  private enemyBulletGroup!: Phaser.Physics.Arcade.Group;
  private backgroundSpeed = 2;
  private playerHealth = 100;
  private healthText!: Phaser.GameObjects.Text;
  // private shootSound!: Phaser.Sound.BaseSound;
  private hitSound!: Phaser.Sound.BaseSound;

  constructor() {
    super({ key: 'MainScene' });
  }

  preload(): void {
    const assets = {
      images: {
        starfield: 'starfield.png',
        playerShip: 'heroship.png',
        bullet: 'bulletup.png',
        bug: 'bug.png',
        cloud_obstacle: 'cloud_obstacle.png',
        low_teir_enemy: 'low_teir_enemy.png',
        mid_tier_enemy: 'heroship.webp',
      },
      sounds: {
        // shootSound: 'shoot.mp3',
        hitSound: 'hit.aac',
        music: 'music.aac',
      },
    };

    for (const [key, file] of Object.entries(assets.images)) {
      this.load.image(key, `/assets/${file}`);
    }

    for (const [key, file] of Object.entries(assets.sounds)) {
      this.load.audio(key, `/assets/${file}`);
    }
  }

  create(): void {
    const { width, height } = this.sys.game.config as { width: number; height: number };
    const music = this.sound.add('music', { loop: true });
    music?.play();

    this.starfield = this.add.tileSprite(width / 2, height / 2, width, height, 'starfield');

    this.player = this.physics.add.sprite(width / 2, height - 100, 'playerShip')
      .setScale(0.1)
      .setCollideWorldBounds(true);

    this.healthText = this.add.text(10, 10, `Health: ${this.playerHealth}`, {
      fontSize: '20px',
      color: '#ffffff',
    });

    // this.shootSound = this.sound.add('shootSound')!;
    this.hitSound = this.sound.add('hitSound')!;

    this.bulletGroup = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 300,
      runChildUpdate: true,
    });

    this.obstacleGroup = this.physics.add.group();
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
        const sprite = this.obstacleGroup.create(x, -50, type) as Phaser.Physics.Arcade.Sprite;
        sprite?.setVelocityY(this.backgroundSpeed * 50);
      },
    });

    this.time.addEvent({
      delay: 5000,
      loop: true,
      callback: () => {
        const x = Phaser.Math.Between(50, width - 50);
        const enemy = this.midTierEnemies.create(x, -50, 'mid_tier_enemy') as Phaser.Physics.Arcade.Sprite;
        enemy?.setVelocityY(this.backgroundSpeed * 30);

        this.time.addEvent({
          delay: 1000,
          callback: () => {
            if (enemy?.active) {
              this.enemyShoot(enemy);
            }
          },
        });
      },
    });

    this.physics.add.overlap(this.bulletGroup, this.obstacleGroup, (bullet, obstacle) => {
      this.hitSound?.play();
      (bullet as Phaser.Physics.Arcade.Image)?.setActive(false).setVisible(false).body?.stop();
      (obstacle as Phaser.Physics.Arcade.Sprite)?.destroy();
    });

    this.physics.add.overlap(this.bulletGroup, this.midTierEnemies, (bullet, enemy) => {
      this.hitSound?.play();
      (bullet as Phaser.Physics.Arcade.Image)?.setActive(false).setVisible(false).body?.stop();
      (enemy as Phaser.Physics.Arcade.Sprite)?.destroy();
    });

    this.physics.add.overlap(this.enemyBulletGroup, this.player, (bullet, player) => {
      this.hitSound?.play();
      (bullet as Phaser.Physics.Arcade.Image)?.setActive(false).setVisible(false).body?.stop();
      this.reducePlayerHealth(10);
    });

    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-SPACE', () => this.shoot());
      this.input.keyboard.on('keydown-W', () => this.adjustBackgroundSpeed(1));
      this.input.keyboard.on('keydown-S', () => this.adjustBackgroundSpeed(-1));
      this.cursors = this.input.keyboard.createCursorKeys()!;
    }
  }

  private reducePlayerHealth(damage: number): void {
    this.playerHealth -= damage;
    if (this.playerHealth < 0) {
      this.playerHealth = 0;
    }
    this.healthText?.setText(`Health: ${this.playerHealth}`);
    if (this.playerHealth === 0) {
      console.log('Game Over!');
    }
  }

  shoot(): void {
    const bulletY = this.player.y - this.player.displayHeight / 2;
    const bullet = this.bulletGroup.get(this.player.x, bulletY, 'bullet') as Phaser.Physics.Arcade.Image;

    if (bullet) {
      bullet.setActive(true).setVisible(true).setPosition(this.player.x, bulletY).setScale(0.3);
      bullet.angle = this.player.angle;

      const bulletSpeed = 400;
      const angleRad = Phaser.Math.DegToRad(-90 + this.player.angle);
      const velocityX = bulletSpeed * Math.cos(angleRad);
      const velocityY = bulletSpeed * Math.sin(angleRad);

      bullet.setVelocity(velocityX, velocityY);

      // this.shootSound?.play();

      this.time.addEvent({
        delay: 2000,
        callback: () => {
          bullet?.setActive(false).setVisible(false).body?.stop();
        },
      });
    }
  }

  enemyShoot(enemy: Phaser.Physics.Arcade.Sprite): void {
    const bullet = this.enemyBulletGroup.get(enemy.x, enemy.y, 'bullet') as Phaser.Physics.Arcade.Image;
    if (bullet) {
      bullet.setActive(true).setVisible(true).setScale(0.3).setAngle(enemy.angle);

      const angleRad = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
      const bulletSpeed = 300;
      bullet.setVelocity(
        bulletSpeed * Math.cos(angleRad),
        bulletSpeed * Math.sin(angleRad)
      );

      this.time.addEvent({
        delay: 3000,
        callback: () => {
          bullet?.setActive(false).setVisible(false).body?.stop();
        },
      });
    }
  }

  adjustBackgroundSpeed(delta: number): void {
    this.backgroundSpeed = Math.max(0, this.backgroundSpeed + delta);
    console.log('Background speed:', this.backgroundSpeed);
  }

  update(): void {
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
