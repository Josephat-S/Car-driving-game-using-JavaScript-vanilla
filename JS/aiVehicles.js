class AIVehicle {
    constructor(lane, speed) {
        this.lane = lane;  // -1 (left), 0 (center), 1 (right)
        this.speed = speed;
        this.position = { x: 0, y: 0, z: -200 }; // Start behind player
        this.type = this.getTruckType();
        this.width = this.type.width;
        this.length = this.type.length;
        this.active = true;
        this.color = this.generateRandomColor();
        this.mesh = new THREE.Group();
        this.wheelRotation = 0;
        this.brakeLightsOn = false;
        this.createVehicle();
        this.updateMeshPosition();
    }

    getTruckType() {
        return {
            width: 2.8,
            length: 7.0,
            maxSpeed: 0.7,
            height: 3.0,
            features: ['cargo'],
            defaultColor: 0x4169E1,
            name: 'truck'
        };
    }

    generateRandomColor() {
        const colors = [
            '#4169E1', // Royal Blue
            '#556B2F', // Dark Olive Green
            '#2F4F4F', // Dark Slate Gray
            '#191970', // Midnight Blue
            '#006400'  // Dark Green
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    createVehicle() {
        // Base body (lower part for cabin)
        const bodyGeometry = new THREE.BoxGeometry(this.width, this.type.height * 0.6, this.length * 0.3);
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: this.color,
            shininess: 30
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = this.type.height * 0.3;
        body.position.z = -this.length * 0.35; // Move cabin to front
        this.mesh.add(body);

        // Cargo container
        const containerGeometry = new THREE.BoxGeometry(this.width - 0.1, this.type.height, this.length * 0.65);
        const containerMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xFFFFFF,
            shininess: 20
        });
        const container = new THREE.Mesh(containerGeometry, containerMaterial);
        container.position.set(0, this.type.height * 0.5, this.length * 0.05);
        this.mesh.add(container);

        // Container details (horizontal stripes)
        const stripeHeight = this.type.height / 6;
        for (let i = 0; i < 3; i++) {
            const stripeGeometry = new THREE.BoxGeometry(this.width, stripeHeight * 0.1, this.length * 0.65);
            const stripeMaterial = new THREE.MeshPhongMaterial({ color: this.color });
            const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
            stripe.position.set(0, this.type.height * (0.25 + i * 0.25), this.length * 0.05);
            this.mesh.add(stripe);
        }

        this.addWheels();
        this.addLights();
        this.addWindows();
    }

    addWindows() {
        const windowMaterial = new THREE.MeshPhongMaterial({
            color: 0x000080,
            transparent: true,
            opacity: 0.7
        });

        // Windshield
        const windshieldGeometry = new THREE.PlaneGeometry(this.width - 0.6, this.type.height * 0.4);
        const windshield = new THREE.Mesh(windshieldGeometry, windowMaterial);
        windshield.rotation.x = Math.PI * 0.1;
        windshield.position.set(0, this.type.height * 0.5, -this.length * 0.45);
        this.mesh.add(windshield);

        // Side windows
        const sideWindowGeometry = new THREE.PlaneGeometry(this.length * 0.2, this.type.height * 0.3);
        const leftWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
        leftWindow.rotation.y = Math.PI * 0.5;
        leftWindow.position.set(-this.width * 0.5, this.type.height * 0.5, -this.length * 0.35);
        this.mesh.add(leftWindow);

        const rightWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
        rightWindow.rotation.y = -Math.PI * 0.5;
        rightWindow.position.set(this.width * 0.5, this.type.height * 0.5, -this.length * 0.35);
        this.mesh.add(rightWindow);
    }

    addWheels() {
        const wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 32);
        const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });

        // Three pairs of wheels for trucks
        const wheelPairs = 3;
        const wheelSpacing = this.length / (wheelPairs + 1);

        for (let i = 0; i < wheelPairs; i++) {
            for (let j = 0; j < 2; j++) {
                const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
                wheel.rotation.z = Math.PI * 0.5;
                wheel.rotation.x = this.wheelRotation;
                wheel.position.set(
                    (j ? 1 : -1) * (this.width/2 + 0.1),
                    0.5,
                    -this.length/2 + (i + 1) * wheelSpacing
                );
                this.mesh.add(wheel);
            }
        }
    }

    addLights() {
        // Headlights
        const headlightGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.1);
        const headlightMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xFFFFFF,
            emissive: 0xFFFFFF,
            emissiveIntensity: 0.5
        });

        // Front lights
        for (let i = 0; i < 2; i++) {
            const headlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
            headlight.position.set(
                (i ? 1 : -1) * (this.width/2 - 0.3),
                0.6,
                -this.length/2
            );
            this.mesh.add(headlight);
        }

        // Taillights
        const taillightMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xFF0000,
            emissive: 0xFF0000,
            emissiveIntensity: this.brakeLightsOn ? 0.8 : 0.2
        });

        for (let i = 0; i < 2; i++) {
            const taillight = new THREE.Mesh(headlightGeometry, taillightMaterial);
            taillight.position.set(
                (i ? 1 : -1) * (this.width/2 - 0.3),
                0.6,
                this.length/2
            );
            this.mesh.add(taillight);
        }

        // Add top marker lights
        const markerGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        const markerMaterial = new THREE.MeshPhongMaterial({
            color: 0xFFA500,
            emissive: 0xFFA500,
            emissiveIntensity: 0.5
        });

        // Top corners of the container
        for (let i = 0; i < 2; i++) {
            const markerLight = new THREE.Mesh(markerGeometry, markerMaterial);
            markerLight.position.set(
                (i ? 1 : -1) * (this.width/2),
                this.type.height,
                this.length * 0.3
            );
            this.mesh.add(markerLight);
        }
    }

    updateMeshPosition() {
        // Update mesh position to match logical position
        this.mesh.position.set(
            this.lane * 3.0, // Convert lane to actual X position
            0,
            this.position.z
        );
    }

    update(playerSpeed, deltaTime) {
        // Update wheel rotation based on speed
        this.wheelRotation += (this.speed - playerSpeed) * deltaTime * 2;
        this.mesh.children.forEach(child => {
            if (child.geometry && child.geometry.type === 'CylinderGeometry') {
                child.rotation.x = this.wheelRotation;
            }
        });

        // Update brake lights based on relative speed
        this.brakeLightsOn = (this.speed - playerSpeed) < -1;
        this.updateLights();

        // Move AI vehicle based on relative speed to player
        const relativeSpeed = (this.speed - playerSpeed) * this.type.maxSpeed;
        this.position.z += relativeSpeed * deltaTime;

        // Remove vehicle if it's too far behind or ahead
        if (this.position.z < -250 || this.position.z > 250) {
            this.active = false;
        }

        // Update 3D mesh position
        this.updateMeshPosition();
    }

    updateLights() {
        this.mesh.children.forEach(child => {
            if (child.material && child.material.emissive) {
                if (child.material.color.getHex() === 0xFF0000) { // Taillights
                    child.material.emissiveIntensity = this.brakeLightsOn ? 0.8 : 0.2;
                }
            }
        });
    }

    checkCollision(playerX, playerZ) {
        if (!this.active) return false;

        // Get current stage from manager
        const stage = this.manager ? this.manager.currentStage : 1;

        // Convert lane-based position to actual X coordinate
        const vehicleX = this.lane * 3.0 + (Math.sin(this.position.z * 0.01) * 0.1);
        
        // Calculate distances
        const dx = Math.abs(vehicleX - playerX);
        const dz = Math.abs(this.position.z - playerZ);

        // Base collision thresholds that become stricter with each stage
        const stageDifficulty = stage / 3; // 0.33 for stage 1, 0.67 for stage 2, 1.0 for stage 3
        const baseWidthThreshold = this.width * (0.9 - stageDifficulty * 0.1); // Gets stricter with stage
        const baseLengthThreshold = this.length * (0.8 - stageDifficulty * 0.1);

        // Check if we're in an overtaking scenario
        const isOvertaking = playerZ < this.position.z && Math.abs(dx) > this.width * 0.3;

        if (isOvertaking) {
            // More forgiving collision detection during overtaking
            // Gets progressively stricter with stage
            const overtakeThresholdMultiplier = 0.4 - (stage - 1) * 0.05; // 0.4 -> 0.3 -> 0.2
            return dx < baseWidthThreshold * overtakeThresholdMultiplier && 
                   dz < baseLengthThreshold * overtakeThresholdMultiplier;
        } else {
            // Normal collision detection
            // Also gets stricter with stage
            return dx < baseWidthThreshold && dz < baseLengthThreshold;
        }
    }

    getCollisionDetails(playerX, playerZ, playerSpeed) {
        // Convert lane-based position to actual X coordinate
        const vehicleX = this.lane * 3.0 + (Math.sin(this.position.z * 0.01) * 0.1);
        
        const dx = Math.abs(vehicleX - playerX);
        const dz = Math.abs(this.position.z - playerZ);
        const isOvertaking = playerZ < this.position.z && Math.abs(dx) > this.width * 0.3;
        
        return {
            dx,
            dz,
            relativeSpeed: playerSpeed - this.speed,
            isOvertaking,
            vehicleType: this.type.name
        };
    }
}

