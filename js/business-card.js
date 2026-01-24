// 3D Business Card Implementation
document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('canvas-container');
    const loadingOverlay = document.getElementById('loading-overlay');
    
    if (!container) return;

    // Variables
    let scene, camera, renderer, controls;
    let cardGroup, frontMesh, backMesh, sideMesh;
    let isFlipped = false;
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let targetRotation = { x: 0, y: 0 };
    let currentRotation = { x: 0, y: 0 };

    // Card Dimensions
    const CARD_WIDTH = 3.5; // Standard business card width ratio
    const CARD_HEIGHT = 2.0; // Standard business card height ratio
    const CARD_THICKNESS = 0.02; // Card thickness

    function init() {
        // Scene Setup
        scene = new THREE.Scene();
        // scene.background = new THREE.Color(0xf5f5f5); // Let CSS handle background

        // Camera Setup
        const aspect = container.clientWidth / container.clientHeight;
        camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
        camera.position.z = 5;

        // Renderer Setup
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(renderer.domElement);

        // Lighting - Bright Studio Setup
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(ambientLight);

        const spotLight = new THREE.SpotLight(0xffffff, 1.2);
        spotLight.position.set(10, 15, 10);
        spotLight.castShadow = true;
        spotLight.shadow.mapSize.width = 2048; // High res shadow
        spotLight.shadow.mapSize.height = 2048;
        spotLight.shadow.bias = -0.0001;
        scene.add(spotLight);

        const fillLight = new THREE.PointLight(0xe0e0e0, 0.5); // Cool fill light
        fillLight.position.set(-5, 5, 5);
        scene.add(fillLight);

        // Texture Loading Manager
        const manager = new THREE.LoadingManager();
        manager.onLoad = function() {
            if (loadingOverlay) loadingOverlay.style.display = 'none';
            animate();
        };

        const textureLoader = new THREE.TextureLoader(manager);
        
        // Load Textures with High Quality Settings
        const frontTexture = textureLoader.load('images/card_front.jpg');
        const backTexture = textureLoader.load('images/card_back.jpg');
        
        // Max Anisotropy for sharpness at angles
        const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
        
        frontTexture.anisotropy = maxAnisotropy;
        backTexture.anisotropy = maxAnisotropy;
        
        frontTexture.minFilter = THREE.LinearFilter;
        frontTexture.magFilter = THREE.LinearFilter;
        backTexture.minFilter = THREE.LinearFilter;
        backTexture.magFilter = THREE.LinearFilter;
        
        // Encoding for better color
        frontTexture.encoding = THREE.sRGBEncoding;
        backTexture.encoding = THREE.sRGBEncoding;
        renderer.outputEncoding = THREE.sRGBEncoding;

        // Create Card
        createCard(frontTexture, backTexture);

        // Event Listeners
        window.addEventListener('resize', onWindowResize, false);
        container.addEventListener('mousedown', onMouseDown, false);
        container.addEventListener('mousemove', onMouseMove, false);
        container.addEventListener('mouseup', onMouseUp, false);
        container.addEventListener('mouseleave', onMouseUp, false);
        
        // Touch events
        container.addEventListener('touchstart', onTouchStart, false);
        container.addEventListener('touchmove', onTouchMove, false);
        container.addEventListener('touchend', onMouseUp, false);

        // Click to flip (if not dragging)
        container.addEventListener('click', onCardClick, false);
    }

    function createCard(frontTex, backTex) {
        cardGroup = new THREE.Group();
        
        // Materials
        const frontMaterial = new THREE.MeshStandardMaterial({ 
            map: frontTex,
            roughness: 0.4,
            metalness: 0.1
        });

        const backMaterial = new THREE.MeshStandardMaterial({ 
            map: backTex,
            roughness: 0.4,
            metalness: 0.1
        });

        const sideMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x1a2a44, // Navy Blue sides
            roughness: 0.3,
            metalness: 0.0
        });

        // Geometry - Using BoxGeometry for thickness
        const geometry = new THREE.BoxGeometry(CARD_WIDTH, CARD_HEIGHT, CARD_THICKNESS);

        // Apply materials to specific faces
        // 0: right, 1: left, 2: top, 3: bottom, 4: front, 5: back
        const materials = [
            sideMaterial, // Right
            sideMaterial, // Left
            sideMaterial, // Top
            sideMaterial, // Bottom
            frontMaterial, // Front
            backMaterial  // Back
        ];

        const cardMesh = new THREE.Mesh(geometry, materials);
        cardMesh.castShadow = true;
        cardMesh.receiveShadow = true;
        
        cardGroup.add(cardMesh);
        scene.add(cardGroup);

        // Initial subtle rotation
        targetRotation.y = -0.2;
        targetRotation.x = 0.1;
    }

    // Interaction Handlers
    function onMouseDown(e) {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
    }

    function onTouchStart(e) {
        if (e.touches.length === 1) {
            isDragging = true;
            previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
    }

    function onMouseMove(e) {
        if (!isDragging) {
            // Mouse hover effect (tilt)
            const x = (e.clientX / window.innerWidth) * 2 - 1;
            const y = -(e.clientY / window.innerHeight) * 2 + 1;
            if (!isFlipped) {
                targetRotation.y = x * 0.2; // Slight tilt
                targetRotation.x = -y * 0.2;
            }
            return;
        }

        const deltaMove = {
            x: e.clientX - previousMousePosition.x,
            y: e.clientY - previousMousePosition.y
        };

        targetRotation.y += deltaMove.x * 0.01;
        targetRotation.x += deltaMove.y * 0.01;

        previousMousePosition = { x: e.clientX, y: e.clientY };
    }

    function onTouchMove(e) {
        if (!isDragging || e.touches.length !== 1) return;
        
        e.preventDefault(); // Prevent scrolling while rotating card
        
        const touch = e.touches[0];
        const deltaMove = {
            x: touch.clientX - previousMousePosition.x,
            y: touch.clientY - previousMousePosition.y
        };

        targetRotation.y += deltaMove.x * 0.01;
        targetRotation.x += deltaMove.y * 0.01;

        previousMousePosition = { x: touch.clientX, y: touch.clientY };
    }

    function onMouseUp() {
        isDragging = false;
    }

    function onCardClick(e) {
        if (isDragging) return; // Prevent flip if just finished dragging
        
        // Simple click detection logic could be improved, but this works for now
        isFlipped = !isFlipped;
        
        if (isFlipped) {
            // Flip to back
            targetRotation.y = Math.PI + (targetRotation.y % (Math.PI * 2));
        } else {
            // Flip to front
            targetRotation.y = 0;
        }
    }

    function onWindowResize() {
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }

    function animate() {
        requestAnimationFrame(animate);

        // Smooth rotation interpolation
        // Damping effect
        currentRotation.x += (targetRotation.x - currentRotation.x) * 0.1;
        currentRotation.y += (targetRotation.y - currentRotation.y) * 0.1;

        if (cardGroup) {
            cardGroup.rotation.x = currentRotation.x;
            cardGroup.rotation.y = currentRotation.y;
            
            // Floating animation
            cardGroup.position.y = Math.sin(Date.now() * 0.001) * 0.1;
        }

        renderer.render(scene, camera);
    }

    // Initialize
    init();
});