import Entity from './Entity.js';

export default class Player extends Entity {
    constructor(scene, x, y) {
        super(scene, x, y, 'player'); // Assuming 'player' texture is loaded

        // Player Stats for combat and consumables
        this.stats = {
            hp: 100,
            maxHp: 100,
            mana: 50,
            maxMana: 50,
            attack: 10,
            defense: 5,
            speed: 150,
            level: 1,
            xp: 0,
            xpToNextLevel: 100
        };

        // Movement speed (uses stats.speed)
        this.speed = this.stats.speed;

        // Input Keys
        this.cursors = this.scene.input.keyboard.createCursorKeys();
        this.keys = this.scene.input.keyboard.addKeys({
            W: Phaser.Input.Keyboard.KeyCodes.W,
            A: Phaser.Input.Keyboard.KeyCodes.A,
            S: Phaser.Input.Keyboard.KeyCodes.S,
            D: Phaser.Input.Keyboard.KeyCodes.D
        });

        // Create Animations if they don't exist globally
        if (!this.scene.anims.exists('left')) {
            this.scene.anims.create({
                key: 'left',
                frames: this.scene.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
                frameRate: 10,
                repeat: -1
            });
            this.scene.anims.create({
                key: 'turn',
                frames: [{ key: 'player', frame: 4 }],
                frameRate: 20
            });
            this.scene.anims.create({
                key: 'right',
                frames: this.scene.anims.generateFrameNumbers('player', { start: 5, end: 8 }),
                frameRate: 10,
                repeat: -1
            });
        }

        // State Machine
        this.state = 'IDLE'; // IDLE, WALK, ATTACK, HIT
        this.lastFacing = 'right';

        // Set initial face
        this.anims.play('turn');

        // Fix hitbox (top-down style: smaller circle at feet)
        this.body.setCircle(12, 4, 24);

        // Mana Regeneration: 1% every 1 second
        this.scene.time.addEvent({
            delay: 1000,
            callback: this.regenerateMana,
            callbackScope: this,
            loop: true
        });
    }

    regenerateMana() {
        if (!this.active || !this.stats || this.stats.hp <= 0) return;

        if (this.stats.mana < this.stats.maxMana) {
            const regenAmount = Math.max(0.1, this.stats.maxMana * 0.01);
            this.stats.mana = Math.min(this.stats.maxMana, this.stats.mana + regenAmount);
            this.scene.events.emit('PLAYER_STATS_CHANGED', this.stats);
        }
    }

    update(time, delta) {
        if (!this.body || this.state === 'ATTACK') return;

        this.body.setVelocity(0);

        let velocityX = 0;
        let velocityY = 0;

        // Horizontal Movement
        if (this.cursors.left.isDown || this.keys.A.isDown) {
            velocityX = -1;
            this.lastFacing = 'left';
        } else if (this.cursors.right.isDown || this.keys.D.isDown) {
            velocityX = 1;
            this.lastFacing = 'right';
        }

        // Vertical Movement
        if (this.cursors.up.isDown || this.keys.W.isDown) {
            velocityY = -1;
        } else if (this.cursors.down.isDown || this.keys.S.isDown) {
            velocityY = 1;
        }

        // Normalize vector
        if (velocityX !== 0 || velocityY !== 0) {
            const vector = new Phaser.Math.Vector2(velocityX, velocityY).normalize();
            this.body.setVelocity(vector.x * this.speed, vector.y * this.speed);

            if (velocityX < 0) this.anims.play('left', true);
            else if (velocityX > 0) this.anims.play('right', true);
            else this.anims.play(this.lastFacing === 'left' ? 'left' : 'right', true);

            this.setState('WALK');
        } else {
            this.anims.play('turn');
            this.setState('IDLE');
        }
    }

    setState(newState) {
        if (this.state === newState) return;
        this.state = newState;
        // console.log("Player State:", this.state); // Debug

        // Example Animation Trigger
        // if (newState === 'WALK') this.play('walk');
        // if (newState === 'IDLE') this.play('idle');
    }

    playAttackAnimation() {
        if (this.state === 'ATTACK') return;

        const originalState = this.state;
        this.setState('ATTACK');

        // Sword Swing Visual
        const isLeft = this.lastFacing === 'left';
        const offsetX = isLeft ? -10 : 10;

        // Create a simple "sword" using a graphics object or rectangle
        // Pivot is automatically center for rectangle, so we might need a container or just adjust position logic
        // Easier: Use a sprite if available, or just a thin rectangle
        const sword = this.scene.add.rectangle(this.x + offsetX, this.y, 40, 4, 0xffffff);
        sword.setOrigin(isLeft ? 1 : 0, 0.5); // Pivot at the "handle" (closest to player)

        // Start angle: Pointing slightly up/back
        const startAngle = isLeft ? -45 : -135;
        const endAngle = isLeft ? -135 : -45; // This seems inverted for "swinging down" visually in Phaser?
        // Let's try simple rotation:
        // Right: Starts at -45 (up-right), swings to 45 (down-right)
        // Left: Starts at -135 (up-left), swings to 135 (down-left)

        const startRot = isLeft ? Phaser.Math.DegToRad(225) : Phaser.Math.DegToRad(-45);
        const endRot = isLeft ? Phaser.Math.DegToRad(135) : Phaser.Math.DegToRad(45);

        sword.rotation = startRot;

        this.scene.tweens.add({
            targets: sword,
            rotation: endRot,
            duration: 150,
            ease: 'Linear',
            onComplete: () => {
                sword.destroy();
                this.setState(originalState);
            }
        });

        // Slight "step" forward without sliding entire distance? No, user requested "not sliding".
        // So we keep velocity 0 or whatever it was (update loop sets it to 0 if ATTACK state).
    }

    useMana(amount) {
        if (this.stats.mana >= amount) {
            this.stats.mana -= amount;
            this.scene.events.emit('PLAYER_STATS_CHANGED', this.stats);
            return true;
        }
        return false;
    }

    takeDamage(amount) {
        if (this.stats.hp <= 0 || this.isInvulnerable) return;

        const damage = Math.max(1, amount - (this.stats.defense || 0));
        this.stats.hp -= damage;
        if (this.stats.hp < 0) this.stats.hp = 0;

        this.scene.events.emit('PLAYER_STATS_CHANGED', this.stats);

        // HIT STUN / ANIMATION
        this.setState('HIT_STUN');
        this.setTint(0xffaaaa); // Slight Red

        // Short stun
        this.scene.time.delayedCall(300, () => {
            if (this.active && this.state === 'HIT_STUN') {
                this.setState('IDLE');
            }
        });

        // Long visual feedback (Red Tint)
        this.scene.time.delayedCall(1500, () => {
            if (this.active) {
                this.clearTint();
            }
        });

        if (this.stats.hp <= 0) {
            this.die();
        }
    }

    die() {
        console.log("Player Died!");
        this.setTint(0x555555);
        this.body.setVelocity(0);
        this.scene.events.emit('PLAYER_DEATH');
        // Disable input
        if (this.scene.input && this.scene.input.keyboard) {
            this.scene.input.keyboard.enabled = false;
        }
    }
}