class AITrafficManager {
    constructor() {
        this.vehicles = [];
        this.spawnTimer = 0;
        this.spawnInterval = 3000;
        this.maxVehicles = 8;
        this.scene = null;
        this.lastStageStats = null;
        this.currentStage = 1;

        // Stage progression system
        this.stages = {
            1: {
                name: "Nyarugenge District",
                distanceRequired: 0,
                maxVehicles: 6,
                truckSpeed: -30,
                description: "Navigate through the bustling city center!",
                spawnInterval: 4000
            },
            2: {
                name: "Kicukiro District",
                distanceRequired: 2000,
                maxVehicles: 8,
                truckSpeed: -25,
                description: "Challenge yourself in the industrial zone!",
                spawnInterval: 3500
            },
            3: {
                name: "Gasabo District",
                distanceRequired: 4000,
                maxVehicles: 10,
                truckSpeed: -20,
                description: "Master the crowded residential district!",
                spawnInterval: 3000
            },
            4: {
                name: "Magic Garden",
                distanceRequired: 6000,
                description: "A peaceful paradise awaits...",
                maxVehicles: 0,
                spawnInterval: 0,
                isSpecial: true
            }
        };
    }

    setScene(scene) {
        this.scene = scene;
    }

    getCurrentStage(distance) {
        if (distance >= this.stages[4].distanceRequired) {
            return 4; // Magic Garden
        } else if (distance >= this.stages[3].distanceRequired) {
            return 3; // Gasabo
        } else if (distance >= this.stages[2].distanceRequired) {
            return 2; // Kicukiro
        } else {
            return 1; // Nyarugenge
        }
    }

