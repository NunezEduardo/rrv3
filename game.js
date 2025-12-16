// Enhanced Game Controller - Fixed Combat, Progression, and Mobile Support
const Game = {
    canvas: null,
    ctx: null,
    state: 'menu',
    distance: 0,
    startX: 0,
    lastTime: 0,

    // Score & Progression
    score: 0,
    level: 1,

    // Checkpoint system
    checkpointsReached: 0,
    checkpointTimer: 0,
    maxCheckpointTime: 30,
    timerActive: false,

    // Combo system
    combo: 0,
    maxCombo: 0,
    comboTimer: 0,

    // Message system
    messageTimer: 0,

    // Scale factor for different screen sizes
    scaleFactor: 1,
    mode: 'normal', // 'normal', 'hardcore', 'coop'

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.ctx.imageSmoothingEnabled = false;

        // Update Camera dimensions if it exists
        if (typeof Camera !== 'undefined' && Camera.init) {
            Camera.width = this.canvas.width;
            Camera.height = this.canvas.height;
        }

        // Update Platforms base Y for responsive layout
        if (typeof Platforms !== 'undefined') {
            Platforms.baseY = Math.min(420, this.canvas.height * 0.7);
        }
    },

    init() {
        console.log("Game.init() called");
        try {
            this.canvas = document.getElementById('game-canvas');
            this.ctx = this.canvas.getContext('2d');

            this.resize();
            window.addEventListener('resize', () => this.resize());
            window.addEventListener('orientationchange', () => {
                setTimeout(() => this.resize(), 100);
            });

            // Check for Co-op Join Link
            const urlParams = new URLSearchParams(window.location.search);
            const joinId = urlParams.get('join');

            if (joinId) {
                console.log("Join ID found:", joinId);
                this.showCoopLobby(false, joinId);
            }

            Audio.init();
            Assets.init();
            Input.init();
            Camera.init(this.canvas.width, this.canvas.height);
            Combat.init();
            Enemies.init();
            Bosses.init();

            this.setupUI();
            this.createMenuParticles();
            this.lastTime = performance.now();
            this.loop();
            console.log("Game initialized successfully");
        } catch (e) {
            console.error("Game init failed:", e);
            alert("Game init failed: " + e.message);
        }
    },

    setupUI() {
        console.log("Setting up UI...");
        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                console.log("Start button clicked");
                this.startGame('normal');
            });
        } else {
            console.error("Start button not found!");
        }

        const hardcoreBtn = document.getElementById('hardcore-btn');
        if (hardcoreBtn) {
            hardcoreBtn.addEventListener('click', () => {
                console.log("Hardcore button clicked");
                this.startGame('hardcore');
            });
        }

        const coopBtn = document.getElementById('coop-btn');
        if (coopBtn) {
            coopBtn.addEventListener('click', () => {
                console.log("Coop button clicked");
                this.showCoopLobby(true);
            });
        }

        document.getElementById('coop-back-btn').addEventListener('click', () => {
            document.getElementById('coop-panel').classList.add('hidden');
            document.getElementById('main-menu').classList.remove('hidden');
            if (Network.peer) Network.peer.destroy();
        });

        document.getElementById('controls-btn').addEventListener('click', () => this.showControls());
        document.getElementById('back-btn').addEventListener('click', () => this.hideControls());
        document.getElementById('retry-btn').addEventListener('click', () => this.startGame(this.mode));
        document.getElementById('menu-btn').addEventListener('click', () => this.showMenu());

        // Settings panel
        document.getElementById('settings-btn').addEventListener('click', () => this.showSettings());
        document.getElementById('settings-back-btn').addEventListener('click', () => this.hideSettings());
        document.getElementById('music-toggle').addEventListener('click', () => Audio.toggleMusic());
        document.getElementById('sfx-toggle').addEventListener('click', () => Audio.toggleSfx());
    },

    showSettings() {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('settings-panel').classList.remove('hidden');
        Audio.updateSettingsUI();
    },

    hideSettings() {
        document.getElementById('settings-panel').classList.add('hidden');
        document.getElementById('main-menu').classList.remove('hidden');
    },

    createMenuParticles() {
        const container = document.getElementById('menu-particles');
        if (!container) return;

        container.innerHTML = '';
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: absolute;
                width: ${3 + Math.random() * 5}px;
                height: ${3 + Math.random() * 5}px;
                background: rgba(100, 100, 120, ${0.2 + Math.random() * 0.4});
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: float ${4 + Math.random() * 8}s linear infinite;
                animation-delay: ${-Math.random() * 5}s;
            `;
            container.appendChild(particle);
        }

        if (!document.getElementById('float-keyframes')) {
            const style = document.createElement('style');
            style.id = 'float-keyframes';
            style.textContent = `
                @keyframes float {
                    0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.3; }
                    25% { transform: translate(30px, -40px) rotate(90deg); opacity: 0.7; }
                    50% { transform: translate(-15px, -80px) rotate(180deg); opacity: 0.4; }
                    75% { transform: translate(40px, -40px) rotate(270deg); opacity: 0.7; }
                }
            `;
            document.head.appendChild(style);
        }
    },

    showCoopLobby(isHost, joinId = null) {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('coop-panel').classList.remove('hidden');

        if (isHost) {
            document.getElementById('host-ui').classList.remove('hidden');
            document.getElementById('join-ui').classList.add('hidden');
        } else {
            document.getElementById('host-ui').classList.add('hidden');
            document.getElementById('join-ui').classList.remove('hidden');
        }

        Network.onConnect = () => {
            if (isHost) {
                setTimeout(() => this.startGame('coop'), 1000);
            }
        };

        Network.onData = (data) => {
            if (isHost) {
                if (data.type === 'input') {
                    Player.handleRemoteInput(data.keys);
                }
            } else {
                if (data.type === 'start') {
                    this.startGame('coop');
                } else if (data.type === 'state') {
                    Player.handleRemoteState(data);
                    Camera.x = data.cam.x;
                }
            }
        };

        Network.init(isHost, joinId);
    },

    startGame(mode = 'normal') {
        this.mode = mode;
        this.state = 'playing';
        this.distance = 0;
        this.score = 0;
        this.level = 1;
        this.checkpointsReached = 0;
        this.checkpointTimer = this.maxCheckpointTime;
        this.timerActive = true;
        this.combo = 0;
        this.maxCombo = 0;
        this.comboTimer = 0;

        if (mode === 'coop') {
            if (Network.isHost) {
                Network.send({ type: 'start' });
            }
            // Increase hp for coop
            Player.maxHealth = 5;
            Player.health = 5;
            Audio.setTrack('music.mp3');
        } else if (mode === 'hardcore') {
            Player.maxHealth = 1; // Hardcore: 1 HP start? Or maybe 3 but keeps normal. User asked for diff.
            // Let's keep 3 but rely on enemies.js for difficulty
            Player.maxHealth = 3;
            Player.health = 3;
            Audio.setTrack('hardcore.mp3');
        } else {
            Player.maxHealth = 3;
            Player.health = 3;
            Audio.setTrack('music.mp3');
        }

        Audio.resume();
        Audio.startMusic();

        // Initialize with screen-relative positions
        Platforms.baseY = Math.min(420, this.canvas.height * 0.7);

        Player.init();
        Platforms.init();
        Enemies.init();
        Combat.init();
        Bosses.init();
        Camera.init(this.canvas.width, this.canvas.height);
        Camera.x = 0;
        Camera.y = 0;

        // Adjust player starting position based on screen height
        Player.y = Platforms.baseY - Player.height - 20;

        this.startX = Player.x;

        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('coop-panel').classList.add('hidden');
        document.getElementById('game-over').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        document.getElementById('boss-warning').classList.add('hidden');
        if (mode !== 'hardcore') { // Hardcore might not show distance/score hints or maybe yes? default yes.
        }
        Input.showTouchControls();

        this.updateHealthUI();
        this.updateCheckpointUI();
        this.updateTimerUI();
        this.updateScoreUI();
        this.updateStatsUI();
    },

    showControls() {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('controls-panel').classList.remove('hidden');
    },

    hideControls() {
        document.getElementById('controls-panel').classList.add('hidden');
        document.getElementById('main-menu').classList.remove('hidden');
    },

    showMenu() {
        this.state = 'menu';
        document.getElementById('game-over').classList.add('hidden');
        document.getElementById('main-menu').classList.remove('hidden');
        document.getElementById('hud').classList.add('hidden');
        Input.hideTouchControls();
    },

    reachCheckpoint(checkpoint) {
        this.checkpointsReached++;
        this.checkpointTimer = this.maxCheckpointTime;
        Camera.addShake(4);
        Audio.play('checkpoint');

        if (this.checkpointsReached % 2 === 0) {
            this.level++;
            this.showMessage(`¡NIVEL ${this.level}!`);
        }

        this.addScore(100 + this.combo * 10 + this.level * 50);
        this.maxCheckpointTime = Math.max(20, 30 - this.checkpointsReached * 0.5);

        this.updateCheckpointUI();
        this.updateTimerUI();

        const timerEl = document.getElementById('checkpoint-timer');
        if (timerEl) {
            timerEl.style.background = 'rgba(74, 138, 74, 0.4)';
            timerEl.style.transform = 'scale(1.1)';
            setTimeout(() => { timerEl.style.background = ''; timerEl.style.transform = ''; }, 400);
        }
    },

    addCombo() {
        this.combo++;
        this.comboTimer = 120;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;

        if (this.combo >= 2) {
            this.showMessage(`${this.combo}x COMBO!`);
        }

        if (this.combo >= 3) {
            this.checkpointTimer = Math.min(this.maxCheckpointTime, this.checkpointTimer + 2);
            this.updateTimerUI();
        }
    },

    addScore(amount) {
        this.score += amount * this.level;
        this.updateScoreUI();
    },

    showMessage(text) {
        const el = document.getElementById('message-display');
        if (el) {
            el.textContent = text;
            el.classList.remove('show');
            void el.offsetWidth;
            el.classList.add('show');

            clearTimeout(this.messageTimer);
            this.messageTimer = setTimeout(() => el.classList.remove('show'), 1500);
        }
    },

    updateHealthUI() {
        for (let i = 1; i <= 3; i++) {
            const heart = document.getElementById(`heart-${i}`);
            if (heart) {
                heart.classList.toggle('empty', i > Player.health);
            }
        }
    },

    updateCheckpointUI() {
        const el = document.getElementById('checkpoints');
        if (el) el.textContent = this.checkpointsReached;
    },

    updateTimerUI() {
        const timerEl = document.getElementById('checkpoint-timer');
        const valueEl = document.getElementById('timer-value');

        if (timerEl && valueEl) {
            if (this.timerActive) {
                timerEl.classList.remove('hidden');
                valueEl.textContent = Math.ceil(this.checkpointTimer);
                timerEl.classList.toggle('urgent', this.checkpointTimer <= 8);
            } else {
                timerEl.classList.add('hidden');
            }
        }
    },

    updateScoreUI() {
        const el = document.getElementById('score');
        if (el) el.textContent = this.score;
    },

    updateStatsUI() {
        const damageEl = document.getElementById('damage-stat');
        const speedEl = document.getElementById('speed-stat');

        if (damageEl) damageEl.textContent = Combat.damage;
        if (speedEl) speedEl.textContent = `${Platforms.gameSpeed.toFixed(1)}x`;
    },

    gameOver() {
        this.state = 'gameover';
        this.timerActive = false;
        Camera.addShake(10);
        Audio.stopMusic();

        document.getElementById('hud').classList.add('hidden');
        document.getElementById('boss-warning').classList.add('hidden');
        Input.hideTouchControls();
        document.getElementById('final-distance').textContent = `${this.distance}m`;
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-bosses').textContent = Bosses.bossDefeated;

        setTimeout(() => {
            document.getElementById('game-over').classList.remove('hidden');
        }, 600);
    },

    update(deltaTime) {
        if (this.state !== 'playing') return;

        // Combo decay
        if (this.comboTimer > 0) {
            this.comboTimer--;
            if (this.comboTimer <= 0) this.combo = 0;
        }

        // Checkpoint timer
        if (this.timerActive) {
            this.checkpointTimer -= deltaTime;
            this.updateTimerUI();

            if (this.checkpointTimer <= 0) {
                Player.takeDamage();
                this.checkpointTimer = this.maxCheckpointTime;
            }
        }

        // Update distance
        this.distance = Math.floor((Player.x - this.startX) / 10);
        document.getElementById('distance').textContent = `${this.distance}m`;

        // Check boss spawn
        Bosses.checkSpawn(this.distance);

        // Show boss warning
        const bossWarning = document.getElementById('boss-warning');
        if (Bosses.activeBoss && Bosses.activeBoss.state === 'entering') {
            bossWarning.classList.remove('hidden');
        } else {
            bossWarning.classList.add('hidden');
        }

        // Update all systems
        Player.update();
        Camera.follow(Player);
        Camera.update(deltaTime);
        Platforms.update(Camera.x, this.canvas.width, Player);
        Enemies.update(Camera.x, this.canvas.width, Player);
        Combat.update(Player);
        Bosses.update(Player, Camera.x);

        this.updateStatsUI();

        // Network Sync
        if (this.mode === 'coop' && Network.isConnected) {
            if (Network.isHost) {
                // Host sends authoritative state
                Network.send({
                    type: 'state',
                    p1: { x: Player.x, y: Player.y, vx: Player.vx, vy: Player.vy, anim: Player.animFrame, facing: Player.facing },
                    // Simplified state for p2 just to echo back or confirm
                    cam: { x: Camera.x }
                });
                // Update P2 ghost
                if (Player.p2) {
                    // P2 logic is handled by receiving inputs
                }
            } else {
                // Client sends input
                Network.send({
                    type: 'input',
                    keys: Input.keys
                });
            }
        }

        // Check death
        if (Player.isDead(this.canvas.height)) {
            this.gameOver();
        }
    },

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        Camera.render(this.ctx);

        if (this.state === 'playing' || this.state === 'gameover') {
            Platforms.render(this.ctx, Camera);
            Enemies.render(this.ctx, Camera);
            Bosses.render(this.ctx, Camera);
            Combat.render(this.ctx, Camera);
            Player.render(this.ctx, Camera);
            if (this.mode === 'coop') {
                Player.renderP2(this.ctx, Camera);
            }
        }
    },

    loop() {
        const currentTime = performance.now();
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.05);
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();
        requestAnimationFrame(() => this.loop());
    }
};

document.addEventListener('DOMContentLoaded', () => Game.init());
