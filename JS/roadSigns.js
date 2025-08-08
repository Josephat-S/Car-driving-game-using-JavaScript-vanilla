class RoadSigns {
    constructor(scene) {
        this.scene = scene;
        this.signs = [];
        this.billboards = [];
        this.createSigns();
        this.createBillboards();
    }

    createSigns() {
        // Common materials
        const poleMaterial = new THREE.MeshPhongMaterial({
            color: 0x000000,  // Black poles
            shininess: 10
        });

        const signMaterials = [
            { 
                text: 'TSS SCHOOL', 
                color: 0xFFFFFF
            },
            { 
                text: 'RP KARONGI\nCOLLEGE', 
                color: 0xFFFFFF
            },
            { 
                text: 'INNOVATION\nHUB', 
                color: 0xFFFFFF
            },
            { 
                text: 'WELCOME TO\nRP', 
                color: 0xFFFFFF
            }
        ];

        // Create signs on both sides of the road
        for (let i = 0; i < 8; i++) {
            const side = i % 2 === 0 ? 1 : -1;
            const signInfo = signMaterials[Math.floor(i / 2) % signMaterials.length];
            
            // Create base - short black rectangle
            const baseGeometry = new THREE.BoxGeometry(0.4, 0.2, 0.4);
            const base = new THREE.Mesh(baseGeometry, poleMaterial);
            
            // Create pole - short and thick
            const poleGeometry = new THREE.BoxGeometry(0.2, 1.2, 0.2);
            const pole = new THREE.Mesh(poleGeometry, poleMaterial);
            
            // Create sign
            const signGeometry = new THREE.PlaneGeometry(2, 0.8); // Matches screenshot dimensions
            
            // Create sign material with text
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 512;
            canvas.height = 256;

            // White background
            context.fillStyle = '#FFFFFF';
            context.fillRect(0, 0, 512, 256);

            // Black border
            context.strokeStyle = '#000000';
            context.lineWidth = 8;
            context.strokeRect(4, 4, 504, 248);

            // Add text
            context.fillStyle = '#000000';  // Black text
            context.font = 'bold 72px Arial';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            
            // Handle multiline text
            const lines = signInfo.text.split('\\n');
            const lineHeight = lines.length > 1 ? 70 : 0;
            lines.forEach((line, index) => {
                const y = 128 + (index - (lines.length - 1) / 2) * lineHeight;
                context.fillText(line, 256, y);
            });

            const texture = new THREE.CanvasTexture(canvas);
            const signMaterial = new THREE.MeshPhongMaterial({
                map: texture,
                side: THREE.DoubleSide
            });

            const sign = new THREE.Mesh(signGeometry, signMaterial);
            
            // Position exactly like in screenshot
            const zPosition = -100 - i * 120; // More spread out
            base.position.set(side * 2.8, 0.1, zPosition); // Closer to road, at ground level
            pole.position.set(side * 2.8, 0.7, zPosition); // Short pole
            sign.position.set(side * 2.8, 1.3, zPosition); // Lower sign height
            sign.rotation.y = side === 1 ? -Math.PI / 2 : Math.PI / 2;

            this.scene.add(base);
            this.scene.add(pole);
            this.scene.add(sign);
            this.signs.push({ base, pole, sign });
        }
    }

    createBillboards() {
        const billboardTexts = [
            { 
                text: 'VISIT RWANDA', 
                subtext: 'Land of a Thousand Hills'
            },
            { 
                text: 'INNOVATION HUB', 
                subtext: 'Powered by Youth'
            },
            { 
                text: 'RWANDAN COFFEE', 
                subtext: 'Fuel Your Journey'
            }
        ];

        // Create billboards
        billboardTexts.forEach((billboardInfo, index) => {
            // Create base
            const baseGeometry = new THREE.BoxGeometry(0.6, 0.2, 0.6);
            const baseMaterial = new THREE.MeshPhongMaterial({
                color: 0x000000,
                shininess: 10
            });

            // Create supports
            const supportGeometry = new THREE.BoxGeometry(0.2, 2.5, 0.2);
            
            // Left base and support
            const leftBase = new THREE.Mesh(baseGeometry, baseMaterial);
            const leftSupport = new THREE.Mesh(supportGeometry, baseMaterial);
            leftBase.position.set(-2, 0.1, -180 - index * 200);
            leftSupport.position.set(-2, 1.35, -180 - index * 200);

            // Right base and support
            const rightBase = new THREE.Mesh(baseGeometry, baseMaterial);
            const rightSupport = new THREE.Mesh(supportGeometry, baseMaterial);
            rightBase.position.set(2, 0.1, -180 - index * 200);
            rightSupport.position.set(2, 1.35, -180 - index * 200);

            // Create billboard panel
            const panelGeometry = new THREE.PlaneGeometry(4.5, 2);
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 1024;
            canvas.height = 512;

            // White background
            context.fillStyle = '#FFFFFF';
            context.fillRect(0, 0, 1024, 512);

            // Black border
            context.strokeStyle = '#000000';
            context.lineWidth = 8;
            context.strokeRect(4, 4, 1016, 504);

            // Add text
            context.fillStyle = '#000000';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            
            // Main text
            context.font = 'bold 96px Arial';
            context.fillText(billboardInfo.text, 512, 180);

            // Subtext
            context.font = 'bold 64px Arial';
            context.fillText(billboardInfo.subtext, 512, 320);

            const texture = new THREE.CanvasTexture(canvas);
            const panelMaterial = new THREE.MeshPhongMaterial({
                map: texture,
                side: THREE.DoubleSide
            });

            const panel = new THREE.Mesh(panelGeometry, panelMaterial);
            panel.position.set(0, 2.5, -180 - index * 200);

            this.scene.add(leftBase);
            this.scene.add(rightBase);
            this.scene.add(leftSupport);
            this.scene.add(rightSupport);
            this.scene.add(panel);

            this.billboards.push({
                bases: [leftBase, rightBase],
                supports: [leftSupport, rightSupport],
                panel
            });
        });
    }

    update(speed) {
        // Update positions of signs and billboards
        const moveAmount = speed / 10;

        this.signs.forEach((sign) => {
            sign.base.position.z += moveAmount;
            sign.pole.position.z += moveAmount;
            sign.sign.position.z += moveAmount;

            // Reset position when passed
            if (sign.base.position.z > 50) {
                const resetDistance = 960; // 8 signs * 120 spacing
                sign.base.position.z -= resetDistance;
                sign.pole.position.z -= resetDistance;
                sign.sign.position.z -= resetDistance;
            }
        });

        this.billboards.forEach(billboard => {
            billboard.bases.forEach(base => {
                base.position.z += moveAmount;
            });
            billboard.supports.forEach(support => {
                support.position.z += moveAmount;
            });
            billboard.panel.position.z += moveAmount;

            // Reset position when passed
            if (billboard.panel.position.z > 50) {
                const resetDistance = 600; // 3 billboards * 200 spacing
                billboard.bases.forEach(base => {
                    base.position.z -= resetDistance;
                });
                billboard.supports.forEach(support => {
                    support.position.z -= resetDistance;
                });
                billboard.panel.position.z -= resetDistance;
            }
        });
    }
} 