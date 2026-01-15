import Phaser from 'phaser';
import { inventoryInstance } from '../systems/InventoryManager.js';
import itemsData from '../data/items.json';
import LootSystem from '../systems/LootSystem.js';

/**
 * UIScene - Overlay scene for HUD and Inventory display
 * Runs in parallel with GameScene
 */
export default class UIScene extends Phaser.Scene {
    constructor() {
        super('UIScene');

        this.isInventoryOpen = false;
        this.inventoryPanel = null;
        this.itemSlots = [];
        this.selectedSlot = null;
        this.tooltip = null;
    }

    create() {
        // Create HUD elements
        this._createHUD();

        // Create Inventory Panel (initially hidden)
        this._createInventoryPanel();

        // Create Tooltip
        this._createTooltip();

        // Listen for inventory changes
        inventoryInstance.onChange(() => {
            this._updateHUD();
            if (this.isInventoryOpen) {
                this._updateInventoryDisplay();
            }
        });

        // Listen for GameScene events
        const gameScene = this.scene.get('GameScene');
        if (gameScene) {
            gameScene.events.on('INVENTORY_UPDATED', () => {
                this._updateHUD();
                if (this.isInventoryOpen) {
                    this._updateInventoryDisplay();
                }
            });

            gameScene.events.on('PLAYER_STATS_CHANGED', (stats) => {
                this._updateHealthBar(stats);
            });
        }

        // Keyboard input for toggle
        this.input.keyboard.on('keydown-I', () => {
            this.toggleInventory();
        });

        this.input.keyboard.on('keydown-ESC', () => {
            if (this.isInventoryOpen) {
                this.toggleInventory();
            } else {
                this.pauseGame();
            }
        });

        // Initial update
        this._updateHUD();
    }

