import Entity from './Entity.js';
import enemiesConfig from '../data/enemies.json';
import LootSystem from '../systems/LootSystem.js';

export default class Enemy extends Entity {
    constructor(scene, x, y, enemyID) {
        const config = enemiesConfig[enemyID];
        if (!config) {
            console.error(`Enemy config for ${enemyID} not found!`);
            super(scene, x, y, 'player'); // Fallback sprite
            return;
        }

        super(scene, x, y, config.sprite);

        this.enemyID = enemyID;
        this.stats = { ...config }; // Copy stats
        this.initialPos = { x, y };
        this.isDead = false;

        // AI State
        this.state = 'PATROL'; // PATROL, CHASE, ATTACK
        this.target = null; // Reference to player

        // Initial Appearance
        this.setTexture('enemy_normal');
        this.setDisplaySize(24, 24);

        // Physics tweaks
        this.body.setSize(24, 24);

        this.attackCooldown = 0;

        // Debug
        // this.scene.add.text(x, y - 20, config.name, { fontSize: '10px' });
    }

    setTarget(player) {
        this.target = player;
    }

    update(time, delta) {
        if (!this.active || !this.body) return;

        if (this.attackCooldown > 0) {
            this.attackCooldown -= delta;
        }

        switch (this.state) {
            case 'PATROL':
                this.updatePatrol();
                break;
            case 'CHASE':
                this.updateChase();
                break;
        }
    }

    updatePatrol() {
        // Simple Patrol: Idle or Random wander could go here. 
        // For now, let's just check for player
        this.body.setVelocity(0);

        if (this.canSeePlayer()) {
            this.setState('CHASE');
        }
    }

    updateChase() {
        if (!this.target) return;

        const dist = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);

        if (dist > this.stats.chaseDistance * 1.5) {
            // Lost player
            this.setState('PATROL');
            this.body.setVelocity(0);
            return;
        }

        // Stop if too close to avoid overlapping perfectly
        if (dist < 30) {
            this.body.setVelocity(0);
            if (this.attackCooldown <= 0) {
                this.attackPlayer();
            }
            return;
        }

        // Move towards player
        this.scene.physics.moveToObject(this, this.target, this.stats.speed);

        // Simple sprite flipping
        if (this.body.velocity.x > 0) this.setFlipX(true);
        else this.setFlipX(false);
    }

    attackPlayer() {
        if (this.target && this.target.active) {
            const damage = this.stats.damage || 10;
            // Let combat system handle hit logic? Or direct?
            // Direct call to ensure damage even if not overlapping
            this.target.takeDamage(damage);
            this.attackCooldown = 1000; // 1 second cooldown

            // Optional: Small lunge or visual cue?
            // For now just damage
        }
    }

    canSeePlayer() {
        if (!this.target) return false;
        const dist = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);
        return dist < this.stats.chaseDistance;
    }

    setState(newState) {
        if (this.state === newState) return;
        this.state = newState;

        // Texture Swap
        if (this.state === 'CHASE') {
            this.setTexture('enemy_chase');
            this.setDisplaySize(24, 24);
            // this.setTint(0xff0000); // Red tinted removed
        } else {
            this.setTexture('enemy_normal');
            this.setDisplaySize(24, 24);
            this.clearTint();
        }
    }

    takeDamage(amount) {
        this.stats.hp -= amount;

        // Feedback
        this.setTint(0xffffff); // Flash white
        this.scene.time.delayedCall(100, () => {
            this.clearTint(); // or restore state tint
            // if (this.state === 'CHASE') this.setTint(0xff0000);
        });

        // Pushback / Knockback
        if (this.target) {
            const angle = Phaser.Math.Angle.Between(this.target.x, this.target.y, this.x, this.y);
            const vec = this.scene.physics.velocityFromRotation(angle, 200);
            this.body.setVelocity(vec.x, vec.y);
            this.isHit = true;
            this.scene.time.delayedCall(200, () => { this.isHit = false; });
        }

        if (this.stats.hp <= 0 && !this.isDead) {
            this.die();
        }
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;
        console.log(`${this.stats.name || 'Enemy'} Died!`);

        // Roll loot from loot table
        const lootTableId = this.stats.lootTable || 'common_enemy';
        const droppedItems = LootSystem.rollLoot(lootTableId);

        // Emit death event with loot data
        this.scene.events.emit('ENEMY_DEATH', {
            enemy: this,
            enemyID: this.enemyID,
            position: { x: this.x, y: this.y },
            xpReward: this.stats.xpReward || 10,
            loot: droppedItems
        });

        this.destroy(); // Remove sprite
    }
}
