class Game {
    constructor() {
        this.setupScene();
        this.setupEventListeners();
        this.gameState = 'start'; // start, playing, paused
        this.menuState = 'main'; // main, pause
        this.mouseControl = false;
        this.freeRideMode = false;
        this.radioPlaying = false;
        this.previewSpeed = 40; // Constant speed for preview
        this.currentStage = 1;
        this.currentLap = 1;
        this.maxLaps = 6;
        this.lapDistance = 1000; // Distance for each lap in meters
        this.lastLapDistance = 0; // Track distance at last lap change

        // Initialize sound manager
        this.soundManager = new SoundManager();

        // Initialize radio
        this.radio = new Radio();

        // Scoring system
        this.metersPerPoint = 50; // 50 meters = 1 point
        this.highScores = JSON.parse(localStorage.getItem('highScores') || '[]');

        // Initialize game components
        this.aiTraffic = new AITrafficManager();
        this.aiTraffic.setScene(this.scene); // Set the scene for AI traffic
        this.obstacles = new ObstacleManager();
        this.obstacles.setScene(this.scene); // Set the scene for obstacles

        // Start the game loop
        this.lastUpdateTime = performance.now();
        this.animate();

        this.baseSpeed = 30;  // Base speed of the car
        this.currentSpeed = this.baseSpeed;
        this.speedEffects = [];  // Array to track active speed effects
    }

    setupScene() {
        // Three.js setup
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById('gameCanvas').appendChild(this.renderer.domElement);

        // Add better lighting for obstacles
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(0, 10, 5);
        this.scene.add(directionalLight);

        // Add spotlight for better obstacle visibility
        const spotlight = new THREE.SpotLight(0xffffff, 0.5);
        spotlight.position.set(0, 10, 0);
        spotlight.target.position.set(0, 0, 10);
        spotlight.angle = Math.PI / 3;
        spotlight.penumbra = 0.5;
        spotlight.decay = 1;
        spotlight.distance = 50;
        this.scene.add(spotlight);
        this.scene.add(spotlight.target);

        // Initialize game components
        this.environment = new Environment(this.scene);
        this.road = new Road(this.scene);
        this.car = new Car3D();
        this.scene.add(this.car.mesh);

        // Set up camera position - higher and further back for better obstacle visibility
        this.camera.position.set(0, 4, -8);
        this.camera.lookAt(0, 1, 15); // Look slightly up for better perspective
    }

