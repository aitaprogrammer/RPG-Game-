import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Add Background
        const bg = this.add.image(width / 2, height / 2, 'menu_bg');
        // Scale to cover
        const scaleX = width / bg.width;
        const scaleY = height / bg.height;
        const scale = Math.max(scaleX, scaleY);
        bg.setScale(scale);

        this.add.text(width / 2, height / 2 - 100, 'RPG GAME', {
            fontSize: '64px',
            fontFamily: 'monospace',
            color: '#ffffff'
        }).setOrigin(0.5);

        const playButton = this.add.text(width / 2, height / 2 + 50, 'PLAY', {
            fontSize: '32px',
            fontFamily: 'monospace',
            color: '#00ff00',
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 }
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.startGame())
            .on('pointerover', () => playButton.setStyle({ fill: '#ff0' }))
            .on('pointerout', () => playButton.setStyle({ fill: '#0f0' }));

        const settingsButton = this.add.text(width / 2, height / 2 + 120, 'SETTINGS', {
            fontSize: '24px',
            fontFamily: 'monospace',
            color: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 }
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.scene.start('SettingsScene'))
            .on('pointerover', () => settingsButton.setStyle({ fill: '#ff0' }))
            .on('pointerout', () => settingsButton.setStyle({ fill: '#fff' }));

        const controlsButton = this.add.text(width / 2, height / 2 + 190, 'CONTROLS', {
            fontSize: '24px',
            fontFamily: 'monospace',
            color: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 }
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.scene.start('ControlsScene'))
            .on('pointerover', () => controlsButton.setStyle({ fill: '#ff0' }))
            .on('pointerout', () => controlsButton.setStyle({ fill: '#fff' }));



        // Music handling
        if (!this.sound.get('theme_music')) {
            this.sound.play('theme_music', { loop: true, volume: 0.5 });
        }
    }

    startGame() {
        this.scene.start('LevelSelectionScene');
    }
}
