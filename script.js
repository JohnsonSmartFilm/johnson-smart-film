/* ============================================================
   JOHNSON SMART FILM — Main JavaScript (Bug-Free)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    /* ── 1. Loading Screen ─────────────────────────────────── */
    const loader = document.getElementById('loader');

    // Add particle burst to loader
    const loaderParticles = document.getElementById('loaderParticles');
    if (loaderParticles) {
        for (let i = 0; i < 30; i++) {
            const p = document.createElement('div');
            const angle = Math.random() * 360;
            const dist = 60 + Math.random() * 200;
            const size = 1 + Math.random() * 2;
            p.style.cssText = `
                position:absolute;
                width:${size}px;height:${size}px;
                background:${Math.random() > 0.5 ? '#00d4ff' : '#c8a97e'};
                border-radius:50%;
                left:50%;top:50%;
                opacity:0;
                transform:translate(-50%,-50%);
                animation: particleBurst ${0.8 + Math.random() * 0.6}s ease ${0.3 + Math.random()*0.5}s both;
                --angle:${angle}deg;--dist:${dist}px;
            `;
            loaderParticles.appendChild(p);
        }
        const style = document.createElement('style');
        style.textContent = `@keyframes particleBurst {
            0% { opacity:0; transform:translate(-50%,-50%) rotate(var(--angle)) translateX(0); }
            30% { opacity:1; }
            100% { opacity:0; transform:translate(-50%,-50%) rotate(var(--angle)) translateX(var(--dist)); }
        }`;
        document.head.appendChild(style);
    }

    window.addEventListener('load', () => {
        setTimeout(() => {
            if (loader) {
                // Epic exit: flash then fade
                loader.style.transition = 'opacity 0.15s ease';
                loader.style.opacity = '1.5';
                setTimeout(() => {
                    loader.style.transition = 'opacity 0.7s cubic-bezier(0.76, 0, 0.24, 1), visibility 0.7s';
                    loader.classList.add('hidden');
                }, 100);
            }
        }, 1400);
    });

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
    const nav     = document.getElementById('mobileNav');

    if (menuBtn && nav) {
        menuBtn.addEventListener('click', () => {
            const isOpen = nav.classList.toggle('open');
            menuBtn.classList.toggle('active', isOpen);
            document.body.style.overflow = isOpen ? 'hidden' : '';
        });

        nav.querySelectorAll('.mobile-nav-link').forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('open');
                menuBtn.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }

    /* ── 4. Active Nav Link on Scroll ─────────────────────── */
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.header__nav-link');

    const sectionObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    link.classList.toggle('active',
                        link.getAttribute('href') === '#' + id);
                });
            }
        });
    }, { threshold: 0.35 });

    sections.forEach(s => sectionObserver.observe(s));

    /* ── 5. Scroll Reveal ──────────────────────────────────── */
    const revealEls = document.querySelectorAll('.reveal');

    const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            // Stagger siblings
            const siblings = Array.from(
                entry.target.parentElement.querySelectorAll('.reveal')
            );
            const delay = siblings.indexOf(entry.target) * 100;

            setTimeout(() => {
                entry.target.classList.add('in');
            }, delay);

            revealObserver.unobserve(entry.target);
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(el => revealObserver.observe(el));

    /* ── 6. Counter Animation ──────────────────────────────── */
    const counters = document.querySelectorAll('.stat-number[data-target]');

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

    /* ── 7. Booking Form Multi-Step ────────────────────────── */
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        let currentStep = 1;
        const steps         = bookingForm.querySelectorAll('.booking-step');
        const progressSteps = document.querySelectorAll('.booking-progress__step');

        function showStep(step) {
            steps.forEach(s => s.classList.remove('active'));
            const target = bookingForm.querySelector(`.booking-step[data-step="${step}"]`);
            if (target) target.classList.add('active');

            progressSteps.forEach(ps => {
                const n = parseInt(ps.getAttribute('data-step'), 10);
                ps.classList.remove('active', 'completed');
                if (n === step) ps.classList.add('active');
                if (n < step)  ps.classList.add('done');
            });
            currentStep = step;

            // Scroll form into view
            bookingForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        // Next buttons
        bookingForm.querySelectorAll('.btn-next').forEach(btn => {
            btn.addEventListener('click', () => {
                const nextStep    = parseInt(btn.getAttribute('data-next'), 10);
                const currentEl   = bookingForm.querySelector(`.booking-step[data-step="${currentStep}"]`);
                let valid = true;

                // Validate step 1: radio required
                if (currentStep === 1) {
                    const checked = currentEl.querySelector('input[name="service"]:checked');
                    if (!checked) {
                        valid = false;
                        currentEl.querySelectorAll('.service-opt__card').forEach(c => {
                            c.style.animation = 'none';
                            c.style.borderColor = '#f87171';
                            setTimeout(() => { c.style.borderColor = ''; }, 2000);
                        });
                    }
                }

                // Validate step 3: required fields
                if (currentStep === 3) {
                    currentEl.querySelectorAll('[required]').forEach(field => {
                        if (!field.value.trim()) {
                            valid = false;
                            field.classList.add('err');
                            setTimeout(() => field.classList.remove('err'), 2000);
                        }
                    });
                }

                if (valid) showStep(nextStep);
            });
        });

        // Prev buttons
        bookingForm.querySelectorAll('.btn-prev').forEach(btn => {
            btn.addEventListener('click', () => {
                const prevStep = parseInt(btn.getAttribute('data-prev'), 10);
                showStep(prevStep);
            });
        });

        // Submit
        bookingForm.addEventListener('submit', e => {
            e.preventDefault();

            // Validate step 3 before submit
            const step3 = bookingForm.querySelector('.booking-step[data-step="3"]');
            let valid = true;
            step3.querySelectorAll('[required]').forEach(field => {
                if (!field.value.trim()) {
                    valid = false;
                    field.classList.add('err');
                    setTimeout(() => field.classList.remove('err'), 2000);
                }
            });
            if (!valid) return;

            steps.forEach(s => s.classList.remove('active'));
            progressSteps.forEach(ps => ps.classList.add('done'));
            const successEl = document.getElementById('bookingSuccess');
            if (successEl) successEl.style.display = 'block';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        // Min date = today
        const dateInput = document.getElementById('date');
        if (dateInput) {
            dateInput.setAttribute('min', new Date().toISOString().split('T')[0]);
        }
    }

    /* ── 8. Three.js Hero Scene ────────────────────────────── */
    const canvasContainer = document.getElementById('heroCanvas');

    if (canvasContainer && typeof THREE !== 'undefined') {

        /* ── Scene & Camera ── */
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            60, window.innerWidth / window.innerHeight, 0.1, 200
        );
        camera.position.set(0, 0, 6);

        /* ── Renderer ── */
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.8;
        renderer.setClearColor(0x000000, 0); // Fully transparent BG
        canvasContainer.appendChild(renderer.domElement);
        // Allow video to show through
        renderer.domElement.style.mixBlendMode = 'screen';

        /* ── Lights ── */
        scene.add(new THREE.AmbientLight(0xffffff, 0.3));

        const blueLight = new THREE.PointLight(0x00d4ff, 4, 20);
        blueLight.position.set(-4, 2, 4);
        scene.add(blueLight);

        const goldLight = new THREE.PointLight(0xc8a97e, 3, 20);
        goldLight.position.set(4, -1, 3);
        scene.add(goldLight);

        const topLight = new THREE.DirectionalLight(0xffffff, 0.8);
        topLight.position.set(0, 8, 0);
        scene.add(topLight);

        /* ── Central Shiny Sphere (PPF Film Effect) ── */
        const sphereGeo = new THREE.SphereGeometry(1.4, 64, 64);
        const sphereMat = new THREE.MeshStandardMaterial({
            color: 0x003344,
            metalness: 1.0,
            roughness: 0.05,
            envMapIntensity: 2.0,
            emissive: 0x001122,
            emissiveIntensity: 0.3,
        });
        const sphere = new THREE.Mesh(sphereGeo, sphereMat);
        scene.add(sphere);

        /* ── Wireframe Ring (car rim aesthetic) ── */
        const ringGeo = new THREE.TorusGeometry(2.0, 0.015, 8, 80);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.4 });
        const ring1 = new THREE.Mesh(ringGeo, ringMat);
        ring1.rotation.x = Math.PI / 2;
        scene.add(ring1);

        const ring2 = new THREE.Mesh(
            new THREE.TorusGeometry(2.6, 0.008, 8, 80),
            new THREE.MeshBasicMaterial({ color: 0xc8a97e, transparent: true, opacity: 0.25 })
        );
        ring2.rotation.x = Math.PI / 3;
        ring2.rotation.z = Math.PI / 6;
        scene.add(ring2);

        /* ── Floating Particles ── */
        const PARTICLE_COUNT = 1200;
        const positions = new Float32Array(PARTICLE_COUNT * 3);
        const colors    = new Float32Array(PARTICLE_COUNT * 3);
        const sizes     = new Float32Array(PARTICLE_COUNT);

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            // Spread in a sphere shell
            const r     = 3.5 + Math.random() * 7;
            const theta = Math.random() * Math.PI * 2;
            const phi   = Math.acos(2 * Math.random() - 1);
            positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);

            // Blue or gold tint
            const isCyan = Math.random() > 0.35;
            colors[i * 3]     = isCyan ? 0.0  : 0.78;
            colors[i * 3 + 1] = isCyan ? 0.83 : 0.66;
            colors[i * 3 + 2] = isCyan ? 1.0  : 0.49;

            sizes[i] = 0.5 + Math.random() * 1.5;
        }

        const partGeo = new THREE.BufferGeometry();
        partGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        partGeo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
        partGeo.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));

        const partMat = new THREE.PointsMaterial({
            size: 0.08,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            sizeAttenuation: true,
        });
        const particles = new THREE.Points(partGeo, partMat);
        scene.add(particles);

        /* ── Small orbiting detail spheres ── */
        const orbiters = [];
        const orbitData = [
            { r: 2.2, speed: 0.4,  angle: 0,           y: 0.3,  size: 0.12, color: 0x00d4ff },
            { r: 2.8, speed: -0.25,angle: Math.PI,      y: -0.5, size: 0.08, color: 0xc8a97e },
            { r: 2.5, speed: 0.6,  angle: Math.PI/2,   y: 0.6,  size: 0.09, color: 0x00d4ff },
            { r: 3.0, speed: -0.35,angle: Math.PI*1.5, y: -0.2, size: 0.07, color: 0xffffff },
        ];
        orbitData.forEach(d => {
            const m = new THREE.Mesh(
                new THREE.SphereGeometry(d.size, 16, 16),
                new THREE.MeshStandardMaterial({
                    color: d.color,
                    metalness: 1, roughness: 0.1,
                    emissive: d.color, emissiveIntensity: 0.5
                })
            );
            scene.add(m);
            orbiters.push({ mesh: m, ...d });
        });

        /* ── Thin horizontal grid plane ── */
        const gridHelper = new THREE.GridHelper(20, 20, 0x00d4ff, 0x0a1a20);
        gridHelper.position.y = -2.2;
        gridHelper.material.transparent = true;
        gridHelper.material.opacity = 0.2;
        scene.add(gridHelper);

        /* ── NOTE: the bundled scene.gltf (Sketchfab "2023 Chevrolet Traverse RS")
           is licensed CC-BY-NC-SA-4.0 — non-commercial only — so it can't be used
           on this business site, and its texture files weren't included anyway
           (only scene.bin was uploaded). Loading is disabled; the abstract
           sphere/ring/particle scene above is the permanent hero visual. ── */
        let modelGroup = null;

        /* ── Resize ── */
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }, { passive: true });

        /* ── Mouse parallax ── */
        let mx = 0, my = 0;
        window.addEventListener('mousemove', e => {
            mx = (e.clientX / window.innerWidth  - 0.5);
            my = (e.clientY / window.innerHeight - 0.5);
        }, { passive: true });

        /* ── Animation Loop ── */
        const clock = new THREE.Clock();
        function animate() {
            requestAnimationFrame(animate);
            const t = clock.getElapsedTime();

            // Sphere pulse
            const pulse = 1 + Math.sin(t * 1.2) * 0.015;
            sphere.scale.setScalar(pulse);

            // Rings rotation
            ring1.rotation.z = t * 0.15;
            ring2.rotation.y = t * 0.10;

            // Particle drift
            particles.rotation.y = t * 0.04;
            particles.rotation.x = t * 0.02;

            // Orbiting spheres
            orbiters.forEach((o, i) => {
                const a = o.angle + t * o.speed;
                o.mesh.position.set(
                    Math.cos(a) * o.r,
                    o.y + Math.sin(t * 0.7 + i) * 0.15,
                    Math.sin(a) * o.r
                );
            });

            // Lights color animation
            blueLight.intensity = 3 + Math.sin(t * 0.8) * 1;
            goldLight.intensity = 2.5 + Math.cos(t * 0.6) * 1;

            // Model gentle sway (if loaded)
            if (modelGroup) {
                modelGroup.position.y = -0.8 + Math.sin(t * 0.5) * 0.06;
            }

            // Camera micro-parallax
            camera.position.x += (mx * 0.8 - camera.position.x) * 0.04;
            camera.position.y += (-my * 0.4 - camera.position.y) * 0.04;
            camera.lookAt(0, 0, 0);

            renderer.render(scene, camera);
        }
        animate();
    }

    /* ── 9. Custom Cursor (desktop, fine pointer only) ──────── */
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        document.documentElement.classList.add('has-cursor');

        const dot  = document.createElement('div');
        const ring = document.createElement('div');
        dot.className  = 'cursor-dot';
        ring.className = 'cursor-ring';
        document.body.append(dot, ring);

        let dotX = 0, dotY = 0, ringX = 0, ringY = 0;
        let tx = 0, ty = 0;

        window.addEventListener('mousemove', e => {
            tx = e.clientX; ty = e.clientY;
            dot.style.opacity = '1';
            ring.style.opacity = '1';
        }, { passive: true });

        function tickCursor() {
            // Dot follows instantly, ring eases behind for a trailing feel
            dotX += (tx - dotX) * 0.9;
            dotY += (ty - dotY) * 0.9;
            ringX += (tx - ringX) * 0.18;
            ringY += (ty - ringY) * 0.18;
            dot.style.transform  = `translate(${dotX}px, ${dotY}px) translate(-50%,-50%)`;
            ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%,-50%)`;
            requestAnimationFrame(tickCursor);
        }
        tickCursor();

        document.addEventListener('mousedown', () => ring.classList.add('is-down'));
        document.addEventListener('mouseup',   () => ring.classList.remove('is-down'));

        const magneticTargets = 'a, button, .pricing-card, .service-card, .gallery-item';
        document.querySelectorAll(magneticTargets).forEach(el => {
            el.addEventListener('mouseenter', () => ring.classList.add('is-active'));
            el.addEventListener('mouseleave', () => ring.classList.remove('is-active'));
        });
    }

    /* ── 10. Parallax Background Layers (Scrolling + Tiling) ── */
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
            // Fallback: manual rAF-driven parallax if GSAP failed to load
            let raf = null;
            function updateParallax() {
                const vh = window.innerHeight;
                parallaxLayers.forEach(layer => {
                    const speed = parseFloat(layer.dataset.speed || 0.25);
                    const rect = layer.closest('.has-parallax, .marque-band').getBoundingClientRect();
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

}); // DOMContentLoaded