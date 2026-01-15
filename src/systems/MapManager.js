export default class MapManager {
    constructor(scene) {
        this.scene = scene;
        this.map = null;
        this.layers = {};
    }

    init(levelID, levelConfig) {
        this.clear();

        // In a real scenario, we load the JSON key defined in levelConf
        // For this task, we'll assume the tilemap is already preloaded or we generate one

        if (levelConfig.isGenerate) {
            this.createGeneratedMap(levelConfig);
        } else {
            this.createTiledMap(levelConfig.mapAsset);
        }
    }

    createGeneratedMap(config) {
        // Create a 40x23 map (approx 1280x736) to fit the screen
        const width = 40;
        const height = 23;
        const map = this.scene.make.tilemap({ tileWidth: 32, tileHeight: 32, width: width, height: height });
        const tileset = map.addTilesetImage('tiles', null, 32, 32);

        // Fill with a visible tile for floor (Index 6 seems to be a reliable floor tile in drawtiles)
        const layer = map.createBlankLayer('World', tileset);
        // layer.fill(6); // REMOVED: Floor tiles obscure the background image. Rely on background image.

        // Add walls border
        layer.fill(1, 0, 0, width, 1); // Top
        layer.fill(1, 0, height - 1, width, 1); // Bottom
        layer.fill(1, 0, 0, 1, height); // Left
        layer.fill(1, width - 1, 0, 1, height); // Right

        // Setup Collision
        layer.setCollision(1);

        this.map = map;
        this.layers['World'] = layer;

        // Mock an Object Layer for testing 'SpawnPoint' logic and 'Portals'
        const isForest = this.scene.levelID === 'forest_level';
        const nextLevel = config.nextLevel;

        const objects = [
            { name: 'SpawnPoint', x: 200, y: 200 },
            {
                name: 'Elder',
                type: 'NPC',
                x: 300,
                y: 100,
                width: 32,
                height: 32,
                properties: [
                    { name: 'dialogueID', value: 'elder_start' }
                ]
            }
        ];

        // REMOVED: Portal option as requested.
        // if (nextLevel) { ... }

        // Add Enemies dynamically
        const enemyCount = config.enemyCount || 5;
        for (let i = 0; i < enemyCount; i++) {
            // Random position within sensible bounds (map is 40x23 tiles of 32px)
            // Range x: 100 -> 1180, y: 100 -> 636
            const ex = Phaser.Math.Between(100, 1180);
            const ey = Phaser.Math.Between(100, 636);

            objects.push({
                name: `Enemy_${i}`,
                type: 'Enemy',
                x: ex,
                y: ey,
                properties: [
                    { name: 'id', value: 'slime' } // Could vary enemy type by level later
                ]
            });
        }

        // Med Kit and Energy Kit are NOT spawned on map - they drop from enemies once per level

        this.map.objects = [
            {
                name: 'Objects',
                objects: objects
            }
        ];

        // Create Physics Group for Interactables
        this.interactables = this.scene.physics.add.group();

        // Parse the mock objects into sprites/zones
        this.map.objects[0].objects.forEach(obj => {
            if (obj.name === 'Portal') {
                const zone = this.scene.add.zone(obj.x, obj.y, obj.width, obj.height);
                this.scene.physics.add.existing(zone);
                zone.body.setAllowGravity(false);
                zone.body.setImmovable(true);
                zone.setName(obj.name);

                // Set Custom Properties
                if (obj.properties) {
                    obj.properties.forEach(prop => {
                        zone.setData(prop.name, prop.value);
                    });
                }

                this.interactables.add(zone);

                // Visual debug for portal
                const debugRect = this.scene.add.rectangle(obj.x, obj.y, obj.width, obj.height, 0x00ff00, 0.5);
                this.scene.add.text(obj.x - 20, obj.y - 40, "Portal", { fontSize: '12px' });
            }
        });

        // Debug Physics
        if (this.scene.physics.config.debug) {
            const debugGraphics = this.scene.add.graphics().setAlpha(0.75);
            layer.renderDebug(debugGraphics, {
                tileColor: null,
                collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255),
                faceColor: new Phaser.Display.Color(40, 39, 37, 255)
            });
        }
    }

    createTiledMap(key) {
        this.map = this.scene.make.tilemap({ key: key });
        // Assuming the Tiled map has a tileset name that matches the loaded image key
        // You might need to adjust 'tiles' to match your actual Tiled tileset name
        const tileset = this.map.addTilesetImage('tileset', 'tiles');

        // Create the 'World' layer - assumes this layer name exists in Tiled
        const worldLayer = this.map.createLayer('World', tileset, 0, 0);

        if (worldLayer) {
            worldLayer.setCollisionByProperty({ collides: true });
            // Or simpler for prototype: worldLayer.setCollision([1]); depending heavily on Tiled setup
            this.layers['World'] = worldLayer;
        }
    }

    getSpawnPoint() {
        // If Tiled Map, check Object Layer
        if (this.map && this.map.objects) {
            // Depending on how Tiled is structured, objects might be in a layer named 'Objects'
            const objectLayer = this.map.getObjectLayer('Objects');
            if (objectLayer) {
                const spawn = objectLayer.objects.find(obj => obj.name === 'SpawnPoint');
                if (spawn) return { x: spawn.x, y: spawn.y };
            }
        }

        // Default for generated maps
        return { x: 10 * 32, y: 10 * 32 };
    }

    getEnemies() {
        if (!this.map || !this.map.objects) return [];

        const objectLayer = this.map.objects.find(l => l.name === 'Objects');
        if (!objectLayer) return [];

        return objectLayer.objects.filter(obj => obj.type === 'Enemy');
    }

    clear() {
        if (this.map) {
            this.map.destroy();
            this.map = null;
        }
        this.layers = {};
    }
}
