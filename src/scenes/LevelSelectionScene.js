import Phaser from 'phaser';
import PersistenceManager from '../systems/PersistenceManager.js';
import levels from '../data/levels.json';

export default class LevelSelectionScene extends Phaser.Scene {
    constructor() {
        super('LevelSelectionScene');
    }

    create() {
        this.cameras.main.setBackgroundColor('#1a1a1a');
        const { width, height } = this.cameras.main;

        // Title
        this.add.text(width / 2, 80, 'SELECT LEVEL', {
            fontSize: '48px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // List levels
        const levelKeys = Object.keys(levels);
        const startY = 200;
        const gap = 80;

        levelKeys.forEach((key, index) => {
            const levelConfig = levels[key];
            const isUnlocked = PersistenceManager.isLevelUnlocked(key);

            const yPos = startY + (index * gap);

            // Container for the level entry
            const container = this.add.container(width / 2, yPos);

            // Background strip
            const bg = this.add.rectangle(0, 0, 600, 60, isUnlocked ? 0x333333 : 0x111111)
                .setStrokeStyle(2, isUnlocked ? 0x00ff00 : 0x555555);
            container.add(bg);

            // Level Name
            const text = this.add.text(-280, 0, levelConfig.name.toUpperCase(), {
                fontSize: '24px',
                fill: isUnlocked ? '#ffffff' : '#777777'
            }).setOrigin(0, 0.5);
            container.add(text);

            if (isUnlocked) {
                // Interactive functionality
                bg.setInteractive({ useHandCursor: true })
                    .on('pointerover', () => bg.setFillStyle(0x444444))
                    .on('pointerout', () => bg.setFillStyle(0x333333))
                    .on('pointerdown', () => this.startLevel(key));

                // Play Icon/Text
                const playText = this.add.text(250, 0, 'PLAY >', {
                    fontSize: '20px',
                    fill: '#00ff00'
                }).setOrigin(0.5);
                container.add(playText);

            } else {
                // Locked Icon
                const lockText = this.add.text(250, 0, 'LOCKED', {
                    fontSize: '20px',
                    fill: '#ff0000'
                }).setOrigin(0.5);
                container.add(lockText);
            }
        });

        // Back Button
        const backBtn = this.add.text(150, height - 50, '< Back to Main Menu', {
            fontSize: '24px',
            fill: '#ffffff'
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => backBtn.setStyle({ fill: '#ffff00' }))
            .on('pointerout', () => backBtn.setStyle({ fill: '#ffffff' }))
            .on('pointerdown', () => this.scene.start('MenuScene'));
    }

    startLevel(levelID) {
        this.scene.start('GameScene', { levelID: levelID });
    }
}
