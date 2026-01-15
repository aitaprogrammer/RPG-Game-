import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import UIScene from './scenes/UIScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import WinningScene from './scenes/WinningScene.js';
import PauseScene from './scenes/PauseScene.js';
import SettingsScene from './scenes/SettingsScene.js';

import LevelSelectionScene from './scenes/LevelSelectionScene.js';
import ControlsScene from './scenes/ControlsScene.js';

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false, // Enable debug to see hitboxes during dev
            gravity: { y: 0 } // Top-down, so no gravity
        }
    },
    scene: [BootScene, MenuScene, LevelSelectionScene, GameScene, UIScene, GameOverScene, WinningScene, PauseScene, SettingsScene, ControlsScene]
};

const game = new Phaser.Game(config);
