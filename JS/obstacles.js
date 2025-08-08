// Material helpers - define first
class ObstacleMaterials {
    static get cone() {
        if (!this._coneMaterial) {
            this._coneMaterial = new THREE.MeshPhongMaterial({ 
                color: 0xFF6600,
                shininess: 30
            });
        }
        return this._coneMaterial;
    }

    static get stripe() {
        if (!this._stripeMaterial) {
            this._stripeMaterial = new THREE.MeshPhongMaterial({ 
                color: 0xFFFFFF,
                emissive: 0x666666
            });
        }
        return this._stripeMaterial;
    }

    static get hole() {
        if (!this._holeMaterial) {
            this._holeMaterial = new THREE.MeshPhongMaterial({ 
                color: 0x333333,
                side: THREE.DoubleSide
            });
        }
        return this._holeMaterial;
    }

    static get innerHole() {
        if (!this._innerHoleMaterial) {
            this._innerHoleMaterial = new THREE.MeshPhongMaterial({ 
                color: 0x1a1a1a,
                side: THREE.DoubleSide
            });
        }
        return this._innerHoleMaterial;
    }

    static get barrier() {
        if (!this._barrierTexture) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 256;
            canvas.height = 64;

            // Create red and white stripes
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#FFFFFF';
            const stripeWidth = canvas.width / 8;
            for(let i = 0; i < canvas.width; i += stripeWidth * 2) {
                ctx.fillRect(i, 0, stripeWidth, canvas.height);
            }

            this._barrierTexture = new THREE.CanvasTexture(canvas);
            this._barrierMaterial = new THREE.MeshPhongMaterial({
                map: this._barrierTexture
            });
        }
        return this._barrierMaterial;
    }

    static get warningLight() {
        if (!this._warningLightMaterial) {
            this._warningLightMaterial = new THREE.MeshPhongMaterial({ 
                color: 0xFF0000,
                emissive: 0xFF0000,
                emissiveIntensity: 0.5
            });
        }
        return this._warningLightMaterial;
    }
}

// Obstacle class definition
class Obstacle {
    constructor(type, lane, z) {
        this.type = type;  // 'cone', 'pothole', 'roadblock'
        this.lane = lane;  // -1 (left), 0 (center), 1 (right)
        this.position = { x: lane * 3.5, y: 0, z: z }; // Adjusted lane width
        this.active = true;
        this.width = this.getWidth();
        this.length = this.getLength();
        this.mesh = this.createMesh();
        this.updateMeshPosition();
        this.hasCollided = false; // Track if obstacle has been hit

        // Physics properties for cones
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.angularVelocity = new THREE.Vector3(0, 0, 0);
        this.mass = this.type === 'cone' ? 2 : 1000; // Cones are light, others are heavy
        this.gravity = -9.81;
        this.airResistance = 0.02;
        this.groundFriction = 0.3;
        this.restitution = 0.6; // Bounciness factor
        this.rotationSpeed = new THREE.Vector3(0, 0, 0);
        this.isFlying = false;
    }