    showCheckpoint(stage) {
        const stageConfig = this.stages[stage];
        const previousStage = stage - 1;
        const previousStageConfig = this.stages[previousStage];

        // Create or get the stage progress HUD
        let hudElement = document.getElementById('stage-progress');
        if (!hudElement) {
            hudElement = document.createElement('div');
            hudElement.id = 'stage-progress';
            document.body.appendChild(hudElement);

            // Add CSS styles dynamically
            const style = document.createElement('style');
            style.textContent = `
                #stage-progress {
                    position: fixed;
                    top: 60px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0, 0, 0, 0.7);
                    color: white;
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-family: Arial, sans-serif;
                    text-align: center;
                    z-index: 1000;
                    pointer-events: none;
                    transition: opacity 0.5s;
                }
                .stage-title {
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 5px;
                    color: #FFD700;
                }
                .stage-stats {
                    font-size: 14px;
                    margin: 5px 0;
                    color: #FFFFFF;
                }
                .stage-difficulty {
                    color: #FFD700;
                    margin-top: 5px;
                }
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                    10% { opacity: 1; transform: translateX(-50%) translateY(0); }
                    90% { opacity: 1; transform: translateX(-50%) translateY(0); }
                    100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                }
            `;
            document.head.appendChild(style);
        }

        // Store the stats of the completed stage
        this.lastStageStats = {
            stageName: previousStageConfig.name,
            distance: (stageConfig.distanceRequired - previousStageConfig.distanceRequired) / 1000,
            difficulty: this.getDifficultyStars(previousStage)
        };

        // Update HUD content
        hudElement.innerHTML = `
            <div class="stage-title">${stageConfig.name}</div>
            <div class="stage-stats">
                Previous Stage: ${this.lastStageStats.stageName}<br>
                Distance: ${this.lastStageStats.distance.toFixed(1)} km<br>
                Difficulty: ${this.lastStageStats.difficulty}
            </div>
        `;

        // Animate the HUD
        hudElement.style.animation = 'fadeInOut 5s forwards';

        // Remove the HUD after animation
        setTimeout(() => {
            hudElement.remove();
        }, 5000);
    }

    getDifficultyStars(stage) {
        const stars = '★'.repeat(stage) + '☆'.repeat(4 - stage);
        return stars;
    }

