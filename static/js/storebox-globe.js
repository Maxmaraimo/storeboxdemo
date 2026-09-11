/**
 * StoreBox 3D WebGL Earth Globe
 * High-Tech Dark-Purple & Electric Violet Presentation
 * 
 * Features:
 * - High-contrast luminous vector continents (Eurasia, Africa, Americas, Australia)
 * - Emissive neon violet dot-matrix and glowing city hubs
 * - Uzbekistan (Tashkent, Samarkand, Bukhara, Fergana) centered with pulsing rings
 * - 3D parabolic flight arcs with glowing white traveling photons
 * - Outer atmospheric Fresnel halo & orbiting starfield particles
 * - Interactive mouse/touch drag with smooth momentum damping
 * - Scroll-driven tilt & Retina resolution support
 */

(function() {
    'use strict';

    function isWebGLAvailable() {
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        } catch (e) {
            return false;
        }
    }

    function initStoreBoxGlobe() {
        const container = document.getElementById('storeboxGlobeContainer');
        const canvas = document.getElementById('storeboxGlobeCanvas');
        const fallback = document.getElementById('storeboxGlobeFallback');
        if (!container || !canvas) return;

        if (!isWebGLAvailable() || typeof THREE === 'undefined') {
            if (fallback) fallback.classList.remove('hidden');
            canvas.style.display = 'none';
            return;
        }

        let width = container.clientWidth || 700;
        let height = container.clientHeight || 560;

        // 1. Scene, Camera, Renderer
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
        camera.position.set(0, 0, 9.2);

        const renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance'
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

        const rootGroup = new THREE.Group();
        scene.add(rootGroup);

        const globeGroup = new THREE.Group();
        rootGroup.add(globeGroup);

        const GLOBE_RADIUS = 3.25;

        // -------------------------------------------------------------
        // 2. High-Contrast Procedural Earth Texture
        // -------------------------------------------------------------
        function createLuminousEarthTexture() {
            const texCanvas = document.createElement('canvas');
            texCanvas.width = 2048;
            texCanvas.height = 1024;
            const ctx = texCanvas.getContext('2d');

            // Deep Space / Dark-Purple Ocean Background
            ctx.fillStyle = '#080415';
            ctx.fillRect(0, 0, texCanvas.width, texCanvas.height);

            // Glowing Coordinate Grid (Lat / Lon)
            ctx.strokeStyle = 'rgba(168, 85, 247, 0.12)';
            ctx.lineWidth = 1;
            for (let x = 0; x < texCanvas.width; x += 64) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, texCanvas.height);
                ctx.stroke();
            }
            for (let y = 0; y < texCanvas.height; y += 64) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(texCanvas.width, y);
                ctx.stroke();
            }

            // Equirectangular continent coordinate mapper
            function mapCoord(lon, lat) {
                return {
                    x: (lon + 180) * (texCanvas.width / 360),
                    y: (90 - lat) * (texCanvas.height / 180)
                };
            }

            // Accurate Continent Polygons
            const continentOutlines = [
                // Eurasia (Europe, Russia, Central Asia, East Asia, Middle East, India)
                [
                    [-10, 36], [0, 43], [10, 45], [20, 40], [30, 42], [40, 38], [55, 25], [60, 22],
                    [70, 20], [78, 8], [82, 16], [90, 22], [100, 10], [105, 20], [115, 22], [122, 30],
                    [130, 35], [140, 40], [145, 45], [170, 65], [180, 67], [170, 72], [140, 75],
                    [100, 78], [70, 75], [50, 70], [30, 71], [20, 60], [10, 58], [5, 52], [-5, 48],
                    [-10, 43], [-10, 36]
                ],
                // Central Asia Core (Uzbekistan focus)
                [
                    [52, 45], [60, 47], [70, 48], [78, 45], [82, 43], [80, 38], [75, 36],
                    [68, 37], [64, 39], [58, 38], [53, 40], [52, 45]
                ],
                // Africa
                [
                    [-17, 15], [-12, 28], [0, 36], [12, 38], [32, 32], [45, 12], [51, 10],
                    [42, -5], [36, -20], [30, -32], [20, -35], [15, -30], [12, -10], [8, 4],
                    [-5, 5], [-15, 10], [-17, 15]
                ],
                // North America
                [
                    [-168, 65], [-160, 55], [-140, 60], [-130, 50], [-125, 40], [-118, 32],
                    [-105, 20], [-95, 16], [-85, 22], [-80, 26], [-75, 35], [-65, 45],
                    [-60, 48], [-55, 52], [-65, 60], [-80, 65], [-95, 70], [-120, 72],
                    [-140, 70], [-168, 65]
                ],
                // South America
                [
                    [-77, 8], [-72, 11], [-60, 5], [-50, 0], [-35, -5], [-37, -12],
                    [-42, -22], [-50, -30], [-55, -40], [-65, -55], [-75, -50], [-73, -40],
                    [-72, -30], [-76, -18], [-80, -5], [-77, 8]
                ],
                // Australia
                [
                    [114, -22], [120, -18], [130, -12], [142, -11], [148, -20], [153, -28],
                    [150, -38], [140, -38], [130, -32], [116, -34], [114, -22]
                ]
            ];

            // Render Luminous Plates
            continentOutlines.forEach(poly => {
                ctx.beginPath();
                const start = mapCoord(poly[0][0], poly[0][1]);
                ctx.moveTo(start.x, start.y);
                for (let i = 1; i < poly.length; i++) {
                    const pt = mapCoord(poly[i][0], poly[i][1]);
                    ctx.lineTo(pt.x, pt.y);
                }
                ctx.closePath();

                // Luminous Violet Plate Fill
                ctx.fillStyle = 'rgba(76, 29, 149, 0.45)';
                ctx.fill();

                // Vibrant Electric Violet Stroke Outline
                ctx.strokeStyle = 'rgba(192, 132, 252, 0.85)';
                ctx.lineWidth = 2.5;
                ctx.stroke();
            });

            // Dense Matrix of Glowing Nodes (7500 Points)
            for (let i = 0; i < 7500; i++) {
                const poly = continentOutlines[Math.floor(Math.random() * continentOutlines.length)];
                const idx = Math.floor(Math.random() * (poly.length - 1));
                const p1 = mapCoord(poly[idx][0], poly[idx][1]);
                const p2 = mapCoord(poly[idx + 1][0], poly[idx + 1][1]);

                const t = Math.random();
                const jx = (Math.random() - 0.5) * 50;
                const jy = (Math.random() - 0.5) * 40;
                const px = p1.x + (p2.x - p1.x) * t + jx;
                const py = p1.y + (p2.y - p1.y) * t + jy;

                const isWhite = Math.random() > 0.65;
                ctx.fillStyle = isWhite ? '#FFFFFF' : '#C084FC';
                ctx.globalAlpha = Math.random() * 0.7 + 0.3;
                ctx.fillRect(px, py, isWhite ? 2.5 : 2.0, isWhite ? 2.5 : 2.0);
            }
            ctx.globalAlpha = 1.0;

            // City Clusters with Intense Halos
            const cityLights = [
                { lon: 69.28, lat: 41.31, r: 10, color: '#FFFFFF', glow: '#C084FC' }, // Tashkent (HQ)
                { lon: 66.96, lat: 39.65, r: 7, color: '#FFFFFF', glow: '#A855F7' },  // Samarkand
                { lon: 64.42, lat: 39.77, r: 6, color: '#FFFFFF', glow: '#A855F7' },  // Bukhara
                { lon: 71.78, lat: 40.38, r: 6, color: '#FFFFFF', glow: '#A855F7' },  // Fergana
                { lon: 72.34, lat: 40.78, r: 5, color: '#FFFFFF', glow: '#A855F7' },  // Andijan
                { lon: 59.61, lat: 42.46, r: 5, color: '#FFFFFF', glow: '#A855F7' },  // Nukus
                { lon: 55.27, lat: 25.20, r: 7, color: '#FFFFFF', glow: '#A855F7' },  // Dubai
                { lon: 28.97, lat: 41.00, r: 7, color: '#FFFFFF', glow: '#A855F7' },  // Istanbul
                { lon: 8.68, lat: 50.11, r: 7, color: '#FFFFFF', glow: '#A855F7' },   // Frankfurt
                { lon: -0.12, lat: 51.50, r: 7, color: '#FFFFFF', glow: '#A855F7' },  // London
                { lon: 103.81, lat: 1.35, r: 6, color: '#FFFFFF', glow: '#A855F7' },  // Singapore
                { lon: 139.65, lat: 35.67, r: 7, color: '#FFFFFF', glow: '#A855F7' }, // Tokyo
                { lon: -74.00, lat: 40.71, r: 7, color: '#FFFFFF', glow: '#A855F7' }  // New York
            ];

            cityLights.forEach(city => {
                const pt = mapCoord(city.lon, city.lat);
                const haloRadius = Math.max(4, city.r * 0.82);
                const rad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, haloRadius);
                rad.addColorStop(0, 'rgba(255,255,255,.92)');
                rad.addColorStop(0.22, city.glow);
                rad.addColorStop(1, 'rgba(8, 4, 21, 0)');
                ctx.fillStyle = rad;
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, haloRadius, 0, Math.PI * 2);
                ctx.fill();
            });

            const texture = new THREE.CanvasTexture(texCanvas);
            texture.generateMipmaps = true;
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            return texture;
        }

        const earthTexture = createLuminousEarthTexture();

        // 3. Globe Mesh with Emissive Glow
        const sphereGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
        // The texture carries its own light information. An unlit material keeps
        // continent detail readable and avoids a blown-out Phong hotspot.
        const sphereMat = new THREE.MeshBasicMaterial({
            map: earthTexture,
            color: new THREE.Color(0xBFA4FF)
        });
        const earthMesh = new THREE.Mesh(sphereGeo, sphereMat);
        globeGroup.add(earthMesh);

        // 4. Outer Atmospheric Halo
        const haloGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.05, 64, 64);
        const haloMat = new THREE.ShaderMaterial({
            uniforms: {
                c: { value: 0.35 },
                p: { value: 3.0 },
                glowColor: { value: new THREE.Color(0xA855F7) },
                viewVector: { value: camera.position }
            },
            vertexShader: `
                uniform vec3 viewVector;
                varying float intensity;
                void main() {
                    vec3 vNormal = normalize(normalMatrix * normal);
                    intensity = pow(max(0.0, 0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.5);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 glowColor;
                varying float intensity;
                void main() {
                    gl_FragColor = vec4(glowColor * intensity, intensity * 0.9);
                }
            `,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true
        });
        const haloMesh = new THREE.Mesh(haloGeo, haloMat);
        globeGroup.add(haloMesh);

        // 5. Hub Pins & Pulsing Radar Rings
        function latLonToVector3(lat, lon, radius) {
            const phi = (90 - lat) * (Math.PI / 180);
            const theta = (lon + 180) * (Math.PI / 180);
            const x = -(radius * Math.sin(phi) * Math.cos(theta));
            const z = radius * Math.sin(phi) * Math.sin(theta);
            const y = radius * Math.cos(phi);
            return new THREE.Vector3(x, y, z);
        }

        const hubs = [
            { name: 'Tashkent (HQ)', lat: 41.311081, lon: 69.240562, isHQ: true },
            { name: 'Samarkand', lat: 39.654167, lon: 66.959722 },
            { name: 'Bukhara', lat: 39.774722, lon: 64.428611 },
            { name: 'Fergana', lat: 40.384210, lon: 71.784320 },
            { name: 'Andijan', lat: 40.782060, lon: 72.344240 },
            { name: 'Nukus', lat: 42.460280, lon: 59.616670 },
            { name: 'Dubai', lat: 25.2048, lon: 55.2708 },
            { name: 'Istanbul', lat: 41.0082, lon: 28.9784 },
            { name: 'Frankfurt', lat: 50.1109, lon: 8.6821 },
            { name: 'London', lat: 51.5074, lon: -0.1278 },
            { name: 'Singapore', lat: 1.3521, lon: 103.8198 },
            { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
            { name: 'New York', lat: 40.7128, lon: -74.0060 }
        ];

        const pulsingRings = [];

        hubs.forEach(hub => {
            const pos = latLonToVector3(hub.lat, hub.lon, GLOBE_RADIUS * 1.006);

            // Pin Core
            const pinGeo = new THREE.SphereGeometry(hub.isHQ ? 0.05 : 0.035, 16, 16);
            const pinMat = new THREE.MeshBasicMaterial({
                color: hub.isHQ ? 0xFFFFFF : 0xC084FC
            });
            const pin = new THREE.Mesh(pinGeo, pinMat);
            pin.position.copy(pos);
            globeGroup.add(pin);

            // Pulsing Concentric Radar Ring
            const ringGeo = new THREE.RingGeometry(0.02, 0.045, 32);
            const ringMat = new THREE.MeshBasicMaterial({
                color: hub.isHQ ? 0xFFFFFF : 0xA855F7,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.9,
                blending: THREE.AdditiveBlending
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.position.copy(pos);
            ring.lookAt(new THREE.Vector3(0, 0, 0));
            globeGroup.add(ring);

            pulsingRings.push({
                mesh: ring,
                maxScale: hub.isHQ ? 4.8 : 3.4,
                speed: hub.isHQ ? 0.035 : 0.025,
                phase: Math.random() * Math.PI * 2
            });
        });

        // 6. 3D Flight Arcs & Traveling Photons
        const connections = [
            { from: 'Tashkent (HQ)', to: 'Samarkand' },
            { from: 'Tashkent (HQ)', to: 'Bukhara' },
            { from: 'Tashkent (HQ)', to: 'Fergana' },
            { from: 'Tashkent (HQ)', to: 'Andijan' },
            { from: 'Tashkent (HQ)', to: 'Nukus' },
            { from: 'Tashkent (HQ)', to: 'Dubai' },
            { from: 'Tashkent (HQ)', to: 'Istanbul' },
            { from: 'Tashkent (HQ)', to: 'Frankfurt' },
            { from: 'Tashkent (HQ)', to: 'London' },
            { from: 'Tashkent (HQ)', to: 'Singapore' },
            { from: 'Tashkent (HQ)', to: 'Tokyo' },
            { from: 'Frankfurt', to: 'New York' }
        ];

        const photonList = [];

        connections.forEach(conn => {
            const h1 = hubs.find(h => h.name === conn.from);
            const h2 = hubs.find(h => h.name === conn.to);
            if (!h1 || !h2) return;

            const p1 = latLonToVector3(h1.lat, h1.lon, GLOBE_RADIUS);
            const p2 = latLonToVector3(h2.lat, h2.lon, GLOBE_RADIUS);

            const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
            const dist = p1.distanceTo(p2);
            const altitude = GLOBE_RADIUS + Math.min(dist * 0.38, 1.4);
            mid.normalize().multiplyScalar(altitude);

            const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
            const points = curve.getPoints(50);
            const arcGeo = new THREE.BufferGeometry().setFromPoints(points);

            const arcMat = new THREE.LineBasicMaterial({
                color: 0xC084FC,
                transparent: true,
                opacity: 0.65,
                blending: THREE.AdditiveBlending
            });
            const arcLine = new THREE.Line(arcGeo, arcMat);
            globeGroup.add(arcLine);

            const photonGeo = new THREE.SphereGeometry(0.045, 12, 12);
            const photonMat = new THREE.MeshBasicMaterial({
                color: 0xFFFFFF,
                blending: THREE.AdditiveBlending
            });
            const photonMesh = new THREE.Mesh(photonGeo, photonMat);
            globeGroup.add(photonMesh);

            photonList.push({
                mesh: photonMesh,
                curve: curve,
                progress: Math.random(),
                speed: 0.005 + Math.random() * 0.003
            });
        });

        // 7. Starfield Particles
        const starGeo = new THREE.BufferGeometry();
        const starCount = 400;
        const starPositions = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount * 3; i += 3) {
            const r = GLOBE_RADIUS * 1.5 + Math.random() * 6.0;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            starPositions[i] = r * Math.sin(phi) * Math.cos(theta);
            starPositions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
            starPositions[i + 2] = r * Math.cos(phi);
        }
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

        const starMat = new THREE.PointsMaterial({
            color: 0xD8B4FE,
            size: 0.05,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending
        });
        const starField = new THREE.Points(starGeo, starMat);
        scene.add(starField);

        // Lights
        const ambientLight = new THREE.AmbientLight(0x8B5CF6, 0.62);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xD8B4FE, 0.72);
        dirLight.position.set(6, 4, 7);
        scene.add(dirLight);

        const fillLight = new THREE.DirectionalLight(0xA855F7, 0.48);
        fillLight.position.set(-6, -3, -4);
        scene.add(fillLight);

        // Initial Focus on Central Asia (Tashkent)
        globeGroup.rotation.y = -Math.PI * 0.62;
        globeGroup.rotation.x = 0.28;

        // 8. Interactivity: Drag Rotation & Controls
        let isDragging = false;
        let prevMouseX = 0;
        let prevMouseY = 0;
        let velocityX = 0;
        let velocityY = 0;
        let autoSpin = true;

        const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        function onPointerDown(e) {
            isDragging = true;
            autoSpin = false;
            prevMouseX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
            prevMouseY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
            velocityX = 0;
            velocityY = 0;
            container.style.cursor = 'grabbing';
        }

        function onPointerMove(e) {
            if (!isDragging) return;
            const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
            const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

            const deltaX = clientX - prevMouseX;
            const deltaY = clientY - prevMouseY;
            velocityX = deltaX * 0.004;
            velocityY = deltaY * 0.004;
            globeGroup.rotation.y += velocityX;
            globeGroup.rotation.x += velocityY;
            prevMouseX = clientX;
            prevMouseY = clientY;
        }

        function onPointerUp() {
            isDragging = false;
            container.style.cursor = 'grab';
        }

        container.style.cursor = 'grab';
        container.addEventListener('mousedown', onPointerDown);
        window.addEventListener('mousemove', onPointerMove);
        window.addEventListener('mouseup', onPointerUp);

        container.addEventListener('touchstart', onPointerDown, { passive: true });
        window.addEventListener('touchmove', onPointerMove, { passive: true });
        window.addEventListener('touchend', onPointerUp);

        function onWindowResize() {
            width = container.clientWidth;
            height = container.clientHeight || 560;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        }
        window.addEventListener('resize', onWindowResize);

        const resetBtn = document.getElementById('storeboxGlobeReset');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                globeGroup.rotation.y = -Math.PI * 0.62;
                globeGroup.rotation.x = 0.28;
                autoSpin = true;
            });
        }

        const autoSpinBtn = document.getElementById('storeboxGlobeAutoSpin');
        if (autoSpinBtn) {
            autoSpinBtn.addEventListener('click', () => {
                autoSpin = !autoSpin;
                autoSpinBtn.classList.toggle('bg-purple-600', autoSpin);
            });
        }

        // 9. Animation Loop
        let clock = new THREE.Clock();

        function animate() {
            requestAnimationFrame(animate);
            const delta = clock.getDelta();

            if (!isDragging) {
                velocityX *= 0.94;
                velocityY *= 0.94;
                globeGroup.rotation.y += velocityX;
                globeGroup.rotation.x += velocityY;

                if (autoSpin && !prefersReducedMotion) {
                    globeGroup.rotation.y += 0.0018;
                }
            }

            pulsingRings.forEach(p => {
                if (!prefersReducedMotion) {
                    p.phase += p.speed;
                    const scale = 1 + (Math.sin(p.phase) + 1) * 0.5 * (p.maxScale - 1);
                    p.mesh.scale.set(scale, scale, scale);
                    p.mesh.material.opacity = Math.max(0, 1 - (scale - 1) / (p.maxScale - 1));
                }
            });

            photonList.forEach(item => {
                if (!prefersReducedMotion) {
                    item.progress += item.speed;
                    if (item.progress > 1) item.progress = 0;
                    const pt = item.curve.getPoint(item.progress);
                    item.mesh.position.copy(pt);
                }
            });

            if (!prefersReducedMotion) {
                starField.rotation.y += 0.0004;
            }

            renderer.render(scene, camera);
        }

        animate();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initStoreBoxGlobe);
    } else {
        initStoreBoxGlobe();
    }
})();