    createMesh() {
        const group = new THREE.Group();

        switch(this.type) {
            case 'cone':
                // Create traffic cone
                const coneGeometry = new THREE.ConeGeometry(0.3, 0.8, 32);
                const cone = new THREE.Mesh(coneGeometry, ObstacleMaterials.cone);
                cone.position.y = 0.4; // Half height

                // Add reflective stripes
                const stripeGeometry = new THREE.TorusGeometry(0.31, 0.05, 16, 32);
                const stripe1 = new THREE.Mesh(stripeGeometry, ObstacleMaterials.stripe);
                stripe1.position.y = 0.2;
                stripe1.rotation.x = Math.PI / 2;
                
                const stripe2 = stripe1.clone();
                stripe2.position.y = 0.4;

                group.add(cone, stripe1, stripe2);
                break;

            case 'pothole':
                // Create pothole
                const holeGeometry = new THREE.CircleGeometry(0.8, 32);
                const hole = new THREE.Mesh(holeGeometry, ObstacleMaterials.hole);
                hole.rotation.x = -Math.PI / 2;
                hole.position.y = 0.01; // Slightly above road

                // Add depth effect with inner circle
                const innerGeometry = new THREE.CircleGeometry(0.6, 32);
                const innerHole = new THREE.Mesh(innerGeometry, ObstacleMaterials.innerHole);
                innerHole.rotation.x = -Math.PI / 2;
                innerHole.position.y = 0.005;

                group.add(hole, innerHole);
                break;

            case 'roadblock':
                // Create striped barrier
                const barrierGeometry = new THREE.BoxGeometry(3, 1, 0.3);
                const barrier = new THREE.Mesh(barrierGeometry, ObstacleMaterials.barrier);
                barrier.position.y = 0.5;

                // Add warning lights
                const lightGeometry = new THREE.SphereGeometry(0.1, 16, 16);
                const warningLightMaterial = ObstacleMaterials.warningLight;

                const leftLight = new THREE.Mesh(lightGeometry, warningLightMaterial);
                leftLight.position.set(-1.4, 0.5, 0);
                
                const rightLight = new THREE.Mesh(lightGeometry, warningLightMaterial);
                rightLight.position.set(1.4, 0.5, 0);

                group.add(barrier, leftLight, rightLight);
                break;
        }

        return group;
    }

    updateMeshPosition() {
        if (this.mesh) {
            this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        }
    }

    getWidth() {
        switch(this.type) {
            case 'cone': return 1;
            case 'pothole': return 2;
            case 'roadblock': return 6;
            default: return 1;
        }
    }

    getLength() {
        switch(this.type) {
            case 'cone': return 1;
            case 'pothole': return 2;
            case 'roadblock': return 2;
            default: return 1;
        }
    }

    update(playerSpeed, deltaTime) {
        if (this.type === 'cone' && this.isFlying) {
            // Update position based on velocity
            this.position.x += this.velocity.x * deltaTime;
            this.position.y += this.velocity.y * deltaTime;
            this.position.z += (this.velocity.z - playerSpeed) * deltaTime;

            // Apply gravity
            this.velocity.y += this.gravity * deltaTime;

            // Apply air resistance
            this.velocity.multiplyScalar(1 - this.airResistance);
            this.angularVelocity.multiplyScalar(1 - this.airResistance);

            // Update rotation
            this.mesh.rotation.x += this.angularVelocity.x * deltaTime;
            this.mesh.rotation.y += this.angularVelocity.y * deltaTime;
            this.mesh.rotation.z += this.angularVelocity.z * deltaTime;

            // Ground collision
            if (this.position.y < 0) {
                this.position.y = 0;
                this.velocity.y = -this.velocity.y * this.restitution;
                
                // Apply ground friction to horizontal velocities
                this.velocity.x *= (1 - this.groundFriction);
                this.velocity.z *= (1 - this.groundFriction);

                // Reduce angular velocity on ground contact
                this.angularVelocity.multiplyScalar(0.8);

                // Stop bouncing if velocity is very low
                if (Math.abs(this.velocity.y) < 0.1) {
                    this.velocity.y = 0;
                }
            }
        } else {
            // Normal movement for non-flying obstacles
            this.position.z -= playerSpeed * deltaTime;
        }

        this.updateMeshPosition();

        // Deactivate if passed or too far away
        if (this.position.z < -50 || this.position.z > 200 || 
            Math.abs(this.position.x) > 20) { // Also remove if flew too far sideways
            this.active = false;
            if (this.mesh && this.mesh.parent) {
                this.mesh.parent.remove(this.mesh);
            }
        }
    }

    handleCollision(playerX, playerZ, playerSpeed) {
        if (this.type === 'cone') {
            // Calculate impact direction and force
            const impactX = this.position.x - playerX;
            const normalizedImpactX = impactX / Math.abs(impactX);
            
            // Set initial velocities based on impact
            this.velocity.set(
                normalizedImpactX * (5 + Math.random() * 3), // Sideways velocity
                8 + Math.random() * 4,                       // Upward velocity
                playerSpeed * 0.5                            // Forward velocity
            );

            // Add random rotation
            this.angularVelocity.set(
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10
            );

            this.isFlying = true;
            this.hasCollided = true;
            return true;
        }
        return false;
    }

