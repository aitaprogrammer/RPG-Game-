import Phaser from 'phaser';

export default class PauseScene extends Phaser.Scene {
    constructor() {
        super('PauseScene');
    }

    create() {
        const { width, height } = this.cameras.main;

        // Dim background
        const bg = this.add.rectangle(0, 0, width, height, 0x000000, 0.7);
        bg.setOrigin(0);

        // Pause Menu Container
        const menuWidth = 400;
        const menuHeight = 550;
        const container = this.add.container(width / 2, height / 2);

        const menuBg = this.add.rectangle(0, 0, menuWidth, menuHeight, 0x1a1a2e, 0.95);
        menuBg.setStrokeStyle(4, 0x4a4a6a);

        const title = this.add.text(0, -150, 'PAUSED', {
            fontSize: '48px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Buttons
        const resumeBtn = this.createButton(0, -60, 'RESUME', () => {
            this.resumeGame();
        });

        // --- Music Toggle ---
        let isMusicMuted = this.registry.get('musicMuted');
        if (isMusicMuted === undefined) isMusicMuted = false;

        const musicLabel = isMusicMuted ? 'MUSIC: OFF' : 'MUSIC: ON';
        const musicBtn = this.createButton(0, 10, musicLabel, (btn, text) => {
            const current = this.registry.get('musicMuted');
            const newState = !current;
            this.registry.set('musicMuted', newState);
            text.setText(newState ? 'MUSIC: OFF' : 'MUSIC: ON');

            // Apply immediately
            this.game.sound.sounds.forEach(s => {
                if (s.key === 'theme_music') {
                    s.setMute(newState);
                }
            });
        });

        // --- Sound Toggle ---
        let isSfxMuted = this.registry.get('sfxMuted');
        if (isSfxMuted === undefined) isSfxMuted = false;

        const sfxLabel = isSfxMuted ? 'SOUND: OFF' : 'SOUND: ON';
        const sfxBtn = this.createButton(0, 80, sfxLabel, (btn, text) => {
            const current = this.registry.get('sfxMuted');
            const newState = !current;
            this.registry.set('sfxMuted', newState);
            text.setText(newState ? 'SOUND: OFF' : 'SOUND: ON');
        });

        const controlsBtn = this.createButton(0, 150, 'CONTROLS', () => {
            this.scene.start('ControlsScene', { from: 'PauseScene' });
        });

        const exitBtn = this.createButton(0, 220, 'EXIT TO MENU', () => {
            this.exitToMenu();
        });

        container.add([menuBg, title, resumeBtn.container, musicBtn.container, sfxBtn.container, controlsBtn.container, exitBtn.container]);

        // ESC to resume
        this.input.keyboard.once('keydown-ESC', () => {
            this.resumeGame();
        });
    }

    createButton(x, y, label, callback) {
        const btnContainer = this.add.container(x, y);

        const bg = this.add.rectangle(0, 0, 300, 60, 0x2a2a4a)
            .setInteractive({ useHandCursor: true })
            .setStrokeStyle(2, 0x4a4a6a);

        const text = this.add.text(0, 0, label, {
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        bg.on('pointerover', () => {
            bg.setFillStyle(0x3a3a6a);
            text.setScale(1.1);
        });

        bg.on('pointerout', () => {
            bg.setFillStyle(0x2a2a4a);
            text.setScale(1);
        });

        bg.on('pointerdown', () => {
            callback(bg, text);
        });

        btnContainer.add([bg, text]);

        return { container: btnContainer, text: text };
    }

    resumeGame() {
        this.scene.resume('GameScene');
        this.scene.resume('UIScene');
        this.scene.stop();
    }

    exitToMenu() {
        this.scene.stop('GameScene');
        this.scene.stop('UIScene');
        this.scene.start('MenuScene');
    }
}
