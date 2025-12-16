// Combat System - Projectiles and Shooting (Fixed)
const Combat = {
    projectiles: [],
    enemyProjectiles: [],

    // Weapon stats (upgradeable)
    fireRate: 8,
    fireTimer: 0,
    damage: 1,
    projectileSpeed: 12,
    projectileSize: 8,

    // Powerups
    powerups: [],

    init() {
        this.projectiles = [];
        this.enemyProjectiles = [];
        this.fireTimer = 0;
        this.damage = 1;
        this.fireRate = 8;
        this.projectileSpeed = 12;
        this.projectileSize = 8;
    },

    shoot(x, y, direction) {
        if (this.fireTimer > 0) return false;

        this.projectiles.push({
            x: x,
            y: y,
            vx: direction * this.projectileSpeed,
            vy: 0,
            size: this.projectileSize,
            damage: this.damage,
            life: 60,
            trail: []
        });

        this.fireTimer = this.fireRate;
        Audio.play('shoot');
        Camera.addShake(1);
        return true;
    },

    enemyShoot(x, y, targetX, targetY, speed = 6) {
        const dx = targetX - x;
        const dy = targetY - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) return;

        this.enemyProjectiles.push({
            x: x,
            y: y,
            vx: (dx / dist) * speed,
            vy: (dy / dist) * speed,
            size: 10,
            life: 120
        });
    },

    spawnPowerup(x, y) {
        const types = ['damage', 'fireRate', 'health', 'speed', 'multishot'];
        const type = types[Math.floor(Math.random() * types.length)];

        this.powerups.push({
            x: x,
            y: y,
            type: type,
            vy: -2,
            life: 300,
            bobPhase: Math.random() * Math.PI * 2
        });
    },

    update(player) {
        if (this.fireTimer > 0) this.fireTimer--;

        // Update player projectiles
        this.projectiles.forEach(p => {
            // Store trail
            p.trail.push({ x: p.x, y: p.y });
            if (p.trail.length > 5) p.trail.shift();

            p.x += p.vx;
            p.y += p.vy;
            p.life--;

            // Check enemy hits
            if (typeof Enemies !== 'undefined' && Enemies.enemies) {
                Enemies.enemies.forEach(enemy => {
                    if (!enemy.dead && this.checkCollision(p, enemy)) {
                        enemy.health -= p.damage;
                        p.life = 0;
                        Audio.play('hit');
                        Camera.addShake(2);
                        Platforms.addDust(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 4);

                        if (enemy.health <= 0) {
                            enemy.dead = true;
                            enemy.vy = -5;
                            Audio.play('enemyDie');
                            Game.addCombo();
                            Game.addScore(enemy.isBoss ? 500 : 50);

                            if (Math.random() < 0.15) {
                                this.spawnPowerup(enemy.x + enemy.width / 2, enemy.y);
                            }
                        }
                    }
                });
            }

            // Check boss hits
            if (typeof Bosses !== 'undefined' && Bosses.bosses) {
                Bosses.bosses.forEach(boss => {
                    if (!boss.dead && this.checkCollision(p, boss)) {
                        boss.health -= p.damage;
                        p.life = 0;
                        Audio.play('hit');
                        Camera.addShake(3);
                        Platforms.addDust(boss.x + boss.width / 2, boss.y + boss.height / 2, 6);

                        if (boss.health <= 0) {
                            boss.dead = true;
                            boss.vy = -3;
                            Audio.play('bossDie');
                            Game.addScore(500);
                            Game.showMessage('¡BOSS DERROTADO!');

                            // Boss always drops powerup
                            this.spawnPowerup(boss.x + boss.width / 2, boss.y);
                        }
                    }
                });
            }
        });

        // Update enemy projectiles
        this.enemyProjectiles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life--;

            // Check player hit
            if (player && !player.invincible && !player.isDashing && this.checkCollision(p, player)) {
                player.takeDamage();
                p.life = 0;
            }
        });

        // Update powerups
        this.powerups.forEach(p => {
            p.bobPhase += 0.1;
            p.y += Math.sin(p.bobPhase) * 0.5;
            p.life--;

            // Check player pickup
            if (player && this.checkCollision(p, player, 20)) {
                this.applyPowerup(p.type, player);
                p.life = 0;
                Audio.play('powerup');
            }
        });

        // Cleanup
        this.projectiles = this.projectiles.filter(p => p.life > 0);
        this.enemyProjectiles = this.enemyProjectiles.filter(p => p.life > 0);
        this.powerups = this.powerups.filter(p => p.life > 0);
    },

    checkCollision(a, b, padding = 0) {
        if (!a || !b) return false;

        const ax = a.x - (a.size || 0) / 2;
        const ay = a.y - (a.size || 0) / 2;
        const aw = a.size || a.width || 0;
        const ah = a.size || a.height || 0;

        return ax < b.x + b.width + padding &&
            ax + aw > b.x - padding &&
            ay < b.y + b.height + padding &&
            ay + ah > b.y - padding;
    },

    applyPowerup(type, player) {
        switch (type) {
            case 'damage':
                this.damage = Math.min(5, this.damage + 1);
                Game.showMessage('+DAÑO');
                break;
            case 'fireRate':
                this.fireRate = Math.max(3, this.fireRate - 1);
                Game.showMessage('+CADENCIA');
                break;
            case 'health':
                player.health = Math.min(player.maxHealth, player.health + 1);
                Game.updateHealthUI();
                Game.showMessage('+VIDA');
                break;
            case 'speed':
                player.maxSpeed = Math.min(12, player.maxSpeed + 0.5);
                Game.showMessage('+VELOCIDAD');
                break;
            case 'multishot':
                this.damage += 0.5;
                Game.showMessage('+PODER');
                break;
        }
        Game.updateStatsUI();
    },

    render(ctx, camera) {
        // Player projectiles
        this.projectiles.forEach(p => {
            const screen = camera.worldToScreen(p.x, p.y);

            // Trail
            ctx.strokeStyle = 'rgba(150, 150, 170, 0.5)';
            ctx.lineWidth = p.size / 2;
            ctx.beginPath();
            p.trail.forEach((t, i) => {
                const ts = camera.worldToScreen(t.x, t.y);
                if (i === 0) ctx.moveTo(ts.x, ts.y);
                else ctx.lineTo(ts.x, ts.y);
            });
            ctx.stroke();

            // Projectile
            ctx.fillStyle = '#8888a0';
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, p.size / 2, 0, Math.PI * 2);
            ctx.fill();

            // Glow
            ctx.fillStyle = 'rgba(150, 150, 180, 0.5)';
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });

        // Enemy projectiles
        this.enemyProjectiles.forEach(p => {
            const screen = camera.worldToScreen(p.x, p.y);

            ctx.fillStyle = '#a05050';
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, p.size / 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(180, 80, 80, 0.4)';
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });

        // Powerups
        this.powerups.forEach(p => {
            const screen = camera.worldToScreen(p.x, p.y);

            // Glow
            ctx.fillStyle = this.getPowerupColor(p.type, 0.3);
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, 20, 0, Math.PI * 2);
            ctx.fill();

            // Icon
            ctx.fillStyle = this.getPowerupColor(p.type, 1);
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, 10, 0, Math.PI * 2);
            ctx.fill();

            // Symbol
            ctx.fillStyle = '#fff';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.getPowerupSymbol(p.type), screen.x, screen.y);
        });
    },

    getPowerupColor(type, alpha) {
        const colors = {
            damage: `rgba(200, 80, 80, ${alpha})`,
            fireRate: `rgba(80, 80, 200, ${alpha})`,
            health: `rgba(80, 200, 80, ${alpha})`,
            speed: `rgba(200, 200, 80, ${alpha})`,
            multishot: `rgba(200, 80, 200, ${alpha})`
        };
        return colors[type] || `rgba(150, 150, 150, ${alpha})`;
    },

    getPowerupSymbol(type) {
        const symbols = { damage: '⚔', fireRate: '»', health: '♥', speed: '»', multishot: '✦' };
        return symbols[type] || '?';
    }
};