    checkCollision(playerX, playerZ) {
        if (!this.active || this.hasCollided) return false;

        const dx = Math.abs(this.position.x - playerX);
        const dz = Math.abs(this.position.z - playerZ);
        
        const baseWidthThreshold = this.width * 0.8;
        const baseLengthThreshold = this.length * 0.7;

        if (dx < baseWidthThreshold && dz < baseLengthThreshold) {
            return true;
        }

        return false;
    }

    getSpeedImpact() {
        switch(this.type) {
            case 'cone': return {
                speedMultiplier: 0.2, // 80% speed reduction
                recoveryTime: 1000,    // 1 second recovery
                damageType: 'light'
            };
            case 'pothole': return {
                speedMultiplier: 0.2, // 80% speed reduction
                recoveryTime: 2000,   // 2 seconds recovery
                damageType: 'medium'
            };
            case 'roadblock': return {
                speedMultiplier: 0.2, // 80% speed reduction
                recoveryTime: 3000,   // 3 seconds recovery
                damageType: 'heavy'
            };
            default: return {
                speedMultiplier: 0.2,
                recoveryTime: 1000,
                damageType: 'light'
            };
        }
    }

    getDamageEffect() {
        const impact = this.getSpeedImpact();
        switch(this.type) {
            case 'cone': return {
                shake: 0.3,           // Increased shake effect
                duration: 500,        // Longer effect duration
                sound: 'bump',
                speedEffect: impact
            };
            case 'pothole': return {
                shake: 0.5,           // Increased shake effect
                duration: 800,        // Longer effect duration
                sound: 'thud',
                speedEffect: impact
            };
            case 'roadblock': return {
                shake: 0.8,
                duration: 1000,
                sound: 'crash',
                speedEffect: impact
            };
            default: return {
                shake: 0.3,
                duration: 500,
                sound: 'bump',
                speedEffect: impact
            };
        }
    }
}

// ObstacleManager class definition
class ObstacleManager {
    constructor() {
        this.obstacles = [];
        this.scene = null;
        this.spawnTimer = 0;
        this.difficulty = 1;
        this.baseSpawnInterval = 3000; // Base spawn interval in milliseconds
        
        // Define obstacle types with their stage availability and probability
        this.obstacleConfig = {
            cone: {
                stages: [1, 2, 3, 4],
                baseProb: 0.5,
                probIncrease: 0.1
            },
            pothole: {
                stages: [2, 3, 4],
                baseProb: 0.3,
                probIncrease: 0.15
            },
            roadblock: {
                stages: [3, 4],
                baseProb: 0.2,
                probIncrease: 0.2
            }
        };
    }

    setScene(scene) {
        this.scene = scene;
    }

    getSpawnRate(distance) {
        // Calculate stage based on distance
        const stage = this.getCurrentStage(distance);
        
        // Base spawn rate increases with stage
        const baseRate = 0.1 + (stage * 0.05);
        
        // Add some randomness
        return baseRate * (0.8 + Math.random() * 0.4);
    }

    getCurrentStage(distance) {
        // New stage every 1000 meters, max 4 stages
        return Math.min(1 + Math.floor(distance / 1000), 4);
    }

    update(playerSpeed, deltaTime, distance) {
        // Update existing obstacles
        this.obstacles.forEach(obstacle => {
            if (obstacle.active) {
                obstacle.update(playerSpeed, deltaTime);
            }
        });

        // Remove inactive obstacles
        this.obstacles = this.obstacles.filter(obstacle => {
            if (!obstacle.active && obstacle.mesh.parent) {
                this.scene.remove(obstacle.mesh);
            }
            return obstacle.active;
        });

        // Spawn new obstacles based on distance and stage
        const spawnChance = this.getSpawnRate(distance);
        if (Math.random() < spawnChance * deltaTime) {
            const stage = this.getCurrentStage(distance);
            const obstacle = this.spawnObstacle(stage);
            if (obstacle) {
                this.obstacles.push(obstacle);
                this.scene.add(obstacle.mesh);
            }
        }
    }

