import Phaser from 'phaser';

export default class Entity extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, key) {
        super(scene, x, y, texture);

        this.scene = scene;
        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
    }
}
