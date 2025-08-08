class Car3D {
    constructor() {
        this.mesh = new THREE.Group();
        
        // Add wheel references
        this.wheelFL = null; // Front Left wheel
        this.wheelFR = null; // Front Right wheel
        this.maxWheelTurn = Math.PI / 4; // 45 degrees maximum wheel turn for more visible steering
        this.wheelReturnSpeed = 0.15; // Speed for wheel return
        this.currentWheelAngle = 0; // Track wheel angle separately from steering
        
        // Add turn signal timing
        this.turnSignalTimer = 0;
        this.turnSignalOn = false;
        this.lastTurnSignalUpdate = 0;
        this.turnSignalInterval = 500; // 500ms blink interval
        
        this.createCar();

        // Initialize movement properties
        this.speed = 0;
        this.maxSpeed = 220; // Increased max speed
        this.minSpeed = 0;
        
        // Acceleration properties
        this.acceleration = 0.3;  // Increased base acceleration
        this.accelerationCurve = [  // Improved acceleration curve
            { maxSpeed: 60, multiplier: 1.2 },   // 0-60: Enhanced acceleration
            { maxSpeed: 120, multiplier: 0.9 },  // 60-120: Strong acceleration
            { maxSpeed: 180, multiplier: 0.6 },  // 120-180: Moderate acceleration
            { maxSpeed: 220, multiplier: 0.3 }   // 180-220: Light acceleration
        ];
        
        // Braking properties
        this.baseBrakeForce = 0.5;  // Increased base brake force for better control
        this.brakeCurve = [  // Improved brake curve
            { minSpeed: 180, multiplier: 1.8 },  // Above 180: Very strong brakes
            { minSpeed: 120, multiplier: 1.4 },  // 120-180: Strong brakes
            { minSpeed: 60, multiplier: 1.1 },   // 60-120: Normal brakes
            { minSpeed: 0, multiplier: 0.9 }     // 0-60: Light brakes
        ];
        this.brakeDeceleration = 0;
        this.brakeTransitionTime = 150; // Faster brake response
        this.brakeStartTime = 0;
        
        // Natural deceleration (air resistance simulation)
        this.deceleration = 0.08;  // Reduced base deceleration
        this.decelerationCurve = [  // Improved deceleration curve
            { minSpeed: 180, multiplier: 1.6 },  // Above 180: High resistance
            { minSpeed: 120, multiplier: 1.2 },  // 120-180: Moderate resistance
            { minSpeed: 60, multiplier: 0.8 },   // 60-120: Light resistance
            { minSpeed: 0, multiplier: 0.4 }     // 0-60: Very light resistance
        ];

        // Other properties
        this.distance = 0;
        this.steerLeft = false;
        this.steerRight = false;
        this.brake = false;
        this.accelerate = false;
        this.position = { x: 0, y: 0, z: 0 };
        this.rotation = 0;
        this.steerAngle = 0;
        this.maxSteerAngle = 5; // Adjusted for new lane width
        this.steerSpeed = 0.22; // Adjusted for smoother lane changes
        this.rotationFactor = 0.025; // Adjusted for better turning feel
        this.currentX = 0;
        this.laneWidth = 3.5; // Match AI vehicle lane width
        this.maxLaneDeviation = 4.5; // Maximum deviation from center (slightly more than one lane)

        // Set initial position
        this.mesh.position.set(0, 0, 0);
    }

    createCar() {
        // Car body - main chassis
        const bodyGeometry = new THREE.BoxGeometry(2, 0.5, 4);
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x8B0000,
            shininess: 30
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.5;
        this.mesh.add(body);

        // Top part (cabin)
        const cabinGeometry = new THREE.BoxGeometry(1.8, 0.8, 2);
        const cabinMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x8B0000,
            transparent: true,
            opacity: 0.9,
            shininess: 30
        });
        const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
        cabin.position.y = 1.15;
        cabin.position.z = -0.5;
        this.mesh.add(cabin);

        // Windows with grass-like appearance
        const windowMaterial = new THREE.MeshPhongMaterial({
            color: 0x2F4F2F, // Dark green color
            transparent: true,
            opacity: 0.9,
            shininess: 100,
            specular: 0x333333
        });

        // Create a grass texture pattern
        const windowCanvas = document.createElement('canvas');
        const windowContext = windowCanvas.getContext('2d');
        windowCanvas.width = 128;
        windowCanvas.height = 128;
        
        // Create grass pattern
        windowContext.fillStyle = '#2F4F2F';
        windowContext.fillRect(0, 0, 128, 128);
        
        // Add grass-like strokes
        windowContext.strokeStyle = '#3F6F3F';
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * 128;
            const y = Math.random() * 128;
            windowContext.beginPath();
            windowContext.moveTo(x, y);
            windowContext.lineTo(x + Math.random() * 10 - 5, y + Math.random() * 15);
            windowContext.lineWidth = 2;
            windowContext.stroke();
        }
        
        const grassTexture = new THREE.CanvasTexture(windowCanvas);
        windowMaterial.map = grassTexture;

        // Windshield
        const windshieldGeometry = new THREE.PlaneGeometry(1.7, 0.7);
        const windshield = new THREE.Mesh(windshieldGeometry, windowMaterial);
        windshield.rotation.x = Math.PI * 0.2;
        windshield.position.set(0, 1.2, 0.3);
        this.mesh.add(windshield);

        // Rear window
        const rearWindow = new THREE.Mesh(windshieldGeometry, windowMaterial);
        rearWindow.rotation.x = -Math.PI * 0.2;
        rearWindow.position.set(0, 1.2, -1.3);
        this.mesh.add(rearWindow);

        // Side windows
        const sideWindowGeometry = new THREE.PlaneGeometry(0.7, 0.6);
        const leftWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
        leftWindow.rotation.y = Math.PI * 0.5;
        leftWindow.position.set(-0.9, 1.2, -0.5);
        this.mesh.add(leftWindow);

        const rightWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
        rightWindow.rotation.y = -Math.PI * 0.5;
        rightWindow.position.set(0.9, 1.2, -0.5);
        this.mesh.add(rightWindow);

        // Add doors
        const doorGeometry = new THREE.BoxGeometry(0.1, 0.9, 2);
        const doorMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x8B0000,
            shininess: 30
        });

        // Left door
        const leftDoor = new THREE.Mesh(doorGeometry, doorMaterial);
        leftDoor.position.set(-1, 0.8, -0.5);
        this.mesh.add(leftDoor);

        // Right door
        const rightDoor = new THREE.Mesh(doorGeometry, doorMaterial);
        rightDoor.position.set(1, 0.8, -0.5);
        this.mesh.add(rightDoor);

        // Door handles
        const handleGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.2);
        const handleMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xC0C0C0,
            shininess: 100,
            specular: 0x666666
        });

        // Left door handle
        const leftHandle = new THREE.Mesh(handleGeometry, handleMaterial);
        leftHandle.position.set(-1.05, 0.9, -0.2);
        this.mesh.add(leftHandle);

        // Right door handle
        const rightHandle = new THREE.Mesh(handleGeometry, handleMaterial);
        rightHandle.position.set(1.05, 0.9, -0.2);
        this.mesh.add(rightHandle);

        // Door lines/trim
        const doorLineGeometry = new THREE.BoxGeometry(0.02, 0.95, 2.1);
        const doorLineMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x000000,
            shininess: 30
        });

        // Left door line
        const leftDoorLine = new THREE.Mesh(doorLineGeometry, doorLineMaterial);
        leftDoorLine.position.set(-1.01, 0.8, -0.5);
        this.mesh.add(leftDoorLine);

        // Right door line
        const rightDoorLine = new THREE.Mesh(doorLineGeometry, doorLineMaterial);
        rightDoorLine.position.set(1.01, 0.8, -0.5);
        this.mesh.add(rightDoorLine);

        // Wheels
        const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 32);
        const wheelMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x000000,
            shininess: 30
        });

        // Front wheels with stored references for steering
        this.wheelFL = new THREE.Mesh(wheelGeometry, wheelMaterial);
        this.wheelFL.rotation.z = Math.PI * 0.5;
        this.wheelFL.position.set(-1.1, 0.4, 1.2);
        this.mesh.add(this.wheelFL);

        this.wheelFR = new THREE.Mesh(wheelGeometry, wheelMaterial);
        this.wheelFR.rotation.z = Math.PI * 0.5;
        this.wheelFR.position.set(1.1, 0.4, 1.2);
        this.mesh.add(this.wheelFR);

        // Rear wheels
        const wheelRL = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheelRL.rotation.z = Math.PI * 0.5;
        wheelRL.position.set(-1.1, 0.4, -1.2);
        this.mesh.add(wheelRL);

        const wheelRR = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheelRR.rotation.z = Math.PI * 0.5;
        wheelRR.position.set(1.1, 0.4, -1.2);
        this.mesh.add(wheelRR);

        // License plate at the back
        const plateGeometry = new THREE.BoxGeometry(1.2, 0.3, 0.05);
        const plateMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xFFD700,
            side: THREE.DoubleSide,
            shininess: 100
        });
        const plate = new THREE.Mesh(plateGeometry, plateMaterial);
        plate.position.set(0, 0.7, -1.95);
        this.mesh.add(plate);

        // License plate text
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 128;
        
        // Fill with yellow background
        context.fillStyle = '#FFD700';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add white text with black outline for better visibility
        context.strokeStyle = '#000000';
        context.lineWidth = 8;
        context.font = 'bold 90px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.strokeText('24RP01977', 256, 64);
        
        context.fillStyle = '#FFFFFF';
        context.font = 'bold 90px Arial';
        context.fillText('24RP01977', 256, 64);
        
        // Add plate border
        context.strokeStyle = '#000000';
        context.lineWidth = 4;
        context.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        const textGeometry = new THREE.PlaneGeometry(1.1, 0.25);
        const textMaterial = new THREE.MeshPhongMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide,
            shininess: 0
        });
        const plateText = new THREE.Mesh(textGeometry, textMaterial);
        plateText.position.set(0, 0.7, -1.97);
        this.mesh.add(plateText);

        // Black frame around the plate
        const frameGeometry = new THREE.BoxGeometry(1.3, 0.4, 0.1);
        const frameMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x000000,
            shininess: 30
        });
        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        frame.position.set(0, 0.7, -1.96);
        this.mesh.add(frame);

        // Dedicated spotlight for the plate
        const spotLight = new THREE.SpotLight(0xFFFFFF, 1);
        spotLight.position.set(0, 2, -3);
        spotLight.target.position.set(0, 0.7, -1.95);
        spotLight.angle = Math.PI / 10;
        spotLight.penumbra = 0.3;
        spotLight.distance = 3;
        this.mesh.add(spotLight);
        this.mesh.add(spotLight.target);

        // Top display (2025)
        const topDisplayGeometry = new THREE.BoxGeometry(1.7, 0.2, 0.8);
        const topDisplayMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xFF0000,
            shininess: 30
        });
        const topDisplay = new THREE.Mesh(topDisplayGeometry, topDisplayMaterial);
        topDisplay.position.set(0, 1.6, -0.5);
        this.mesh.add(topDisplay);

        // 2025 text on top
        const topCanvas = document.createElement('canvas');
        const topContext = topCanvas.getContext('2d');
        topCanvas.width = 256;
        topCanvas.height = 64;
        topContext.fillStyle = '#FFFFFF';
        topContext.font = 'bold 48px Arial';
        topContext.textAlign = 'center';
        topContext.fillText('2025', 128, 48);

        const topTexture = new THREE.CanvasTexture(topCanvas);
        const topTextGeometry = new THREE.PlaneGeometry(0.8, 0.15);
        const topTextMaterial = new THREE.MeshPhongMaterial({
            map: topTexture,
            transparent: true,
            side: THREE.DoubleSide,
            shininess: 0
        });
        const topText = new THREE.Mesh(topTextGeometry, topTextMaterial);
        topText.rotation.x = -Math.PI * 0.5;
        topText.position.set(0, 1.71, -0.5);
        this.mesh.add(topText);

        // Add brake lights
        const brakeLightGeometry = new THREE.BoxGeometry(0.3, 0.15, 0.05);
        const brakeLightMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x330000,  // Dark red when off
            emissive: 0x330000,
            emissiveIntensity: 0.2,
            shininess: 100
        });
        
        // Left brake light
        this.leftBrakeLight = new THREE.Mesh(brakeLightGeometry, brakeLightMaterial.clone());
        this.leftBrakeLight.position.set(-0.7, 0.7, -2.0);
        this.mesh.add(this.leftBrakeLight);
        
        // Right brake light
        this.rightBrakeLight = new THREE.Mesh(brakeLightGeometry, brakeLightMaterial.clone());
        this.rightBrakeLight.position.set(0.7, 0.7, -2.0);
        this.mesh.add(this.rightBrakeLight);

        // Add brake light housing (black frame)
        const lightHousingGeometry = new THREE.BoxGeometry(0.35, 0.2, 0.07);
        const lightHousingMaterial = new THREE.MeshPhongMaterial({
            color: 0x000000,
            shininess: 30
        });
        
        const leftHousing = new THREE.Mesh(lightHousingGeometry, lightHousingMaterial);
        leftHousing.position.set(-0.7, 0.7, -1.98);
        this.mesh.add(leftHousing);
        
        const rightHousing = new THREE.Mesh(lightHousingGeometry, lightHousingMaterial);
        rightHousing.position.set(0.7, 0.7, -1.98);
        this.mesh.add(rightHousing);

        // Add turn signal indicators
        const turnSignalGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.05);
        const turnSignalMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x332200,  // Dark amber when off
            emissive: 0x332200,
            emissiveIntensity: 0.2,
            shininess: 100
        });
        
        // Left turn signal
        this.leftTurnSignal = new THREE.Mesh(turnSignalGeometry, turnSignalMaterial.clone());
        this.leftTurnSignal.position.set(-0.95, 0.7, -2.0);
        this.mesh.add(this.leftTurnSignal);
        
        // Right turn signal
        this.rightTurnSignal = new THREE.Mesh(turnSignalGeometry, turnSignalMaterial.clone());
        this.rightTurnSignal.position.set(0.95, 0.7, -2.0);
        this.mesh.add(this.rightTurnSignal);

        // Add turn signal housing (black frame)
        const signalHousingGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.07);
        const signalHousingMaterial = new THREE.MeshPhongMaterial({
            color: 0x000000,
            shininess: 30
        });
        
        const leftSignalHousing = new THREE.Mesh(signalHousingGeometry, signalHousingMaterial);
        leftSignalHousing.position.set(-0.95, 0.7, -1.98);
        this.mesh.add(leftSignalHousing);
        
        const rightSignalHousing = new THREE.Mesh(signalHousingGeometry, signalHousingMaterial);
        rightSignalHousing.position.set(0.95, 0.7, -1.98);
        this.mesh.add(rightSignalHousing);
    }

    getMultiplier(value, curve, isAcceleration = false) {
        for (const point of curve) {
            if (isAcceleration && value <= point.maxSpeed) {
                return point.multiplier;
            } else if (!isAcceleration && value >= point.minSpeed) {
                return point.multiplier;
            }
        }
        return 1.0; // Default multiplier
    }

    update() {
        const now = performance.now();

        // Update turn signals based on steering
        if (now - this.lastTurnSignalUpdate > this.turnSignalInterval) {
            this.turnSignalOn = !this.turnSignalOn;
            this.lastTurnSignalUpdate = now;
        }

        // Update right turn signal based on active steering input
        if (this.steerLeft) {  // When steering left, car moves right, so right signal
            if (this.turnSignalOn) {
                this.rightTurnSignal.material.emissive.setHex(0xff8800);  // Bright amber
                this.rightTurnSignal.material.emissiveIntensity = 1.0;
            } else {
                this.rightTurnSignal.material.emissive.setHex(0x332200);  // Dark amber
                this.rightTurnSignal.material.emissiveIntensity = 0.2;
            }
        } else {
            this.rightTurnSignal.material.emissive.setHex(0x332200);
            this.rightTurnSignal.material.emissiveIntensity = 0.2;
        }

        // Update left turn signal based on active steering input
        if (this.steerRight) {  // When steering right, car moves left, so left signal
            if (this.turnSignalOn) {
                this.leftTurnSignal.material.emissive.setHex(0xff8800);  // Bright amber
                this.leftTurnSignal.material.emissiveIntensity = 1.0;
            } else {
                this.leftTurnSignal.material.emissive.setHex(0x332200);  // Dark amber
                this.leftTurnSignal.material.emissiveIntensity = 0.2;
            }
        } else {
            this.leftTurnSignal.material.emissive.setHex(0x332200);
            this.leftTurnSignal.material.emissiveIntensity = 0.2;
        }

        // Update brake lights based on brake state
        if (this.brake) {
            // Bright red when braking
            this.leftBrakeLight.material.emissive.setHex(0xff0000);
            this.leftBrakeLight.material.emissiveIntensity = 1.0;
            this.rightBrakeLight.material.emissive.setHex(0xff0000);
            this.rightBrakeLight.material.emissiveIntensity = 1.0;
        } else {
            // Dim red when not braking
            this.leftBrakeLight.material.emissive.setHex(0x330000);
            this.leftBrakeLight.material.emissiveIntensity = 0.2;
            this.rightBrakeLight.material.emissive.setHex(0x330000);
            this.rightBrakeLight.material.emissiveIntensity = 0.2;
        }

        // Update speed based on user input
        if (this.accelerate && !this.brake) {
            const accelerationMultiplier = this.getMultiplier(this.speed, this.accelerationCurve, true);
            const finalAcceleration = this.acceleration * accelerationMultiplier;
            
            this.speed = Math.min(this.speed + finalAcceleration, this.maxSpeed);
            this.brakeDeceleration = 0;
            this.brakeStartTime = 0;
        } else if (this.brake) {
            // Start braking if not already braking
            if (this.brakeStartTime === 0) {
                this.brakeStartTime = now;
            }

            // Calculate brake force based on time elapsed and current speed
            const timeElapsed = Math.min(now - this.brakeStartTime, this.brakeTransitionTime);
            const brakeProgress = timeElapsed / this.brakeTransitionTime;
            
            // Get brake force multiplier based on current speed
            const brakeMultiplier = this.getMultiplier(this.speed, this.brakeCurve);
            this.brakeDeceleration = this.baseBrakeForce * brakeMultiplier * brakeProgress;

            // Apply brake force
            this.speed = Math.max(this.speed - this.brakeDeceleration, 0);
        } else {
            // Natural deceleration with air resistance
            const decelerationMultiplier = this.getMultiplier(this.speed, this.decelerationCurve);
            const finalDeceleration = this.deceleration * decelerationMultiplier;
            
            this.speed = Math.max(this.speed - finalDeceleration, 0);
            this.brakeDeceleration = 0;
            this.brakeStartTime = 0;
        }

        // Update steering with improved wheel rotation
        const speedFactor = Math.min(this.speed / 100, 1);
        const steeringMultiplier = 1 + (speedFactor * 0.3);

        if (this.steerLeft) {
            const targetX = Math.max(this.currentX - this.steerSpeed * steeringMultiplier, -this.maxLaneDeviation);
            this.currentX = targetX;
            // Make wheels turn more visibly when steering left
            this.currentWheelAngle = Math.min(this.maxWheelTurn, this.maxWheelTurn * (this.currentX / this.maxLaneDeviation));
        } else if (this.steerRight) {
            const targetX = Math.min(this.currentX + this.steerSpeed * steeringMultiplier, this.maxLaneDeviation);
            this.currentX = targetX;
            // Make wheels turn more visibly when steering right
            this.currentWheelAngle = Math.max(-this.maxWheelTurn, -this.maxWheelTurn * (this.currentX / this.maxLaneDeviation));
        } else {
            // Gradually return wheels to center when not steering
            if (Math.abs(this.currentWheelAngle) > 0.01) {
                this.currentWheelAngle *= (1 - this.wheelReturnSpeed);
            } else {
                this.currentWheelAngle = 0;
            }
        }

        // Apply position and rotation
        this.mesh.position.x = -this.currentX;
        this.mesh.rotation.y = this.currentX * this.rotationFactor;

        // Update front wheel rotation with the new angle
        this.wheelFL.rotation.y = this.currentWheelAngle;
        this.wheelFR.rotation.y = this.currentWheelAngle;

        // Update distance traveled
        this.distance += this.speed / 60;
    }

    // Modify setMouseSteering to update wheel angle
    setMouseSteering(normalizedX) {
        // normalizedX should be between -1 and 1
        this.currentX = Math.max(Math.min(-normalizedX * 4, 4), -4);
        this.currentWheelAngle = (normalizedX * 4 / 3) * this.maxWheelTurn;
    }

    handlePhysicsAndCollisions() {
        // Position constraints
        const maxPlayerX = 4.5; // Maximum lateral position (1.5 lanes on each side)
        this.mesh.position.x = Math.max(-maxPlayerX, Math.min(maxPlayerX, this.mesh.position.x));
        
        // Ground collision and air time
        const groundY = 0; // Base ground level
        const elasticity = 0.6; // Reduced from 1.2 for more realistic bouncing
        
        // Track info based on current stage
        const stage = this.game.aiTraffic.getCurrentStage(this.distance);
        const stageConfig = this.game.aiTraffic.stages[stage];
        
        // Ground collision check
        let offRoad = false;
        let onGround = false;
        const lastAirTime = this.airTime || 0;
        
        if (this.mesh.position.y <= groundY) {
            // Ground collision response
            this.mesh.position.y = groundY;
            
            // Apply bounce if falling with significant velocity
            if (this.velocity.y < -1) {
                // Scale bounce based on stage (less bounce in harder stages)
                const stageBounceScale = 1 - ((stage - 1) * 0.15);
                this.velocity.y = -this.velocity.y * elasticity * stageBounceScale;
                
                // Play landing sound if it was a significant fall
                if (lastAirTime > 0.3) {
                    Sounds.land();
                }
            } else {
                this.velocity.y = 0;
            }
            
            // Off-road check (more than 1.5 lanes from center)
            if (Math.abs(this.mesh.position.x) > 3.0) {
                offRoad = true;
                // Slow down more in higher stages when off-road
                const offRoadSlowdown = 0.98 - ((stage - 1) * 0.02);
                this.speed *= offRoadSlowdown;
                
                // Rougher off-road in higher stages
                this.bumpTimer += this.speed * (0.8 + (stage - 1) * 0.1);
                if (this.bumpTimer > 150) {
                    // More intense bumps in higher stages
                    const bumpIntensity = Math.min(50, this.speed) * 0.1 * (1 + (stage - 1) * 0.2);
                    this.velocity.y += bumpIntensity;
                    this.bumpTimer = 0;
                    Sounds.bump();
                }
            }
            
            onGround = true;
            this.airTime = 0;
            
            // Ground movement
            if (onGround) {
                // Stage-specific handling
                const stageSpeedFactor = 1 + ((stage - 1) * 0.2); // Faster acceleration in higher stages
                
                if (this.accelerate) {
                    // Acceleration scales with stage
                    const acceleration = this.baseAcceleration * stageSpeedFactor;
                    this.speed = Math.min(this.maxSpeed, this.speed + acceleration);
                } else if (this.brake) {
                    // Braking power reduced in higher stages
                    const brakePower = this.baseBrake * (1 - ((stage - 1) * 0.1));
                    this.speed = Math.max(0, this.speed - brakePower);
                }
            }
        } else {
            // In-air physics
            this.airTime = (this.airTime || 0) + 0.016; // Assuming 60fps
            this.velocity.y -= 9.81 * 0.016; // Gravity
            this.mesh.position.y += this.velocity.y * 0.016;
            
            // Less control in air
            this.speed *= 0.995;
        }
        
        // Vehicle collision detection
        const collisionRange = 40;
        const vehicleWidth = 2.0; // Base car width
        const vehicleLength = 4.2; // Base car length
        
        // Get all nearby vehicles
        const nearbyVehicles = this.game.aiTraffic.vehicles.filter(vehicle => {
            const dz = Math.abs(vehicle.position.z - this.mesh.position.z);
            return dz < collisionRange;
        });
        
        // Check collisions with each vehicle
        for (const vehicle of nearbyVehicles) {
            const dx = Math.abs(this.mesh.position.x - (vehicle.lane * 3.0));
            const dz = Math.abs(this.mesh.position.z - vehicle.position.z);
            
            // Adjust collision box based on vehicle type
            const totalWidth = vehicleWidth + vehicle.width;
            const totalLength = vehicleLength + vehicle.length;
            
            if (dx < totalWidth/2 && dz < totalLength/2) {
                // Collision response
                const collisionForce = this.speed * 0.5;
                
                // Push the vehicles apart
                if (this.mesh.position.x < vehicle.position.x) {
                    this.velocity.x = -collisionForce;
                } else {
                    this.velocity.x = collisionForce;
                }
                
                // Reduce speed
                this.speed *= 0.7;
                
                // Trigger collision effect
                this.game.handleCollision();
                break;
            }
        }
        
        // Apply final velocity
        this.mesh.position.x += this.velocity.x * 0.016;
        this.mesh.position.z += this.speed * 0.016;
        
        // Update distance
        this.distance += this.speed * 0.016;
    }
} 