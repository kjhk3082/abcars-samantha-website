// 3D Business Card Implementation
// Card faces are drawn onto canvases at runtime (Samantha Used Car / Gorilla Motors design),
// so the card stays razor-sharp at any zoom and the QR is a real, scannable WhatsApp link.
document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('canvas-container');
    const loadingOverlay = document.getElementById('loading-overlay');

    if (!container) return;

    // Variables
    let scene, camera, renderer;
    let cardGroup;
    let isFlipped = false;
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let targetRotation = { x: 0, y: 0 };
    let currentRotation = { x: 0, y: 0 };

    // Card Dimensions
    const CARD_WIDTH = 3.5; // Standard business card width ratio
    const CARD_HEIGHT = 2.0; // Standard business card height ratio
    const CARD_THICKNESS = 0.02; // Card thickness

    // Texture canvases share the card's 3.5:2 ratio
    const TEX_W = 1400;
    const TEX_H = 800;

    // Printed card palette
    const CREAM = '#FAF6EA';
    const INK = '#2F3A26';
    const INK_SOFT = '#55604A';
    const GREEN = '#2C4732';
    const TAN = '#D2A867';

    function drawQR(ctx, text, x, y, size) {
        // qrcode-generator CDN global; the card still renders if it failed to load
        if (typeof qrcode !== 'function') return;
        const qr = qrcode(0, 'M');
        qr.addData(text);
        qr.make();
        const n = qr.getModuleCount();
        const cell = size / n;
        ctx.fillStyle = '#1E2418';
        for (let row = 0; row < n; row++) {
            for (let col = 0; col < n; col++) {
                if (qr.isDark(row, col)) {
                    ctx.fillRect(x + col * cell, y + row * cell, cell + 0.5, cell + 0.5);
                }
            }
        }
    }

    function makeFrontCanvas() {
        const canvas = document.createElement('canvas');
        canvas.width = TEX_W;
        canvas.height = TEX_H;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = CREAM;
        ctx.fillRect(0, 0, TEX_W, TEX_H);

        // WhatsApp QR (chat with Samantha)
        drawQR(ctx, 'https://wa.me/821071704513', 255, 310, 280);

        // Divider bar
        ctx.fillStyle = GREEN;
        ctx.fillRect(560, 235, 9, 480);

        const LEFT = 615;
        ctx.textBaseline = 'alphabetic';

        // Title + name
        ctx.fillStyle = INK_SOFT;
        ctx.font = '400 27px "Nanum Myeongjo", serif';
        ctx.fillText('Sales', LEFT, 285);
        ctx.fillText('Manager', LEFT, 317);
        const nameX = LEFT + ctx.measureText('Manager').width + 28;
        ctx.fillStyle = INK;
        ctx.font = '700 62px "Nanum Myeongjo", serif';
        ctx.fillText('Samantha Kim', nameX, 315);

        ctx.font = '400 46px "Nanum Myeongjo", serif';
        ctx.fillText('SOFA Vehicle Specialist', LEFT, 397);

        // Contact rows
        function row(label, value, y) {
            ctx.fillStyle = INK_SOFT;
            ctx.font = '400 33px "Nanum Myeongjo", serif';
            ctx.fillText(label, LEFT, y);
            const w = ctx.measureText(label).width;
            ctx.fillStyle = INK;
            ctx.font = '700 36px "Nanum Myeongjo", serif';
            ctx.fillText(value, LEFT + w + 24, y);
        }
        row('Mobile', '010-7170-4513', 505);
        row('WhatsApp', '+82-10-7170-4513', 562);
        row('E-mail', 'flowerdudtlr@gmail.com', 619);

        // Address
        ctx.fillStyle = INK_SOFT;
        ctx.font = '400 27px "Nanum Myeongjo", serif';
        ctx.fillText('401-1, Songhwa-ri, Paengseong-eup,', LEFT, 685);
        ctx.fillText('Pyeongtaek-si, Gyeonggi-do, Republic of Korea', LEFT, 720);

        return canvas;
    }

    function makeBackCanvas() {
        const canvas = document.createElement('canvas');
        canvas.width = TEX_W;
        canvas.height = TEX_H;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = GREEN;
        ctx.fillRect(0, 0, TEX_W, TEX_H);

        ctx.fillStyle = TAN;
        ctx.textBaseline = 'alphabetic';
        ctx.letterSpacing = '6px';
        ctx.font = '400 76px "Titan One", "Arial Black", sans-serif';
        ctx.fillText('GORILLA', 110, 190);
        ctx.fillText('MOTORS', 110, 275);

        ctx.letterSpacing = '4px';
        ctx.font = '700 40px "Nanum Myeongjo", serif';
        ctx.textAlign = 'right';
        ctx.fillText('USED CARS BUY · SELL · JUNK', TEX_W - 110, 725);
        ctx.textAlign = 'left';
        ctx.letterSpacing = '0px';

        return canvas;
    }

    function init() {
        // Scene Setup
        scene = new THREE.Scene();

        // Camera Setup
        const aspect = container.clientWidth / container.clientHeight;
        camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
        fitCameraZ();

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
        spotLight.shadow.mapSize.width = 2048;
        spotLight.shadow.mapSize.height = 2048;
        spotLight.shadow.bias = -0.0001;
        scene.add(spotLight);

        const fillLight = new THREE.PointLight(0xe0e0e0, 0.5);
        fillLight.position.set(-5, 5, 5);
        scene.add(fillLight);

        // Card face textures drawn in-browser
        const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
        const frontTexture = new THREE.CanvasTexture(makeFrontCanvas());
        const backTexture = new THREE.CanvasTexture(makeBackCanvas());
        [frontTexture, backTexture].forEach(function(tex) {
            tex.anisotropy = maxAnisotropy;
            tex.minFilter = THREE.LinearFilter;
            tex.magFilter = THREE.LinearFilter;
            tex.encoding = THREE.sRGBEncoding;
        });
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

        if (loadingOverlay) loadingOverlay.style.display = 'none';
        animate();
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
            color: 0xEDE6D4, // Card stock edge
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

        isFlipped = !isFlipped;

        if (isFlipped) {
            // Flip to back
            targetRotation.y = Math.PI + (targetRotation.y % (Math.PI * 2));
        } else {
            // Flip to front
            targetRotation.y = 0;
        }
    }

    function fitCameraZ() {
        // Pull the camera back far enough that the card (plus margin) fits narrow screens
        const vFov = camera.fov * Math.PI / 180;
        const zForWidth = (CARD_WIDTH / 2 + 0.35) / (Math.tan(vFov / 2) * camera.aspect);
        camera.position.z = Math.max(5, zForWidth);
    }

    function onWindowResize() {
        const width = container.clientWidth;
        const height = container.clientHeight;

        camera.aspect = width / height;
        fitCameraZ();
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }

    function animate() {
        requestAnimationFrame(animate);

        // Smooth rotation interpolation
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

    // Draw once the card fonts are ready (3s cap so a slow font never blocks the card)
    const fontsReady = (document.fonts && document.fonts.load)
        ? Promise.all([
            document.fonts.load('400 33px "Nanum Myeongjo"'),
            document.fonts.load('700 62px "Nanum Myeongjo"'),
            document.fonts.load('400 76px "Titan One"')
          ]).catch(function() {})
        : Promise.resolve();
    Promise.race([fontsReady, new Promise(function(resolve) { setTimeout(resolve, 3000); })]).then(init);
});