import Phaser from 'phaser';
import MapManager from '../systems/MapManager.js';
import InteractionSystem from '../systems/InteractionSystem.js';
import CombatSystem from '../systems/CombatSystem.js';
import DialogueManager from '../systems/DialogueManager.js';
import QuestManager from '../systems/QuestManager.js';
import levels from '../data/levels.json';
import Player from '../entities/Player.js';
import Enemy from '../entities/Enemy.js';
import Item from '../entities/Item.js';
import { inventoryInstance } from '../systems/InventoryManager.js';
import PersistenceManager from '../systems/PersistenceManager.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.mapManager = null;
    }

    init(data) {
        this.levelID = data.levelID || 'test_level';
        console.log("Initializing Level:", this.levelID);
    }

    preload() {
        // While we generate the map data in code, we still need a tileset image
        // Loading a simple 32x32 placeholder grid
        this.load.image('tiles', 'https://labs.phaser.io/assets/tilemaps/tiles/drawtiles-spaced.png');
        // REMOVED: this.load.image('player', ...); // Now in BootScene as spritesheet
        this.load.image('slime', 'https://labs.phaser.io/assets/sprites/green_ball.png');
        this.load.spritesheet('items', 'https://labs.phaser.io/assets/sprites/items.png', { frameWidth: 32, frameHeight: 32 });
    }

    create() {
        this.mapManager = new MapManager(this);

        const levelConfig = levels[this.levelID];
        if (!levelConfig) {
            console.error("Level Config not found for:", this.levelID);
            return;
        }

        // Add Background
        // Add Background
        if (levelConfig.mapAsset) {
            // center the background on the camera view
            const bg = this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, levelConfig.mapAsset);

            // Scale to fit/cover
            const scaleX = this.cameras.main.width / bg.width;
            const scaleY = this.cameras.main.height / bg.height;
            const scale = Math.max(scaleX, scaleY);
            bg.setScale(scale).setScrollFactor(0).setDepth(-100);
        }

        this.mapManager.init(this.levelID, levelConfig);

        // Player Setup
        const spawnPoint = this.mapManager.getSpawnPoint();
        this.player = new Player(this, spawnPoint.x, spawnPoint.y);

        // Collision with walls
        if (this.mapManager.layers['World']) {
            this.physics.add.collider(this.player, this.mapManager.layers['World']);
        }

        // Interaction Setup
        this.interactionSystem = new InteractionSystem(this);
        if (this.mapManager.interactables) {
            this.interactionSystem.setup(this.player, this.mapManager.interactables);
        }

        this.npcs = this.physics.add.group();

        // Dialogue System
        this.dialogueManager = new DialogueManager(this);

        // Setup NPCs (Visuals only for now, interaction handled via InteractionSystem or Overlap)
        // Let's assume MapManager creates Zones for Interactables, include NPCs as 'Interactable' zones
        // We need to specifically look for 'NPC' type objects and add them as interactables

        // Item Group - initialize before parsing objects
        this.items = this.physics.add.group();

        if (this.mapManager.map && this.mapManager.map.objects) {
            const objectLayer = this.mapManager.map.objects.find(l => l.name === 'Objects');
            if (objectLayer) {
                objectLayer.objects.forEach(obj => {
                    if (obj.type === 'NPC') {
                        const npc = this.add.rectangle(obj.x, obj.y, 32, 32, 0x0000ff); // Blue NPC
                        this.physics.add.existing(npc);
                        npc.body.setImmovable(true);
                        npc.dialogueID = obj.properties ? obj.properties.find(p => p.name === 'dialogueID')?.value : 'elder_start';
                        npc.isInteracting = false;
                        this.npcs.add(npc);

                        // Add exclamation mark if quest available (Mock check)
                        if (QuestManager.getQuestStatus('tutorial_quest') === 'INACTIVE') {
                            npc.exclamation = this.add.text(obj.x - 5, obj.y - 20, '!', { fontSize: '24px', fill: '#ffff00' });
                        }

                        this.physics.add.overlap(this.player, npc, () => {
                            // Automatic Trigger on overlap
                            if (!this.dialogueManager.active && !npc.isInteracting) {
                                npc.isInteracting = true;
                                this.dialogueManager.startDialogue(npc.dialogueID, (action, data) => {
                                    if (action === 'START_QUEST') {
                                        QuestManager.startQuest(data);
                                        if (npc.exclamation) npc.exclamation.destroy();
                                    }
                                });
                            }
                        });
                    } else if (obj.type === 'Item') {
                        // Spawn items from map (med_kit, energy_kit, etc.)
                        const itemId = obj.properties ? obj.properties.find(p => p.name === 'itemId')?.value : 'gold_coin';
                        const item = new Item(this, obj.x, obj.y, itemId, 1);
                        this.items.add(item);
                    }
                });
            }
        }

        // Track whether med_kit and energy_kit have been dropped this level (once each)
        this.medKitDropped = false;
        this.energyKitDropped = false;
        this.coinsDropped = false;
        this.enemiesKilledCount = 0;

        // Randomly determine which enemy kill number will drop med_kit, energy_kit, and coins
        // Get total enemy count from level config
        const totalEnemies = levelConfig?.enemyCount || 5;

        // Pick 3 different random enemy numbers for drops
        const usedNumbers = new Set();

        this.medKitDropOnKill = Phaser.Math.Between(1, totalEnemies);
        usedNumbers.add(this.medKitDropOnKill);

        do {
            this.energyKitDropOnKill = Phaser.Math.Between(1, totalEnemies);
        } while (usedNumbers.has(this.energyKitDropOnKill) && usedNumbers.size < totalEnemies);
        usedNumbers.add(this.energyKitDropOnKill);

        do {
            this.coinsDropOnKill = Phaser.Math.Between(1, totalEnemies);
        } while (usedNumbers.has(this.coinsDropOnKill) && usedNumbers.size < totalEnemies);

        console.log(`Med Kit will drop on enemy kill #${this.medKitDropOnKill}`);
        console.log(`Energy Kit will drop on enemy kill #${this.energyKitDropOnKill}`);
        console.log(`Coins will drop on enemy kill #${this.coinsDropOnKill}`);

        // Enemy Death Handler - Spawn loot items
        this.events.on('ENEMY_DEATH', (data) => {
            // Notify quest system
            QuestManager.onEnemyKilled(data.enemyID);

            // Award XP (TODO: integrate with player leveling system)
            console.log(`Gained ${data.xpReward} XP!`);

            this.enemiesKilledCount++;

            // Drop coins from only ONE specific random enemy (once per level)
            if (!this.coinsDropped && this.enemiesKilledCount === this.coinsDropOnKill) {
                if (data.loot && data.loot.length > 0) {
                    data.loot.forEach((drop) => {
                        const item = new Item(
                            this,
                            data.position.x,
                            data.position.y,
                            drop.itemId,
                            drop.quantity
                        );
                        this.items.add(item);
                    });
                }
                this.coinsDropped = true;
                console.log('Coins dropped!');
            }

            // Drop med_kit from a random enemy (once per level, exactly 1x)
            if (!this.medKitDropped && this.enemiesKilledCount === this.medKitDropOnKill) {
                const medKit = new Item(this, data.position.x + 20, data.position.y, 'med_kit', 1);
                this.items.add(medKit);
                this.medKitDropped = true;
                console.log('Med Kit dropped (1x)!');
            }

            // Drop energy_kit from a random enemy (once per level, exactly 1x)
            if (!this.energyKitDropped && this.enemiesKilledCount === this.energyKitDropOnKill) {
                const energyKit = new Item(this, data.position.x + 20, data.position.y, 'energy_kit', 1);
                this.items.add(energyKit);
                this.energyKitDropped = true;
                console.log('Energy Kit dropped (1x)!');
            }

            // Check if all enemies are defeated
            this.time.delayedCall(100, () => {
                if (this.enemies.getLength() === 0 && !this.victoryTriggered) {
                    console.log("All enemies defeated!");
                    this.triggerVictory();
                }
            });
        });

        // Handle item drops from inventory (from UIScene)
        this.events.on('DROP_ITEM', (data) => {
            const item = new Item(this, data.x, data.y, data.itemId, data.quantity);
            this.items.add(item);
        });

        // Item Pickup - Using enhanced Item.pickup() method
        this.physics.add.overlap(this.player, this.items, (player, item) => {
            if (!item.canPickup) return;

            const pickupData = item.pickup();
            if (pickupData) {
                const success = inventoryInstance.addItem(pickupData.itemId, pickupData.quantity);
                if (success) {
                    this.events.emit('INVENTORY_UPDATED');

                    // Pickup feedback text
                    const itemData = item.itemData;
                    const feedbackText = this.add.text(item.x, item.y - 20,
                        `+${pickupData.quantity} ${itemData?.name || 'Item'}`, {
                        fontSize: '12px',
                        fill: '#00ff00',
                        stroke: '#000000',
                        strokeThickness: 2
                    }).setOrigin(0.5);

                    // Float up and fade
                    this.tweens.add({
                        targets: feedbackText,
                        y: feedbackText.y - 30,
                        alpha: 0,
                        duration: 1000,
                        onComplete: () => feedbackText.destroy()
                    });
                }
            }
        });

        this.enemies = this.physics.add.group({ runChildUpdate: true });
        const enemySpawns = this.mapManager.getEnemies();

        enemySpawns.forEach(spawn => {
            // Check for 'id' property in Tiled properties 
            // (Note: In real Tiled JSON, properties is an array, in our mock it is too)
            const idProp = spawn.properties ? spawn.properties.find(p => p.name === 'id') : null;
            const enemyID = idProp ? idProp.value : 'slime'; // Default

            const enemy = new Enemy(this, spawn.x, spawn.y, enemyID);
            enemy.setTarget(this.player);
            this.enemies.add(enemy);
        });

        this.physics.add.collider(this.enemies, this.mapManager.layers['World']);
        this.physics.add.collider(this.player, this.enemies); // Push each other

        // Combat System
        this.combatSystem = new CombatSystem(this);
        this.combatSystem.setup(this.player, this.enemies, this.mapManager.layers['World']);

        // UI Scene
        this.scene.launch('UIScene');

        // Camera Setup
        if (this.mapManager.map) {
            this.cameras.main.setBounds(0, 0, this.mapManager.map.widthInPixels, this.mapManager.map.heightInPixels);
        } else {
            this.cameras.main.setBounds(0, 0, 1280, 720);
        }
        this.cameras.main.setBackgroundColor('#2d2d2d');
        // REMOVED: this.cameras.main.startFollow(this.player, true, 0.1, 0.1); 
        // We want the view to be fixed.

        // Prevent browser window from scrolling with arrow keys
        if (this.input && this.input.keyboard) {
            this.input.keyboard.addCapture([
                Phaser.Input.Keyboard.KeyCodes.UP,
                Phaser.Input.Keyboard.KeyCodes.DOWN,
                Phaser.Input.Keyboard.KeyCodes.LEFT,
                Phaser.Input.Keyboard.KeyCodes.RIGHT,
                Phaser.Input.Keyboard.KeyCodes.SPACE
            ]);
        }

        // Player Death Handler
        this.events.on('PLAYER_DEATH', () => {
            console.log("Game Over Sequence Initiated");
            this.cameras.main.fade(1000, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('GameOverScene', { levelID: this.levelID });
                this.scene.stop('UIScene');
            });
        });

        // Hide existing label to cleaner UI
        // this.add.text...
        // Monitor Quest Completion for Victory
        this.victoryTriggered = false;
        QuestManager.subscribe((quests) => {
            if (!this.scene.isActive()) return; // Prevent zombie callbacks

            // Check specific quest completion (e.g., 'tutorial_quest' for now, or make dynamic)
            const quest = quests['tutorial_quest'];
            if (quest && quest.status === 'COMPLETED' && !this.victoryTriggered) {
                this.triggerVictory();
            }
        });
    }

    triggerVictory() {
        if (this.victoryTriggered) return;
        this.victoryTriggered = true;
        console.log("Victory Triggered!");

        // Unlock next level
        const currentLevelConfig = levels[this.levelID];
        if (currentLevelConfig && currentLevelConfig.nextLevel) {
            PersistenceManager.unlockLevel(currentLevelConfig.nextLevel);
        }

        // Small delay before transition
        this.time.delayedCall(1500, () => {
            this.cameras.main.fade(1000, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('WinningScene', { levelID: this.levelID });
                this.scene.stop('UIScene');
            });
        });
    }

    update(time, delta) {
        if (this.player) {
            this.player.update(time, delta);
        }
        if (this.combatSystem) {
            this.combatSystem.update();
        }

        // Reset NPC interaction flag when moving away
        if (this.npcs) {
            this.npcs.getChildren().forEach(npc => {
                if (npc.active && npc.isInteracting) {
                    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y);
                    if (dist > 50) { // NPC size is 32, so 50 is a safe "exited" distance
                        npc.isInteracting = false;
                    }
                }
            });
        }
    }
}
