/* ============================================================
   JOHNSON SMART FILM — Main JavaScript (Mobile-Fixed v3.0)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    /* ── 1. Loading Screen ─────────────────────────────────── */
    const loader = document.getElementById('loader');

    // Loader particles (desktop only — skip on low-power devices)
    const loaderParticles = document.getElementById('loaderParticles');
    const isLowPower = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (loaderParticles && !isLowPower) {
        for (let i = 0; i < 20; i++) {
            const p = document.createElement('div');
            const angle = Math.random() * 360;
            const dist  = 60 + Math.random() * 150;
            const size  = 1 + Math.random() * 2;
            p.style.cssText = `
                position:absolute;
                width:${size}px;height:${size}px;
                background:${Math.random() > 0.5 ? '#00d4ff' : '#c8a97e'};
                border-radius:50%;
                left:50%;top:50%;
                opacity:0;
                transform:translate(-50%,-50%);
                animation:particleBurst ${0.8 + Math.random() * 0.6}s ease ${0.3 + Math.random()*0.5}s both;
                --angle:${angle}deg;--dist:${dist}px;
            `;
            loaderParticles.appendChild(p);
        }
        const style = document.createElement('style');
        style.textContent = `@keyframes particleBurst {
            0%   { opacity:0; transform:translate(-50%,-50%) rotate(var(--angle)) translateX(0); }
            30%  { opacity:1; }
            100% { opacity:0; transform:translate(-50%,-50%) rotate(var(--angle)) translateX(var(--dist)); }
        }`;
        document.head.appendChild(style);
    }

    function hideLoader() {
        if (!loader) return;
        setTimeout(() => {
            loader.style.transition = 'opacity 0.7s cubic-bezier(0.76,0,0.24,1), visibility 0.7s';
            loader.classList.add('hidden');
        }, 1200);
    }

    if (document.readyState === 'complete') {
        hideLoader();
    } else {
        window.addEventListener('load', hideLoader);
    }


    /* ── 2. Sticky Header ──────────────────────────────────── */
    const header = document.getElementById('header');

    function handleHeaderScroll() {
        if (!header) return;
        header.classList.toggle('scrolled', window.scrollY > 60);
    }
    window.addEventListener('scroll', handleHeaderScroll, { passive: true });
    handleHeaderScroll();


    /* ── 3. Mobile Menu ────────────────────────────────────── */
const menuBtn = document.getElementById('menuBtn');
const mobileNav = document.getElementById('mobileNav');

function openNav() {
    mobileNav.classList.add('open');
    menuBtn.style.display = 'none';  /* إخفاء الزر نفسه */
    document.body.style.overflow = 'hidden';
}
function closeNav() {
    mobileNav.classList.remove('open');
    menuBtn.style.display = '';      /* إظهاره مرة أخرى */
    document.body.style.overflow = '';
}

if (menuBtn) {
    menuBtn.addEventListener('click', () => {
        if (mobileNav.classList.contains('open')) {
            closeNav();
        } else {
            openNav();
        }
    });
}

