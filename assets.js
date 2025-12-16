// Assets - Enhanced Pixel Art Generator (Larger Character)
const Assets = {
    canvas: null,
    ctx: null,
    sprites: {},

    init() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.generateAll();
    },

    generateAll() {
        this.sprites.playerIdle = this.generatePlayerIdle();
        this.sprites.playerRun = this.generatePlayerRun();
        this.sprites.playerJump = this.generatePlayer('jump');
        this.sprites.playerFall = this.generatePlayer('fall');
        this.sprites.playerSlide = this.generatePlayer('slide');
        this.sprites.playerWall = this.generatePlayer('wall');
        this.sprites.playerDash = this.generatePlayer('dash');
        this.sprites.platform = this.generatePlatform();
        this.sprites.tree = this.generateTree();
        this.sprites.vine = this.generateVine();
        this.sprites.dust = this.generateDust();
        this.sprites.leaf = this.generateLeaf();
    },

    generatePlayerIdle() {
        const frames = [];
        for (let i = 0; i < 4; i++) {
            this.canvas.width = 32;
            this.canvas.height = 48;
            this.ctx.clearRect(0, 0, 32, 48);

            const c = { dark: '#1a1a22', mid: '#3a3a45', light: '#5a5a65', scarf: '#4a4a55', eye: '#7a7a85' };
            const breathOffset = Math.sin(i * Math.PI / 2) * 1;

            // Head
            this.ctx.fillStyle = c.mid;
            this.ctx.fillRect(10, 4 + breathOffset, 12, 12);
            this.ctx.fillStyle = c.light;
            this.ctx.fillRect(11, 5 + breathOffset, 10, 10);

            // Hair
            this.ctx.fillStyle = c.dark;
            this.ctx.fillRect(10, 3 + breathOffset, 12, 4);
            this.ctx.fillRect(8, 5 + breathOffset, 3, 6);

            // Eyes
            this.ctx.fillStyle = c.eye;
            this.ctx.fillRect(13, 9 + breathOffset, 2, 3);
            this.ctx.fillRect(17, 9 + breathOffset, 2, 3);
            this.ctx.fillStyle = '#fff';
            this.ctx.fillRect(13, 9 + breathOffset, 1, 1);
            this.ctx.fillRect(17, 9 + breathOffset, 1, 1);

            // Body
            this.ctx.fillStyle = c.dark;
            this.ctx.fillRect(10, 16 + breathOffset, 12, 16);
            this.ctx.fillStyle = c.mid;
            this.ctx.fillRect(11, 17 + breathOffset, 10, 14);

            // Scarf
            this.ctx.fillStyle = c.scarf;
            this.ctx.fillRect(8, 16 + breathOffset, 4, 5);
            this.ctx.fillRect(6, 20 + breathOffset, 4, 8 + i % 2);

            // Legs
            this.ctx.fillStyle = c.dark;
            this.ctx.fillRect(10, 32, 4, 14);
            this.ctx.fillRect(18, 32, 4, 14);

            // Feet
            this.ctx.fillStyle = c.mid;
            this.ctx.fillRect(9, 44, 6, 4);
            this.ctx.fillRect(17, 44, 6, 4);

            frames.push(this.createImageFromCanvas());
        }
        return frames;
    },

    generatePlayerRun() {
        const frames = [];
        const legPositions = [[0, 4], [2, 2], [4, 0], [2, 2]];

        for (let i = 0; i < 4; i++) {
            this.canvas.width = 32;
            this.canvas.height = 48;
            this.ctx.clearRect(0, 0, 32, 48);

            const c = { dark: '#1a1a22', mid: '#3a3a45', light: '#5a5a65', scarf: '#4a4a55', eye: '#7a7a85' };
            const bobOffset = i % 2 === 0 ? 0 : -2;

            // Head
            this.ctx.fillStyle = c.light;
            this.ctx.fillRect(11, 5 + bobOffset, 10, 10);
            this.ctx.fillStyle = c.dark;
            this.ctx.fillRect(10, 3 + bobOffset, 12, 4);
            this.ctx.fillRect(8, 5 + bobOffset, 3, 5);

            // Eyes
            this.ctx.fillStyle = c.eye;
            this.ctx.fillRect(14, 9 + bobOffset, 2, 2);
            this.ctx.fillRect(18, 9 + bobOffset, 2, 2);

            // Body
            this.ctx.fillStyle = c.dark;
            this.ctx.fillRect(10, 15 + bobOffset, 12, 16);

            // Scarf flowing
            this.ctx.fillStyle = c.scarf;
            this.ctx.fillRect(7, 15 + bobOffset, 4, 4);
            this.ctx.fillRect(4 - i % 2, 18 + bobOffset, 5, 10);
            this.ctx.fillRect(2 - i % 2, 24 + bobOffset, 4, 6);

            // Running legs
            this.ctx.fillStyle = c.dark;
            const [leg1, leg2] = legPositions[i];
            this.ctx.fillRect(10, 31, 4, 12 - leg1);
            this.ctx.fillRect(18, 31, 4, 12 - leg2);

            // Feet
            this.ctx.fillStyle = c.mid;
            this.ctx.fillRect(9, 42 - leg1, 6, 4);
            this.ctx.fillRect(17, 42 - leg2, 6, 4);

            frames.push(this.createImageFromCanvas());
        }
        return frames;
    },

    generatePlayer(state) {
        this.canvas.width = 32;
        this.canvas.height = 48;
        this.ctx.clearRect(0, 0, 32, 48);

        const c = { dark: '#1a1a22', mid: '#3a3a45', light: '#5a5a65', scarf: '#4a4a55', eye: '#7a7a85' };

        // Head
        this.ctx.fillStyle = c.light;
        this.ctx.fillRect(11, 5, 10, 10);
        this.ctx.fillStyle = c.dark;
        this.ctx.fillRect(10, 3, 12, 4);

        // Eyes
        this.ctx.fillStyle = c.eye;
        this.ctx.fillRect(13, 9, 2, 2);
        this.ctx.fillRect(17, 9, 2, 2);

        // Body
        this.ctx.fillStyle = c.dark;
        this.ctx.fillRect(10, 15, 12, 16);

        // Scarf
        this.ctx.fillStyle = c.scarf;

        if (state === 'jump') {
            this.ctx.fillRect(6, 16, 4, 4);
            this.ctx.fillRect(3, 20, 5, 8);
            // Legs up
            this.ctx.fillStyle = c.dark;
            this.ctx.fillRect(8, 31, 6, 10);
            this.ctx.fillRect(18, 31, 6, 10);
        } else if (state === 'fall') {
            this.ctx.fillRect(4, 14, 6, 4);
            this.ctx.fillRect(1, 16, 5, 10);
            // Legs spread
            this.ctx.fillStyle = c.dark;
            this.ctx.fillRect(7, 31, 5, 14);
            this.ctx.fillRect(20, 31, 5, 14);
        } else if (state === 'slide') {
            this.ctx.fillRect(7, 8, 4, 6);
            this.ctx.fillRect(4, 12, 5, 6);
            // Crouching body
            this.ctx.fillStyle = c.dark;
            this.ctx.fillRect(8, 20, 16, 10);
            this.ctx.fillRect(6, 28, 20, 6);
            // Modify head position
            this.ctx.fillStyle = c.light;
            this.ctx.fillRect(10, 12, 10, 10);
        } else if (state === 'wall') {
            this.ctx.fillRect(20, 16, 4, 5);
            this.ctx.fillRect(22, 20, 5, 8);
            // Against wall pose
            this.ctx.fillStyle = c.dark;
            this.ctx.fillRect(10, 31, 4, 14);
            this.ctx.fillRect(18, 30, 4, 15);
        } else if (state === 'dash') {
            this.ctx.fillRect(2, 15, 6, 4);
            this.ctx.fillRect(-2, 18, 6, 10);
            // Stretched pose
            this.ctx.fillStyle = c.dark;
            this.ctx.fillRect(10, 32, 4, 12);
            this.ctx.fillRect(18, 30, 4, 14);
        } else {
            this.ctx.fillRect(7, 16, 4, 5);
            this.ctx.fillRect(5, 20, 4, 8);
            this.ctx.fillStyle = c.dark;
            this.ctx.fillRect(10, 31, 4, 14);
            this.ctx.fillRect(18, 31, 4, 14);
        }

        return this.createImageFromCanvas();
    },

    generatePlatform() {
        this.canvas.width = 16;
        this.canvas.height = 16;
        this.ctx.clearRect(0, 0, 16, 16);

        this.ctx.fillStyle = '#2a2a32';
        this.ctx.fillRect(0, 0, 16, 16);

        this.ctx.fillStyle = '#3a3a42';
        this.ctx.fillRect(0, 0, 16, 5);
        this.ctx.fillStyle = '#4a4a52';
        this.ctx.fillRect(0, 0, 16, 2);

        // Cracks and details
        this.ctx.fillStyle = '#1a1a22';
        this.ctx.fillRect(3, 6, 2, 4);
        this.ctx.fillRect(10, 8, 3, 5);
        this.ctx.fillRect(6, 12, 2, 3);

        // Moss
        this.ctx.fillStyle = '#2a3a32';
        this.ctx.fillRect(0, 4, 3, 1);
        this.ctx.fillRect(13, 4, 3, 1);

        return this.createImageFromCanvas();
    },

    generateTree() {
        this.canvas.width = 80;
        this.canvas.height = 160;
        this.ctx.clearRect(0, 0, 80, 160);

        this.ctx.fillStyle = '#0e0e12';
        // Twisted trunk
        this.ctx.fillRect(32, 50, 16, 110);
        this.ctx.fillRect(28, 70, 8, 80);

        // Branches
        this.ctx.fillRect(10, 30, 60, 8);
        this.ctx.fillRect(5, 20, 12, 25);
        this.ctx.fillRect(63, 22, 12, 20);
        this.ctx.fillRect(25, 10, 30, 10);
        this.ctx.fillRect(38, 2, 10, 15);

        // Root details
        this.ctx.fillRect(20, 145, 10, 15);
        this.ctx.fillRect(50, 148, 12, 12);

        return this.createImageFromCanvas();
    },

    generateVine() {
        this.canvas.width = 10;
        this.canvas.height = 80;
        this.ctx.clearRect(0, 0, 10, 80);

        this.ctx.fillStyle = '#1a2a22';
        for (let y = 0; y < 80; y += 6) {
            const x = Math.sin(y / 12) * 3 + 4;
            this.ctx.fillRect(x, y, 3, 8);
        }

        // Leaves
        this.ctx.fillStyle = '#2a3a30';
        this.ctx.fillRect(1, 15, 4, 3);
        this.ctx.fillRect(6, 35, 4, 3);
        this.ctx.fillRect(2, 55, 4, 3);

        return this.createImageFromCanvas();
    },

    generateDust() {
        this.canvas.width = 6;
        this.canvas.height = 6;
        this.ctx.clearRect(0, 0, 6, 6);

        this.ctx.fillStyle = 'rgba(90, 90, 100, 0.7)';
        this.ctx.fillRect(2, 2, 3, 3);
        this.ctx.fillRect(1, 3, 1, 1);
        this.ctx.fillRect(4, 1, 1, 1);

        return this.createImageFromCanvas();
    },

    generateLeaf() {
        this.canvas.width = 8;
        this.canvas.height = 8;
        this.ctx.clearRect(0, 0, 8, 8);

        this.ctx.fillStyle = '#2a3530';
        this.ctx.fillRect(2, 1, 4, 2);
        this.ctx.fillRect(1, 3, 6, 2);
        this.ctx.fillRect(3, 5, 2, 2);

        return this.createImageFromCanvas();
    },

    createImageFromCanvas() {
        const img = new Image();
        img.src = this.canvas.toDataURL();
        return img;
    }
};
