// Audio System with Background Music and Sound Effects
const Audio = {
    context: null,
    masterVolume: 0.5,
    musicEnabled: true,
    sfxEnabled: true,
    backgroundMusic: null,
    musicElement: null,

    init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.loadSettings();
            this.setupBackgroundMusic();
        } catch (e) {
            console.log('Web Audio not supported');
        }
    },

    loadSettings() {
        const savedMusic = localStorage.getItem('nostagious_music');
        const savedSfx = localStorage.getItem('nostagious_sfx');

        if (savedMusic !== null) this.musicEnabled = savedMusic === 'true';
        if (savedSfx !== null) this.sfxEnabled = savedSfx === 'true';

        this.updateSettingsUI();
    },

    saveSettings() {
        localStorage.setItem('nostagious_music', this.musicEnabled);
        localStorage.setItem('nostagious_sfx', this.sfxEnabled);
    },

    updateSettingsUI() {
        const musicBtn = document.getElementById('music-toggle');
        const sfxBtn = document.getElementById('sfx-toggle');

        if (musicBtn) {
            musicBtn.textContent = this.musicEnabled ? '🎵 Música: ON' : '🎵 Música: OFF';
            musicBtn.classList.toggle('off', !this.musicEnabled);
        }
        if (sfxBtn) {
            sfxBtn.textContent = this.sfxEnabled ? '🔊 Sonidos: ON' : '🔊 Sonidos: OFF';
            sfxBtn.classList.toggle('off', !this.sfxEnabled);
        }
    },

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        this.saveSettings();
        this.updateSettingsUI();

        if (this.musicElement) {
            if (this.musicEnabled) {
                this.musicElement.play().catch(() => { });
            } else {
                this.musicElement.pause();
            }
        }
    },

    toggleSfx() {
        this.sfxEnabled = !this.sfxEnabled;
        this.saveSettings();
        this.updateSettingsUI();
    },

    setupBackgroundMusic() {
        this.musicElement = document.createElement('audio');
        this.musicElement.src = 'music.mp3';
        this.musicElement.loop = true;
        this.musicElement.volume = 0.4;
        this.musicElement.preload = 'auto';
    },

    setTrack(trackFile) {
        if (!this.musicElement) this.setupBackgroundMusic();

        // Don't restart if already playing this track
        if (this.musicElement.src.endsWith(trackFile)) return;

        const wasPlaying = !this.musicElement.paused;
        this.musicElement.src = trackFile;
        this.musicElement.currentTime = 0;

        if (wasPlaying && this.musicEnabled) {
            this.musicElement.play().catch(() => { });
        }
    },

    startMusic() {
        if (this.musicElement && this.musicEnabled) {
            this.musicElement.currentTime = 0;
            this.musicElement.play().catch(() => {
                // Auto-play blocked, will start on user interaction
            });
        }
    },

    stopMusic() {
        if (this.musicElement) {
            this.musicElement.pause();
            this.musicElement.currentTime = 0;
        }
    },

    resume() {
        if (this.context && this.context.state === 'suspended') {
            this.context.resume();
        }
        // Try to start music on user interaction
        if (this.musicElement && this.musicEnabled && this.musicElement.paused) {
            this.musicElement.play().catch(() => { });
        }
    },

    play(sound) {
        if (!this.context || !this.sfxEnabled) return;
        if (this.context.state === 'suspended') {
            this.context.resume();
        }

        try {
            switch (sound) {
                case 'jump':
                    this.playTone(280, 0.1, 'square', 0.3);
                    this.playTone(350, 0.08, 'square', 0.2, 0.05);
                    break;
                case 'doubleJump':
                    this.playTone(400, 0.08, 'square', 0.25);
                    this.playTone(500, 0.08, 'square', 0.2, 0.04);
                    this.playTone(600, 0.06, 'square', 0.15, 0.08);
                    break;
                case 'dash':
                    this.playNoise(0.15, 0.4);
                    this.playTone(150, 0.1, 'sawtooth', 0.3);
                    break;
                case 'shoot':
                    this.playTone(800, 0.05, 'square', 0.2);
                    this.playTone(400, 0.08, 'square', 0.15, 0.03);
                    this.playNoise(0.08, 0.2);
                    break;
                case 'hit':
                    this.playTone(300, 0.1, 'square', 0.3);
                    this.playTone(200, 0.15, 'sawtooth', 0.2, 0.05);
                    break;
                case 'enemyDeath':
                    this.playTone(400, 0.1, 'square', 0.25);
                    this.playTone(300, 0.1, 'square', 0.2, 0.08);
                    this.playTone(200, 0.15, 'square', 0.15, 0.15);
                    this.playNoise(0.1, 0.2, 0.1);
                    break;
                case 'damage':
                    this.playTone(200, 0.2, 'sawtooth', 0.4);
                    this.playTone(150, 0.25, 'square', 0.3, 0.1);
                    this.playNoise(0.15, 0.3);
                    break;
                case 'checkpoint':
                    this.playTone(523, 0.15, 'sine', 0.3);
                    this.playTone(659, 0.15, 'sine', 0.25, 0.1);
                    this.playTone(784, 0.2, 'sine', 0.3, 0.2);
                    break;
                case 'powerup':
                    this.playTone(440, 0.1, 'sine', 0.25);
                    this.playTone(550, 0.1, 'sine', 0.25, 0.08);
                    this.playTone(660, 0.1, 'sine', 0.25, 0.16);
                    this.playTone(880, 0.15, 'sine', 0.3, 0.24);
                    break;
                case 'bossAppear':
                    this.playTone(100, 0.3, 'sawtooth', 0.4);
                    this.playTone(80, 0.4, 'sawtooth', 0.35, 0.2);
                    this.playNoise(0.3, 0.3, 0.1);
                    break;
                case 'bossDefeat':
                    for (let i = 0; i < 5; i++) {
                        this.playTone(200 + i * 100, 0.15, 'square', 0.25, i * 0.1);
                        this.playNoise(0.1, 0.2, i * 0.1);
                    }
                    this.playTone(800, 0.4, 'sine', 0.3, 0.5);
                    break;
            }
        } catch (e) {
            console.log('Audio error:', e);
        }
    },

    playTone(frequency, duration, type = 'sine', volume = 0.3, delay = 0) {
        if (!this.context) return;

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        const now = this.context.currentTime + delay;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume * this.masterVolume, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

        oscillator.start(now);
        oscillator.stop(now + duration + 0.01);
    },

    playNoise(duration, volume = 0.2, delay = 0) {
        if (!this.context) return;

        const bufferSize = this.context.sampleRate * duration;
        const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.context.createBufferSource();
        const gainNode = this.context.createGain();
        const filter = this.context.createBiquadFilter();

        noise.buffer = buffer;
        filter.type = 'lowpass';
        filter.frequency.value = 2000;

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.context.destination);

        const now = this.context.currentTime + delay;
        gainNode.gain.setValueAtTime(volume * this.masterVolume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

        noise.start(now);
        noise.stop(now + duration);
    }
};
