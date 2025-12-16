// Enhanced Camera with Rich Parallax Backgrounds
const Camera = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    width: 0,
    height: 0,
    smoothing: 0.1,
    shake: 0,
    layers: [],
    fireflies: [],
    fogParticles: [],

    init(width, height) {
        this.width = width;
        this.height = height;
        this.generateBackgroundLayers();
        this.generateFireflies();
        this.generateFogParticles();
    },

    generateBackgroundLayers() {
        this.layers = [];

        this.layers.push({
            speed: 0.05,
            elements: this.generateMountains(4),
            color: '#0a0a0e'
        });

        this.layers.push({
            speed: 0.15,
            elements: this.generateForest(10, 0.3),
            color: '#0e0e14'
        });

        this.layers.push({
            speed: 0.3,
            elements: this.generateForest(15, 0.5),
            color: '#14141c'
        });

        this.layers.push({
            speed: 0.5,
            elements: this.generateForest(12, 0.8),
            color: '#1a1a24'
        });

        this.layers.push({
            speed: 0.6,
            elements: this.generateHangingVines(20),
            color: '#1a2820'
        });
    },

    generateMountains(count) {
        const elements = [];
        for (let i = 0; i < count; i++) {
            elements.push({
                x: (i / count) * 3000 - 500,
                height: 150 + Math.random() * 200,
                width: 400 + Math.random() * 300,
                type: 'mountain'
            });
        }
        return elements;
    },

    generateForest(count, scale) {
        const elements = [];
        for (let i = 0; i < count; i++) {
            elements.push({
                x: (i / count) * 2000 + Math.random() * 150 - 400,
                height: (60 + Math.random() * 100) * scale,
                width: (30 + Math.random() * 40) * scale,
                type: 'tree',
                variant: Math.floor(Math.random() * 3)
            });
        }
        return elements;
    },

    generateHangingVines(count) {
        const elements = [];
        for (let i = 0; i < count; i++) {
            elements.push({
                x: (i / count) * 1800 + Math.random() * 100 - 200,
                length: 60 + Math.random() * 120,
                sway: Math.random() * Math.PI * 2,
                type: 'vine'
            });
        }
        return elements;
    },

    generateFireflies() {
        this.fireflies = [];
        for (let i = 0; i < 15; i++) {
            this.fireflies.push({
                x: Math.random() * 1500,
                y: Math.random() * this.height * 0.7,
                phase: Math.random() * Math.PI * 2,
                speed: 0.3 + Math.random() * 0.3,
                size: 2 + Math.random() * 2
            });
        }
    },

    generateFogParticles() {
        this.fogParticles = [];
        for (let i = 0; i < 8; i++) {
            this.fogParticles.push({
                x: Math.random() * 2000,
                y: this.height * (0.4 + Math.random() * 0.4),
                width: 200 + Math.random() * 300,
                height: 40 + Math.random() * 60,
                speed: 0.1 + Math.random() * 0.15
            });
        }
    },

    follow(target) {
        this.targetX = target.x - this.width / 3;
        // Keep player visible in lower half of screen (especially for landscape phones)
        // Position camera so player appears in lower 60% of screen
        this.targetY = target.y - this.height * 0.6;
        this.targetY = Math.min(0, this.targetY);
    },

    update(deltaTime) {
        this.x += (this.targetX - this.x) * this.smoothing;
        this.y += (this.targetY - this.y) * this.smoothing;

        if (this.shake > 0) {
            this.shake *= 0.9;
        }

        const time = Date.now() / 1000;
        this.fireflies.forEach(f => {
            f.phase += 0.02;
            f.x += Math.sin(time * f.speed) * 0.5;
            f.y += Math.cos(time * f.speed * 1.3) * 0.3;
        });
    },

    addShake(amount) {
        this.shake = Math.min(this.shake + amount, 10);
    },

    render(ctx) {
        const shakeX = (Math.random() - 0.5) * this.shake;
        const shakeY = (Math.random() - 0.5) * this.shake;

        ctx.save();
        ctx.translate(shakeX, shakeY);

        const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#05050a');
        gradient.addColorStop(0.3, '#0a0a12');
        gradient.addColorStop(0.6, '#10101a');
        gradient.addColorStop(1, '#1a1a28');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);

        this.layers.forEach((layer) => {
            layer.elements.forEach(el => {
                const parallaxX = (el.x - this.x * layer.speed) % (this.width * 2.5);
                const adjustedX = parallaxX < -600 ? parallaxX + this.width * 2.5 : parallaxX;

                ctx.fillStyle = layer.color;

                if (el.type === 'mountain') {
                    this.drawMountain(ctx, adjustedX, this.height - el.height, el.width, el.height);
                } else if (el.type === 'tree') {
                    this.drawSilhouetteTree(ctx, adjustedX, this.height - el.height, el.width, el.height, el.variant);
                } else if (el.type === 'vine') {
                    this.drawVine(ctx, adjustedX, 0, el.length, el.sway);
                }
            });
        });

        ctx.globalAlpha = 0.15;
        ctx.fillStyle = '#2a2a35';
        this.fogParticles.forEach(fog => {
            const fogX = (fog.x - this.x * fog.speed) % (this.width + fog.width * 2);
            const adjustedX = fogX < -fog.width ? fogX + this.width + fog.width * 2 : fogX;

            ctx.beginPath();
            ctx.ellipse(adjustedX, fog.y, fog.width, fog.height, 0, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        const time = Date.now() / 1000;
        this.fireflies.forEach(f => {
            const ffX = (f.x - this.x * 0.4) % (this.width + 100);
            const adjustedX = ffX < -50 ? ffX + this.width + 100 : ffX;

            const glow = (Math.sin(f.phase + time * 2) + 1) / 2;
            ctx.globalAlpha = glow * 0.6;
            ctx.fillStyle = '#8a8a60';
            ctx.beginPath();
            ctx.arc(adjustedX, f.y, f.size * glow + 1, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = glow * 0.3;
            ctx.fillStyle = '#aaaa80';
            ctx.beginPath();
            ctx.arc(adjustedX, f.y, f.size * 3, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        ctx.restore();
    },

    drawMountain(ctx, x, y, w, h) {
        ctx.beginPath();
        ctx.moveTo(x, y + h);
        ctx.lineTo(x + w * 0.3, y + h * 0.3);
        ctx.lineTo(x + w * 0.5, y);
        ctx.lineTo(x + w * 0.7, y + h * 0.4);
        ctx.lineTo(x + w, y + h);
        ctx.closePath();
        ctx.fill();
    },

    drawSilhouetteTree(ctx, x, y, w, h, variant) {
        ctx.fillRect(x + w * 0.35, y, w * 0.3, h);

        if (variant === 0) {
            ctx.fillRect(x, y + h * 0.1, w, h * 0.15);
            ctx.fillRect(x + w * 0.2, y - h * 0.1, w * 0.6, h * 0.2);
        } else if (variant === 1) {
            ctx.fillRect(x - w * 0.1, y + h * 0.2, w * 0.5, h * 0.1);
            ctx.fillRect(x + w * 0.6, y + h * 0.1, w * 0.5, h * 0.1);
            ctx.fillRect(x + w * 0.1, y - h * 0.05, w * 0.8, h * 0.15);
        } else {
            ctx.beginPath();
            ctx.moveTo(x, y + h * 0.3);
            ctx.lineTo(x + w / 2, y - h * 0.1);
            ctx.lineTo(x + w, y + h * 0.3);
            ctx.fill();
        }
    },

    drawVine(ctx, x, y, length, sway) {
        const time = Date.now() / 1000;
        const swayAmount = Math.sin(time + sway) * 5;

        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let i = 0; i <= length; i += 5) {
            const xOffset = Math.sin((i / length) * Math.PI + time + sway) * swayAmount * (i / length);
            ctx.lineTo(x + xOffset, y + i);
        }
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#1a2820';
        ctx.stroke();
    },

    worldToScreen(worldX, worldY) {
        const shakeX = (Math.random() - 0.5) * this.shake * 0.5;
        const shakeY = (Math.random() - 0.5) * this.shake * 0.5;
        return {
            x: worldX - this.x + shakeX,
            y: worldY - this.y + shakeY
        };
    }
};