    spawnVehicle(playerSpeed, stage) {
        if (this.vehicles.length >= this.stages[stage].maxVehicles) return;

        const stageConfig = this.stages[stage];
        
        // Create new truck
        const vehicle = new AIVehicle(0, 0);
        
        // Set speed based on stage config with some variation
        const speedVariation = (Math.random() - 0.5) * 5; // ±2.5 speed variation
        vehicle.speed = playerSpeed + stageConfig.truckSpeed + speedVariation;
        
        // Spawn behind player with some variation in distance
        vehicle.position.z = 200 + (Math.random() - 0.5) * 50; // ±25 distance variation
        
        // More dynamic lane selection based on stage
        // Higher stages have more center lane usage
        const centerLaneChance = 0.3 + (stage - 1) * 0.1; // Increases with stage
        vehicle.lane = Math.random() < centerLaneChance ? 0 : -1;
        
        vehicle.manager = this;
        
        // Safe distance based on stage
        const baseDist = 70; // Base distance for trucks
        const stageDist = baseDist * (1 - ((stage - 1) * 0.1)); // Reduce distance in higher stages
        
        // Check for safe distance
        const isSafeToSpawn = !this.vehicles.some(v => {
            const dz = Math.abs(v.position.z - vehicle.position.z);
            const isSameLane = v.lane === vehicle.lane;
            const isAdjacentLane = Math.abs(v.lane - vehicle.lane) === 1;
            return dz < stageDist && (isSameLane || isAdjacentLane);
        });

        if (isSafeToSpawn && this.scene) {
            this.scene.add(vehicle.mesh);
            this.vehicles.push(vehicle);
        }
    }

    update(playerSpeed, deltaTime, distance) {
        const stage = this.getCurrentStage(distance);
        const stageConfig = this.stages[stage];
        
        // Update current stage if needed
        if (stage !== this.currentStage) {
            // Show checkpoint when entering a new stage (except first stage)
            if (this.currentStage && stage > this.currentStage) {
                this.showCheckpoint(stage);
            }
            
            this.currentStage = stage;
            
            // Announce stage change with proper formatting
            if (stage === 4) {
                console.log("%c🌸 Welcome to the Magic Garden! 🌸", "color: #FF69B4; font-size: 20px; font-weight: bold;");
            } else {
                console.log(
                    `%c→ Entering ${stageConfig.name} District ←\n${stageConfig.description}`,
                    "color: #4CAF50; font-size: 16px; font-weight: bold;"
                );
            }
            
            // Special handling for entering Magic Garden
            if (stage === 4) {
                // Gradually remove all vehicles
                this.vehicles.forEach(vehicle => {
                    vehicle.active = false;
                });
            }
        }
        
        // If in Magic Garden
        if (stage === 4) {
            // Remove any remaining vehicles
            this.vehicles = this.vehicles.filter(vehicle => {
                if (Math.abs(vehicle.position.z) > 50 || Math.random() < 0.1) {
                    this.scene.remove(vehicle.mesh);
                    return false;
                }
                vehicle.update(playerSpeed, deltaTime);
                return true;
            });
            return;
        }

        // Normal stage updates
        this.spawnInterval = stageConfig.spawnInterval;

        // Update spawn timer
        this.spawnTimer += deltaTime * 1000;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnVehicle(playerSpeed, stage);
            this.spawnTimer = 0;
        }

        // Update all vehicles
        this.vehicles = this.vehicles.filter(vehicle => {
            if (!vehicle.active && this.scene) {
                this.scene.remove(vehicle.mesh);
                return false;
            }
            vehicle.update(playerSpeed, deltaTime);
            return true;
        });
    }

    getCollisionDetails(playerX, playerZ, playerSpeed) {
        for (const vehicle of this.vehicles) {
            if (vehicle.checkCollision(playerX, playerZ)) {
                return vehicle.getCollisionDetails(playerX, playerZ, playerSpeed);
            }
        }
        return { isOvertaking: false };
    }

    checkCollisions(playerX, playerZ) {
        return this.vehicles.some(vehicle => vehicle.checkCollision(playerX, playerZ));
    }

    reset() {
        // Remove all vehicle meshes from the scene
        if (this.scene) {
            this.vehicles.forEach(vehicle => {
                if (vehicle.mesh) {
                    this.scene.remove(vehicle.mesh);
                }
            });
        }
        
        this.vehicles = [];
        this.spawnTimer = 0;
        this.difficulty = 1;
    }
}

// Export for use in game.js
window.AITrafficManager = AITrafficManager; 