import Phaser from 'phaser';

export default class CombatSystem {
    constructor(scene) {
        this.scene = scene;
        this.hitboxes = this.scene.physics.add.group();
        this.projectiles = this.scene.physics.add.group();

        // Input
        this.attackKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.rangedKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    }

    setup(player, enemiesGroup, walls) {
        this.player = player;
        this.enemies = enemiesGroup;

        // Collision: Hitbox vs Enemy
        this.scene.physics.add.overlap(this.hitboxes, this.enemies, this.onHit, null, this);

        // Projectiles
        this.scene.physics.add.overlap(this.projectiles, this.enemies, this.onProjectileHit, null, this);
        if (walls) {
            this.scene.physics.add.collider(this.projectiles, walls, this.onProjectileHitWall, null, this);
        }

        // Collision: Enemy vs Player (Contact Damage)
        this.scene.physics.add.overlap(this.player, this.enemies, this.onPlayerHit, null, this);

        // Solid collision so they don't walk over each other
        this.scene.physics.add.collider(this.player, this.enemies);
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
            this.performAttack();
        }
        if (Phaser.Input.Keyboard.JustDown(this.rangedKey)) {
            this.performRangedAttack();
        }
    }

    performAttack() {
        console.log("Player Attacking!");
        this.player.playAttackAnimation();

        // Determine offset based on player facing direction
        // Use lastFacing to ensure we hit where the player is looking, even if standing still
        let offsetX = 30; // Increased offset for larger hitbox

        if (this.player.lastFacing === 'left') {
            offsetX = -30;
        }

        // Increase damage area (hitbox size)
        const hitbox = this.scene.add.rectangle(this.player.x + offsetX, this.player.y, 48, 48, 0xffffff, 0);
        this.scene.physics.add.existing(hitbox);
        this.hitboxes.add(hitbox);

        // Remove hitbox after short duration (melee swing)
        this.scene.time.delayedCall(100, () => {
            hitbox.destroy();
        });
    }

    onHit(hitbox, enemy) {
        if (enemy.isHit) return; // Simple invulnerability frame

        console.log(`Hit enemy ${enemy.enemyID}!`);

        // Calculate damage (mock player stats)
        const playerDamage = this.player.stats ? this.player.stats.attack : 10;
        enemy.takeDamage(playerDamage);

        // Play hit sound
        // Play hit sound
        const isSfxMuted = this.scene.registry.get('sfxMuted');
        const vol = isSfxMuted ? 0 : 0.6;
        this.scene.sound.play('sword_hit', { volume: vol });

        // Freeze logic (1s duration)
        if (enemy.freeze) {
            enemy.freeze(1000);
        }

        hitbox.destroy();
    }

    onPlayerHit(player, enemy) {
        if (!player.body || !enemy.body) return;
        if (player.isInvulnerable) return;
        if (player.stats.hp <= 0) return;

        // Get damage from enemy stats
        const damage = enemy.stats ? (enemy.stats.damage || 10) : 10;

        console.log(`Player hit by ${enemy.enemyID} for ${damage} damage!`);
        player.takeDamage(damage);

        // Knockback player
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
        const knockbackForce = 300;
        player.body.setVelocity(
            Math.cos(angle) * knockbackForce,
            Math.sin(angle) * knockbackForce
        );

        // Invulnerability
        player.isInvulnerable = true;
        // player.alpha = 0.5; // Visual feedback removed

        this.scene.time.delayedCall(1000, () => {
            if (player.active) {
                player.isInvulnerable = false;
                // player.alpha = 1;
            }
        });
    }

    performRangedAttack() {
        const manaCost = 10;
        if (!this.player.useMana(manaCost)) {
            return;
        }

        let velocityX = 0;
        let velocityY = 0;
        const speed = 400;

        // Determine direction
        // Prioritize movement (velocity), fallback to lastFacing
        if (this.player.body.velocity.y < -10) { velocityX = 0; velocityY = -speed; }
        else if (this.player.body.velocity.y > 10) { velocityX = 0; velocityY = speed; }
        else if (this.player.body.velocity.x < -10) { velocityX = -speed; velocityY = 0; }
        else if (this.player.body.velocity.x > 10) { velocityX = speed; velocityY = 0; }
        else {
            // Idle, verify lastFacing
            if (this.player.lastFacing === 'left') {
                velocityX = -speed;
            } else {
                velocityX = speed;
            }
        }

        // Increased radius from 6 to 16 for a larger damage area
        const projectile = this.scene.add.circle(this.player.x, this.player.y, 16, 0x00ffff);
        this.scene.physics.add.existing(projectile);
        // Ensure the physics body matches the larger visual size
        projectile.body.setCircle(16);
        this.projectiles.add(projectile);
        projectile.body.setVelocity(velocityX, velocityY);
        console.log(`Ranged Attack: VelX=${velocityX}, VelY=${velocityY}, LastFacing=${this.player.lastFacing}`);
        this.scene.time.delayedCall(1500, () => {
            if (projectile.active) projectile.destroy();
        });
    }

    onProjectileHit(projectile, enemy) {
        projectile.destroy();
        // One hit kill as requested
        const damage = enemy.stats ? enemy.stats.hp : 9999;
        enemy.takeDamage(damage);

        // Play hit sound
        // Play hit sound
        const isSfxMuted = this.scene.registry.get('sfxMuted');
        const vol = isSfxMuted ? 0 : 0.6;
        this.scene.sound.play('sword_hit', { volume: vol });

        // Freeze logic (1s duration)
        if (enemy.freeze) {
            enemy.freeze(1000);
        }
    }

    onProjectileHitWall(projectile, wall) {
        projectile.destroy();
    }
}