    /**
     * Create the HUD elements (health bar, gold, quick slots)
     * @private
     */
    _createHUD() {
        // HUD Container
        this.hud = this.add.container(0, 0);
        this.hud.setDepth(100);
        this.hud.setScrollFactor(0);

        // --- Health Bar ---
        const barX = 20;
        const barY = 20;
        const barWidth = 200;
        const barHeight = 24;

        // Background
        this.healthBarBg = this.add.rectangle(barX, barY, barWidth, barHeight, 0x333333)
            .setOrigin(0)
            .setStrokeStyle(2, 0x000000);
        this.hud.add(this.healthBarBg);

        // Health fill
        this.healthBarFill = this.add.rectangle(barX + 2, barY + 2, barWidth - 4, barHeight - 4, 0xff3333)
            .setOrigin(0);
        this.hud.add(this.healthBarFill);

        // Health text
        this.healthText = this.add.text(barX + barWidth / 2, barY + barHeight / 2, '100 / 100', {
            fontSize: '14px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        this.hud.add(this.healthText);

        // Heart icon
        this.add.text(barX - 5, barY + barHeight / 2, '❤️', { fontSize: '16px' })
            .setOrigin(1, 0.5);

        // --- Mana Bar ---
        const manaY = barY + barHeight + 8;

        this.manaBarBg = this.add.rectangle(barX, manaY, barWidth * 0.7, barHeight * 0.8, 0x333333)
            .setOrigin(0)
            .setStrokeStyle(2, 0x000000);
        this.hud.add(this.manaBarBg);

        this.manaBarFill = this.add.rectangle(barX + 2, manaY + 2, (barWidth * 0.7) - 4, (barHeight * 0.8) - 4, 0x3366ff)
            .setOrigin(0);
        this.hud.add(this.manaBarFill);

        this.manaText = this.add.text(barX + (barWidth * 0.7) / 2, manaY + (barHeight * 0.8) / 2, '50 / 50', {
            fontSize: '12px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        this.hud.add(this.manaText);

        // --- Gold Display ---
        this.goldContainer = this.add.container(barX, manaY + 35);
        this.hud.add(this.goldContainer);

        const goldIcon = this.add.text(0, 0, '💰', { fontSize: '18px' });
        this.goldText = this.add.text(25, 2, '0', {
            fontSize: '16px',
            fill: '#ffd700',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.goldContainer.add([goldIcon, this.goldText]);

        // --- Inventory Toggle Hint ---
        this.add.text(20, this.cameras.main.height - 30, '[I] Inventory', {
            fontSize: '14px',
            fill: '#aaaaaa',
            stroke: '#000000',
            strokeThickness: 1
        }).setScrollFactor(0);

        // --- Quick Slots (bottom center) ---
        this._createQuickSlots();
    }

    /**
     * Create quick slots bar at bottom of screen
     * @private
     */
    _createQuickSlots() {
        const slotSize = 48;
        const slotCount = 5;
        const spacing = 6;
        const totalWidth = slotCount * slotSize + (slotCount - 1) * spacing;
        const startX = (this.cameras.main.width - totalWidth) / 2;
        const y = this.cameras.main.height - 60;

        this.quickSlotsContainer = this.add.container(startX, y);
        this.quickSlotsContainer.setScrollFactor(0);
        this.quickSlotsContainer.setDepth(100);

        this.quickSlots = [];

        for (let i = 0; i < slotCount; i++) {
            const x = i * (slotSize + spacing);

            // Slot background
            const bg = this.add.rectangle(x, 0, slotSize, slotSize, 0x222222, 0.8)
                .setOrigin(0)
                .setStrokeStyle(2, 0x666666);

            // Key label
            const keyLabel = this.add.text(x + 4, 4, `${i + 1}`, {
                fontSize: '10px',
                fill: '#888888'
            });

            // Item icon placeholder
            const itemIcon = this.add.sprite(x + slotSize / 2, slotSize / 2, 'items', 0)
                .setVisible(false);

            // Quantity text
            const qtyText = this.add.text(x + slotSize - 4, slotSize - 4, '', {
                fontSize: '10px',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(1, 1);

            this.quickSlotsContainer.add([bg, keyLabel, itemIcon, qtyText]);
            this.quickSlots.push({ bg, itemIcon, qtyText, itemId: null });
        }
    }

    /**
     * Create the inventory panel
     * @private
     */
    _createInventoryPanel() {
        const panelWidth = 400;
        const panelHeight = 450;
        const x = (this.cameras.main.width - panelWidth) / 2;
        const y = (this.cameras.main.height - panelHeight) / 2;

        this.inventoryPanel = this.add.container(x, y);
        this.inventoryPanel.setDepth(200);
        this.inventoryPanel.setScrollFactor(0);
        this.inventoryPanel.setVisible(false);

        // Panel background with gradient effect
        const bg = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x1a1a2e, 0.95)
            .setOrigin(0)
            .setStrokeStyle(3, 0x4a4a6a);
        this.inventoryPanel.add(bg);

        // Title bar
        const titleBar = this.add.rectangle(0, 0, panelWidth, 40, 0x2a2a4a)
            .setOrigin(0);
        this.inventoryPanel.add(titleBar);

        const title = this.add.text(panelWidth / 2, 20, '📦 INVENTORY', {
            fontSize: '18px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.inventoryPanel.add(title);

        // Close button
        const closeBtn = this.add.text(panelWidth - 15, 20, '✕', {
            fontSize: '20px',
            fill: '#ff6666'
        }).setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.toggleInventory())
            .on('pointerover', () => closeBtn.setStyle({ fill: '#ff9999' }))
            .on('pointerout', () => closeBtn.setStyle({ fill: '#ff6666' }));
        this.inventoryPanel.add(closeBtn);

        // Gold display in inventory
        const goldLabel = this.add.text(20, 55, '💰 Gold:', {
            fontSize: '14px',
            fill: '#ffd700'
        });
        this.invGoldText = this.add.text(90, 55, '0', {
            fontSize: '14px',
            fill: '#ffffff'
        });
        this.inventoryPanel.add([goldLabel, this.invGoldText]);

        // Inventory grid
        this._createInventoryGrid(20, 90, panelWidth - 40);

        // Item info panel
        this._createItemInfoPanel(panelWidth);
    }

    /**
     * Create the inventory grid slots
     * @private
     */
    _createInventoryGrid(startX, startY, containerWidth) {
        const slotSize = 48;
        const spacing = 6;
        const cols = 6;
        const rows = 4;

        this.itemSlots = [];

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = startX + col * (slotSize + spacing);
                const y = startY + row * (slotSize + spacing);
                const index = row * cols + col;

                // Slot background
                const slotBg = this.add.rectangle(x, y, slotSize, slotSize, 0x333355, 0.8)
                    .setOrigin(0)
                    .setStrokeStyle(2, 0x555577)
                    .setInteractive({ useHandCursor: true })
                    .on('pointerover', () => this._onSlotHover(index))
                    .on('pointerout', () => this._onSlotOut(index))
                    .on('pointerdown', () => this._onSlotClick(index));

                // Item icon
                const itemIcon = this.add.sprite(x + slotSize / 2, y + slotSize / 2, 'items', 0)
                    .setVisible(false);

                // Quantity text
                const qtyText = this.add.text(x + slotSize - 4, y + slotSize - 4, '', {
                    fontSize: '11px',
                    fill: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 2
                }).setOrigin(1, 1);

                this.inventoryPanel.add([slotBg, itemIcon, qtyText]);
                this.itemSlots.push({
                    bg: slotBg,
                    icon: itemIcon,
                    qtyText: qtyText,
                    itemId: null,
                    quantity: 0
                });
            }
        }
    }

    /**
     * Create item info panel at bottom of inventory
     * @private
     */
    _createItemInfoPanel(panelWidth) {
        const infoY = 330;

        // Separator line
        const separator = this.add.rectangle(20, infoY, panelWidth - 40, 2, 0x4a4a6a)
            .setOrigin(0);
        this.inventoryPanel.add(separator);

        // Item name
        this.itemInfoName = this.add.text(20, infoY + 15, '', {
            fontSize: '16px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        this.inventoryPanel.add(this.itemInfoName);

        // Item type/rarity
        this.itemInfoType = this.add.text(20, infoY + 38, '', {
            fontSize: '12px',
            fill: '#aaaaaa'
        });
        this.inventoryPanel.add(this.itemInfoType);

        // Item description
        this.itemInfoDesc = this.add.text(20, infoY + 58, '', {
            fontSize: '12px',
            fill: '#cccccc',
            wordWrap: { width: panelWidth - 40 }
        });
        this.inventoryPanel.add(this.itemInfoDesc);

        // Action buttons
        this.useButton = this.add.text(panelWidth - 100, infoY + 15, '[USE]', {
            fontSize: '14px',
            fill: '#66ff66',
            backgroundColor: '#224422',
            padding: { x: 8, y: 4 }
        })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this._useSelectedItem())
            .setVisible(false);
        this.inventoryPanel.add(this.useButton);

        this.dropButton = this.add.text(panelWidth - 100, infoY + 45, '[DROP]', {
            fontSize: '14px',
            fill: '#ff6666',
            backgroundColor: '#442222',
            padding: { x: 8, y: 4 }
        })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this._dropSelectedItem())
            .setVisible(false);
        this.inventoryPanel.add(this.dropButton);
    }

    /**
     * Create tooltip element
     * @private
     */
    _createTooltip() {
        this.tooltip = this.add.container(0, 0);
        this.tooltip.setDepth(300);
        this.tooltip.setVisible(false);

        const bg = this.add.rectangle(0, 0, 150, 60, 0x000000, 0.9)
            .setOrigin(0)
            .setStrokeStyle(1, 0x666666);

        const text = this.add.text(8, 8, '', {
            fontSize: '11px',
            fill: '#ffffff',
            wordWrap: { width: 134 }
        });

        this.tooltip.add([bg, text]);
        this.tooltipBg = bg;
        this.tooltipText = text;
    }

    /**
     * Toggle inventory panel visibility
     */
    toggleInventory() {
        this.isInventoryOpen = !this.isInventoryOpen;
        this.inventoryPanel.setVisible(this.isInventoryOpen);

        if (this.isInventoryOpen) {
            this._updateInventoryDisplay();
            // Pause game scene (optional)
            // this.scene.get('GameScene').scene.pause();
        } else {
            this.selectedSlot = null;
            this._clearItemInfo();
            // Resume game scene
            // this.scene.get('GameScene').scene.resume();
        }
    }

    /**
     * Launch the pause menu
     */
    pauseGame() {
        // Only pause if not already paused/winning/losing
        const gameScene = this.scene.get('GameScene');
        if (gameScene && !gameScene.victoryTriggered && gameScene.scene.isActive()) {
            this.scene.pause('GameScene');
            this.scene.pause('UIScene');
            this.scene.launch('PauseScene');
        }
    }

    /**
     * Update HUD elements
     * @private
     */
    _updateHUD() {
        // Update gold
        this.goldText.setText(inventoryInstance.gold.toString());

        // Update quick slots with first 5 items
        const items = inventoryInstance.getItems();
        this.quickSlots.forEach((slot, index) => {
            if (items[index]) {
                const itemData = itemsData[items[index].id];
                if (itemData?.customTexture && itemData?.sprite) {
                    slot.itemIcon.setTexture(itemData.sprite);
                    slot.itemIcon.setDisplaySize(32, 32);
                } else {
                    slot.itemIcon.setTexture('items', itemData?.frame || 0);
                    slot.itemIcon.setDisplaySize(32, 32);
                }
                slot.itemIcon.setVisible(true);
                slot.qtyText.setText(items[index].quantity > 1 ? items[index].quantity : '');
                slot.itemId = items[index].id;
            } else {
                slot.itemIcon.setVisible(false);
                slot.qtyText.setText('');
                slot.itemId = null;
            }
        });
    }

    /**
     * Update health bar display
     * @private
     */
    _updateHealthBar(stats) {
        if (!stats) return;

        const hp = stats.hp || 0;
        const maxHp = stats.maxHp || 100;
        const mana = stats.mana || 0;
        const maxMana = stats.maxMana || 50;

        // Health bar
        const healthPercent = hp / maxHp;
        this.healthBarFill.setScale(healthPercent, 1);
        this.healthText.setText(`${Math.floor(hp)} / ${Math.floor(maxHp)}`);

        // Color based on health
        if (healthPercent > 0.6) {
            this.healthBarFill.setFillStyle(0x44cc44); // Green
        } else if (healthPercent > 0.3) {
            this.healthBarFill.setFillStyle(0xcccc44); // Yellow
        } else {
            this.healthBarFill.setFillStyle(0xcc4444); // Red
        }

        // Mana bar
        const manaPercent = mana / maxMana;
        this.manaBarFill.setScale(manaPercent, 1);
        this.manaText.setText(`${Math.floor(mana)} / ${Math.floor(maxMana)}`);
    }

    /**
     * Update inventory grid display
     * @private
     */
    _updateInventoryDisplay() {
        const items = inventoryInstance.getItems();
        this.invGoldText.setText(inventoryInstance.gold.toString());

        this.itemSlots.forEach((slot, index) => {
            if (items[index]) {
                const itemData = itemsData[items[index].id];
                if (itemData?.customTexture && itemData?.sprite) {
                    slot.icon.setTexture(itemData.sprite);
                    slot.icon.setDisplaySize(32, 32);
                } else {
                    slot.icon.setTexture('items', itemData?.frame || 0);
                    slot.icon.setDisplaySize(32, 32);
                }
                slot.icon.setVisible(true);
                slot.qtyText.setText(items[index].quantity > 1 ? items[index].quantity : '');
                slot.itemId = items[index].id;
                slot.quantity = items[index].quantity;

                // Apply rarity color to border
                const rarityColor = LootSystem.getRarityColor(itemData?.rarity || 'common');
                slot.bg.setStrokeStyle(2, rarityColor);
            } else {
                slot.icon.setVisible(false);
                slot.qtyText.setText('');
                slot.itemId = null;
                slot.quantity = 0;
                slot.bg.setStrokeStyle(2, 0x555577);
            }
        });
    }

    /**
     * Handle slot hover
     * @private
     */
    _onSlotHover(index) {
        const slot = this.itemSlots[index];
        if (!slot.itemId) return;

        slot.bg.setFillStyle(0x444466);

        // Show tooltip
        const itemData = itemsData[slot.itemId];
        if (itemData) {
            let tooltipText = `${itemData.name}`;
            if (slot.quantity > 1) tooltipText += ` (x${slot.quantity})`;
            this.tooltipText.setText(tooltipText);

            // Resize tooltip bg
            const bounds = this.tooltipText.getBounds();
            this.tooltipBg.setSize(bounds.width + 16, bounds.height + 16);
        }
    }

    /**
     * Handle slot hover out
     * @private
     */
    _onSlotOut(index) {
        const slot = this.itemSlots[index];
        slot.bg.setFillStyle(0x333355);
        this.tooltip.setVisible(false);
    }

    /**
     * Handle slot click
     * @private
     */
    _onSlotClick(index) {
        const slot = this.itemSlots[index];

        // Deselect previous
        if (this.selectedSlot !== null && this.itemSlots[this.selectedSlot]) {
            this.itemSlots[this.selectedSlot].bg.setStrokeStyle(2, 0x555577);
        }

        if (!slot.itemId) {
            this.selectedSlot = null;
            this._clearItemInfo();
            return;
        }

        // Select new slot
        this.selectedSlot = index;
        slot.bg.setStrokeStyle(3, 0xffff00);

        // Display item info
        this._displayItemInfo(slot.itemId, slot.quantity);
    }

    /**
     * Display item info in the info panel
     * @private
     */
    _displayItemInfo(itemId, quantity) {
        const itemData = itemsData[itemId];
        if (!itemData) return;

        const rarityColor = LootSystem.getRarityColor(itemData.rarity || 'common');

        this.itemInfoName.setText(itemData.name + (quantity > 1 ? ` (x${quantity})` : ''));
        this.itemInfoName.setColor('#' + rarityColor.toString(16).padStart(6, '0'));

        this.itemInfoType.setText(`${itemData.type} • ${(itemData.rarity || 'common').toUpperCase()}`);
        this.itemInfoDesc.setText(itemData.description || 'No description.');

        // Show appropriate buttons
        this.useButton.setVisible(itemData.type === 'CONSUMABLE');
        this.dropButton.setVisible(true);
    }

    /**
     * Clear item info panel
     * @private
     */
    _clearItemInfo() {
        this.itemInfoName.setText('');
        this.itemInfoType.setText('');
        this.itemInfoDesc.setText('Select an item to view details.');
        this.useButton.setVisible(false);
        this.dropButton.setVisible(false);
    }

    /**
     * Use the currently selected item
     * @private
     */
    _useSelectedItem() {
        if (this.selectedSlot === null) return;

        const slot = this.itemSlots[this.selectedSlot];
        if (!slot.itemId) return;

        const gameScene = this.scene.get('GameScene');
        if (gameScene && gameScene.player) {
            const success = inventoryInstance.useItem(slot.itemId, gameScene.player);
            if (success) {
                gameScene.events.emit('PLAYER_STATS_CHANGED', gameScene.player.stats);
            }
        }
    }

    /**
     * Drop the currently selected item
     * @private
     */
    _dropSelectedItem() {
        if (this.selectedSlot === null) return;

        const slot = this.itemSlots[this.selectedSlot];
        if (!slot.itemId) return;

        const gameScene = this.scene.get('GameScene');
        if (gameScene && gameScene.player) {
            const player = gameScene.player;

            // Create dropped item in game world
            const Item = gameScene.sys.cache.custom?.Item ||
                (async () => (await import('../entities/Item.js')).default)();

            // Emit event for GameScene to handle item spawning
            gameScene.events.emit('DROP_ITEM', {
                itemId: slot.itemId,
                quantity: 1,
                x: player.x,
                y: player.y + 30
            });

            // Remove from inventory
            inventoryInstance.removeItem(slot.itemId, 1);
        }

        // Clear selection if item depleted
        if (!inventoryInstance.hasItem(slot.itemId)) {
            this.selectedSlot = null;
            this._clearItemInfo();
        }
    }

    /**
     * Handle number key presses for quick use
     */
    update() {
        // Update tooltip position to follow mouse
        if (this.tooltip.visible) {
            const pointer = this.input.activePointer;
            this.tooltip.setPosition(pointer.x + 15, pointer.y + 15);
        }

        // Number keys for quick slots (1-5)
        for (let i = 1; i <= 5; i++) {
            if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(48 + i))) {
                const slot = this.quickSlots[i - 1];
                if (slot.itemId) {
                    const itemData = itemsData[slot.itemId];
                    if (itemData?.type === 'CONSUMABLE') {
                        const gameScene = this.scene.get('GameScene');
                        if (gameScene?.player) {
                            if (inventoryInstance.useItem(slot.itemId, gameScene.player)) {
                                gameScene.events.emit('PLAYER_STATS_CHANGED', gameScene.player.stats);
                            }
                        }
                    }
                }
            }
        }
    }

}
