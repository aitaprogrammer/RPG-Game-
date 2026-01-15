import Phaser from 'phaser';
import QuestManager from '../systems/QuestManager.js';
import levels from '../data/levels.json';

export default class WinningScene extends Phaser.Scene {
    constructor() {
        super('WinningScene');
    }

    init(data) {
        this.levelID = data.levelID || 'test_level';
        console.log("Winning Scene for Level:", this.levelID);
    }

    create() {
        const { width, height } = this.cameras.main;

        // Add Background
        const bg = this.add.image(width / 2, height / 2, 'win_bg');
        const scaleX = width / bg.width;
        const scaleY = height / bg.height;
        const scale = Math.max(scaleX, scaleY);
        bg.setScale(scale);

        // Play Again Button
        const playAgainBtn = this.add.text(width / 2, height / 2 + 50, '> Play Again', {
            fontSize: '32px',
            fill: '#ffffff'
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => playAgainBtn.setStyle({ fill: '#ffff00' }))
            .on('pointerout', () => playAgainBtn.setStyle({ fill: '#ffffff' }))
            .on('pointerdown', () => this.restartGame());

        // Next Level Button
        const nextLevelID = levels[this.levelID]?.nextLevel;
        if (nextLevelID) {
            const nextLevelBtn = this.add.text(width / 2, height / 2 + 120, '> Next Level', {
                fontSize: '32px',
                fill: '#ffffff'
            })
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true })
                .on('pointerover', () => nextLevelBtn.setStyle({ fill: '#ffff00' }))
                .on('pointerout', () => nextLevelBtn.setStyle({ fill: '#ffffff' }))
                .on('pointerdown', () => this.startNextLevel(nextLevelID));
        }

        // Main Menu Button
        const menuBtn = this.add.text(width / 2, height / 2 + 190, '> Main Menu', {
            fontSize: '32px',
            fill: '#ffffff'
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => menuBtn.setStyle({ fill: '#ffff00' }))
            .on('pointerout', () => menuBtn.setStyle({ fill: '#ffffff' }))
            .on('pointerdown', () => this.goToMenu());

        // Key shortcuts
        this.input.keyboard.on('keydown-ENTER', () => {
            if (nextLevelID) this.startNextLevel(nextLevelID);
            else this.restartGame();
        });
        this.input.keyboard.on('keydown-ESC', () => this.goToMenu());
    }

    startNextLevel(nextLevelID) {
        // Unlock next level is handled in GameScene victory trigger, 
        // but double check here or just start it (since it should be unlocked)
        QuestManager.resetAll(); // Reset quests for the new level
        this.scene.stop('UIScene');
        this.scene.start('GameScene', { levelID: nextLevelID });
    }

    restartGame() {
        // Reset quests so we can play again
        QuestManager.resetAll();
        this.scene.stop('UIScene');
        this.scene.start('GameScene', { levelID: this.levelID });
    }

    goToMenu() {
        this.scene.stop('UIScene');
        this.scene.start('MenuScene');
    }
}
