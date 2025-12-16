// Boss System with More Variety and Random Selection
const Bosses = {
    bosses: [],
    nextBossDistance: 800,
    bossSpacing: 1000,
    activeBoss: null,
    bossDefeated: 0,
    availableBosses: [],

    init() {
        this.bosses = [];
        this.nextBossDistance = 800;
        this.activeBoss = null;
        this.bossDefeated = 0;
        // Shuffle boss order each game
        this.availableBosses = this.shuffleArray(['titan', 'flyer', 'shooter', 'crawler', 'phantom', 'guardian']);
    },

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },

    checkSpawn(distance) {
        let spawnDist = this.nextBossDistance;

        // In hardcore, bosses spawn much more frequently
        if (Game.mode === 'hardcore') {
            // Force spawn if no active boss and enough distance traveled since last one (e.g., every 100m)
            const gap = distance - (this.lastBossSpawnDistance || 0);
            if (!this.activeBoss && gap > 150) {
                this.spawnBoss();
                this.lastBossSpawnDistance = distance;
            }
            return;
        }

        if (distance >= this.nextBossDistance && !this.activeBoss) {
            this.spawnBoss();
            this.nextBossDistance += this.bossSpacing + this.bossDefeated * 200;
            this.lastBossSpawnDistance = distance;
        }
    },

    spawnBoss() {
        // Get random boss type from shuffled list
        const type = this.availableBosses[this.bossDefeated % this.availableBosses.length];

        const boss = {
            x: Player.x + 600,
            y: 300,
            width: 80,
            height: 100,
            vx: 0,
            vy: 0,
            type: type,
            health: 12 + this.bossDefeated * 4,
            maxHealth: 12 + this.bossDefeated * 4,
            state: 'entering',
            phase: 0,
            phaseTimer: 0,
            attackTimer: 0,
            animFrame: 0,
            animTimer: 0,
            dead: false,
            deathTimer: 0,
            isBoss: true,
            facing: -1
        };

        // Boss-specific setup
        switch (type) {
            case 'flyer':
                boss.height = 70;
                boss.baseY = 250;
                break;
            case 'shooter':
                boss.width = 60;
                boss.height = 80;
                break;
            case 'crawler':
                boss.width = 100;
                boss.height = 60;
                boss.y = 380;
                break;
            case 'phantom':
                boss.width = 60;
                boss.height = 90;
                boss.teleportTimer = 0;
                break;
            case 'guardian':
                boss.width = 90;
                boss.height = 120;
                boss.shieldActive = true;
                boss.shieldTimer = 0;
                break;
        }

        this.bosses.push(boss);
        this.activeBoss = boss;
        Audio.play('bossAppear');
        Game.showMessage(`⚠ ${this.getBossName(type)} ⚠`);
    },

    getBossName(type) {
        const names = {
            titan: 'TITAN',
            flyer: 'ESPECTRO VOLADOR',
            shooter: 'TORRETA',
            crawler: 'ARAÑA GIGANTE',
            phantom: 'FANTASMA',
            guardian: 'GUARDIAN'
        };
        return names[type] || 'BOSS';
    },

    update(player, cameraX) {
        this.bosses.forEach(boss => {
            if (boss.dead) {
                boss.deathTimer++;
                boss.vy += 0.3;
                boss.y += boss.vy;

                if (boss.deathTimer % 5 === 0) {
                    Platforms.addDust(
                        boss.x + Math.random() * boss.width,
                        boss.y + Math.random() * boss.height,
                        8
                    );
                }

                if (boss.deathTimer >= 60) {
                    this.activeBoss = null;
                    this.bossDefeated++;
                }
                return;
            }

            boss.animTimer++;
            if (boss.animTimer >= 10) {
                boss.animTimer = 0;
                boss.animFrame = (boss.animFrame + 1) % 4;
            }

            boss.facing = player.x < boss.x ? -1 : 1;
            boss.phaseTimer++;
            boss.attackTimer++;

            if (boss.state === 'entering') {
                boss.x += (player.x + 250 - boss.x) * 0.02;
                if (boss.phaseTimer > 120) {
                    boss.state = 'attack';
                    boss.phaseTimer = 0;
                }
            } else {
                this.updateBossAI(boss, player);
            }

            const minX = player.x + 150;
            const maxX = player.x + 400;
            if (boss.x < minX) boss.x += 2;
            if (boss.x > maxX) boss.x -= 1;
        });

        this.bosses = this.bosses.filter(b => !b.dead || b.deathTimer < 60);
    },

    updateBossAI(boss, player) {
        switch (boss.type) {
            case 'titan': this.titanAI(boss, player); break;
            case 'flyer': this.flyerAI(boss, player); break;
            case 'shooter': this.shooterAI(boss, player); break;
            case 'crawler': this.crawlerAI(boss, player); break;
            case 'phantom': this.phantomAI(boss, player); break;
            case 'guardian': this.guardianAI(boss, player); break;
        }
    },

    titanAI(boss, player) {
        if (boss.phase === 0) {
            boss.y += (player.y - 30 - boss.y) * 0.02;
            if (boss.attackTimer > 90) {
                boss.phase = 1;
                boss.attackTimer = 0;
                boss.vx = boss.facing * -15;
            }
        } else if (boss.phase === 1) {
            boss.x += boss.vx;
            boss.vx *= 0.98;
            if (Math.abs(boss.vx) < 1) {
                boss.phase = 0;
                boss.attackTimer = 0;
            }
            if (boss.attackTimer % 10 === 0) Camera.addShake(3);
        }
        this.checkBossCollision(boss, player);
    },

    flyerAI(boss, player) {
        boss.phase += 0.03;
        boss.y = boss.baseY + Math.sin(boss.phase) * 80;
        boss.x += Math.sin(boss.phase * 2) * 2;

        if (boss.attackTimer > 50) {
            Combat.enemyShoot(boss.x + boss.width / 2, boss.y + boss.height / 2,
                player.x + player.width / 2, player.y + player.height / 2, 6);
            boss.attackTimer = 0;
        }
        this.checkBossCollision(boss, player);
    },

    shooterAI(boss, player) {
        boss.y += (350 - boss.y) * 0.02;

        if (boss.attackTimer > 35) {
            const patterns = [
                [[0, -8]],
                [[-6, -6], [0, -8], [6, -6]],
                [[0, -10], [0, -8]],
            ];
            const pattern = patterns[Math.floor(boss.phaseTimer / 200) % patterns.length];
            pattern.forEach(([vx, vy]) => {
                Combat.enemyProjectiles.push({
                    x: boss.x + boss.width / 2,
                    y: boss.y + boss.height / 2,
                    vx: vx * boss.facing * -1,
                    vy: vy,
                    size: 12,
                    life: 100
                });
            });
            boss.attackTimer = 0;
        }
        this.checkBossCollision(boss, player);
    },

    crawlerAI(boss, player) {
        // Crawls on ground, jumps occasionally
        boss.vy += 0.5;
        boss.y += boss.vy;

        const platform = Platforms.checkCollision(boss);
        if (platform) {
            boss.y = platform.y - boss.height;
            boss.vy = 0;

            // Jump toward player
            if (boss.attackTimer > 80) {
                boss.vy = -12;
                boss.vx = boss.facing * -8;
                boss.attackTimer = 0;
                Camera.addShake(4);
            }
        }

        boss.x += boss.vx;
        boss.vx *= 0.95;

        // Shoot web
        if (boss.phaseTimer % 60 === 0) {
            Combat.enemyShoot(boss.x + boss.width / 2, boss.y,
                player.x + player.width / 2, player.y + player.height / 2, 4);
        }

        this.checkBossCollision(boss, player);
    },

    phantomAI(boss, player) {
        boss.teleportTimer++;

        // Float toward player
        boss.x += (player.x + 150 - boss.x) * 0.01;
        boss.y += (player.y - boss.y) * 0.02;
        boss.phase += 0.05;
        boss.y += Math.sin(boss.phase) * 2;

        // Teleport
        if (boss.teleportTimer > 120) {
            boss.x = player.x + (Math.random() < 0.5 ? -200 : 300);
            boss.teleportTimer = 0;
            Platforms.addDust(boss.x + boss.width / 2, boss.y + boss.height / 2, 10);

            // Shoot after teleport
            for (let i = 0; i < 4; i++) {
                setTimeout(() => {
                    Combat.enemyShoot(boss.x + boss.width / 2, boss.y + boss.height / 2,
                        player.x + player.width / 2, player.y + player.height / 2, 5);
                }, i * 100);
            }
        }

        this.checkBossCollision(boss, player);
    },

    guardianAI(boss, player) {
        boss.y += (320 - boss.y) * 0.02;
        boss.shieldTimer++;

        // Shield cycles
        if (boss.shieldTimer > 180) {
            boss.shieldActive = !boss.shieldActive;
            boss.shieldTimer = 0;
            if (!boss.shieldActive) {
                Game.showMessage('¡ESCUDO DESACTIVADO!');
            }
        }

        // Slam attack
        if (boss.attackTimer > 100 && !boss.shieldActive) {
            Combat.enemyProjectiles.push({
                x: boss.x + boss.width / 2,
                y: boss.y + boss.height,
                vx: -5,
                vy: 0,
                size: 20,
                life: 60
            });
            Combat.enemyProjectiles.push({
                x: boss.x + boss.width / 2,
                y: boss.y + boss.height,
                vx: 5,
                vy: 0,
                size: 20,
                life: 60
            });
            Camera.addShake(5);
            boss.attackTimer = 0;
        }

        this.checkBossCollision(boss, player);
    },

    // Override damage for guardian
    takeDamage(boss, damage) {
        if (boss.type === 'guardian' && boss.shieldActive) {
            return false; // No damage
        }
        return true;
    },

    checkBossCollision(boss, player) {
        if (player.invincible || player.isDashing) return;

        if (player.x < boss.x + boss.width &&
            player.x + player.width > boss.x &&
            player.y < boss.y + boss.height &&
            player.y + player.height > boss.y) {
            player.takeDamage();
        }
    },

    render(ctx, camera) {
        this.bosses.forEach(boss => {
            const screen = camera.worldToScreen(boss.x, boss.y);

            ctx.save();

            if (boss.dead) {
                ctx.globalAlpha = 1 - boss.deathTimer / 60;
                ctx.translate(screen.x + boss.width / 2, screen.y + boss.height / 2);
                ctx.rotate(boss.deathTimer * 0.1);
                ctx.translate(-boss.width / 2, -boss.height / 2);
            } else {
                ctx.translate(screen.x, screen.y);
            }

            switch (boss.type) {
                case 'titan': this.drawTitan(ctx, boss); break;
                case 'flyer': this.drawFlyer(ctx, boss); break;
                case 'shooter': this.drawShooter(ctx, boss); break;
                case 'crawler': this.drawCrawler(ctx, boss); break;
                case 'phantom': this.drawPhantom(ctx, boss); break;
                case 'guardian': this.drawGuardian(ctx, boss); break;
            }

            ctx.restore();

            // Health bar
            if (!boss.dead) {
                const barWidth = boss.width;
                const barHeight = 8;
                const barY = screen.y - 20;

                ctx.fillStyle = '#1a1a22';
                ctx.fillRect(screen.x, barY, barWidth, barHeight);
                ctx.fillStyle = '#8a4040';
                ctx.fillRect(screen.x + 1, barY + 1, (barWidth - 2) * (boss.health / boss.maxHealth), barHeight - 2);

                // Boss name
                ctx.fillStyle = '#9090a0';
                ctx.font = '8px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(this.getBossName(boss.type), screen.x + boss.width / 2, barY - 5);
            }
        });
    },

    drawTitan(ctx, boss) {
        ctx.fillStyle = '#1a1a22';
        ctx.fillRect(10, 20, 60, 70);
        ctx.fillStyle = '#2a2a32';
        ctx.fillRect(20, 0, 40, 30);
        ctx.fillStyle = '#8a4040';
        ctx.fillRect(25, 10, 8, 8);
        ctx.fillRect(47, 10, 8, 8);
        const armOffset = Math.sin(boss.animFrame * Math.PI / 2) * 5;
        ctx.fillStyle = '#1a1a22';
        ctx.fillRect(-5, 30 + armOffset, 20, 40);
        ctx.fillRect(65, 30 - armOffset, 20, 40);
        ctx.fillRect(15, 85, 15, 20);
        ctx.fillRect(50, 85, 15, 20);
    },

    drawFlyer(ctx, boss) {
        ctx.fillStyle = '#1a1a22';
        ctx.beginPath();
        ctx.ellipse(40, 35, 35, 25, 0, 0, Math.PI * 2);
        ctx.fill();
        const wingOffset = Math.sin(boss.animFrame * Math.PI) * 10;
        ctx.fillStyle = '#2a2a35';
        ctx.fillRect(-10, 20 + wingOffset, 30, 15);
        ctx.fillRect(60, 20 - wingOffset, 30, 15);
        ctx.fillStyle = '#2a2a32';
        ctx.fillRect(25, 50, 30, 25);
        ctx.fillStyle = '#8a4040';
        ctx.fillRect(35, 58, 12, 10);
    },

    drawShooter(ctx, boss) {
        ctx.fillStyle = '#1a1a22';
        ctx.fillRect(10, 30, 40, 50);
        ctx.fillStyle = '#2a2a32';
        ctx.fillRect(5, 45, 55, 20);
        ctx.fillStyle = '#3a3a42';
        ctx.fillRect(0, 48, 15, 14);
        ctx.fillRect(45, 48, 15, 14);
        ctx.fillStyle = '#2a2a32';
        ctx.fillRect(15, 10, 30, 25);
        ctx.fillStyle = '#8a4040';
        ctx.fillRect(25, 18, 10, 10);
        ctx.fillStyle = '#1a1a22';
        ctx.fillRect(5, 75, 50, 10);
    },

    drawCrawler(ctx, boss) {
        // Spider boss
        ctx.fillStyle = '#1a1a22';
        ctx.beginPath();
        ctx.ellipse(50, 30, 40, 25, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#8a4040';
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(30 + i * 10, 20, 5, 5);
        }

        // Legs
        ctx.strokeStyle = '#1a1a22';
        ctx.lineWidth = 4;
        for (let i = 0; i < 4; i++) {
            const legOffset = Math.sin(boss.animFrame * Math.PI / 2 + i) * 5;
            ctx.beginPath();
            ctx.moveTo(20 + i * 20, 40);
            ctx.lineTo(0 + i * 15, 60 + legOffset);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(20 + i * 20, 40);
            ctx.lineTo(40 + i * 15, 60 - legOffset);
            ctx.stroke();
        }
    },

    drawPhantom(ctx, boss) {
        // Ghostly appearance
        const flicker = Math.sin(Date.now() / 100) * 0.2 + 0.7;
        ctx.globalAlpha = flicker;

        ctx.fillStyle = '#3a3a4a';
        ctx.beginPath();
        ctx.ellipse(30, 30, 25, 30, 0, 0, Math.PI * 2);
        ctx.fill();

        // Trailing wisps
        ctx.fillStyle = '#2a2a3a';
        ctx.beginPath();
        ctx.moveTo(10, 50);
        ctx.quadraticCurveTo(30, 90, 50, 50);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#aaaacc';
        ctx.fillRect(20, 25, 8, 8);
        ctx.fillRect(35, 25, 8, 8);

        ctx.globalAlpha = 1;
    },

    drawGuardian(ctx, boss) {
        // Shield effect
        if (boss.shieldActive) {
            ctx.strokeStyle = 'rgba(100, 150, 200, 0.6)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(45, 60, 55, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Body
        ctx.fillStyle = '#2a2a3a';
        ctx.fillRect(15, 30, 60, 80);

        // Head
        ctx.fillStyle = '#3a3a4a';
        ctx.fillRect(25, 5, 40, 30);

        // Eyes
        ctx.fillStyle = boss.shieldActive ? '#6090c0' : '#8a4040';
        ctx.fillRect(32, 15, 10, 10);
        ctx.fillRect(48, 15, 10, 10);

        // Arms
        ctx.fillStyle = '#2a2a3a';
        ctx.fillRect(0, 40, 20, 50);
        ctx.fillRect(70, 40, 20, 50);
    }
};
