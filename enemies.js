// Enhanced Enemies - More Aggressive and Varied
const Enemies = {
    enemies: [],
    spawnRate: 0.35,

    init() {
        this.enemies = [];
        this.spawnRate = 0.35;
    },

    spawn(x, y, type = 'crawler') {
        const enemy = {
            x: x,
            y: y,
            width: type === 'jumper' ? 20 : 24,
            height: type === 'jumper' ? 28 : 24,
            vx: 0,
            vy: 0,
            type: type,
            state: 'idle',
            facing: -1,
            animFrame: 0,
            animTimer: 0,
            patrolStart: x - 120,
            patrolEnd: x + 120,
            health: 1,
            dead: false,
            deathTimer: 0,
            jumpTimer: 0,
            chargeTimer: 0,
            isCharging: false
        };

        if (type === 'flyer') {
            enemy.height = 20;
            enemy.baseY = y;
            enemy.flyPhase = Math.random() * Math.PI * 2;
            enemy.speed = 1.5 + Math.random() * 0.5;
        } else if (type === 'charger') {
            enemy.width = 32;
            enemy.height = 28;
            enemy.speed = 0;
        } else if (type === 'jumper') {
            enemy.jumpTimer = Math.random() * 60;
        }

        this.enemies.push(enemy);
    },

    update(cameraX, canvasWidth, player) {
        // Increase spawn rate over time
        // In hardcore, spawn rate is higher
        const maxSpawnRate = Game.mode === 'hardcore' ? 0.8 : 0.5;
        this.spawnRate = Math.min(maxSpawnRate, this.spawnRate + 0.0001);

        this.enemies.forEach(enemy => {
            if (enemy.dead) {
                enemy.deathTimer++;
                enemy.vy += 0.5;
                enemy.y += enemy.vy;
                return;
            }

            // Animation
            enemy.animTimer++;
            if (enemy.animTimer >= 8) {
                enemy.animTimer = 0;
                enemy.animFrame = (enemy.animFrame + 1) % 4;
            }

            const distToPlayer = Math.abs(player.x - enemy.x);

            // Hardcore aggression multiplier
            const aggression = Game.mode === 'hardcore' ? 1.5 : 1.0;

            if (enemy.type === 'crawler') {
                // Faster when player is close
                const speed = distToPlayer < 150 ? 2.5 * aggression : 1.8 * aggression;
                enemy.vx = enemy.facing * speed;
                enemy.x += enemy.vx;

                if (enemy.x <= enemy.patrolStart) enemy.facing = 1;
                else if (enemy.x >= enemy.patrolEnd) enemy.facing = -1;

                enemy.vy += 0.6;
                enemy.y += enemy.vy;

                const platform = Platforms.checkCollision(enemy);
                if (platform) {
                    enemy.y = platform.y - enemy.height;
                    enemy.vy = 0;
                }

            } else if (enemy.type === 'flyer') {
                enemy.flyPhase += 0.06 * aggression;
                enemy.y = enemy.baseY + Math.sin(enemy.flyPhase) * 25;

                // Aggressive chase
                const dx = player.x - enemy.x;
                const dy = player.y - enemy.y;
                if (distToPlayer < 300 * aggression) {
                    enemy.x += Math.sign(dx) * enemy.speed * aggression;
                    enemy.baseY += Math.sign(dy) * 0.3 * aggression;
                    enemy.facing = Math.sign(dx) || 1;
                }
                enemy.x += enemy.facing * 0.5 * aggression;

            } else if (enemy.type === 'charger') {
                if (distToPlayer < 200 * aggression && !enemy.isCharging && enemy.chargeTimer <= 0) {
                    enemy.isCharging = true;
                    enemy.chargeTimer = 30 / aggression;
                    enemy.facing = player.x > enemy.x ? 1 : -1;
                }

                if (enemy.chargeTimer > 0) {
                    enemy.chargeTimer--;
                }

                if (enemy.isCharging && enemy.chargeTimer <= 0) {
                    enemy.x += enemy.facing * 8;
                    enemy.speed = 8;

                    if (enemy.x < enemy.patrolStart - 100 || enemy.x > enemy.patrolEnd + 100) {
                        enemy.isCharging = false;
                        enemy.chargeTimer = 90;
                        enemy.speed = 0;
                    }
                }

                enemy.vy += 0.6;
                enemy.y += enemy.vy;
                const platform = Platforms.checkCollision(enemy);
                if (platform) {
                    enemy.y = platform.y - enemy.height;
                    enemy.vy = 0;
                }

            } else if (enemy.type === 'jumper') {
                enemy.jumpTimer--;
                if (enemy.jumpTimer <= 0 && enemy.vy === 0) {
                    enemy.vy = -12;
                    enemy.vx = (Math.random() - 0.5) * 6;
                    enemy.jumpTimer = 40 + Math.random() * 40;
                }

                enemy.vy += 0.5;
                enemy.x += enemy.vx;
                enemy.y += enemy.vy;
                enemy.facing = enemy.vx > 0 ? 1 : -1;

                const platform = Platforms.checkCollision(enemy);
                if (platform) {
                    enemy.y = platform.y - enemy.height;
                    enemy.vy = 0;
                    enemy.vx *= 0.5;
                }
            }

            // Collision with player
            if (this.checkPlayerCollision(enemy, player)) {
                if (player.vy > 0 && player.y + player.height < enemy.y + enemy.height / 2) {
                    enemy.dead = true;
                    enemy.vy = -5;
                    player.vy = -12;
                    Camera.addShake(4);
                    Platforms.addDust(enemy.x + enemy.width / 2, enemy.y + enemy.height);
                    Game.addCombo();
                } else if (!player.invincible && !player.isDashing) {
                    player.takeDamage();
                }
            }
        });

        this.enemies = this.enemies.filter(e =>
            e.x > cameraX - 400 &&
            e.y < 800 &&
            (e.deathTimer < 25 || !e.dead)
        );
    },

    checkPlayerCollision(enemy, player) {
        return !enemy.dead &&
            player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y;
    },

    render(ctx, camera) {
        this.enemies.forEach(enemy => {
            const screen = camera.worldToScreen(enemy.x, enemy.y);

            ctx.save();
            ctx.translate(screen.x + enemy.width / 2, screen.y + enemy.height / 2);

            if (enemy.dead) {
                ctx.globalAlpha = 1 - enemy.deathTimer / 25;
                ctx.rotate(enemy.deathTimer * 0.2);
                ctx.scale(1 - enemy.deathTimer / 30, 1 - enemy.deathTimer / 30);
            }

            ctx.scale(enemy.facing, 1);
            ctx.translate(-enemy.width / 2, -enemy.height / 2);

            if (enemy.type === 'crawler') {
                this.drawCrawler(ctx, enemy);
            } else if (enemy.type === 'flyer') {
                this.drawFlyer(ctx, enemy);
            } else if (enemy.type === 'charger') {
                this.drawCharger(ctx, enemy);
            } else if (enemy.type === 'jumper') {
                this.drawJumper(ctx, enemy);
            }

            ctx.restore();
        });
    },

    drawCrawler(ctx, enemy) {
        ctx.fillStyle = '#1a1a22';
        ctx.fillRect(2, 8, 20, 12);
        ctx.fillStyle = '#2a2a32';
        ctx.fillRect(16, 4, 8, 10);
        ctx.fillStyle = '#6a3030';
        ctx.fillRect(19, 7, 3, 3);

        const legOffset = Math.sin(enemy.animFrame * Math.PI / 2) * 3;
        ctx.fillStyle = '#1a1a22';
        ctx.fillRect(4, 18 + legOffset, 3, 6);
        ctx.fillRect(10, 18 - legOffset, 3, 6);
        ctx.fillRect(16, 18 + legOffset, 3, 6);
    },

    drawFlyer(ctx, enemy) {
        ctx.fillStyle = '#1a1a22';
        ctx.beginPath();
        ctx.ellipse(12, 10, 10, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        const wingOffset = Math.sin(enemy.animFrame * Math.PI) * 5;
        ctx.fillStyle = '#2a2a35';
        ctx.fillRect(-2, 5 + wingOffset, 10, 5);
        ctx.fillRect(16, 5 - wingOffset, 10, 5);

        ctx.fillStyle = '#6a3030';
        ctx.fillRect(14, 7, 5, 5);
    },

    drawCharger(ctx, enemy) {
        // Larger, more menacing
        ctx.fillStyle = enemy.isCharging && enemy.chargeTimer <= 0 ? '#3a2020' : '#1a1a22';
        ctx.fillRect(0, 6, 32, 20);
        ctx.fillStyle = '#2a2a32';
        ctx.fillRect(24, 2, 10, 14);

        // Angry eyes
        ctx.fillStyle = enemy.isCharging ? '#aa4040' : '#6a3030';
        ctx.fillRect(27, 6, 4, 4);

        // Horns
        ctx.fillStyle = '#3a3a42';
        ctx.fillRect(26, 0, 3, 6);
        ctx.fillRect(31, 2, 3, 5);

        // Legs
        ctx.fillStyle = '#1a1a22';
        ctx.fillRect(4, 24, 5, 6);
        ctx.fillRect(14, 24, 5, 6);
        ctx.fillRect(24, 24, 5, 6);
    },

    drawJumper(ctx, enemy) {
        const squash = enemy.vy === 0 ? 1 : (enemy.vy < 0 ? 0.8 : 1.2);

        ctx.fillStyle = '#1a2020';
        ctx.fillRect(2, 4 * squash, 16, 20 * squash);

        ctx.fillStyle = '#2a3030';
        ctx.fillRect(14, 2 * squash, 8, 10 * squash);

        ctx.fillStyle = '#4a6060';
        ctx.fillRect(16, 5 * squash, 3, 3);

        // Legs
        ctx.fillStyle = '#1a2020';
        if (enemy.vy < 0) {
            ctx.fillRect(2, 20, 5, 8);
            ctx.fillRect(12, 20, 5, 8);
        } else {
            ctx.fillRect(0, 22, 6, 6);
            ctx.fillRect(14, 22, 6, 6);
        }
    }
};