if (mobileNav) {
    mobileNav.querySelectorAll('[data-close], .mobile-nav-link').forEach(link => {
        link.addEventListener('click', closeNav);
    });
}

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        closeNav();
    }
});
    /* ── 6. Counter Animation ──────────────────────────────── */
    const counters = document.querySelectorAll('.stat-number[data-target]');

    if (counters.length) {
        const counterObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;

                const el     = entry.target;
                const target = parseInt(el.getAttribute('data-target'), 10);
                const dur    = 2000;
                const start  = performance.now();
                const inner  = el.querySelector('span') || el;

                function tick(now) {
                    const elapsed  = now - start;
                    const progress = Math.min(elapsed / dur, 1);
                    const eased    = 1 - Math.pow(1 - progress, 3);
                    inner.textContent = Math.round(eased * target).toLocaleString();
                    if (progress < 1) {
                        requestAnimationFrame(tick);
                    } else {
                        inner.textContent = target.toLocaleString();
                    }
                }
                requestAnimationFrame(tick);
                counterObserver.unobserve(el);
            });
        }, { threshold: 0.5 });

        counters.forEach(c => counterObserver.observe(c));
    }


    /* ── 7. Three.js Hero Scene (desktop only) ─────────────── */
    const canvasContainer = document.getElementById('heroCanvas');
    // Skip 3D scene on mobile/low-power devices to save battery & performance
    const isMobile = window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent);

    if (canvasContainer && typeof THREE !== 'undefined' && !isMobile && !isLowPower) {

        const scene  = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
        camera.position.set(0, 0, 6);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        canvasContainer.appendChild(renderer.domElement);
        renderer.domElement.style.mixBlendMode = 'screen';

        scene.add(new THREE.AmbientLight(0xffffff, 0.3));

        const blueLight = new THREE.PointLight(0x00d4ff, 4, 20);
        blueLight.position.set(-4, 2, 4);
        scene.add(blueLight);

        const goldLight = new THREE.PointLight(0xc8a97e, 3, 20);
        goldLight.position.set(4, -1, 3);
        scene.add(goldLight);

        scene.add(new THREE.DirectionalLight(0xffffff, 0.8)).position.set(0, 8, 0);

        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(1.4, 64, 64),
            new THREE.MeshStandardMaterial({
                color: 0x003344, metalness: 1.0, roughness: 0.05,
                emissive: 0x001122, emissiveIntensity: 0.3,
            })
        );
        scene.add(sphere);

        const ring1 = new THREE.Mesh(
            new THREE.TorusGeometry(2.0, 0.015, 8, 80),
            new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.4 })
        );
        ring1.rotation.x = Math.PI / 2;
        scene.add(ring1);

        const ring2 = new THREE.Mesh(
            new THREE.TorusGeometry(2.6, 0.008, 8, 80),
            new THREE.MeshBasicMaterial({ color: 0xc8a97e, transparent: true, opacity: 0.25 })
        );
        ring2.rotation.x = Math.PI / 3;
        ring2.rotation.z = Math.PI / 6;
        scene.add(ring2);

        const PARTICLE_COUNT = 800;
        const positions = new Float32Array(PARTICLE_COUNT * 3);
        const colors    = new Float32Array(PARTICLE_COUNT * 3);

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const r     = 3.5 + Math.random() * 7;
            const theta = Math.random() * Math.PI * 2;
            const phi   = Math.acos(2 * Math.random() - 1);
            positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);
            const isCyan = Math.random() > 0.35;
            colors[i * 3]     = isCyan ? 0.0  : 0.78;
            colors[i * 3 + 1] = isCyan ? 0.83 : 0.66;
            colors[i * 3 + 2] = isCyan ? 1.0  : 0.49;
        }

        const partGeo = new THREE.BufferGeometry();
        partGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        partGeo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

        const particles = new THREE.Points(partGeo, new THREE.PointsMaterial({
            size: 0.08, vertexColors: true, transparent: true, opacity: 0.9, sizeAttenuation: true,
        }));
        scene.add(particles);

        const gridHelper = new THREE.GridHelper(20, 20, 0x00d4ff, 0x0a1a20);
        gridHelper.position.y = -2.2;
        gridHelper.material.transparent = true;
        gridHelper.material.opacity = 0.2;
        scene.add(gridHelper);

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }, { passive: true });

        let mx = 0, my = 0;
        window.addEventListener('mousemove', e => {
            mx = (e.clientX / window.innerWidth  - 0.5);
            my = (e.clientY / window.innerHeight - 0.5);
        }, { passive: true });

        const clock = new THREE.Clock();
        function animate() {
            requestAnimationFrame(animate);
            const t = clock.getElapsedTime();

            sphere.scale.setScalar(1 + Math.sin(t * 1.2) * 0.015);
            ring1.rotation.z = t * 0.15;
            ring2.rotation.y = t * 0.10;
            particles.rotation.y = t * 0.04;
            particles.rotation.x = t * 0.02;
            blueLight.intensity = 3 + Math.sin(t * 0.8) * 1;
            goldLight.intensity = 2.5 + Math.cos(t * 0.6) * 1;
            camera.position.x += (mx * 0.8 - camera.position.x) * 0.04;
            camera.position.y += (-my * 0.4 - camera.position.y) * 0.04;
            camera.lookAt(0, 0, 0);

            renderer.render(scene, camera);
        }
        animate();

    } else if (canvasContainer) {
        // On mobile: hide the 3D canvas container entirely
        canvasContainer.style.display = 'none';
    }


    /* ── 8. Custom Cursor — desktop ONLY ───────────────────── */
    // Only add cursor on true pointer devices (not touch screens)
    const hasFinePonter = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (hasFinePonter && !isMobile) {
        document.documentElement.classList.add('has-cursor');

        const dot  = document.createElement('div');
        const ring = document.createElement('div');
        dot.className  = 'cursor-dot';
        ring.className = 'cursor-ring';
        document.body.append(dot, ring);

        let dotX = 0, dotY = 0, ringX = 0, ringY = 0;
        let tx = 0, ty = 0;
        let cursorVisible = false;

        window.addEventListener('mousemove', e => {
            tx = e.clientX; ty = e.clientY;
            if (!cursorVisible) {
                cursorVisible = true;
                dot.style.opacity  = '1';
                ring.style.opacity = '1';
            }
        }, { passive: true });

        function tickCursor() {
            dotX  += (tx - dotX)  * 0.9;
            dotY  += (ty - dotY)  * 0.9;
            ringX += (tx - ringX) * 0.18;
            ringY += (ty - ringY) * 0.18;
            dot.style.transform  = `translate(${dotX}px, ${dotY}px) translate(-50%,-50%)`;
            ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%,-50%)`;
            requestAnimationFrame(tickCursor);
        }
        tickCursor();

        document.addEventListener('mousedown', () => ring.classList.add('is-down'));
        document.addEventListener('mouseup',   () => ring.classList.remove('is-down'));

        document.querySelectorAll('a, button, .pricing-card, .service-card').forEach(el => {
            el.addEventListener('mouseenter', () => ring.classList.add('is-active'));
            el.addEventListener('mouseleave', () => ring.classList.remove('is-active'));
        });
    }


    /* ── 9. Touch Ripple Effect (mobile replacement for cursor) */
    // Adds a subtle tap ripple on mobile as a replacement for cursor feedback
    if (isMobile || !hasFinePonter) {
        const rippleStyle = document.createElement('style');
        rippleStyle.textContent = `
            .tap-ripple {
                position: fixed;
                border-radius: 50%;
                width: 40px; height: 40px;
                background: rgba(0, 212, 255, 0.25);
                border: 1px solid rgba(0, 212, 255, 0.5);
                pointer-events: none;
                z-index: 9999;
                transform: translate(-50%, -50%) scale(0);
                animation: tapRipple 0.5s ease forwards;
            }
            @keyframes tapRipple {
                0%   { transform: translate(-50%, -50%) scale(0); opacity: 1; }
                100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
            }
        `;
        document.head.appendChild(rippleStyle);

        document.addEventListener('touchstart', e => {
            const touch = e.touches[0];
            const ripple = document.createElement('div');
            ripple.className = 'tap-ripple';
            ripple.style.left = touch.clientX + 'px';
            ripple.style.top  = touch.clientY + 'px';
            document.body.appendChild(ripple);
            setTimeout(() => ripple.remove(), 500);
        }, { passive: true });
    }


    /* ── 10. Parallax Background Layers ────────────────────── */
    // Skip parallax on mobile for performance
    if (!isMobile) {
        const parallaxLayers = document.querySelectorAll('.parallax-layer, .marque-band__layer');

        if (parallaxLayers.length) {
            if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
                gsap.registerPlugin(ScrollTrigger);
                parallaxLayers.forEach(layer => {
                    const speed = parseFloat(layer.dataset.speed || 0.25);
                    gsap.to(layer, {
                        yPercent: speed * 100,
                        ease: 'none',
                        scrollTrigger: {
                            trigger: layer.closest('.has-parallax, .marque-band'),
                            start: 'top bottom',
                            end: 'bottom top',
                            scrub: true
                        }
                    });
                });
            } else {
                let raf = null;
                function updateParallax() {
                    const vh = window.innerHeight;
                    parallaxLayers.forEach(layer => {
                        const speed = parseFloat(layer.dataset.speed || 0.25);
                        const parent = layer.closest('.has-parallax, .marque-band');
                        if (!parent) return;
                        const rect = parent.getBoundingClientRect();
                        const progress = (vh - rect.top) / (vh + rect.height);
                        layer.style.transform = `translateY(${(progress - 0.5) * speed * 200}px)`;
                    });
                    raf = null;
                }
                window.addEventListener('scroll', () => {
                    if (!raf) raf = requestAnimationFrame(updateParallax);
                }, { passive: true });
                updateParallax();
            }
        }
    }

}); // DOMContentLoaded
