// Enhanced Player with Ziplines and Vine Climbing
const Player = {
    x: 100,
    y: 300,
    width: 32,
    height: 48,
    vx: 0,
    vy: 0,

    gravity: 0.65,
    friction: 0.85,
    maxSpeed: 8,
    acceleration: 1.2,
    jumpForce: -14,

    health: 3,
    maxHealth: 3,
    invincible: false,
    invincibleTimer: 0,

    grounded: false,
    canDoubleJump: true,
    facing: 1,
    state: 'idle',

    animFrame: 0,
    animTimer: 0,

    dashCooldown: 0,
    dashDuration: 0,
    dashSpeed: 22,
    isDashing: false,

    onWall: false,
    wallDirection: 0,
    wallSlideSpeed: 2.5,
    wallJumpForce: { x: 12, y: -13 },

    isSliding: false,
    slideTimer: 0,

    jumpPressed: false,
    jumpBufferTimer: 0,
    coyoteTimer: 0,

    scaleX: 1,
    scaleY: 1,

    onMovingPlatform: null,

    // Zipline & Vine
    onZipline: null,
    ziplineProgress: 0,
    onVine: null,
    isClimbing: false,

    isShooting: false,
    shootAnimTimer: 0,

    // Player 2 (Co-op)
    p2: {
        x: 100, y: 0,
        vx: 0, vy: 0,
        facing: 1,
        animFrame: 0,
        active: false,
        input: { left: false, right: false, jump: false, shoot: false, dash: false },
        grounded: false, // Added for P2 basic physics
        speed: 5, // Added for P2 basic physics
        jumpForce: -13 // Added for P2 basic physics
    },

    // Network Handlers
    handleRemoteInput(keys) {
        if (!this.p2.active) return;
        this.p2.input = keys;

        // Host simulation for P2
        if (keys.left) this.p2.vx = -this.speed;
        else if (keys.right) this.p2.vx = this.speed;
        else this.p2.vx = 0;

        if (keys.jump) {
            if (this.p2.grounded) {
                this.p2.vy = this.jumpForce;
                this.p2.grounded = false;
            }
        }

        // Simple gravity for p2 host sim
        this.p2.vy += 0.65;
        this.p2.y += this.p2.vy;

        // Floor collision (baseY)
        if (this.p2.y > Platforms.baseY - this.height - 20) {
            this.p2.y = Platforms.baseY - this.height - 20;
            this.p2.vy = 0;
            this.p2.grounded = true;
        }
    },

    handleRemoteState(state) {
        if (!Network.isHost) {
            // Update the "Other Player" (Host/P1)
            this.p2.x = state.p1.x;
            this.p2.y = state.p1.y;
            this.p2.facing = state.p1.facing;
            this.p2.animFrame = state.p1.anim;
        }
    },

    renderP2(ctx, camera) {
        if (!this.p2.active) return;

        const screen = camera.worldToScreen(this.p2.x, this.p2.y);

        ctx.save();
        ctx.translate(screen.x + this.width / 2, screen.y + this.height / 2);
        ctx.scale(this.p2.facing, 1);

        // Draw P2 with different color (Greenish)
        ctx.fillStyle = '#4a8a4a';
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

        // Eyes
        ctx.fillStyle = '#aaffaa';
        ctx.fillRect(2, -8, 6, 6);

        // Scarf
        ctx.fillStyle = '#2a5a2a';
        ctx.fillRect(-this.width / 2, -this.height / 2 + 8, this.width, 4);

        ctx.restore();
    },

    init() {
        this.x = 100;
        this.y = 300;
        this.vx = 0;
        this.vy = 0;
        this.health = 3;
        this.maxHealth = 3;
        this.maxSpeed = 8;
        this.invincible = false;
        this.grounded = false;
        this.canDoubleJump = true;
        this.state = 'idle';
        this.dashCooldown = 0;
        this.isDashing = false;
        this.onWall = false;
        this.isSliding = false;
        this.scaleX = 1;
        this.scaleY = 1;
        this.onMovingPlatform = null;
        this.onZipline = null;
        this.onVine = null;
        this.isClimbing = false;
        this.isShooting = false;
    },

    takeDamage() {
        if (this.invincible) return;

        this.health--;
        this.invincible = true;
        this.invincibleTimer = 80;
        this.vy = -10;
        this.vx = -this.facing * 6;
        this.onZipline = null;
        this.onVine = null;
        this.isClimbing = false;
        Camera.addShake(8);
        Audio.play('damage');

        Game.combo = 0;
        Game.comboTimer = 0;

        if (this.health <= 0) {
            Game.gameOver();
        }

        Game.updateHealthUI();
    },

    update() {
        const gameSpeed = Platforms.gameSpeed;

        if (this.invincible) {
            this.invincibleTimer--;
            if (this.invincibleTimer <= 0) this.invincible = false;
        }

        if (this.dashCooldown > 0) this.dashCooldown--;
        if (this.slideTimer > 0) this.slideTimer--;
        if (this.shootAnimTimer > 0) this.shootAnimTimer--;

        // Shooting
        if (Input.isPressed('shoot')) {
            const shot = Combat.shoot(
                this.x + this.width / 2 + this.facing * 15,
                this.y + this.height / 2 - 5,
                this.facing
            );
            if (shot) {
                this.shootAnimTimer = 10;
                this.isShooting = true;
            }
        } else {
            this.isShooting = false;
        }

        // ZIPLINE LOGIC
        if (this.onZipline) {
            const zip = this.onZipline;
            this.ziplineProgress += 0.02 * gameSpeed;

            if (this.ziplineProgress >= 1) {
                this.onZipline = null;
                this.vy = -5;
            } else {
                this.x = zip.startX + (zip.endX - zip.startX) * this.ziplineProgress - this.width / 2;
                this.y = zip.startY + (zip.endY - zip.startY) * this.ziplineProgress;
                this.vx = 0;
                this.vy = 0;

                // Jump off zipline
                if (Input.isPressed('jump') && !this.jumpPressed) {
                    this.jumpPressed = true;
                    this.onZipline = null;
                    this.vy = this.jumpForce * 0.8;
                    this.canDoubleJump = true;
                    Audio.play('jump');
                }
            }

            this.state = 'zipline';
            this.animTimer++;
            if (this.animTimer >= 5) {
                this.animTimer = 0;
                this.animFrame = (this.animFrame + 1) % 4;
            }
            this.updateHUD();
            return;
        }

        // VINE CLIMBING LOGIC
        if (this.onVine) {
            const vine = this.onVine;
            this.isClimbing = true;
            this.vx = 0;
            this.vy = 0;

            // Climb up/down
            if (Input.isPressed('jump') || Input.isPressed('up')) {
                this.y -= 4 * gameSpeed;
            }
            if (Input.isPressed('down')) {
                this.y += 3 * gameSpeed;
            }

            // Keep within vine bounds
            if (this.y < vine.topY) {
                this.y = vine.topY;
                this.onVine = null;
                this.isClimbing = false;
                this.vy = -5;
            }
            if (this.y + this.height > vine.bottomY) {
                this.y = vine.bottomY - this.height;
            }

            // Jump off vine (left/right)
            if (Input.isPressed('left') || Input.isPressed('right')) {
                this.onVine = null;
                this.isClimbing = false;
                this.vx = Input.isPressed('left') ? -8 : 8;
                this.vy = -8;
                this.facing = Input.isPressed('left') ? -1 : 1;
                this.canDoubleJump = true;
                Audio.play('jump');
            }

            // Center on vine
            this.x = vine.x - this.width / 2 + Math.sin(vine.swayPhase) * 3;

            this.state = 'climb';
            this.animTimer++;
            if (this.animTimer >= 8) {
                this.animTimer = 0;
                this.animFrame = (this.animFrame + 1) % 4;
            }
            this.updateHUD();
            return;
        }

        // Normal movement
        if (this.dashDuration > 0) {
            this.dashDuration--;
            this.vx = this.dashSpeed * this.facing * gameSpeed;
            this.vy = 0;
            this.scaleX = 1.4;
            this.scaleY = 0.6;
        } else {
            this.isDashing = false;
        }

        if (this.isSliding && this.slideTimer > 0) {
            this.vx = this.facing * 10 * gameSpeed;
            this.height = 28;
        } else {
            this.isSliding = false;
            this.height = 48;
        }

        if (!this.isDashing && !this.isSliding) {
            if (Input.isPressed('left')) {
                this.vx -= this.acceleration * gameSpeed;
                this.facing = -1;
            } else if (Input.isPressed('right')) {
                this.vx += this.acceleration * gameSpeed;
                this.facing = 1;
            }

            this.vx *= this.friction;
            this.vx = Math.max(-this.maxSpeed * gameSpeed, Math.min(this.maxSpeed * gameSpeed, this.vx));

            if (this.onWall && this.vy > 0) {
                this.vy += this.gravity * 0.25;
                this.vy = Math.min(this.wallSlideSpeed, this.vy);
            } else {
                this.vy += this.gravity;
                this.vy = Math.min(20, this.vy);
            }
        }

        if (this.onMovingPlatform) {
            const mpVel = Platforms.getMovingPlatformVelocity(this.onMovingPlatform);
            this.x += mpVel.x;
            this.y += mpVel.y;
        }

        if (this.grounded) {
            this.coyoteTimer = 10;
        } else if (this.coyoteTimer > 0) {
            this.coyoteTimer--;
        }

        if (this.jumpBufferTimer > 0) this.jumpBufferTimer--;

        if (Input.isPressed('jump') && !this.jumpPressed) {
            this.jumpPressed = true;
            this.jumpBufferTimer = 12;

            if (this.onWall && !this.grounded) {
                this.wallJump();
            } else if (this.coyoteTimer > 0) {
                this.jump();
            } else if (this.canDoubleJump) {
                this.doubleJump();
            }
        }

        if (!Input.isPressed('jump')) {
            this.jumpPressed = false;
            if (this.vy < -5) this.vy = -5;
        }

        if (Input.isPressed('dash') && this.dashCooldown === 0 && !this.isDashing) {
            this.dash();
        }

        if (Input.isPressed('down') && this.grounded && Math.abs(this.vx) > 2.5 && !this.isSliding) {
            this.slide();
        }

        this.x += this.vx;
        this.y += this.vy;

        this.grounded = false;
        this.onWall = false;
        this.onMovingPlatform = null;

        // Check zipline - AUTOMATIC (no button press needed)
        if (!this.grounded && this.vy > 0 && !this.onZipline) {
            const zipline = Platforms.checkZiplineCollision(this);
            if (zipline) {
                this.onZipline = zipline;
                this.ziplineProgress = (this.x - zipline.startX) / (zipline.endX - zipline.startX);
                this.ziplineProgress = Math.max(0, Math.min(0.9, this.ziplineProgress));
                this.vy = 0;
            }
        }

        // Check vine
        const vine = Platforms.checkVineCollision(this);
        if (vine && (Input.isPressed('up') || Input.isPressed('jump'))) {
            this.onVine = vine;
            this.jumpPressed = true;
        }

        // Platform collision
        const platform = Platforms.checkCollision(this);
        if (platform && this.vy >= 0) {
            this.y = platform.y - this.height;
            this.vy = 0;
            this.grounded = true;
            this.canDoubleJump = true;

            if (platform.moveType) this.onMovingPlatform = platform;

            if (!this.isSliding) {
                this.scaleX = 1.25;
                this.scaleY = 0.75;
            }

            if (this.jumpBufferTimer > 0) {
                this.jump();
                this.jumpBufferTimer = 0;
            }

            if (Math.abs(this.vx) > 1.5) {
                Platforms.addDust(this.x + this.width / 2, this.y + this.height, 4);
            }
        }

        // Wall collision
        const wall = Platforms.checkWallCollision(this);
        if (wall && !this.grounded) {
            this.onWall = true;
            this.wallDirection = wall.direction;
            this.canDoubleJump = true;
        }

        this.scaleX += (1 - this.scaleX) * 0.25;
        this.scaleY += (1 - this.scaleY) * 0.25;

        this.updateState();

        this.animTimer++;
        if (this.animTimer >= 5) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }

        this.updateHUD();
    },

    jump() {
        this.vy = this.jumpForce;
        this.grounded = false;
        this.coyoteTimer = 0;
        this.scaleX = 0.75;
        this.scaleY = 1.25;
        Platforms.addDust(this.x + this.width / 2, this.y + this.height, 5);
        Camera.addShake(2);
        Audio.play('jump');
    },

    doubleJump() {
        this.vy = this.jumpForce * 0.85;
        this.canDoubleJump = false;
        this.scaleX = 0.7;
        this.scaleY = 1.3;
        Platforms.addDust(this.x + this.width / 2, this.y + this.height, 6);
        Camera.addShake(2);
        Audio.play('doubleJump');
    },

    wallJump() {
        this.vx = this.wallJumpForce.x * -this.wallDirection;
        this.vy = this.wallJumpForce.y;
        this.facing = -this.wallDirection;
        this.onWall = false;
        this.canDoubleJump = true;
        this.scaleX = 0.65;
        this.scaleY = 1.35;
        Camera.addShake(4);
        Audio.play('jump');
    },

    dash() {
        this.isDashing = true;
        this.dashDuration = 8;
        this.dashCooldown = 30;
        this.vy = 0;
        Camera.addShake(5);
        Platforms.addDust(this.x + this.width / 2, this.y + this.height, 8);
        Audio.play('dash');
    },

    slide() {
        this.isSliding = true;
        this.slideTimer = 18;
        Platforms.addDust(this.x + this.width / 2, this.y + this.height, 6);
    },

    updateState() {
        if (this.isDashing) {
            this.state = 'dash';
        } else if (this.isSliding) {
            this.state = 'slide';
        } else if (this.onWall && !this.grounded) {
            this.state = 'wall';
        } else if (!this.grounded) {
            this.state = this.vy < 0 ? 'jump' : 'fall';
        } else if (Math.abs(this.vx) > 0.5) {
            this.state = 'run';
        } else {
            this.state = 'idle';
        }
    },

    updateHUD() {
        const dashEl = document.getElementById('dash-indicator');
        const jumpEl = document.getElementById('jump-indicator');

        if (dashEl) dashEl.className = this.dashCooldown === 0 ? 'ability ready' : 'ability cooldown';
        if (jumpEl) jumpEl.className = this.canDoubleJump ? 'ability ready' : 'ability cooldown';
    },

    render(ctx, camera) {
        const screen = camera.worldToScreen(this.x, this.y);

        if (this.invincible && Math.floor(this.invincibleTimer / 3) % 2 === 0) return;

        ctx.save();

        const centerX = screen.x + this.width / 2;
        const centerY = screen.y + this.height / 2;

        ctx.translate(centerX, centerY);
        ctx.scale(this.facing * this.scaleX, this.scaleY);
        ctx.translate(-this.width / 2, -this.height / 2);

        if (this.invincible) ctx.globalAlpha = 0.7;

        let sprite;
        if (this.state === 'run' && Assets.sprites.playerRun) {
            sprite = Assets.sprites.playerRun[this.animFrame];
        } else if (this.state === 'idle' && Assets.sprites.playerIdle) {
            sprite = Assets.sprites.playerIdle[this.animFrame];
        } else if (this.state === 'jump' && Assets.sprites.playerJump) {
            sprite = Assets.sprites.playerJump;
        } else if (this.state === 'fall' && Assets.sprites.playerFall) {
            sprite = Assets.sprites.playerFall;
        } else if (this.state === 'slide' && Assets.sprites.playerSlide) {
            sprite = Assets.sprites.playerSlide;
        } else if (this.state === 'wall' && Assets.sprites.playerWall) {
            sprite = Assets.sprites.playerWall;
        } else if (this.state === 'dash' && Assets.sprites.playerDash) {
            sprite = Assets.sprites.playerDash;
        } else if (Assets.sprites.playerIdle) {
            sprite = Assets.sprites.playerIdle[0];
        }

        // Zipline rendering
        if (this.onZipline) {
            // Draw arms up holding zipline
            ctx.fillStyle = '#4a4a55';
            ctx.fillRect(8, -10, 6, 15);
            ctx.fillRect(18, -10, 6, 15);
        }

        // Climbing pose
        if (this.isClimbing) {
            ctx.fillStyle = '#4a4a55';
            ctx.fillRect(0, 0, this.width, 48);
            ctx.fillStyle = '#5a5a65';
            ctx.fillRect(4, 4, 8, 8); // head
            ctx.fillRect(0, 15 + Math.sin(this.animFrame) * 3, 10, 15); // arm
            ctx.fillRect(22, 15 - Math.sin(this.animFrame) * 3, 10, 15); // arm
        } else if (this.isDashing) {
            for (let i = 1; i <= 5; i++) {
                ctx.globalAlpha = 0.15 * (5 - i) / 5;
                if (sprite) ctx.drawImage(sprite, -i * 15, 0, this.width, 48);
            }
            ctx.globalAlpha = 1;
            if (sprite) ctx.drawImage(sprite, 0, 0, this.width, 48);
        } else if (sprite) {
            ctx.drawImage(sprite, 0, 0, this.width, 48);
        } else {
            ctx.fillStyle = '#4a4a55';
            ctx.fillRect(0, 0, this.width, 48);
        }

        // Shooting arm/muzzle flash
        if (this.shootAnimTimer > 0 && !this.isClimbing) {
            ctx.fillStyle = '#8888aa';
            ctx.fillRect(this.width - 5, 15, 12, 6);
            ctx.fillStyle = `rgba(200, 200, 220, ${this.shootAnimTimer / 10})`;
            ctx.beginPath();
            ctx.arc(this.width + 10, 18, 8, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    },

    isDead(canvasHeight) {
        return this.y > canvasHeight + 150 || this.health <= 0;
    }
};
