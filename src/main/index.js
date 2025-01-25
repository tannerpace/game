import Phaser from 'phaser';
import { MainScene } from './MainScene';

const config = {
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
