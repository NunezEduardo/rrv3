// Enhanced Platform System with Ziplines and Climbable Vines
const Platforms = {
    platforms: [],
    movingPlatforms: [],
    checkpoints: [],
    ziplines: [],
    climbableVines: [],
    decorations: [],
    particles: [],
    leaves: [],
    tileSize: 16,
    lastX: 0,
    difficulty: 1,
    nextCheckpoint: 4000,
    checkpointSpacing: 4000,
    gameSpeed: 1,
    baseY: 420, // Will be adjusted based on screen height

    init() {
        this.platforms = [];
        this.movingPlatforms = [];
        this.checkpoints = [];
        this.ziplines = [];
        this.climbableVines = [];
        this.decorations = [];
        this.particles = [];
        this.leaves = [];
        this.lastX = 0;
        this.difficulty = 1;
        this.nextCheckpoint = 4000;
        this.gameSpeed = 1;

        // Use screen-relative baseY if set by Game
        const startY = this.baseY || 420;

        this.addPlatform(0, startY, 20);

        for (let i = 0; i < 15; i++) {
            this.generateNext();
        }

        for (let i = 0; i < 25; i++) {
            this.addLeaf(Math.random() * 1500, Math.random() * 400);
        }
    },

    addPlatform(x, y, width) {
        const platform = {
            x: x,
            y: y,
            width: width * this.tileSize,
            height: this.tileSize * 2,
            type: 'normal'
        };
        this.platforms.push(platform);

        if (Math.random() < 0.3) {
            this.decorations.push({
                type: 'tree',
                x: x + 20 + Math.random() * (width * this.tileSize - 80),
                y: y - 110 - Math.random() * 50,
                scale: 0.5 + Math.random() * 0.6
            });
        }

        if (Math.random() < 0.2) {
            this.decorations.push({
                type: 'vine',
                x: x + Math.random() * width * this.tileSize,
                y: y - 60 - Math.random() * 40,
                length: 40 + Math.random() * 60
            });
        }

        // Wall platforms
        if (Math.random() < 0.18 && width > 5) {
            this.platforms.push({
                x: x + width * this.tileSize * 0.4,
                y: y - 90 - Math.random() * 70,
                width: this.tileSize * 2,
                height: 90 + Math.random() * 50,
                type: 'wall'
            });
        }

        // Spawn enemies
        if (x > 300) {
            const rand = Math.random();
            if (rand < Enemies.spawnRate) {
                let enemyType;
                const typeRand = Math.random();
                if (typeRand < 0.4) enemyType = 'crawler';
                else if (typeRand < 0.6) enemyType = 'flyer';
                else if (typeRand < 0.8) enemyType = 'jumper';
                else enemyType = 'charger';

                const enemyY = enemyType === 'flyer' ? y - 90 : y - 30;
                Enemies.spawn(x + width * this.tileSize * 0.5, enemyY, enemyType);
            }
        }
    },

    addZipline(startX, startY, endX, endY) {
        this.ziplines.push({
            startX: startX,
            startY: startY,
            endX: endX,
            endY: endY,
            length: Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2)
        });
    },

    addClimbableVine(x, bottomY, height) {
        this.climbableVines.push({
            x: x,
            bottomY: bottomY,
            topY: bottomY - height,
            height: height,
            swayPhase: Math.random() * Math.PI * 2
        });
    },

    addMovingPlatform(x, y, width, moveType, range, speed) {
        this.movingPlatforms.push({
            x: x,
            y: y,
            baseX: x,
            baseY: y,
            width: width * this.tileSize,
            height: this.tileSize * 2,
            moveType: moveType,
            range: range,
            phase: Math.random() * Math.PI * 2,
            speed: speed || (0.03 + Math.random() * 0.02)
        });
    },

    addCheckpoint(x, y) {
        this.checkpoints.push({
            x: x,
            y: y - 70,
            width: 36,
            height: 70,
            reached: false,
            glowPhase: 0
        });
    },

    generateNext() {
        const lastPlatform = this.platforms.filter(p => p.type === 'normal').pop();

        const baseGap = 80 + this.difficulty * 30;
        const gap = baseGap + Math.random() * 60;
        const heightChange = (Math.random() - 0.4) * 140 * this.difficulty;

        const newX = lastPlatform.x + lastPlatform.width + gap;
        // Use relative bounds based on baseY
        const minY = Math.max(100, this.baseY - 250);
        const maxY = this.baseY + 100;
        let newY = Math.max(minY, Math.min(maxY, lastPlatform.y + heightChange));
        const newWidth = Math.max(4, 12 - this.difficulty * 1.5 + Math.floor(Math.random() * 8));

        // Checkpoints
        if (newX >= this.nextCheckpoint) {
            this.addCheckpoint(newX + newWidth * this.tileSize / 2, newY);
            this.nextCheckpoint += this.checkpointSpacing;
            this.addPlatform(newX, newY, newWidth + 6);
        } else {
            this.addPlatform(newX, newY, newWidth);
        }

        // Ziplines between platforms (15% chance)
        if (Math.random() < 0.15 && this.difficulty > 1) {
            const zipEndX = newX + newWidth * this.tileSize + 150 + Math.random() * 100;
            const zipEndY = newY - 30 - Math.random() * 80;
            this.addZipline(
                newX + newWidth * this.tileSize - 20,
                newY - 40,
                zipEndX,
                zipEndY
            );
            // Add small platform at zipline end
            this.platforms.push({
                x: zipEndX - 20,
                y: zipEndY + 30,
                width: this.tileSize * 4,
                height: this.tileSize * 2,
                type: 'normal'
            });
        }

        // Climbable vines for high platforms (20% chance)
        if (Math.random() < 0.2 && heightChange < -50) {
            const vineHeight = Math.abs(heightChange) + 60;
            this.addClimbableVine(
                newX + (newWidth * this.tileSize) / 2,
                newY,
                vineHeight
            );
        }

        // Moving platforms
        if (Math.random() < 0.25 + this.difficulty * 0.1) {
            const moveType = Math.random() < 0.5 ? 'vertical' : 'horizontal';
            const range = 50 + Math.random() * 60 + this.difficulty * 15;
            const speed = 0.025 + this.difficulty * 0.01 + Math.random() * 0.015;

            this.addMovingPlatform(
                newX + gap / 2,
                newY - (moveType === 'vertical' ? range / 2 : 0),
                3 + Math.floor(Math.random() * 3),
                moveType,
                range,
                speed
            );
        }

        // Crumbling platforms
        if (Math.random() < 0.1 * this.difficulty && this.difficulty > 1.2) {
            this.platforms.push({
                x: newX + gap * 0.3,
                y: newY - 50,
                width: this.tileSize * 4,
                height: this.tileSize * 2,
                type: 'crumble',
                timer: 0,
                falling: false,
                fallSpeed: 0
            });
        }

        this.lastX = newX + newWidth * this.tileSize;
        this.difficulty = Math.min(3, this.difficulty + 0.012);
        this.gameSpeed = 1 + (this.difficulty - 1) * 0.15;
    },

    addLeaf(x, y) {
        this.leaves.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 0.8,
            vy: 0.6 + Math.random() * 0.6,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.08,
            size: 5 + Math.random() * 5
        });
    },

    update(cameraX, canvasWidth, player) {
        while (this.lastX < cameraX + canvasWidth + 700) {
            this.generateNext();
        }

        // Update moving platforms
        this.movingPlatforms.forEach(mp => {
            mp.phase += mp.speed * this.gameSpeed;
            if (mp.moveType === 'vertical') {
                mp.y = mp.baseY + Math.sin(mp.phase) * mp.range;
            } else {
                mp.x = mp.baseX + Math.sin(mp.phase) * mp.range;
            }
        });

        // Update climbable vines (sway)
        this.climbableVines.forEach(vine => {
            vine.swayPhase += 0.02;
        });

        // Update crumbling platforms
        this.platforms.forEach(p => {
            if (p.type === 'crumble') {
                if (p.timer > 0) {
                    p.timer--;
                    if (p.timer <= 0) p.falling = true;
                }
                if (p.falling) {
                    p.fallSpeed += 0.3;
                    p.y += p.fallSpeed;
                }
            }
        });

        // Update checkpoints
        this.checkpoints.forEach(cp => {
            cp.glowPhase += 0.07;
            if (!cp.reached && player) {
                if (player.x > cp.x - 25 && player.x < cp.x + cp.width + 25 &&
                    player.y + player.height > cp.y && player.y < cp.y + cp.height) {
                    cp.reached = true;
                    Game.reachCheckpoint(cp);
                }
            }
        });

        // Clean up
        this.platforms = this.platforms.filter(p =>
            (p.x + p.width > cameraX - 300) && (!p.falling || p.y < 700)
        );
        this.movingPlatforms = this.movingPlatforms.filter(p => p.x + p.width > cameraX - 300);
        this.checkpoints = this.checkpoints.filter(c => c.x > cameraX - 100);
        this.ziplines = this.ziplines.filter(z => z.endX > cameraX - 100);
        this.climbableVines = this.climbableVines.filter(v => v.x > cameraX - 100);
        this.decorations = this.decorations.filter(d => d.x > cameraX - 400);

        // Particles
        this.particles = this.particles.filter(p => {
            p.x += p.vx * this.gameSpeed;
            p.y += p.vy * this.gameSpeed;
            p.life -= 0.03;
            p.vy += 0.18;
            return p.life > 0;
        });

        // Leaves
        this.leaves.forEach(leaf => {
            leaf.x += (leaf.vx + Math.sin(Date.now() / 800 + leaf.rotation) * 0.5) * this.gameSpeed;
            leaf.y += leaf.vy * this.gameSpeed;
            leaf.rotation += leaf.rotSpeed * this.gameSpeed;
            if (leaf.y > 650) {
                leaf.y = -30;
                leaf.x = cameraX + Math.random() * canvasWidth;
            }
        });

        if (Math.random() < 0.04 * this.gameSpeed) {
            this.addLeaf(cameraX + Math.random() * canvasWidth, -30);
        }
        this.leaves = this.leaves.filter(l => l.x > cameraX - 100 && this.leaves.length < 50);
    },

    addDust(x, y, amount = 6) {
        for (let i = 0; i < amount; i++) {
            this.particles.push({
                x: x + Math.random() * 20 - 10,
                y: y - 3,
                vx: (Math.random() - 0.5) * 4,
                vy: -Math.random() * 4 - 1,
                life: 1,
                size: 3 + Math.random() * 4
            });
        }
    },

    render(ctx, camera) {
        // Decorations
        this.decorations.forEach(dec => {
            const screen = camera.worldToScreen(dec.x, dec.y);
            if (dec.type === 'tree' && Assets.sprites.tree) {
                ctx.globalAlpha = 0.75;
                ctx.drawImage(Assets.sprites.tree, screen.x - 40 * dec.scale, screen.y, 80 * dec.scale, 160 * dec.scale);
                ctx.globalAlpha = 1;
            } else if (dec.type === 'vine' && Assets.sprites.vine) {
                ctx.drawImage(Assets.sprites.vine, screen.x, screen.y, 10, dec.length);
            }
        });

        // Ziplines
        this.ziplines.forEach(zip => {
            const start = camera.worldToScreen(zip.startX, zip.startY);
            const end = camera.worldToScreen(zip.endX, zip.endY);

            // Cable
            ctx.strokeStyle = '#4a4a55';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();

            // Posts
            ctx.fillStyle = '#3a3a42';
            ctx.fillRect(start.x - 4, start.y, 8, 40);
            ctx.fillRect(end.x - 4, end.y, 8, 30);

            // Handles
            ctx.fillStyle = '#5a5a65';
            ctx.beginPath();
            ctx.arc(start.x, start.y, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(end.x, end.y, 6, 0, Math.PI * 2);
            ctx.fill();
        });

        // Climbable vines
        this.climbableVines.forEach(vine => {
            const swayOffset = Math.sin(vine.swayPhase) * 5;
            const bottom = camera.worldToScreen(vine.x + swayOffset, vine.bottomY);
            const top = camera.worldToScreen(vine.x, vine.topY);

            // Vine rope
            ctx.strokeStyle = '#3a5040';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(top.x, top.y);
            ctx.quadraticCurveTo(bottom.x + swayOffset * 2, (top.y + bottom.y) / 2, bottom.x, bottom.y);
            ctx.stroke();

            // Leaves on vine
            ctx.fillStyle = '#4a6050';
            for (let i = 0; i < 4; i++) {
                const leafY = top.y + (vine.height / 4) * i * (camera.height / 600);
                const leafX = top.x + Math.sin(vine.swayPhase + i) * 3;
                ctx.beginPath();
                ctx.ellipse(leafX + 8, leafY, 8, 4, 0.3, 0, Math.PI * 2);
                ctx.fill();
            }

            // Grab indicator
            ctx.fillStyle = 'rgba(100, 150, 100, 0.3)';
            ctx.beginPath();
            ctx.arc(bottom.x, bottom.y - vine.height / 2, 15, 0, Math.PI * 2);
            ctx.fill();
        });

        // Regular platforms
        this.platforms.forEach(platform => {
            const screen = camera.worldToScreen(platform.x, platform.y);

            if (platform.type === 'wall') {
                ctx.fillStyle = '#2a2a32';
                ctx.fillRect(screen.x, screen.y, platform.width, platform.height);
                ctx.fillStyle = '#3a3a42';
                ctx.fillRect(screen.x, screen.y, platform.width, 4);
            } else if (platform.type === 'crumble') {
                ctx.globalAlpha = platform.falling ? 0.5 : (platform.timer > 0 ? 0.7 + Math.sin(Date.now() / 50) * 0.3 : 1);
                ctx.fillStyle = '#4a3a32';
                ctx.fillRect(screen.x, screen.y, platform.width, platform.height);
                ctx.fillStyle = '#5a4a42';
                ctx.fillRect(screen.x, screen.y, platform.width, 4);
                ctx.globalAlpha = 1;
            } else if (Assets.sprites.platform) {
                const tilesX = Math.ceil(platform.width / this.tileSize);
                for (let i = 0; i < tilesX; i++) {
                    ctx.drawImage(Assets.sprites.platform, screen.x + i * this.tileSize, screen.y, this.tileSize, this.tileSize * 2);
                }
            } else {
                ctx.fillStyle = '#3a3a42';
                ctx.fillRect(screen.x, screen.y, platform.width, platform.height);
            }
        });

        // Moving platforms
        this.movingPlatforms.forEach(mp => {
            const screen = camera.worldToScreen(mp.x, mp.y);
            ctx.fillStyle = 'rgba(100, 120, 120, 0.4)';
            ctx.fillRect(screen.x - 3, screen.y - 3, mp.width + 6, mp.height + 6);
            ctx.fillStyle = '#3a5050';
            ctx.fillRect(screen.x, screen.y, mp.width, mp.height);
            ctx.fillStyle = '#4a6060';
            ctx.fillRect(screen.x, screen.y, mp.width, 5);
            const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
            ctx.fillStyle = `rgba(100, 150, 150, ${pulse})`;
            ctx.fillRect(screen.x + 5, screen.y + 8, 5, 5);
            ctx.fillRect(screen.x + mp.width - 10, screen.y + 8, 5, 5);
        });

        // Checkpoints
        this.checkpoints.forEach(cp => {
            const screen = camera.worldToScreen(cp.x, cp.y);
            const glowIntensity = cp.reached ? 0.7 : (Math.sin(cp.glowPhase) + 1) / 3;
            ctx.fillStyle = cp.reached ? `rgba(80, 140, 80, ${glowIntensity})` : `rgba(120, 120, 140, ${glowIntensity})`;
            ctx.beginPath();
            ctx.arc(screen.x + cp.width / 2, screen.y + cp.height / 2, 50, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#3a3a42';
            ctx.fillRect(screen.x + 14, screen.y, 10, cp.height);
            ctx.fillStyle = cp.reached ? '#4a7a4a' : '#4a4a55';
            ctx.beginPath();
            ctx.moveTo(screen.x + 24, screen.y + 6);
            ctx.lineTo(screen.x + 55, screen.y + 18);
            ctx.lineTo(screen.x + 24, screen.y + 30);
            ctx.closePath();
            ctx.fill();
        });

        // Leaves
        this.leaves.forEach(leaf => {
            const screen = camera.worldToScreen(leaf.x, leaf.y);
            ctx.save();
            ctx.translate(screen.x, screen.y);
            ctx.rotate(leaf.rotation);
            ctx.globalAlpha = 0.65;
            ctx.fillStyle = '#2a3530';
            ctx.fillRect(-leaf.size / 2, -leaf.size / 2, leaf.size, leaf.size * 0.6);
            ctx.restore();
        });
        ctx.globalAlpha = 1;

        // Particles
        this.particles.forEach(p => {
            const screen = camera.worldToScreen(p.x, p.y);
            ctx.globalAlpha = p.life * 0.8;
            ctx.fillStyle = '#6a6a70';
            ctx.fillRect(screen.x, screen.y, p.size, p.size);
        });
        ctx.globalAlpha = 1;
    },

    checkCollision(entity) {
        for (const platform of this.platforms) {
            if (platform.type === 'wall') continue;
            if (platform.falling) continue;

            if (entity.x + entity.width > platform.x &&
                entity.x < platform.x + platform.width &&
                entity.y + entity.height > platform.y &&
                entity.y + entity.height < platform.y + platform.height + 15 &&
                entity.vy >= 0) {

                if (platform.type === 'crumble' && platform.timer === 0 && !platform.falling) {
                    platform.timer = 25;
                }
                return platform;
            }
        }

        for (const mp of this.movingPlatforms) {
            if (entity.x + entity.width > mp.x &&
                entity.x < mp.x + mp.width &&
                entity.y + entity.height > mp.y &&
                entity.y + entity.height < mp.y + mp.height + 15 &&
                entity.vy >= 0) {
                return mp;
            }
        }

        return null;
    },

    checkZiplineCollision(entity) {
        for (const zip of this.ziplines) {
            const dist = this.pointToLineDistance(
                entity.x + entity.width / 2, entity.y,
                zip.startX, zip.startY, zip.endX, zip.endY
            );
            if (dist < 20 && entity.x > zip.startX - 30 && entity.x < zip.endX + 30) {
                return zip;
            }
        }
        return null;
    },

    checkVineCollision(entity) {
        for (const vine of this.climbableVines) {
            if (Math.abs(entity.x + entity.width / 2 - vine.x) < 20 &&
                entity.y + entity.height > vine.topY &&
                entity.y < vine.bottomY) {
                return vine;
            }
        }
        return null;
    },

    pointToLineDistance(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        if (lenSq !== 0) param = dot / lenSq;
        let xx, yy;
        if (param < 0) { xx = x1; yy = y1; }
        else if (param > 1) { xx = x2; yy = y2; }
        else { xx = x1 + param * C; yy = y1 + param * D; }
        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    },

    checkWallCollision(entity) {
        for (const platform of this.platforms) {
            const entityRight = entity.x + entity.width;
            const entityBottom = entity.y + entity.height;
            const platformRight = platform.x + platform.width;

            if (entityRight > platform.x - 5 && entityRight < platform.x + 10 &&
                entity.y < platform.y + platform.height && entityBottom > platform.y) {
                return { direction: 1, platform };
            }

            if (entity.x < platformRight + 5 && entity.x > platformRight - 10 &&
                entity.y < platform.y + platform.height && entityBottom > platform.y) {
                return { direction: -1, platform };
            }
        }
        return null;
    },

    getMovingPlatformVelocity(platform) {
        if (!platform || !platform.moveType) return { x: 0, y: 0 };
        const speed = Math.cos(platform.phase) * platform.speed * platform.range * this.gameSpeed;
        if (platform.moveType === 'vertical') {
            return { x: 0, y: speed };
        } else {
            return { x: speed, y: 0 };
        }
    }
};
