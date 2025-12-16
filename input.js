// Input Handler with Touch Buttons
const Input = {
    keys: {},
    touchActive: false,

    init() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (['Space', 'ArrowUp', 'ArrowDown', 'KeyX', 'KeyZ'].includes(e.code)) {
                e.preventDefault();
            }
            if (Audio && Audio.resume) Audio.resume();
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        this.setupTouchButtons();
        this.detectTouch();
    },

    detectTouch() {
        // Show touch controls on touch devices
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (isTouchDevice) {
            this.touchActive = true;
        }
    },

    showTouchControls() {
        const touchControls = document.getElementById('touch-controls');
        if (touchControls && this.touchActive) {
            touchControls.classList.remove('hidden');
        }
    },

    hideTouchControls() {
        const touchControls = document.getElementById('touch-controls');
        if (touchControls) {
            touchControls.classList.add('hidden');
        }
    },

    setupTouchButtons() {
        const leftBtn = document.getElementById('touch-left-btn');
        const rightBtn = document.getElementById('touch-right-btn');
        const jumpBtn = document.getElementById('touch-jump-btn');
        const shootBtn = document.getElementById('touch-shoot-btn');
        const dashBtn = document.getElementById('touch-dash-btn');

        // Helper for touch events
        const addTouchEvents = (btn, keyCode) => {
            if (!btn) return;

            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.keys[keyCode] = true;
                btn.classList.add('pressed');
                if (Audio && Audio.resume) Audio.resume();
            }, { passive: false });

            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.keys[keyCode] = false;
                btn.classList.remove('pressed');
            }, { passive: false });

            btn.addEventListener('touchcancel', (e) => {
                this.keys[keyCode] = false;
                btn.classList.remove('pressed');
            });

            // Prevent context menu on long press
            btn.addEventListener('contextmenu', (e) => e.preventDefault());
        };

        addTouchEvents(leftBtn, 'ArrowLeft');
        addTouchEvents(rightBtn, 'ArrowRight');
        addTouchEvents(jumpBtn, 'Space');
        addTouchEvents(shootBtn, 'KeyX');
        addTouchEvents(dashBtn, 'ShiftLeft');

        // Handle multi-touch for movement + action
        document.addEventListener('touchstart', (e) => {
            if (Audio && Audio.resume) Audio.resume();
        }, { passive: true });
    },

    isPressed(action) {
        switch (action) {
            case 'left':
                return this.keys['ArrowLeft'] || this.keys['KeyA'];
            case 'right':
                return this.keys['ArrowRight'] || this.keys['KeyD'];
            case 'up':
                return this.keys['ArrowUp'] || this.keys['KeyW'];
            case 'jump':
                return this.keys['Space'] || this.keys['ArrowUp'] || this.keys['KeyW'];
            case 'dash':
                return this.keys['ShiftLeft'] || this.keys['ShiftRight'];
            case 'down':
                return this.keys['ArrowDown'] || this.keys['KeyS'];
            case 'shoot':
                return this.keys['KeyX'] || this.keys['KeyJ'] || this.keys['Period'];
            case 'special':
                return this.keys['KeyZ'] || this.keys['KeyK'] || this.keys['Comma'];
            default:
                return false;
        }
    },

    consumeKey(code) {
        const was = this.keys[code];
        this.keys[code] = false;
        return was;
    }
};
