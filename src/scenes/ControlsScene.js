import Phaser from 'phaser';

export default class ControlsScene extends Phaser.Scene {
    constructor() {
        super('ControlsScene');
    }

    init(data) {
        this.fromScene = data?.from || 'MenuScene';
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Background (Reuse main menu background)
        const bg = this.add.image(width / 2, height / 2, 'menu_bg');
        const scaleX = width / bg.width;
        const scaleY = height / bg.height;
        const scale = Math.max(scaleX, scaleY);
        bg.setScale(scale).setTint(0x444444); // Darken for readability

        // Title
        this.add.text(width / 2, 80, 'CONTROLS', {
            fontSize: '64px',
            fontFamily: 'monospace',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Control List
        const controls = [
            { key: 'W,A,S,D/ARROWS', action: 'MOVE' },
            { key: 'SPACE', action: 'MELEE ATTACK' },
            { key: 'F', action: 'BLUE BLAST (RANGED)' },
            { key: 'I', action: 'TOGGLE INVENTORY' },
            { key: 'ESC', action: 'PAUSE MENU' }
        ];

        let startY = 200;
        controls.forEach(control => {
            this.add.text(width / 2 - 200, startY, control.key, {
                fontSize: '28px',
                fontFamily: 'monospace',
                color: '#00ffff'
            }).setOrigin(0, 0.5);

            this.add.text(width / 2 + 50, startY, control.action, {
                fontSize: '28px',
                fontFamily: 'monospace',
                color: '#ffffff'
            }).setOrigin(0, 0.5);

            startY += 60;
        });

        // Back Button
        const backButton = this.add.text(width / 2, height - 100, 'BACK', {
            fontSize: '32px',
            fontFamily: 'monospace',
            color: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 }
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.scene.start(this.fromScene);
            })
            .on('pointerover', () => backButton.setStyle({ fill: '#ffff00' }))
            .on('pointerout', () => backButton.setStyle({ fill: '#ffffff' }));

    }
}