    spawnObstacle(stage) {
        if (this.obstacles.length >= this.maxObstacles || !this.scene) return;

        // Calculate probabilities based on stage
        const availableTypes = Object.entries(this.obstacleConfig)
            .filter(([_, config]) => config.stages.includes(stage))
            .map(([type, config]) => ({
                type,
                probability: config.baseProb + (config.probIncrease * (stage - 1))
            }));

        // Normalize probabilities
        const totalProb = availableTypes.reduce((sum, t) => sum + t.probability, 0);
        const normalizedTypes = availableTypes.map(t => ({
            ...t,
            probability: t.probability / totalProb
        }));

        // Select obstacle type
        const rand = Math.random();
        let cumProb = 0;
        let selectedType = normalizedTypes[0].type;
        for (const t of normalizedTypes) {
            cumProb += t.probability;
            if (rand <= cumProb) {
                selectedType = t.type;
                break;
            }
        }

        // Improved lane selection with player challenge scaling
        const lanes = [-1, 0, 1];
        const playerLaneWeight = Math.min(0.3 + (stage * 0.1), 0.6);
        const sideLaneWeight = (1 - playerLaneWeight) / 2;
        
        const laneProbs = [sideLaneWeight, playerLaneWeight, sideLaneWeight];
        const laneRand = Math.random();
        let cumLaneProb = 0;
        let selectedLane = 0;
        
        for (let i = 0; i < lanes.length; i++) {
            cumLaneProb += laneProbs[i];
            if (laneRand <= cumLaneProb) {
                selectedLane = lanes[i];
                break;
            }
        }

        // Spawn ahead of the player (positive Z)
        const baseDistance = 150; // Changed from -150 to 150
        const randomSpread = 50;
        const z = baseDistance + (Math.random() * randomSpread); // Now spawning in positive Z
        
        // Create the obstacle
        const obstacle = new Obstacle(selectedType, selectedLane, z);
        
        // Check for safe spawn position
        const minDistance = 20;
        const isSafeToSpawn = !this.obstacles.some(obs => 
            Math.abs(obs.position.z - z) < minDistance && 
            Math.abs(obs.position.x - obstacle.position.x) < obs.width
        );

        if (isSafeToSpawn) {
            this.scene.add(obstacle.mesh);
            this.obstacles.push(obstacle);
        }
    }

    checkCollisions(playerX, playerZ, playerSpeed) {
        let collisions = [];
        
        this.obstacles.forEach(obstacle => {
            if (obstacle.checkCollision(playerX, playerZ)) {
                if (obstacle.type === 'cone') {
                    // Handle physics-based collision for cones
                    if (obstacle.handleCollision(playerX, playerZ, playerSpeed)) {
                        collisions.push({
                            obstacle: obstacle,
                            effect: obstacle.getDamageEffect(),
                            collisionPoint: new THREE.Vector3(
                                obstacle.position.x,
                                obstacle.position.y,
                                obstacle.position.z
                            )
                        });
                    }
                } else {
                    // Handle regular collision for other obstacles
                    obstacle.hasCollided = true;
                    collisions.push({
                        obstacle: obstacle,
                        effect: obstacle.getDamageEffect(),
                        collisionPoint: new THREE.Vector3(
                            obstacle.position.x,
                            obstacle.position.y,
                            obstacle.position.z
                        )
                    });
                }
            }
        });

        return collisions;
    }

    reset() {
        // Remove all obstacle meshes from scene
        this.obstacles.forEach(obstacle => {
            if (obstacle.mesh && obstacle.mesh.parent) {
                obstacle.mesh.parent.remove(obstacle.mesh);
            }
        });
        
        this.obstacles = [];
        this.spawnTimer = 0;
        this.difficulty = 1;
    }
}

// Export at the end after all classes are defined
if (typeof window !== 'undefined') {
    window.ObstacleManager = ObstacleManager;
} 