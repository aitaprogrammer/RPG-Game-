import Phaser from 'phaser';
import chamberBg from '../assets/chamber_background.png';
import forestBg from '../assets/forest_background.png';
import dungeonBg from '../assets/dungeon_background.png';
import caveBg from '../assets/cave_background.png';
import cyberpunkBg from '../assets/cyberpunk_background.png';
import libraryBg from '../assets/library_background.png';
import underwaterBg from '../assets/underwater_background.png';
import musicFile from '../assets/Music.wav';
import swordSound from '../assets/sowrd_sound.mp3';
import enemyNormal from '../assets/enemy_normal.png';
import enemyChase from '../assets/enemy.png';
import menuBg from '../assets/background.png';
import winBg from '../assets/win.png';
import loseBg from '../assets/lose.png';
import medKitImg from '../assets/med_kit.png';
import energyImg from '../assets/energy.png';
import coinImg from '../assets/coin.png';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Preload assets here (dummy loading bar logic)
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

        const loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 50,
            text: 'Loading...',
            style: {
                font: '20px monospace',
                fill: '#ffffff'
            }
        });
        loadingText.setOrigin(0.5, 0.5);

        this.load.on('progress', function (value) {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
        });

        this.load.on('complete', function () {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
        });

        // Load level backgrounds
        this.load.image('chamber_bg', chamberBg);
        this.load.image('forest_bg', forestBg);
        this.load.image('dungeon_bg', dungeonBg);
        this.load.image('cave_bg', caveBg);

        // Character Spritesheet
        this.load.spritesheet('player', 'https://labs.phaser.io/assets/sprites/dude.png', { frameWidth: 32, frameHeight: 48 });

        // Attack VFX
        this.load.image('attack_swing', 'https://labs.phaser.io/assets/sprites/phaser-dude.png'); // Placeholder for swing, will tint

        // Simulate a load time or load actual assets
        this.load.image('logo', 'https://labs.phaser.io/assets/sprites/phaser3-logo.png'); // Placeholder
        for (let i = 0; i < 50; i++) {
            this.load.image('logo' + i, 'https://labs.phaser.io/assets/sprites/phaser3-logo.png');
        }

        this.load.image('cyberpunk_bg', cyberpunkBg);
        this.load.image('library_bg', libraryBg);
        this.load.image('underwater_bg', underwaterBg);

        this.load.audio('theme_music', musicFile);
        this.load.audio('sword_hit', swordSound);
        this.load.image('enemy_normal', enemyNormal);
        this.load.image('enemy_chase', enemyChase);
        this.load.image('menu_bg', menuBg);
        this.load.image('win_bg', winBg);
        this.load.image('lose_bg', loseBg);
        this.load.image('med_kit', medKitImg);
        this.load.image('energy_kit', energyImg);
        this.load.image('coin', coinImg);
    }

    create() {
        this.scene.start('MenuScene');
    }
}
