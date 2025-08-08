class Road {
    constructor(scene) {
        this.scene = scene;
        this.roadLines = [];
        this.zebraCrossings = [];
        this.signs = [];  // Array to store sign objects
        this.createRoad();
        this.createSigns();
    }

    createRoad() {
        // Road
        const roadGeometry = new THREE.PlaneGeometry(10, 1000, 20, 200);
        const roadMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x8B8B8B,  // Lighter gray for the road
            side: THREE.DoubleSide
        });
        
        this.road = new THREE.Mesh(roadGeometry, roadMaterial);
        this.road.rotation.x = -Math.PI / 2;
        this.road.position.z = 0;
        this.scene.add(this.road);

        // Create second road section for continuous scrolling
        this.road2 = new THREE.Mesh(roadGeometry, roadMaterial);
        this.road2.rotation.x = -Math.PI / 2;
        this.road2.position.z = 1000;
        this.scene.add(this.road2);

        // Create road lines
        this.createRoadLines();

        // Add zebra crossings at regular intervals
        this.createZebraCrossing(100);    // First zebra crossing - moved closer to start
        this.createZebraCrossing(600);    // Second zebra crossing

        // Add side barriers
        const barrierGeometry = new THREE.BoxGeometry(0.5, 1, 1000);
        const barrierMaterial = new THREE.MeshPhongMaterial({ color: 0xE0E0E0 });  // Light gray barriers
        
        // First section barriers
        this.leftBarrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
        this.leftBarrier.position.set(-5.25, 0.5, 0);
        this.scene.add(this.leftBarrier);

        this.rightBarrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
        this.rightBarrier.position.set(5.25, 0.5, 0);
        this.scene.add(this.rightBarrier);

        // Second section barriers
        this.leftBarrier2 = new THREE.Mesh(barrierGeometry, barrierMaterial);
        this.leftBarrier2.position.set(-5.25, 0.5, 1000);
        this.scene.add(this.leftBarrier2);

        this.rightBarrier2 = new THREE.Mesh(barrierGeometry, barrierMaterial);
        this.rightBarrier2.position.set(5.25, 0.5, 1000);
        this.scene.add(this.rightBarrier2);
    }

    createRoadLines() {
        // Create solid side lines
        this.createSolidLine(-4.5, 0);      // Left solid line
        this.createSolidLine(4.5, 0);       // Right solid line
        this.createSolidLine(-4.5, 1000);   // Left solid line for second section
        this.createSolidLine(4.5, 1000);    // Right solid line for second section

        // Create dashed center lines
        this.createDashedLines(0, 0);       // First section
        this.createDashedLines(0, 1000);    // Second section
    }

    createSolidLine(xOffset, zOffset) {
        const lineGeometry = new THREE.PlaneGeometry(0.2, 1000);
        const lineMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xFFFFFF,
            side: THREE.DoubleSide
        });
        const line = new THREE.Mesh(lineGeometry, lineMaterial);
        line.rotation.x = -Math.PI / 2;
        line.position.set(xOffset, 0.01, zOffset);
        this.scene.add(line);
        this.roadLines.push(line);
    }

    createDashedLines(xOffset, zOffset) {
        const dashLength = 5;        // Longer dashes
        const gapLength = 3;         // Shorter gaps
        const totalLength = 1000;
        const totalDashes = Math.floor(totalLength / (dashLength + gapLength));

        for (let i = 0; i < totalDashes; i++) {
            const lineGeometry = new THREE.PlaneGeometry(0.2, dashLength);
            const lineMaterial = new THREE.MeshPhongMaterial({ 
                color: 0xFFFFFF,
                side: THREE.DoubleSide
            });
            const dash = new THREE.Mesh(lineGeometry, lineMaterial);
            dash.rotation.x = -Math.PI / 2;
            dash.position.set(
                xOffset,
                0.01,
                i * (dashLength + gapLength) - totalLength/2 + zOffset
            );
            this.scene.add(dash);
            this.roadLines.push(dash);
        }
    }

    createZebraCrossing(zPosition) {
        const stripeWidth = 1;  // Made wider
        const stripeLength = 10;  // Made longer to cover full road width
        const numStripes = 6;  // Fewer but larger stripes
        const spacing = 1;  // Increased spacing between stripes
        
        const groupWidth = (stripeWidth + spacing) * numStripes;
        const startZ = zPosition - (groupWidth / 2);  // Center the crossing

        for (let i = 0; i < numStripes; i++) {
            const stripeGeometry = new THREE.PlaneGeometry(stripeLength, stripeWidth);
            const stripeMaterial = new THREE.MeshPhongMaterial({
                color: 0xFFFFFF,
                side: THREE.DoubleSide,
                emissive: 0x666666,  // Lighter emissive color
            });
            const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
            
            // Position and rotation
            stripe.rotation.x = -Math.PI / 2;
            stripe.rotation.y = Math.PI / 2;
            stripe.position.set(
                0,  // Centered on road
                0.02,  // Raised slightly higher above road
                startZ + (i * (stripeWidth + spacing))
            );
            
            this.scene.add(stripe);
            this.zebraCrossings.push(stripe);
        }
    }

    createSigns() {
        // Billboard data with varied colors
        const billboardData = [
            { 
                text: "Visit Rwanda", 
                position: 200, 
                side: 1,
                color: 0x2E8B57  // Sea Green
            },
            { 
                text: "Rwanda's Innovation Hub\nPowered by Youth", 
                position: 400, 
                side: -1,
                color: 0x4169E1  // Royal Blue
            },
            { 
                text: "Refuel with Rwandan\nCoffee Energy!", 
                position: 600, 
                side: 1,
                color: 0x8B4513  // Saddle Brown
            },
            { 
                text: "RP", 
                position: 800, 
                side: -1,
                color: 0xFFD700  // Gold (unchanged for RP sign)
            }
        ];

        // Traffic sign data
        const trafficSigns = [
            {
                type: 'speed_limit',
                text: '60',
                position: 150,
                side: -1
            },
            {
                type: 'yield',
                position: 300,
                side: 1
            },
            {
                type: 'stop',
                position: 500,
                side: -1
            },
            {
                type: 'speed_limit',
                text: '80',
                position: 700,
                side: 1
            }
        ];

        // Create billboards
        billboardData.forEach(data => {
            const billboardGroup = new THREE.Group();
            
            // Create two support poles
            const poleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 5, 8);
            const poleMaterial = new THREE.MeshPhongMaterial({ color: 0x8B9B7B });  // Greenish gray for poles
            
            const leftPole = new THREE.Mesh(poleGeometry, poleMaterial);
            const rightPole = new THREE.Mesh(poleGeometry, poleMaterial);
            
            // Create sign board
            const boardWidth = data.text === "RP" ? 3 : 6;
            const boardHeight = data.text.includes("\n") ? 3 : 2;
            const boardGeometry = new THREE.BoxGeometry(boardWidth, boardHeight, 0.3);
            const boardMaterial = new THREE.MeshPhongMaterial({ 
                color: data.color,
                shininess: 50
            });
            const board = new THREE.Mesh(boardGeometry, boardMaterial);

            // Position board
            board.position.y = 5;

            // Position support poles
            const poleSpacing = boardWidth * 0.4;
            leftPole.position.set(-poleSpacing, 2.5, 0);
            rightPole.position.set(poleSpacing, 2.5, 0);

            // Create metal frame
            const frameThickness = 0.1;
            const frameDepth = 0.35;
            const frameGeometry = new THREE.BoxGeometry(boardWidth + frameThickness, boardHeight + frameThickness, frameDepth);
            const frameMaterial = new THREE.MeshPhongMaterial({ 
                color: 0x303030,
                shininess: 80
            });
            const frame = new THREE.Mesh(frameGeometry, frameMaterial);
            frame.position.y = 5;
            frame.position.z = -0.02;

            // Create text
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 1024;
            canvas.height = 512;

            context.fillStyle = data.text === "RP" ? '#000000' : '#FFFFFF';
            context.textAlign = 'center';
            context.textBaseline = 'middle';

            if (data.text.includes("\n")) {
                const lines = data.text.split("\n");
                context.font = data.text === "RP" ? 'bold 180px Arial' : 'bold 96px Arial';
                lines.forEach((line, index) => {
                    context.fillText(line, 512, 256 + (index - 0.5) * 120);
                });
            } else {
                context.font = data.text === "RP" ? 'bold 240px Arial' : 'bold 144px Arial';
                context.fillText(data.text, 512, 256);
            }

            const texture = new THREE.CanvasTexture(canvas);
            const textGeometry = new THREE.PlaneGeometry(boardWidth - 0.3, boardHeight - 0.3);
            const textMaterial = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                side: THREE.DoubleSide
            });
            const textMesh = new THREE.Mesh(textGeometry, textMaterial);

            textMesh.position.y = 5;
            textMesh.position.z = 0.16;

            billboardGroup.add(leftPole);
            billboardGroup.add(rightPole);
            billboardGroup.add(frame);
            billboardGroup.add(board);
            billboardGroup.add(textMesh);

            // Position billboard further from road based on side
            const xOffset = data.side === 1 ? 8 : -8;  // Increased distance from road
            billboardGroup.position.set(xOffset, 0, data.position);
            billboardGroup.rotation.y = Math.PI;

            this.scene.add(billboardGroup);
            this.signs.push({
                group: billboardGroup,
                initialZ: data.position
            });
        });

        // Create traffic signs
        trafficSigns.forEach(data => {
            const signGroup = new THREE.Group();

            // Create pole
            const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3, 8);
            const poleMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
            const pole = new THREE.Mesh(poleGeometry, poleMaterial);
            pole.position.y = 1.5;
            signGroup.add(pole);

            // Create sign based on type
            let signGeometry, signMaterial, textContent;
            switch(data.type) {
                case 'stop':
                    signGeometry = new THREE.BoxGeometry(1, 1, 0.1);
                    signMaterial = new THREE.MeshPhongMaterial({ color: 0xFF0000 });
                    textContent = 'STOP';
                    break;
                case 'yield':
                    signGeometry = new THREE.BufferGeometry();
                    const vertices = new Float32Array([
                        0, 0.866, 0,    // top
                        -0.5, 0, 0,     // bottom left
                        0.5, 0, 0       // bottom right
                    ]);
                    signGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
                    signMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFF00 });
                    textContent = '';
                    break;
                case 'speed_limit':
                    signGeometry = new THREE.CircleGeometry(0.5, 32);
                    signMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });
                    textContent = data.text;
                    break;
            }

            const sign = new THREE.Mesh(signGeometry, signMaterial);
            sign.position.y = 3;
            signGroup.add(sign);

            // Add text if needed
            if (textContent) {
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = 256;
                canvas.height = 256;

                context.fillStyle = data.type === 'speed_limit' ? '#000000' : '#FFFFFF';
                context.textAlign = 'center';
                context.textBaseline = 'middle';
                context.font = 'bold 120px Arial';
                context.fillText(textContent, 128, 128);

                const texture = new THREE.CanvasTexture(canvas);
                const textGeometry = new THREE.PlaneGeometry(0.8, 0.8);
                const textMaterial = new THREE.MeshBasicMaterial({
                    map: texture,
                    transparent: true,
                    side: THREE.DoubleSide
                });
                const textMesh = new THREE.Mesh(textGeometry, textMaterial);
                textMesh.position.y = 3;
                textMesh.position.z = 0.06;
                signGroup.add(textMesh);
            }

            // Position sign
            const xOffset = data.side === 1 ? 5.5 : -5.5;  // Closer to road than billboards
            signGroup.position.set(xOffset, 0, data.position);
            signGroup.rotation.y = Math.PI;

            this.scene.add(signGroup);
            this.signs.push({
                group: signGroup,
                initialZ: data.position
            });
        });
    }

    update(speed) {
        const moveAmount = speed / 10;

        // Update main road sections
        this.road.position.z -= moveAmount;
        this.road2.position.z -= moveAmount;
        this.leftBarrier.position.z -= moveAmount;
        this.rightBarrier.position.z -= moveAmount;
        this.leftBarrier2.position.z -= moveAmount;
        this.rightBarrier2.position.z -= moveAmount;

        // Update signs
        this.signs.forEach(sign => {
            sign.group.position.z -= moveAmount;

            // Reset sign position when it goes off screen
            if (sign.group.position.z <= -500) {
                sign.group.position.z += 1000;
            }
        });

        // Reset road sections when they move off screen
        if (this.road.position.z <= -1000) {
            this.road.position.z = this.road2.position.z + 1000;
        }
        if (this.road2.position.z <= -1000) {
            this.road2.position.z = this.road.position.z + 1000;
        }

        // Reset barriers
        if (this.leftBarrier.position.z <= -1000) {
            this.leftBarrier.position.z = this.leftBarrier2.position.z + 1000;
            this.rightBarrier.position.z = this.rightBarrier2.position.z + 1000;
        }
        if (this.leftBarrier2.position.z <= -1000) {
            this.leftBarrier2.position.z = this.leftBarrier.position.z + 1000;
            this.rightBarrier2.position.z = this.rightBarrier.position.z + 1000;
        }
        
        // Update road lines position
        this.roadLines.forEach(dash => {
            dash.position.z -= moveAmount;
            if (dash.position.z <= -500) {
                dash.position.z += 1000;
            }
        });

        // Update zebra crossings position
        this.zebraCrossings.forEach(stripe => {
            stripe.position.z -= moveAmount;
            if (stripe.position.z <= -500) {
                stripe.position.z += 1000;
            }
        });
    }
} 