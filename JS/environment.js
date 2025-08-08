class Environment {
    constructor(scene) {
        this.scene = scene;
        this.clouds = [];
        this.hills = [];
        this.decorations = [];
        this.buildings = [];  // Array to store building objects
        this.magicGardenElements = [];
        this.currentStage = 1;
        this.skyMaterial = null; // Store sky material reference
        
        this.createSky();
        this.createHills();
        this.createBuildings();  // Add buildings creation
        this.createDecorations();
        this.createMagicGarden();
    }

    createSky() {
        // Create a large sphere for the sky
        const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
        this.skyMaterial = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(0x0077ff) },    // Bright blue
                bottomColor: { value: new THREE.Color(0x87CEEB) }, // Light blue
                offset: { value: 33 },
                exponent: { value: 0.6 }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 bottomColor;
                uniform float offset;
                uniform float exponent;
                varying vec3 vWorldPosition;
                void main() {
                    float h = normalize(vWorldPosition + offset).y;
                    gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
                }
            `,
            side: THREE.BackSide
        });
        const sky = new THREE.Mesh(skyGeometry, this.skyMaterial);
        this.scene.add(sky);

        // Create more visible clouds at higher altitude
        for (let i = 0; i < 25; i++) {  // Increased number of clouds
            this.createCloud(
                Math.random() * 300 - 150,    // Wider x spread
                Math.random() * 30 + 130,     // Height between 130-160 (above tallest building)
                Math.random() * 800 - 400     // Deeper z spread for more clouds in view
            );
        }
    }

    createCloud(x, y, z) {
        const cloudGeometry = new THREE.SphereGeometry(5, 8, 8);
        const cloudMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.9  // Increased opacity
        });

        const cloudGroup = new THREE.Group();
        
        // Create denser cloud formations
        for (let i = 0; i < 8; i++) {  // More pieces per cloud
            const cloudPiece = new THREE.Mesh(cloudGeometry, cloudMaterial);
            cloudPiece.position.set(
                Math.random() * 10 - 5,
                Math.random() * 4 - 2,
                Math.random() * 10 - 5
            );
            cloudPiece.scale.set(
                Math.random() * 1.5 + 1.0,  // Larger scale
                Math.random() * 0.8 + 0.6,
                Math.random() * 1.5 + 1.0   // Larger scale
            );
            cloudGroup.add(cloudPiece);
        }

        cloudGroup.position.set(x, y, z);
        this.scene.add(cloudGroup);
        this.clouds.push(cloudGroup);
    }

    createHills() {
        const hillGeometry = new THREE.PlaneGeometry(1000, 1000, 150, 150);
        const vertices = hillGeometry.attributes.position.array;
        
        // Create gentle rolling hills for grassland
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const z = vertices[i + 2];
            
            // Create gentle grass-covered hills
            const baseHeight = 
                Math.sin(x * 0.02) * 12 +    // Long rolling hills
                Math.sin(z * 0.02) * 10 +    // Cross hills
                Math.sin(x * 0.05 + z * 0.05) * 8; // Diagonal variations

            // Add smaller grass mound details
            const detail = 
                Math.sin(x * 0.1) * 2 * Math.sin(z * 0.1) +  // Small bumps
                Math.cos(x * 0.08 - z * 0.08) * 3;           // Medium variations

            const distanceFromRoad = Math.abs(x);
            let heightMultiplier = 1.0;

            if (distanceFromRoad > 30) {
                heightMultiplier = 1.0 + (distanceFromRoad - 30) * 0.03;
            }

            vertices[i + 1] = (baseHeight + detail) * heightMultiplier;

            // Flatten area near the road
            if (distanceFromRoad < 10) {
                vertices[i + 1] *= (distanceFromRoad - 5) / 5;
                if (distanceFromRoad < 5) vertices[i + 1] = 0;
            }
        }

        hillGeometry.computeVertexNormals();
        
        // Create grass materials with different shades
        const grassMaterials = [
            new THREE.MeshPhongMaterial({
                color: 0x7CB342,     // Fresh spring grass green
                shininess: 8,
                flatShading: true
            }),
            new THREE.MeshPhongMaterial({
                color: 0x558B2F,     // Rich meadow green
                shininess: 8,
                flatShading: true
            }),
            new THREE.MeshPhongMaterial({
                color: 0x33691E,     // Deep forest green
                shininess: 8,
                flatShading: true
            })
        ];

        // Create grass sections
        for (let i = 0; i < 3; i++) {
            const grassland = new THREE.Mesh(hillGeometry, grassMaterials[i % 3]);
            grassland.rotation.x = -Math.PI / 2;
            grassland.position.z = i * 1000 - 500;
            grassland.position.y = -2 - (i * 0.2);
            grassland.rotation.z = (Math.random() - 0.5) * 0.1;
            
            this.scene.add(grassland);
            this.hills.push(grassland);
        }

        // Add darker base ground underneath
        const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
        const groundMaterial = new THREE.MeshPhongMaterial({
            color: 0x2F3B1C,     // Dark earthy green
            shininess: 5,
            flatShading: true
        });
        const darkGround = new THREE.Mesh(groundGeometry, groundMaterial);
        darkGround.rotation.x = -Math.PI / 2;
        darkGround.position.y = -2.1;  // Slightly below the grass
        this.scene.add(darkGround);

        // Create distant hills with grass
        const distantHillsGeometry = new THREE.PlaneGeometry(2000, 1000, 50, 50);
        const hillVertices = distantHillsGeometry.attributes.position.array;
        
        for (let i = 0; i < hillVertices.length; i += 3) {
            const x = hillVertices[i];
            const z = hillVertices[i + 2];
            
            // Create larger, smoother hills
            hillVertices[i + 1] = 
                Math.sin(x * 0.01) * 30 +
                Math.sin(z * 0.01) * 25 +
                Math.sin(x * 0.02 + z * 0.02) * 20;
        }

        distantHillsGeometry.computeVertexNormals();

        // Create distant hills with slightly darker grass
        const distantHillsMaterial = new THREE.MeshPhongMaterial({
            color: 0x1B4F2F,     // Deep emerald green for distance
            shininess: 8,
            flatShading: true,
            opacity: 0.9,
            transparent: true
        });

        const distantHills = new THREE.Mesh(distantHillsGeometry, distantHillsMaterial);
        distantHills.rotation.x = -Math.PI / 2;
        distantHills.position.z = -500;
        distantHills.position.y = -10;
        this.scene.add(distantHills);
        this.hills.push(distantHills);

        // Add grass detail patches
        const grassPatchGeometry = new THREE.PlaneGeometry(2, 2);
        const grassPatchMaterial = new THREE.MeshPhongMaterial({
            color: 0x8BC34A,    // Lighter, brighter grass green for detail
            shininess: 5,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });

        // Add grass patches along the terrain
        for (let i = 0; i < 500; i++) {
            const patch = new THREE.Mesh(grassPatchGeometry, grassPatchMaterial);
            const x = (Math.random() - 0.5) * 1000;
            const z = Math.random() * 1000 - 500;
            
            // Skip patches too close to the road
            if (Math.abs(x) < 8) continue;

            patch.position.set(x, 0.1, z);
            patch.rotation.x = -Math.PI / 2;
            patch.rotation.z = Math.random() * Math.PI;
            patch.scale.set(
                0.5 + Math.random() * 1.5,
                0.5 + Math.random() * 1.5,
                1
            );
            
            this.scene.add(patch);
            this.decorations.push(patch);
        }
    }

    createCow() {
        const cow = new THREE.Group();

        // Body
        const bodyGeometry = new THREE.BoxGeometry(2, 1.2, 3);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x4A4A4A }); // Dark grey
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1.5;
        cow.add(body);

        // Head
        const headGeometry = new THREE.BoxGeometry(0.8, 0.8, 1.2);
        const head = new THREE.Mesh(headGeometry, bodyMaterial);
        head.position.set(0, 2.1, 1.8);
        cow.add(head);

        // Legs
        const legGeometry = new THREE.BoxGeometry(0.4, 1.2, 0.4);
        const legMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 }); // Darker grey
        
        const positions = [
            [-0.7, 0.6, 1],  // Front left
            [0.7, 0.6, 1],   // Front right
            [-0.7, 0.6, -1], // Back left
            [0.7, 0.6, -1]   // Back right
        ];

        positions.forEach(pos => {
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            leg.position.set(...pos);
            cow.add(leg);
        });

        // Spots (for variety)
        const spotGeometry = new THREE.CircleGeometry(0.3, 8);
        const spotMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x8B4513,
            side: THREE.DoubleSide 
        });

        for (let i = 0; i < 5; i++) {
            const spot = new THREE.Mesh(spotGeometry, spotMaterial);
            spot.rotation.y = Math.PI / 2;
            spot.position.set(
                (Math.random() - 0.5) * 1.5,
                1.5 + (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 2
            );
            cow.add(spot);
        }

        // Tail
        const tailGeometry = new THREE.CylinderGeometry(0.1, 0.05, 1);
        const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
        tail.position.set(0, 2, -1.7);
        tail.rotation.x = Math.PI / 4;
        cow.add(tail);

        return cow;
    }

    createDecorations() {
        // Materials for trees with more natural colors
        const treeMaterials = {
            lightGreen: new THREE.MeshStandardMaterial({ 
                color: 0x68c242,  // Brighter green
                roughness: 0.8,
                metalness: 0.1
            }),
            mediumGreen: new THREE.MeshStandardMaterial({ 
                color: 0x2d5a27,  // Medium forest green
                roughness: 0.8,
                metalness: 0.1
            }),
            darkGreen: new THREE.MeshStandardMaterial({ 
                color: 0x1a3409,  // Dark forest green
                roughness: 0.8,
                metalness: 0.1
            }),
            trunk: new THREE.MeshStandardMaterial({ 
                color: 0x3b2616,  // Dark brown
                roughness: 0.9,
                metalness: 0.0
            }),
            bark: new THREE.MeshStandardMaterial({ 
                color: 0x4a3728,  // Lighter brown
                roughness: 1.0,
                metalness: 0.0
            })
        };

        function createLeafGroup(size, density = 1) {
            const group = new THREE.Group();
            const baseGeometry = new THREE.IcosahedronGeometry(size, 1);
            
            // Create multiple overlapping leaf sections
            for (let i = 0; i < density * 5; i++) {
                const leaf = new THREE.Mesh(
                    baseGeometry,
                    [treeMaterials.lightGreen, treeMaterials.mediumGreen, treeMaterials.darkGreen][Math.floor(Math.random() * 3)]
                );
                
                // Random positioning within the group
                leaf.position.x = (Math.random() - 0.5) * size;
                leaf.position.y = (Math.random() - 0.5) * size * 0.5;
                leaf.position.z = (Math.random() - 0.5) * size;
                
                // Random scaling for variety
                const scale = 0.5 + Math.random() * 0.5;
                leaf.scale.set(scale, scale, scale);
                
                // Random rotation
                leaf.rotation.x = Math.random() * Math.PI;
                leaf.rotation.y = Math.random() * Math.PI;
                leaf.rotation.z = Math.random() * Math.PI;
                
                group.add(leaf);
            }
            return group;
        }

        function createTreeTrunk(height, baseRadius, topRadius) {
            const trunkGroup = new THREE.Group();
            
            // Main trunk
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(topRadius, baseRadius, height, 8),
                treeMaterials.trunk
            );
            trunk.position.y = height / 2;
            trunkGroup.add(trunk);
            
            // Add bark detail and irregularities
            for (let i = 0; i < 8; i++) {
                const barkPiece = new THREE.Mesh(
                    new THREE.BoxGeometry(0.2, height * 0.3, 0.1),
                    treeMaterials.bark
                );
                barkPiece.position.y = height * (0.3 + Math.random() * 0.4);
                barkPiece.rotation.y = (Math.PI * 2 / 8) * i;
                barkPiece.position.x = Math.sin(barkPiece.rotation.y) * (baseRadius * 0.9);
                barkPiece.position.z = Math.cos(barkPiece.rotation.y) * (baseRadius * 0.9);
                trunkGroup.add(barkPiece);
            }
            
            return trunkGroup;
        }

        function createDetailedTree(type, scale = 1) {
            const tree = new THREE.Group();
            let trunkHeight, baseRadius, topRadius;
            
            switch(type) {
                case 'pine':
                    trunkHeight = 8 * scale;
                    baseRadius = 0.4 * scale;
                    topRadius = 0.2 * scale;
                    
                    // Add trunk
                    tree.add(createTreeTrunk(trunkHeight, baseRadius, topRadius));
                    
                    // Add pine layers
                    for (let i = 0; i < 5; i++) {
                        const layer = createLeafGroup(3 * scale * (1 - i * 0.15), 1.2);
                        layer.position.y = trunkHeight * (0.5 + i * 0.15);
                        layer.scale.y = 1.5;
                        tree.add(layer);
                    }
                    break;

                case 'oak':
                    trunkHeight = 6 * scale;
                    baseRadius = 0.5 * scale;
                    topRadius = 0.3 * scale;
                    
                    // Add trunk
                    tree.add(createTreeTrunk(trunkHeight, baseRadius, topRadius));
                    
                    // Add full crown
                    const crown = createLeafGroup(4 * scale, 1.5);
                    crown.position.y = trunkHeight + (2 * scale);
                    tree.add(crown);
                    
                    // Add smaller surrounding crowns for fullness
                    for (let i = 0; i < 3; i++) {
                        const subCrown = createLeafGroup(3 * scale, 1.2);
                        subCrown.position.y = trunkHeight + (1.5 * scale);
                        subCrown.position.x = (Math.random() - 0.5) * 2 * scale;
                        subCrown.position.z = (Math.random() - 0.5) * 2 * scale;
                        tree.add(subCrown);
                    }
                    break;

                case 'birch':
                    trunkHeight = 10 * scale;
                    baseRadius = 0.3 * scale;
                    topRadius = 0.15 * scale;
                    
                    // Add trunk
                    tree.add(createTreeTrunk(trunkHeight, baseRadius, topRadius));
                    
                    // Add elongated crown
                    const birchCrown = createLeafGroup(2.5 * scale, 1);
                    birchCrown.position.y = trunkHeight * 0.8;
                    birchCrown.scale.y = 2;
                    tree.add(birchCrown);
                    
                    // Add smaller surrounding crowns
                    for (let i = 0; i < 4; i++) {
                        const subCrown = createLeafGroup(2 * scale, 0.8);
                        subCrown.position.y = trunkHeight * (0.6 + Math.random() * 0.3);
                        subCrown.position.x = (Math.random() - 0.5) * 3 * scale;
                        subCrown.position.z = (Math.random() - 0.5) * 3 * scale;
                        tree.add(subCrown);
                    }
                    break;
            }
            
            return tree;
        }

        // Create forest clusters
        const forestClusters = [
            { x: -40, z: 0, radius: 30 },
            { x: 40, z: 200, radius: 25 },
            { x: -35, z: 400, radius: 20 },
            { x: 45, z: 600, radius: 35 },
            { x: -45, z: 800, radius: 30 }
        ];

        forestClusters.forEach(cluster => {
            const numTrees = Math.floor(cluster.radius * 0.8);
            for (let i = 0; i < numTrees; i++) {
                // Use polar coordinates for better distribution
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * cluster.radius;
                const x = cluster.x + Math.cos(angle) * radius;
                const z = cluster.z + Math.sin(angle) * radius;

                // Vary tree types and sizes
                const treeType = ['pine', 'oak', 'birch'][Math.floor(Math.random() * 3)];
                const scale = 0.8 + Math.random() * 0.4;
                const tree = createDetailedTree(treeType, scale);

                // Random rotation
                tree.rotation.y = Math.random() * Math.PI * 2;
                
                // Add some random offset to x and z for natural look
                tree.position.set(
                    x + (Math.random() - 0.5) * 2,
                    0,
                    z + (Math.random() - 0.5) * 2
                );
                
                this.scene.add(tree);
                this.decorations.push(tree);
            }
        });

        // Add some individual trees between forests
        for (let i = 0; i < 30; i++) {
            const side = Math.random() > 0.5 ? 1 : -1;
            const x = side * (Math.random() * 15 + 25);
            const z = Math.random() * 1000 - 500;
            
            const treeType = ['pine', 'oak', 'birch'][Math.floor(Math.random() * 3)];
            const scale = 0.8 + Math.random() * 0.4;
            const tree = createDetailedTree(treeType, scale);
            
            tree.rotation.y = Math.random() * Math.PI * 2;
            tree.position.set(x, 0, z);
            
            this.scene.add(tree);
            this.decorations.push(tree);
        }

        // Add more tree clusters in specific areas
        const additionalClusters = [
            { x: -50, z: 300, radius: 15 },
            { x: 60, z: 500, radius: 20 },
            { x: -40, z: 700, radius: 25 }
        ];

        additionalClusters.forEach(cluster => {
            const numTrees = Math.floor(cluster.radius * 0.7);
            for (let i = 0; i < numTrees; i++) {
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * cluster.radius;
                const x = cluster.x + Math.cos(angle) * radius;
                const z = cluster.z + Math.sin(angle) * radius;

                const treeType = ['pine', 'oak', 'birch'][Math.floor(Math.random() * 3)];
                const scale = 0.6 + Math.random() * 0.4; // Slightly smaller trees
                const tree = createDetailedTree(treeType, scale);
                
                tree.rotation.y = Math.random() * Math.PI * 2;
                tree.position.set(x, 0, z);
                
                this.scene.add(tree);
                this.decorations.push(tree);
            }
        });

        // Add grazing cows
        const cowPositions = [
            { x: -25, z: 200, rotation: 0.5 },
            { x: -28, z: 205, rotation: -0.3 },
            { x: -23, z: 203, rotation: 0.2 },
            { x: 35, z: 400, rotation: -0.4 },
            { x: 38, z: 405, rotation: 0.6 },
            { x: -30, z: 600, rotation: 0.1 }
        ];

        cowPositions.forEach(pos => {
            const cow = this.createCow();
            cow.position.set(pos.x, 0, pos.z);
            cow.rotation.y = pos.rotation;
            this.scene.add(cow);
            this.decorations.push(cow);
        });

        // Add small vegetation near trees
        const bushGeometry = new THREE.SphereGeometry(0.5, 8, 6);
        const bushMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x8B4513,
            flatShading: true 
        });

        additionalClusters.forEach(cluster => {
            for (let i = 0; i < 10; i++) {
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * (cluster.radius + 5);
                const x = cluster.x + Math.cos(angle) * radius;
                const z = cluster.z + Math.sin(angle) * radius;

                const bush = new THREE.Mesh(bushGeometry, bushMaterial);
                bush.position.set(x, 0.3, z);
                bush.scale.set(
                    0.8 + Math.random() * 0.4,
                    0.6 + Math.random() * 0.3,
                    0.8 + Math.random() * 0.4
                );
                this.scene.add(bush);
                this.decorations.push(bush);
            }
        });
    }

    createBuildings() {
        // Create building groups for each side of the road
        this.createBuildingGroup(-30, 0);     // Left side
        this.createBuildingGroup(30, 1000);   // Right side
        this.createBuildingGroup(-30, 1000);  // Left side second section
        this.createBuildingGroup(30, 2000);   // Right side second section
    }

    createBuildingGroup(xOffset, zOffset) {
        const buildingCount = 8;
        const spacing = 100;  // Space between buildings

        for (let i = 0; i < buildingCount; i++) {
            const z = zOffset + i * spacing;
            
            // Determine which side of the road we're on
            const side = xOffset > 0 ? 1 : -1;
            // Position buildings further back (65-75 units from center)
            const adjustedX = side * (65 + Math.random() * 10);
            
            // Randomly decide if this should be a tall or medium building
            if (Math.random() > 0.7) {  // 30% chance for a skyscraper
                this.createSkyscraper(adjustedX, z);
            } else {
                this.createMediumBuilding(adjustedX, z);
            }
        }
    }

    createSkyscraper(x, z) {
        const height = 80 + Math.random() * 40;  // Height between 80-120 units
        const width = 10 + Math.random() * 5;
        const depth = 10 + Math.random() * 5;

        const building = new THREE.Group();

        // Main building body
        const bodyGeometry = new THREE.BoxGeometry(width, height, depth);
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: 0x505050,  // Base gray color
            shininess: 50
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = height / 2;
        building.add(body);

        // Add windows
        const windowRowCount = Math.floor(height / 4);
        const windowColCount = Math.floor(width / 3);
        const windowGeometry = new THREE.PlaneGeometry(2, 2);
        const windowMaterial = new THREE.MeshPhongMaterial({
            color: 0xFFFF99,
            emissive: 0x666666
        });

        for (let row = 0; row < windowRowCount; row++) {
            for (let col = 0; col < windowColCount; col++) {
                const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
                windowMesh.position.set(
                    (col - windowColCount/2) * 3 + 1.5,
                    row * 4 + 2,
                    depth/2 + 0.1
                );
                building.add(windowMesh);

                // Add windows to other sides
                const windowBack = windowMesh.clone();
                windowBack.position.z = -depth/2 - 0.1;
                windowBack.rotation.y = Math.PI;
                building.add(windowBack);

                if (col === 0) {  // Add windows to sides only once per row
                    const windowLeft = windowMesh.clone();
                    windowLeft.position.x = -width/2 - 0.1;
                    windowLeft.position.z = 0;
                    windowLeft.rotation.y = -Math.PI/2;
                    building.add(windowLeft);

                    const windowRight = windowMesh.clone();
                    windowRight.position.x = width/2 + 0.1;
                    windowRight.position.z = 0;
                    windowRight.rotation.y = Math.PI/2;
                    building.add(windowRight);
                }
            }
        }

        building.position.set(x, 0, z);
        this.scene.add(building);
        this.buildings.push(building);
    }

    createMediumBuilding(x, z) {
        const height = 20 + Math.random() * 20;  // Height between 20-40 units
        const width = 15 + Math.random() * 10;
        const depth = 15 + Math.random() * 10;

        const building = new THREE.Group();

        // Main building body
        const bodyGeometry = new THREE.BoxGeometry(width, height, depth);
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: Math.random() > 0.5 ? 0x808080 : 0x606060,  // Varying grays
            shininess: 30
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = height / 2;
        building.add(body);

        // Add a more detailed roof
        const roofGeometry = new THREE.BoxGeometry(width + 2, 2, depth + 2);
        const roofMaterial = new THREE.MeshPhongMaterial({ color: 0x505050 });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = height + 1;
        building.add(roof);

        // Add windows (smaller and more spread out than skyscrapers)
        const windowRowCount = Math.floor(height / 5);
        const windowColCount = Math.floor(width / 4);
        const windowGeometry = new THREE.PlaneGeometry(2.5, 3);
        const windowMaterial = new THREE.MeshPhongMaterial({
            color: 0xA0A0A0,
            emissive: 0x333333
        });

        for (let row = 0; row < windowRowCount; row++) {
            for (let col = 0; col < windowColCount; col++) {
                const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
                windowMesh.position.set(
                    (col - windowColCount/2) * 4 + 2,
                    row * 5 + 3,
                    depth/2 + 0.1
                );
                building.add(windowMesh);

                // Add windows to back
                const windowBack = windowMesh.clone();
                windowBack.position.z = -depth/2 - 0.1;
                windowBack.rotation.y = Math.PI;
                building.add(windowBack);
            }
        }

        building.position.set(x, 0, z);
        this.scene.add(building);
        this.buildings.push(building);
    }

    updateStage(stage) {
        this.currentStage = stage;
        
        // Update sky colors based on stage
        if (stage === 4) { // Magic Garden
            // Soft pink and lavender sky for Magic Garden
            this.skyMaterial.uniforms.topColor.value = new THREE.Color(0xFF69B4); // Pink
            this.skyMaterial.uniforms.bottomColor.value = new THREE.Color(0xE6E6FA); // Lavender
            this.skyMaterial.uniforms.exponent.value = 0.8; // Softer gradient
        } else {
            // Default blue sky for other stages
            this.skyMaterial.uniforms.topColor.value = new THREE.Color(0x0077ff);
            this.skyMaterial.uniforms.bottomColor.value = new THREE.Color(0x87CEEB);
            this.skyMaterial.uniforms.exponent.value = 0.6;
        }
    }

    update(speed) {
        const moveAmount = speed / 10;

        // Update clouds
        this.clouds.forEach(cloud => {
            cloud.position.z -= moveAmount * 0.3;  // Slower cloud movement
            if (cloud.position.z < -400) {
                cloud.position.z += 800;  // Full loop distance
                // Randomize x position when cloud resets
                cloud.position.x = Math.random() * 300 - 150;
            }
        });

        // Update buildings
        this.buildings.forEach(building => {
            building.position.z -= moveAmount;
            if (building.position.z < -100) {
                building.position.z += 2000;  // Loop back to far distance
            }
        });

        // Update hills
        this.hills.forEach(hill => {
            hill.position.z -= moveAmount;
            if (hill.position.z < -1500) {
                hill.position.z += 3000;
            }
        });

        // Update decorations
        this.decorations.forEach(decoration => {
            decoration.position.z -= moveAmount;
            if (decoration.position.z < -500) {
                decoration.position.z += 1000;
            }
        });

        // Update Magic Garden elements
        const time = Date.now() * 0.001;
        this.magicGardenElements.forEach((element, index) => {
            if (element instanceof THREE.Points) {
                // Update falling petals
                const positions = element.geometry.attributes.position.array;
                for (let i = 0; i < positions.length; i += 3) {
                    positions[i + 1] -= 0.05; // Fall down
                    positions[i] += Math.sin(time + i) * 0.01; // Sway left and right
                    
                    // Reset petal when it falls too low
                    if (positions[i + 1] < 0) {
                        positions[i] = Math.random() * 100 - 50;
                        positions[i + 1] = 20;
                        positions[i + 2] = 6000 + Math.random() * 100 - 50;
                    }
                }
                element.geometry.attributes.position.needsUpdate = true;
            } else if (element.children.some(child => child instanceof THREE.PointLight)) {
                // This is a lantern - make it float
                element.position.y = 5 + Math.sin(time + index) * 0.5;
            }
        });
    }

    createMagicGarden() {
        // Create cherry blossom trees
        const createCherryBlossomTree = (x, z, scale = 1) => {
            const tree = new THREE.Group();

            // Create trunk
            const trunkGeometry = new THREE.CylinderGeometry(0.2 * scale, 0.3 * scale, 3 * scale, 8);
            const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.y = 1.5 * scale;
            tree.add(trunk);

            // Create blossoms
            const blossomGeometry = new THREE.SphereGeometry(1.5 * scale, 8, 8);
            const blossomMaterial = new THREE.MeshPhongMaterial({
                color: 0xFFB7C5,
                transparent: true,
                opacity: 0.9
            });

            for (let i = 0; i < 8; i++) {
                const blossom = new THREE.Mesh(blossomGeometry, blossomMaterial);
                const angle = (i / 8) * Math.PI * 2;
                const radius = 1 * scale;
                blossom.position.set(
                    Math.cos(angle) * radius,
                    3 * scale + Math.random() * scale,
                    Math.sin(angle) * radius
                );
                blossom.scale.set(0.7, 0.5, 0.7);
                tree.add(blossom);
            }

            tree.position.set(x, 0, z);
            return tree;
        };

        // Create floating lanterns
        const createLantern = (x, y, z) => {
            const lantern = new THREE.Group();

            // Lantern body
            const bodyGeometry = new THREE.SphereGeometry(0.5, 8, 8);
            const bodyMaterial = new THREE.MeshPhongMaterial({
                color: 0xFF9500,
                emissive: 0xFF4500,
                emissiveIntensity: 0.5,
                transparent: true,
                opacity: 0.8
            });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            lantern.add(body);

            // Light source
            const light = new THREE.PointLight(0xFF9500, 1, 10);
            light.position.set(0, 0, 0);
            lantern.add(light);

            lantern.position.set(x, y, z);
            return lantern;
        };

        // Create flower patches
        const createFlowerPatch = (x, z, radius) => {
            const patch = new THREE.Group();
            const colors = [0xFF69B4, 0xFFB7C5, 0xFFC0CB, 0xFF1493];

            for (let i = 0; i < 20; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * radius;
                const flowerGeometry = new THREE.ConeGeometry(0.2, 0.4, 8);
                const flowerMaterial = new THREE.MeshPhongMaterial({
                    color: colors[Math.floor(Math.random() * colors.length)]
                });
                const flower = new THREE.Mesh(flowerGeometry, flowerMaterial);
                flower.position.set(
                    x + Math.cos(angle) * distance,
                    0.2,
                    z + Math.sin(angle) * distance
                );
                flower.rotation.x = Math.PI / 2;
                patch.add(flower);
            }

            return patch;
        };

        // Add cherry blossom trees
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 20 + Math.random() * 30;
            const x = Math.cos(angle) * radius;
            const z = 6000 + Math.sin(angle) * radius; // Position at Magic Garden stage
            const scale = 0.8 + Math.random() * 0.4;
            const tree = createCherryBlossomTree(x, z, scale);
            this.scene.add(tree);
            this.magicGardenElements.push(tree);
        }

        // Add floating lanterns
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 15 + Math.random() * 25;
            const x = Math.cos(angle) * radius;
            const y = 5 + Math.random() * 5;
            const z = 6000 + Math.sin(angle) * radius;
            const lantern = createLantern(x, y, z);
            this.scene.add(lantern);
            this.magicGardenElements.push(lantern);
        }

        // Add flower patches
        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 10 + Math.random() * 20;
            const x = Math.cos(angle) * radius;
            const z = 6000 + Math.sin(angle) * radius;
            const patch = createFlowerPatch(x, z, 3);
            this.scene.add(patch);
            this.magicGardenElements.push(patch);
        }

        // Create particle system for falling petals
        const particleCount = 1000;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const petalMaterial = new THREE.PointsMaterial({
            color: 0xFFB7C5,
            size: 0.1,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });

        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = Math.random() * 100 - 50; // x
            positions[i + 1] = Math.random() * 20 + 10; // y
            positions[i + 2] = 6000 + Math.random() * 100 - 50; // z
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particles = new THREE.Points(particleGeometry, petalMaterial);
        this.scene.add(particles);
        this.magicGardenElements.push(particles);
    }
} 