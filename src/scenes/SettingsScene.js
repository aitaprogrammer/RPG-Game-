import Phaser from 'phaser';

export default class SettingsScene extends Phaser.Scene {
    constructor() {
        super('SettingsScene');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Background
        const bg = this.add.image(width / 2, height / 2, 'menu_bg');
        // Scale to cover
        const scaleX = width / bg.width;
        const scaleY = height / bg.height;
        const scale = Math.max(scaleX, scaleY);
        bg.setScale(scale).setTint(0x666666); // Darken a bit for settings

        // Title
        this.add.text(width / 2, 80, 'SETTINGS', {
            fontSize: '48px',
            fontFamily: 'monospace',
            color: '#ffffff'
        }).setOrigin(0.5);

        // --- Music Toggle ---
        const isMusicMuted = this.registry.get('musicMuted') || false;
        const musicText = this.add.text(width / 2, height / 2 - 40,
            isMusicMuted ? 'Music: OFF' : 'Music: ON', {
            fontSize: '32px',
            fontFamily: 'monospace',
            color: isMusicMuted ? '#ff9999' : '#99ff99',
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 }
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.toggleMusic(musicText))
            .on('pointerover', () => musicText.setStyle({ fill: '#ffff00' }))
            .on('pointerout', () => musicText.setStyle({ fill: isMusicMuted ? '#ff9999' : '#99ff99' }));

        // --- Sound Toggle ---
        // 'sfxMuted' might not be set yet, default false
        let isSfxMuted = this.registry.get('sfxMuted');
        if (isSfxMuted === undefined) isSfxMuted = false;

        this.sfxText = this.add.text(width / 2, height / 2 + 60,
            isSfxMuted ? 'Sound: OFF' : 'Sound: ON', {
            fontSize: '32px',
            fontFamily: 'monospace',
            color: isSfxMuted ? '#ff9999' : '#99ff99',
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 }
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.toggleSound())
            .on('pointerover', () => this.sfxText.setStyle({ fill: '#ffff00' }))
            .on('pointerout', () => {
                const muted = this.registry.get('sfxMuted');
                this.sfxText.setStyle({ fill: muted ? '#ff9999' : '#99ff99' });
            });

        // --- Back Button ---
        const backButton = this.add.text(width / 2, height - 100, 'BACK', {
            fontSize: '24px',
            fontFamily: 'monospace',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 15, y: 8 }
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.scene.start('MenuScene'))
            .on('pointerover', () => backButton.setStyle({ fill: '#ff0' }))
            .on('pointerout', () => backButton.setStyle({ fill: '#fff' }));
    }

    toggleMusic(textObj) {
        const currentMute = this.registry.get('musicMuted') || false;
        const newMute = !currentMute;
        this.registry.set('musicMuted', newMute);

        textObj.setText(newMute ? 'Music: OFF' : 'Music: ON');
        textObj.setColor(newMute ? '#ff9999' : '#99ff99');

        // Apply immediately
        this.sound.sounds.forEach(s => {
            if (s.key === 'theme_music') {
                s.setMute(newMute);
            }
        });
    }

    toggleSound() {
        const currentMute = this.registry.get('sfxMuted') || false;
        const newMute = !currentMute;
        this.registry.set('sfxMuted', newMute);

        this.sfxText.setText(newMute ? 'Sound: OFF' : 'Sound: ON');
        this.sfxText.setColor(newMute ? '#ff9999' : '#99ff99');
    }
}
