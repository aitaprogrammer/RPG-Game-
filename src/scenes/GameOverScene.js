import Phaser from 'phaser';

export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    init(data) {
        this.levelID = data.levelID || 'test_level';
        console.log("Game Over on Level:", this.levelID);
    }

    create() {
        const { width, height } = this.cameras.main;

        // Add Background
        const bg = this.add.image(width / 2, height / 2, 'lose_bg');
        const scaleX = width / bg.width;
        const scaleY = height / bg.height;
        const scale = Math.max(scaleX, scaleY);
        bg.setScale(scale);

        // Retry Button
        const retryBtn = this.add.text(width / 2, height / 2.5 + 100, '> Retry Level', {
            fontSize: '32px',
            fill: '#ffffff'
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => retryBtn.setStyle({ fill: '#ffff00' }))
            .on('pointerout', () => retryBtn.setStyle({ fill: '#ffffff' }))
            .on('pointerdown', () => this.restartGame());

        // Menu Button
        const menuBtn = this.add.text(width / 2, height / 2.5 + 160, '> Return to Menu', {
            fontSize: '32px',
            fill: '#ffffff'
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => menuBtn.setStyle({ fill: '#ffff00' }))
            .on('pointerout', () => menuBtn.setStyle({ fill: '#ffffff' }))
            .on('pointerdown', () => this.goToMenu());

        // Restart with R key
        this.input.keyboard.on('keydown-R', () => this.restartGame());
    }

    restartGame() {
        // Stop UI Scene in case it's still running overlay
        this.scene.stop('UIScene');
        this.scene.start('GameScene', { levelID: this.levelID });
    }

    goToMenu() {
        this.scene.stop('UIScene');
        this.scene.start('MenuScene');
    }
}
