class Scenery {
    constructor(scene) {
        this.scene = scene;
        this.decorativeElements = [];
        this.lastSpawnPosition = 0;
        this.spawnInterval = 50; // Distance between spawns
        this.maxElements = 30; // Maximum number of elements visible at once
        this.despawnDistance = -50; // Distance at which elements are removed
        this.spawnDistance = 200; // Distance ahead where elements spawn
        
        // Initialize different types of scenery elements
        this.initializeSceneryTypes();
    }

    initializeSceneryTypes() {
        // Define different types of scenery elements
        this.sceneryTypes = {
            rocks: {
                probability: 0.3,
                generator: this.createRock.bind(this)
            },
            flowers: {
                probability: 0.4,
                generator: this.createFlowerPatch.bind(this)
            },
            mailboxes: {
                probability: 0.15,
                generator: this.createMailbox.bind(this)
            },
            signposts: {
                probability: 0.15,
                generator: this.createSignpost.bind(this)
            }
        };
    }

    createRock() {
        const rockGroup = new THREE.Group();
        
        // Create main rock shape
        const geometry = new THREE.DodecahedronGeometry(
            0.5 + Math.random() * 1, // Random size
            0 // No subdivisions for a more rugged look
        );
        
        const material = new THREE.MeshPhongMaterial({
            color: 0x808080,
            flatShading: true,
            shininess: 0
        });

        const rock = new THREE.Mesh(geometry, material);
        
        // Random rotation for variety
        rock.rotation.x = Math.random() * Math.PI;
        rock.rotation.y = Math.random() * Math.PI;
        rock.rotation.z = Math.random() * Math.PI;
        
        // Random scale for variety
        const scale = 0.5 + Math.random() * 1;
        rock.scale.set(scale, scale * 0.7, scale);
        
        rockGroup.add(rock);
        return rockGroup;
    }

    createFlowerPatch() {
        const patchGroup = new THREE.Group();
        
        // Create ground patch
        const groundGeometry = new THREE.CircleGeometry(1, 8);
        const groundMaterial = new THREE.MeshPhongMaterial({
            color: 0x355E3B,
            side: THREE.DoubleSide
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        patchGroup.add(ground);

        // Add flowers
        const flowerColors = [0xFF69B4, 0xFFFF00, 0xFF0000, 0xFFA500, 0x800080];
        const numFlowers = 5 + Math.floor(Math.random() * 7);

        for (let i = 0; i < numFlowers; i++) {
            const flowerGeometry = new THREE.ConeGeometry(0.1, 0.3, 8);
            const flowerMaterial = new THREE.MeshPhongMaterial({
                color: flowerColors[Math.floor(Math.random() * flowerColors.length)]
            });
            const flower = new THREE.Mesh(flowerGeometry, flowerMaterial);

            // Position flower randomly within patch
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.8;
            flower.position.set(
                Math.cos(angle) * radius,
                0.15,
                Math.sin(angle) * radius
            );

            // Random slight tilt
            flower.rotation.x = (Math.random() - 0.5) * 0.2;
            flower.rotation.z = (Math.random() - 0.5) * 0.2;

            patchGroup.add(flower);
        }

        return patchGroup;
    }

    createMailbox() {
        const mailboxGroup = new THREE.Group();

        // Create post
        const postGeometry = new THREE.BoxGeometry(0.1, 1.2, 0.1);
        const postMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        const post = new THREE.Mesh(postGeometry, postMaterial);
        post.position.y = 0.6;
        mailboxGroup.add(post);

        // Create mailbox
        const boxGeometry = new THREE.BoxGeometry(0.3, 0.25, 0.5);
        const boxMaterial = new THREE.MeshPhongMaterial({ color: 0x4A4A4A });
        const box = new THREE.Mesh(boxGeometry, boxMaterial);
        box.position.y = 1.1;
        mailboxGroup.add(box);

        // Add flag
        const flagGeometry = new THREE.BoxGeometry(0.05, 0.2, 0.1);
        const flagMaterial = new THREE.MeshPhongMaterial({ color: 0xFF0000 });
        const flag = new THREE.Mesh(flagGeometry, flagMaterial);
        flag.position.set(0.17, 1.1, 0.1);
        mailboxGroup.add(flag);

        return mailboxGroup;
    }

    createSignpost() {
        const signGroup = new THREE.Group();

        // Create post
        const postGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2, 8);
        const postMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
        const post = new THREE.Mesh(postGeometry, postMaterial);
        post.position.y = 1;
        signGroup.add(post);

        // Create sign
        const signGeometry = new THREE.BoxGeometry(0.8, 0.4, 0.05);
        const signMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });
        const sign = new THREE.Mesh(signGeometry, signMaterial);
        sign.position.y = 1.5;
        signGroup.add(sign);

        // Add text to sign (using canvas texture)
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 128;
        canvas.height = 64;

        context.fillStyle = '#000000';
        context.font = 'bold 24px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // Random distance for the sign
        const distance = Math.floor(Math.random() * 100) + 1;
        context.fillText(`${distance}km`, canvas.width/2, canvas.height/2);

        const texture = new THREE.CanvasTexture(canvas);
        const textGeometry = new THREE.PlaneGeometry(0.7, 0.3);
        const textMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true
        });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.set(0, 1.5, 0.03);
        signGroup.add(textMesh);

        return signGroup;
    }

    spawnSceneryElement(zPosition) {
        // Randomly select scenery type based on probability
        const rand = Math.random();
        let cumulativeProbability = 0;
        let selectedType = null;

        for (const [type, data] of Object.entries(this.sceneryTypes)) {
            cumulativeProbability += data.probability;
            if (rand <= cumulativeProbability && !selectedType) {
                selectedType = type;
            }
        }

        if (!selectedType) return null;

        const element = this.sceneryTypes[selectedType].generator();
        
        // Random x position (distance from road)
        const side = Math.random() < 0.5 ? -1 : 1;
        const xOffset = (Math.random() * 10 + 15) * side;
        
        element.position.set(xOffset, 0, zPosition);
        this.scene.add(element);
        this.decorativeElements.push({
            mesh: element,
            type: selectedType
        });
    }

    update(speed) {
        const moveAmount = speed / 10;

        // Move existing elements
        for (let i = this.decorativeElements.length - 1; i >= 0; i--) {
            const element = this.decorativeElements[i];
            
            // Regular scenery elements
            element.mesh.position.z -= moveAmount;

            // Remove elements that are too far behind
            if (element.mesh.position.z < this.despawnDistance) {
                this.scene.remove(element.mesh);
                this.decorativeElements.splice(i, 1);
            }
        }

        // Spawn new elements
        this.lastSpawnPosition -= moveAmount;
        if (this.lastSpawnPosition <= 0 && this.decorativeElements.length < this.maxElements) {
            this.spawnSceneryElement(this.spawnDistance);
            this.lastSpawnPosition = this.spawnInterval;
        }
    }
} 