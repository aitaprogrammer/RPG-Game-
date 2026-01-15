import Phaser from 'phaser';
import itemsData from '../data/items.json';
import LootSystem from '../systems/LootSystem.js';

/**
 * Item - Represents a dropped item entity in the game world
 * Handles visual representation, pickup collision, and item data
 */
export default class Item extends Phaser.Physics.Arcade.Sprite {
    /**
     * @param {Phaser.Scene} scene - The scene this item belongs to
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} itemId - The item ID from items.json
     * @param {number} quantity - Stack quantity (default: 1)
     */
    constructor(scene, x, y, itemId, quantity = 1) {
        // Get item data
        const itemData = itemsData[itemId];

        // Determine texture and frame
        let texture = 'items';
        let frame = 0;

        if (itemData) {
            if (itemData.customTexture && itemData.sprite) {
                texture = itemData.sprite;
                frame = undefined; // No frame for standalone images
            } else {
                frame = itemData.frame || 0;
            }
        }

        if (!itemData) {
            console.error(`Item data for '${itemId}' not found!`);
            super(scene, x, y, 'items', 0);
        } else if (itemData.customTexture) {
            super(scene, x, y, texture);
        } else {
            super(scene, x, y, texture, frame);
        }

        this.itemId = itemId;
        this.itemData = itemData || { name: 'Unknown', rarity: 'common' };
        this.quantity = quantity;
        this.scene = scene;
        this.useCustomTexture = itemData?.customTexture || false;

        // Add to scene
        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);

        // Physics setup - 24x24 hitbox for all items (matching enemy size)
        this.body.setSize(24, 24);
        this.body.setImmovable(true);

        // Visual size - 24x24 for custom textures (matching enemy size)
        if (this.useCustomTexture) {
            this.setDisplaySize(24, 24);
        } else {
            this.setScale(1);
        }

        // Spawn animation - pop in effect
        this.setAlpha(0);
        this.scene.tweens.add({
            targets: this,
            alpha: 1,
            duration: 200,
            ease: 'Back.easeOut',
            onComplete: () => {
                // Restore display size after animation for custom textures
                if (this.useCustomTexture) {
                    this.setDisplaySize(24, 24);
                }
            }
        });

        // Floating animation
        this.floatTween = this.scene.tweens.add({
            targets: this,
            y: y - 6,
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Apply rarity tint/glow
        this._applyRarityEffect();

        // Create quantity label for stacks > 1 (but NOT for med_kit or energy_kit - they always show as 1x)
        const noQuantityLabel = ['med_kit', 'energy_kit'];
        if (this.quantity > 1 && !noQuantityLabel.includes(this.itemId)) {
            this._createQuantityLabel();
        }

        // Pickup delay to prevent instant grabs
        this.canPickup = false;
        this.scene.time.delayedCall(300, () => {
            this.canPickup = true;
        });

        // Despawn timer (optional - items disappear after 60 seconds)
        this.despawnTimer = this.scene.time.delayedCall(60000, () => {
            this._despawn();
        });
    }

    /**
     * Apply visual effects based on item rarity
     * @private
     */
    _applyRarityEffect() {
        const rarity = this.itemData.rarity || 'common';
        const color = LootSystem.getRarityColor(rarity);

        // Add subtle glow for uncommon+ items (skip for custom textures to avoid issues)
        if (rarity !== 'common' && !this.useCustomTexture) {
            // Create glow effect using another sprite behind
            this.glow = this.scene.add.sprite(this.x, this.y, 'items', this.itemData.frame || 0);
            this.glow.setTint(color);
            this.glow.setAlpha(0.4);
            this.glow.setScale(1.3);
            this.glow.setBlendMode(Phaser.BlendModes.ADD);

            // Pulsing glow animation
            this.scene.tweens.add({
                targets: this.glow,
                alpha: { from: 0.2, to: 0.5 },
                scale: { from: 1.2, to: 1.4 },
                duration: 800,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    /**
     * Create quantity label for stacked items
     * @private
     */
    _createQuantityLabel() {
        this.qtyLabel = this.scene.add.text(this.x + 8, this.y + 8, `x${this.quantity}`, {
            fontSize: '10px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.qtyLabel.setOrigin(0.5);
        this.qtyLabel.setDepth(1);
    }

    /**
     * Called when player picks up this item
     * @returns {Object} { itemId, quantity } for inventory
     */
    pickup() {
        if (!this.canPickup) return null;

        // Prevent multiple pickups
        this.canPickup = false;

        // Cancel despawn
        if (this.despawnTimer) {
            this.despawnTimer.remove();
        }

        // Pickup visual effect
        this.scene.tweens.add({
            targets: this,
            y: this.y - 20,
            alpha: 0,
            scale: 0.3,
            duration: 150,
            ease: 'Power2',
            onComplete: () => {
                this._cleanup();
            }
        });

        // Play pickup sound (if available)
        // this.scene.sound.play('pickup');

        return { itemId: this.itemId, quantity: this.quantity };
    }

    /**
     * Despawn animation
     * @private
     */
    _despawn() {
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            scale: 0,
            duration: 500,
            onComplete: () => {
                this._cleanup();
            }
        });
    }

    /**
     * Clean up all related objects
     * @private
     */
    _cleanup() {
        if (this.glow) this.glow.destroy();
        if (this.qtyLabel) this.qtyLabel.destroy();
        if (this.floatTween) this.floatTween.stop();
        this.destroy();
    }

    /**
     * Update glow and label positions (call in scene update if needed)
     */
    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        if (this.glow) {
            this.glow.setPosition(this.x, this.y);
        }
        if (this.qtyLabel) {
            this.qtyLabel.setPosition(this.x + 8, this.y + 8);
        }
    }

    /**
     * Get tooltip text for this item
     * @returns {string}
     */
    getTooltip() {
        const data = this.itemData;
        let text = `${data.name}`;
        if (this.quantity > 1) text += ` (x${this.quantity})`;
        text += `\n${data.rarity || 'common'}`;
        if (data.description) text += `\n${data.description}`;
        return text;
    }
}