    setupEventListeners() {
        // Start screen listener for click
        document.getElementById('start-screen').addEventListener('click', () => {
            this.startGameIfReady();
        });

        // Start screen listener for spacebar
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.gameState === 'start') {
                this.startGameIfReady();
            }
        });

        // Mouse movement for steering
        document.addEventListener('mousemove', (e) => {
            if (this.gameState === 'playing' && this.mouseControl) {
                const centerX = window.innerWidth / 2;
                const mouseX = e.clientX;
                const normalizedX = (mouseX - centerX) / (window.innerWidth / 4);
                this.car.setMouseSteering(normalizedX);
            }
        });

        // Game controls
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));

        // Menu buttons
        document.getElementById('startBtn')?.addEventListener('click', () => this.startGame());
        document.getElementById('resumeBtn')?.addEventListener('click', () => this.resumeGame());
        document.getElementById('settingsBtn')?.addEventListener('click', () => this.showSettings());
        document.getElementById('scoresBtn')?.addEventListener('click', () => this.showScores());
        document.getElementById('helpBtn')?.addEventListener('click', () => this.showHelp());
        document.getElementById('exitBtn')?.addEventListener('click', () => this.exitGame());
        document.getElementById('exitToMenuBtn')?.addEventListener('click', () => this.exitToMenu());
        document.getElementById('backToMenu')?.addEventListener('click', () => this.hideSettings());
        document.getElementById('backToMenuFromScores')?.addEventListener('click', () => this.hideScores());

        // Responsive design
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Settings controls
        document.getElementById('mouseControl').addEventListener('change', (e) => {
            this.mouseControl = e.target.checked;
            // Reset steering when switching control modes
            this.car.steerLeft = false;
            this.car.steerRight = false;
            this.car.currentX = 0;
            this.car.mesh.position.x = 0;
            this.car.mesh.rotation.y = 0;
        });

        // Volume controls
        document.getElementById('musicVolume').addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            // Implement music volume control
        });

        document.getElementById('sfxVolume').addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            // Implement sound effects volume control
        });
    }

    handleKeyDown(e) {
        if (this.gameState === 'countdown') return; // Prevent controls during countdown
        if (this.gameState !== 'playing' && e.key.toLowerCase() !== 'r') return;

        switch(e.key.toLowerCase()) { // Convert to lowercase to handle both cases
            case 'arrowleft':
            case 'a':
                if (!this.mouseControl) {
                    this.car.steerLeft = true;
                    this.car.steerRight = false;
                }
                break;
            case 'arrowright':
            case 'd':
                if (!this.mouseControl) {
                    this.car.steerRight = true;
                    this.car.steerLeft = false;
                }
                break;
            case 'arrowup':
            case 'w':
                this.car.accelerate = true;
                break;
            case 'arrowdown':
            case 's':
            case ' ': // Space
                this.car.brake = true;
                this.soundManager.playSound('brake');
                break;
            case 'r': // Restart game
                this.restartGame();
                break;
            case 'f':
                this.toggleFreeRide();
                break;
            case 'escape':
                if (this.gameState === 'playing') {
                    this.pauseGame();
                } else if (this.gameState === 'paused') {
                    this.resumeGame();
                }
                break;
        }
    }

    handleKeyUp(e) {
        if (this.gameState !== 'playing') return;

        switch(e.key.toLowerCase()) { // Convert to lowercase to handle both cases
            case 'arrowleft':
            case 'a':
                if (!this.mouseControl) {
                    this.car.steerLeft = false;
                }
                break;
            case 'arrowright':
            case 'd':
                if (!this.mouseControl) {
                    this.car.steerRight = false;
                }
                break;
            case 'arrowup':
            case 'w':
                this.car.accelerate = false;
                break;
            case 'arrowdown':
            case 's':
            case ' ': // Space
                this.car.brake = false;
                break;
        }
    }

    toggleFreeRide() {
        this.freeRideMode = !this.freeRideMode;
        if (this.freeRideMode) {
            this.car.maxSpeed = Infinity;
            document.getElementById('stage').textContent = 'Free Ride Mode';
        } else {
            this.car.maxSpeed = 200;
            const stageConfig = this.aiTraffic.stages[this.currentStage];
            document.getElementById('stage').textContent = `Stage ${this.currentStage}: ${stageConfig.name}`;
        }
    }

    toggleRadio() {
        this.radioPlaying = !this.radioPlaying;
        if (this.radioPlaying) {
            this.soundManager.playMusic();
        } else {
            this.soundManager.stopMusic();
        }
    }

    returnToTitle() {
        this.gameState = 'start';
        document.getElementById('start-screen').classList.remove('hidden');
        document.getElementById('menu').classList.add('hidden');
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('settings-menu').classList.add('hidden');
        this.resetGame();
    }

    resetGame() {
        this.car.speed = 0;
        this.car.distance = 0;
        this.car.position.x = 0;
        this.car.steerAngle = 0;
        this.car.mesh.position.set(0, 0, 0);
        this.car.mesh.rotation.set(0, 0, 0);
        this.freeRideMode = false;
        this.currentStage = 1;
        this.currentLap = 1;
        this.lastLapDistance = 0;
        this.aiTraffic.reset();
        this.obstacles.reset();
        if (this.radioPlaying) {
            this.soundManager.stopMusic();
            this.radioPlaying = false;
        }

        // Reset HUD
        document.getElementById('score').textContent = 'Score: 0';
        document.getElementById('distance').textContent = 'Distance: 0m';
        document.getElementById('points').textContent = 'Points: 0.00';
        document.getElementById('speed').textContent = '0 km/h';
        document.getElementById('stage').textContent = 'Stage 1: Nyarugenge';
        document.getElementById('lap-counter').textContent = `Lap: 1/${this.maxLaps}`;
    }

    showSettings() {
        document.getElementById('menu').classList.add('hidden');
        document.getElementById('settings-menu').classList.remove('hidden');
    }

    hideSettings() {
        document.getElementById('settings-menu').classList.add('hidden');
        this.showMenu();
    }

    showScores() {
        document.getElementById('menu').classList.add('hidden');
        document.getElementById('high-scores').classList.remove('hidden');
    }

    hideScores() {
        document.getElementById('high-scores').classList.add('hidden');
        this.showMenu();
    }

    showHelp() {
        // Implement help/how to play display
    }

    exitGame() {
        // Implement game exit logic
        this.returnToTitle();
    }

    updateGameState() {
        if (this.gameState === 'start') {
            // Update environment and road for preview
            this.environment.update(this.previewSpeed);
            this.road.update(this.previewSpeed);
            return;
        }

        if (this.gameState !== 'playing') return;

        // Update car position and physics
        this.car.update();

        // Update AI traffic
        this.aiTraffic.update(this.car.speed, 0.016, this.car.distance);

        // Update obstacles
        this.obstacles.update(this.car.speed, 0.016, this.car.distance);

        // Check collisions with AI traffic
        if (this.aiTraffic.checkCollisions(this.car.mesh.position.x, this.car.mesh.position.z)) {
            this.handleAICollision();
        }

        // Check collisions with obstacles
        const obstacleCollision = this.obstacles.checkCollisions(
            this.car.mesh.position.x, 
            this.car.mesh.position.z
        );
        
        if (obstacleCollision.collision) {
            this.handleCollision(obstacleCollision);
        }

        // Update environment
        this.environment.update(this.car.speed);
        this.road.update(this.car.speed);

        // Update HUD
        this.updateHUD();

        // Check for stage progression
        this.checkStageProgression();
    }

    showCollisionEffect(effect) {
        const gameCanvas = document.getElementById('gameCanvas');
        
        // Remove any existing flash effects first
        const existingFlashes = document.querySelectorAll('.collision-flash');
        existingFlashes.forEach(flash => flash.remove());
        
        // Clear any existing animations
        if (gameCanvas.animation) {
            gameCanvas.animation.cancel();
        }
        
        // Apply screen shake based on effect intensity
        const intensity = effect.shake;
        const duration = effect.duration;
        
        // Create milder keyframes for the shake animation
        const shakeFrames = [];
        const steps = 5;
        for (let i = 0; i < steps; i++) {
            const offset = 10 * intensity * (Math.random() - 0.5); // Reduced from 20 to 10
            const rotateOffset = 1 * intensity * (Math.random() - 0.5); // Reduced from 2 to 1
            shakeFrames.push({
                transform: `translate(${offset}px, ${offset}px) rotate(${rotateOffset}deg)`
            });
        }
        
        // Add ending keyframe to return to normal
        shakeFrames.push({
            transform: 'translate(0, 0) rotate(0deg)'
        });
        
        // Apply the animation and store its reference
        gameCanvas.animation = gameCanvas.animate(shakeFrames, {
            duration: duration,
            iterations: 1
        });
        
        // Create flash effect with reduced opacity and duration
        const flash = document.createElement('div');
        flash.className = 'collision-flash';
        flash.style.position = 'fixed';
        flash.style.top = '0';
        flash.style.left = '0';
        flash.style.right = '0';
        flash.style.bottom = '0';
        flash.style.backgroundColor = `rgba(255, 255, 255, ${0.2 * intensity})`; // Reduced from 0.3 to 0.2
        flash.style.pointerEvents = 'none';
        flash.style.transition = 'opacity 0.2s ease-out';
        flash.style.zIndex = '1000';
        document.body.appendChild(flash);
        
        // Fade out and remove flash effect
        setTimeout(() => {
            flash.style.opacity = '0';
            setTimeout(() => flash.remove(), 200);
        }, duration/4); // Reduced from duration/2 to duration/4

        this.soundManager.playSound('crash');
    }

    handleCollision(obstacle) {
        if (this.canPlaySound()) {
            const intensity = Math.min(1, this.currentSpeed / 100);
            this.soundManager.playCrashSound(intensity);
        }

        // Apply speed effect
        if (obstacle.getDamageEffect().speedEffect) {
            this.addSpeedEffect(obstacle.getDamageEffect().speedEffect);
        }

        // Show collision effect
        this.showCollisionEffect(obstacle.getDamageEffect());
    }

    handleAICollision() {
        if (this.canPlaySound()) {
            const intensity = Math.min(1, this.currentSpeed / 100);
            this.soundManager.playCrashSound(intensity);
        }

        // Get collision details from AI traffic
        const collisionDetails = this.aiTraffic.getCollisionDetails(
            this.car.mesh.position.x,
            this.car.mesh.position.z,
            this.car.speed
        );

        if (collisionDetails.isOvertaking) {
            // If we're overtaking (moving faster than the AI vehicle), just apply a small speed reduction
            this.car.speed *= 0.3;
        } else {
            // If it's a real collision (not overtaking), reduce speed more significantly
            this.car.speed *= 0.5;
            // Show major collision effect
            this.showCollisionEffect({
                shake: 1.0,
                duration: 1000,
                sound: 'crash'
            });
        }
    }

    checkStageProgression() {
        if (this.freeRideMode) return;

        // Check if we've completed a lap (every 500 meters)
        const currentDistance = this.car.distance;
        const lapProgress = currentDistance - this.lastLapDistance;

        if (lapProgress >= this.lapDistance) {
            this.currentLap++;
            this.lastLapDistance = currentDistance;

            if (this.currentLap > this.maxLaps) {
                this.handleVictory();
                return;
            }

            // Show lap transition
            const transition = document.createElement('div');
            transition.className = 'stage-transition';
            transition.textContent = `Lap ${this.currentLap} of ${this.maxLaps}`;
            document.body.appendChild(transition);
            setTimeout(() => document.body.removeChild(transition), 2000);
            
            // Update lap counter display
            document.getElementById('lap-counter').textContent = 
                `Lap: ${this.currentLap}/${this.maxLaps}`;

            this.soundManager.playSound('point');
        }

        // Normal stage progression
        const stage = this.aiTraffic.getCurrentStage(this.car.distance);
        if (stage !== this.currentStage) {
            this.currentStage = stage;
            this.showStageTransition();
            
            // Increase difficulty
            this.aiTraffic.difficulty = this.currentStage;
            this.obstacles.difficulty = this.currentStage;

            // Update environment for Magic Garden
            this.environment.updateStage(this.currentStage);

            // Update stage display
            const stageConfig = this.aiTraffic.stages[this.currentStage];
            document.getElementById('stage').textContent = 
                `Stage ${this.currentStage}: ${stageConfig.name}`;

            // Play special sound for Magic Garden entry
            if (this.currentStage === 4) {
                this.soundManager.playSound('magic');
            } else {
                this.soundManager.playSound('point');
            }
        }
    }

    handleVictory() {
        this.gameState = 'victory';
        const victoryScreen = document.createElement('div');
        victoryScreen.className = 'screen';
        victoryScreen.innerHTML = `
            <div class="victory-text">
                <h1>You've Reached the Magic Garden!</h1>
                <div class="final-score">Final Score: ${document.getElementById('score').textContent.split(': ')[1]}</div>
                <button onclick="location.reload()">Play Again</button>
            </div>
        `;
        document.body.appendChild(victoryScreen);
    }

    showStageTransition() {
        const stageConfig = this.aiTraffic.stages[this.currentStage];
        const transition = document.createElement('div');
        transition.className = 'stage-transition';
        
        // Add special styling for Magic Garden
        if (this.currentStage === 4) {
            transition.classList.add('magic-garden');
            transition.innerHTML = `
                <span style="font-size: 1.2em">🌸</span>
                ${stageConfig.name}
                <span style="font-size: 1.2em">🌸</span>
                <br>
                <span style="font-size: 0.8em; color: #FFB7C5">${stageConfig.description}</span>
            `;
        } else {
            transition.textContent = `Entering ${stageConfig.name} - ${stageConfig.description}`;
        }
        
        document.body.appendChild(transition);

        // Remove after animation (longer for Magic Garden)
        setTimeout(() => {
            document.body.removeChild(transition);
        }, this.currentStage === 4 ? 3000 : 2000);
    }

    updateHUD() {
        // Update speed display
        const speedKMH = Math.round(this.car.speed * 3.6); // Convert m/s to km/h
        document.getElementById('speed').textContent = `${speedKMH} km/h`;

        // Update distance and score
        const distanceInMeters = Math.round(this.car.distance);
        document.getElementById('distance').textContent = `Distance: ${distanceInMeters}m`;
        
        // Calculate points based on distance
        const points = (distanceInMeters / this.metersPerPoint).toFixed(2);
        document.getElementById('points').textContent = `Points: ${points}`;
        document.getElementById('score').textContent = `Score: ${Math.floor(points)}`;

        // Update lap progress
        const currentLapProgress = this.car.distance - this.lastLapDistance;
        const lapProgressPercent = Math.min(100, (currentLapProgress / this.lapDistance) * 100).toFixed(1);
        document.getElementById('lap-counter').textContent = 
            `Lap: ${this.currentLap}/${this.maxLaps} (${lapProgressPercent}%)`;
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Calculate delta time for smooth updates
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastUpdateTime) / 1000;
        this.lastUpdateTime = currentTime;

        if (this.gameState === 'playing') {
            // Update car position and physics
            this.car.update();
            
            // Update game environment
            this.environment.update(this.car.speed);
            this.road.update(this.car.speed);
            
            // Update AI traffic with player data
            this.aiTraffic.update(this.car.speed, deltaTime, this.car.distance);

            // Update obstacles with proper timing
            this.obstacles.update(this.car.speed, deltaTime, this.car.distance);

            // Check for collisions with AI vehicles
            if (this.aiTraffic.checkCollisions(this.car.mesh.position.x, this.car.mesh.position.z)) {
                this.handleAICollision();
            }

            // Check for collisions with obstacles
            const collisions = this.obstacles.checkCollisions(
                this.car.mesh.position.x,
                this.car.mesh.position.z,
                this.car.speed
            );

            // Handle all collisions
            collisions.forEach(collision => {
                this.handleCollision(collision.obstacle);
            });

            this.checkStageProgression();
            this.updateHUD();
        } else if (this.gameState === 'start') {
            // Preview mode updates
            this.environment.update(this.previewSpeed);
            this.road.update(this.previewSpeed);
        }

        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }

    startGameIfReady() {
        if (this.gameState === 'start') {
            document.getElementById('start-screen').classList.add('hidden');
            const countdownElement = document.getElementById('countdown');
            const countdownText = countdownElement.querySelector('.countdown-text');
            
            // Reset car position
            this.car.mesh.position.x = 0;
            this.car.mesh.rotation.y = 0;
            
            // Reset camera to gameplay position
            this.camera.position.set(0, 3, -6);
            this.camera.lookAt(0, 0, 10);
            
            // Show countdown
            countdownElement.classList.remove('hidden');
            this.gameState = 'countdown';
            
            // Start countdown sequence
            let count = 3;
            const self = this;
            const countdown = async function() {
                if (count > 0) {
                    countdownText.textContent = count;
                    countdownText.style.animation = 'none';
                    countdownText.offsetHeight; // Trigger reflow
                    countdownText.style.animation = 'pulseScale 1s ease-in-out';
                    await self.soundManager.playSound('menu');
                    count--;
                    setTimeout(countdown, 1000);
                } else {
                    // Show GO!
                    countdownText.textContent = 'GO!';
                    countdownText.style.animation = 'none';
                    countdownText.offsetHeight; // Trigger reflow
                    countdownText.style.animation = 'pulseScale 0.5s ease-in-out';
                    await self.soundManager.playSound('point'); // Use point sound for GO!
                    
                    // Hide countdown and start game after GO!
                    setTimeout(() => {
                        countdownElement.classList.add('hidden');
                        document.getElementById('hud').classList.remove('hidden');
                        self.gameState = 'playing';
                    }, 1000);
                }
            };
            
            countdown();
        }
    }

    async update() {
        const currentTime = Date.now();
        const deltaTime = (currentTime - this.lastUpdateTime) / 1000;
        this.lastUpdateTime = currentTime;

        // Update and clean expired speed effects
        this.updateSpeedEffects(currentTime);
        
        // Calculate current speed based on active effects
        this.updateCurrentSpeed();

        if (this.gameState === 'playing') {
            // Update car physics and controls
            this.car.update();
            
            // Update environment with current speed
            this.environment.update(this.currentSpeed);
            this.road.update(this.currentSpeed);
            
            // Update AI traffic with current speed
            this.aiTraffic.update(this.currentSpeed, deltaTime, this.car.distance);
            
            // Update obstacles with current speed
            this.obstacles.update(this.currentSpeed, deltaTime, this.car.distance);
            
            // Check for collisions with AI vehicles
            if (this.aiTraffic.checkCollisions(this.car.mesh.position.x, this.car.mesh.position.z)) {
                await this.handleAICollision();
            }

            // Check for collisions with obstacles
            const collisions = this.obstacles.checkCollisions(
                this.car.mesh.position.x,
                this.car.mesh.position.z,
                this.currentSpeed
            );

            // Handle all collisions
            for (const collision of collisions) {
                await this.handleCollision(collision.obstacle);
            }

            this.checkStageProgression();
            this.updateHUD();

            // Update engine sound based on speed
            if (this.currentSpeed > 0) {
                await this.soundManager.playEngineSound(this.currentSpeed);
            }
        }
    }

    updateSpeedEffects(currentTime) {
        // Remove expired effects
        this.speedEffects = this.speedEffects.filter(effect => effect.endTime > currentTime);
    }

    updateCurrentSpeed() {
        if (this.speedEffects.length === 0) {
            // No active effects, use base speed
            this.currentSpeed = this.baseSpeed;
            return;
        }

        // Find the strongest speed reduction
        const lowestMultiplier = Math.min(...this.speedEffects.map(effect => effect.multiplier));
        this.currentSpeed = this.baseSpeed * lowestMultiplier;
    }

    addSpeedEffect(effect) {
        // Add new speed effect with timing information
        this.speedEffects.push({
            multiplier: effect.speedMultiplier,
            endTime: Date.now() + effect.recoveryTime,
            type: effect.damageType
        });
    }

    addScreenShake(shake, duration) {
        // Implementation of addScreenShake method
    }

    canPlaySound() {
        return !this.lastCollisionSound || (Date.now() - this.lastCollisionSound > 300);
    }

    restartGame() {
        // Reset game state
        this.gameState = 'start';
        
        // Reset car position and properties
        this.car.mesh.position.set(0, 0, 0);
        this.car.mesh.rotation.set(0, 0, 0);
        this.car.speed = 0;
        this.car.distance = 0;
        this.car.currentX = 0;
        this.car.steerLeft = false;
        this.car.steerRight = false;
        this.car.brake = false;
        this.car.accelerate = false;

        // Reset camera position
        this.camera.position.set(0, 3, -6);
        this.camera.lookAt(0, 0, 10);

        // Reset AI traffic
        this.aiTraffic.reset();

        // Reset obstacles if they exist
        if (this.obstacles) {
            this.obstacles.reset();
        }

        // Reset HUD
        document.getElementById('score').textContent = 'Score: 0';
        document.getElementById('distance').textContent = 'Distance: 0m';
        document.getElementById('points').textContent = 'Points: 0.00';
        document.getElementById('speed').textContent = '0 km/h';
        document.getElementById('stage').textContent = 'Stage 1: Nyarugenge';

        // Show start screen
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('start-screen').classList.remove('hidden');
        
        // Reset collision cooldown
        this.isCollisionCooldown = false;

        // Reset any active effects
        const gameCanvas = document.getElementById('gameCanvas');
        if (gameCanvas.animation) {
            gameCanvas.animation.cancel();
        }
        
        // Remove any existing flash effects
        const existingFlashes = document.querySelectorAll('.collision-flash');
        existingFlashes.forEach(flash => flash.remove());

        // Reset the last update time
        this.lastUpdateTime = performance.now();
    }

    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.updateMenuState('pause');
            this.showMenu();
            if (this.radioPlaying) {
                this.soundManager.stopMusic();
            }
        }
    }

    resumeGame() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.hideMenu();
            if (this.radioPlaying) {
                this.soundManager.playMusic();
            }
        }
    }

    exitToMenu() {
        this.gameState = 'start';
        this.updateMenuState('main');
        document.getElementById('start-screen').classList.remove('hidden');
        document.getElementById('hud').classList.add('hidden');
        this.hideMenu();
        this.resetGame();
    }

    updateMenuState(state) {
        this.menuState = state;
        const menu = document.getElementById('menu');
        const title = menu.querySelector('.title');
        
        // Update title based on state
        title.textContent = state === 'main' ? 'FutureSkillsDrive' : 'Game Paused';
        
        // Show/hide buttons based on menu state
        const buttons = menu.querySelectorAll('[data-menu-state]');
        buttons.forEach(button => {
            if (button.dataset.menuState === state) {
                button.classList.remove('hidden');
            } else {
                button.classList.add('hidden');
            }
        });
    }

    showMenu() {
        document.getElementById('menu').classList.remove('hidden');
        document.getElementById('settings-menu').classList.add('hidden');
        document.getElementById('high-scores').classList.add('hidden');
    }

    hideMenu() {
        document.getElementById('menu').classList.add('hidden');
    }

    startGame() {
        this.gameState = 'playing';
        this.hideMenu();
        document.getElementById('hud').classList.remove('hidden');
        document.getElementById('start-screen').classList.add('hidden');
        // Reset game state if needed
        this.resetGame();
    }
}

// Initialize game when the window loads
window.addEventListener('load', () => {
    new Game();
}); 