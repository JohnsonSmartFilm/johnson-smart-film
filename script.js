/* ============================================================
JOHNSON SMART FILM — Main JavaScript v4.0
Zero-Bug Edition
============================================================ */
document.addEventListener('DOMContentLoaded', () => {
// Global Device Detection
const isMobile = window.innerWidth < 768 || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const isLowPower = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ═══════════════════════════════════════════════════════════
   1. LOADING SCREEN
═══════════════════════════════════════════════════════════ */
const loader = document.getElementById('loader');
const loaderParticles = document.getElementById('loaderParticles');

// Loader particles (desktop only) 
if (loaderParticles && !isLowPower && !isMobile) {
    try {
        for (let i = 0; i < 20; i++) {
            const p = document.createElement('div');
            const angle = Math.random() * 360;
            const dist = 60 + Math.random() * 150;
            const size = 1 + Math.random() * 2;
            p.style.cssText = `
                position:absolute;
                width:${size}px;height:${size}px;
                background:${Math.random() > 0.5 ? '#00d4ff' : '#c8a97e'};
                border-radius:50%;
                left:50%;top:50%;
                opacity:0;
                transform:translate(-50%,-50%);
                animation:particleBurst ${(0.8 + Math.random() * 0.6).toFixed(2)}s ease ${(0.3 + Math.random() * 0.5).toFixed(2)}s both;
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
    } catch (err) {
        console.warn('Loader particles error:', err);
    }
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

// Failsafe
setTimeout(hideLoader, 5000);

/* ═══════════════════════════════════════════════════════════
   2. STICKY HEADER
═══════════════════════════════════════════════════════════ */
const header = document.getElementById('header');

function handleHeaderScroll() {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 60);
}
window.addEventListener('scroll', handleHeaderScroll, { passive: true });
handleHeaderScroll();

/* ══════════════════════════════════════════════════════════
   3. MOBILE MENU
═══════════════════════════════════════════════════════════ */
const menuBtn = document.getElementById('menuBtn');
const mobileNav = document.getElementById('mobileNav');
const mobileNavClose = document.getElementById('mobileNavClose');

function openNav() {
    if (!mobileNav) return;
    mobileNav.classList.add('open');
    if (menuBtn) menuBtn.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeNav() {
    if (!mobileNav) return;
    mobileNav.classList.remove('open');
    if (menuBtn) menuBtn.classList.remove('active');
    document.body.style.overflow = '';
}

if (menuBtn) menuBtn.addEventListener('click', openNav);
if (mobileNavClose) mobileNavClose.addEventListener('click', closeNav);
if (mobileNav) {
    mobileNav.querySelectorAll('[data-close], .mobile-nav-link').forEach(link => {
        link.addEventListener('click', closeNav);
    });
}
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeNav();
});

/* ═══════════════════════════════════════════════════════════
   4. ACTIVE NAV LINK ON SCROLL
═══════════════════════════════════════════════════════════ */
const navLinks = document.querySelectorAll('.header__nav-link');
const sections = document.querySelectorAll('section[id]');

if (navLinks.length && sections.length) {
    function updateActiveNav() {
        const scrollPos = window.scrollY + 120;
        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');
            if (scrollPos >= top && scrollPos < top + height) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }
    window.addEventListener('scroll', updateActiveNav, { passive: true });
    updateActiveNav();
}

/* ═══════════════════════════════════════════════════════════
   5. SCROLL REVEAL
═══════════════════════════════════════════════════════════ */
const revealEls = document.querySelectorAll('.reveal');

if (revealEls.length && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            const siblings = Array.from(
                entry.target.parentElement.querySelectorAll('.reveal')
            );
            const delay = Math.min(siblings.indexOf(entry.target) * 80, 400);

            setTimeout(() => {
                entry.target.classList.add('in');
            }, delay);

            observer.unobserve(entry.target);
        });
    }, {
        threshold: 0.08,
        rootMargin: '0px 0px -30px 0px'
    });

    revealEls.forEach(el => revealObserver.observe(el));
} else {
    revealEls.forEach(el => el.classList.add('in'));
}

/* ═══════════════════════════════════════════════════════════
   6. COUNTER ANIMATION
═══════════════════════════════════════════════════════════ */
const counters = document.querySelectorAll('.stat-number[data-target]');

if (counters.length && 'IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            const el = entry.target;
            const target = parseInt(el.getAttribute('data-target'), 10);
            const dur = 2000;
            const start = performance.now();
            const inner = el.querySelector('span') || el;

            function tick(now) {
                const elapsed = now - start;
                const progress = Math.min(elapsed / dur, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                inner.textContent = Math.round(eased * target).toLocaleString();
                if (progress < 1) {
                    requestAnimationFrame(tick);
                } else {
                    inner.textContent = target.toLocaleString();
                }
            }
            requestAnimationFrame(tick);
            observer.unobserve(el);
        });
    }, { threshold: 0.5 });

    counters.forEach(c => counterObserver.observe(c));
}

/* ═══════════════════════════════════════════════════════════
   7. THREE.JS HERO SCENE (desktop only)
═══════════════════════════════════════════════════════════ */
const canvasContainer = document.getElementById('heroCanvas');

if (canvasContainer && typeof THREE !== 'undefined' && !isMobile && !isLowPower) {
    try {
        const scene = new THREE.Scene();
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

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(0, 8, 0);
        scene.add(dirLight);

        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(1.4, 64, 64),
            new THREE.MeshStandardMaterial({
                color: 0x003344,
                metalness: 1.0,
                roughness: 0.05,
                emissive: 0x001122,
                emissiveIntensity: 0.3,
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
        const colors = new Float32Array(PARTICLE_COUNT * 3);

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const r = 3.5 + Math.random() * 7;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
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
        partGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particles = new THREE.Points(partGeo, new THREE.PointsMaterial({
            size: 0.08,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            sizeAttenuation: true,
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
            mx = (e.clientX / window.innerWidth - 0.5);
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

    } catch (err) {
        console.warn('Three.js scene error:', err);
        if (canvasContainer) canvasContainer.style.display = 'none';
    }

} else if (canvasContainer) {
    canvasContainer.style.display = 'none';
}

/* ═══════════════════════════════════════════════════════════
   8. CUSTOM CURSOR — desktop ONLY
═══════════════════════════════════════════════════════════ */
if (hasFinePointer && !isMobile) {
    document.documentElement.classList.add('has-cursor');

    const dot = document.createElement('div');
    const ring = document.createElement('div');
    dot.className = 'cursor-dot';
    ring.className = 'cursor-ring';
    document.body.append(dot, ring);

    let dotX = 0, dotY = 0, ringX = 0, ringY = 0;
    let tx = 0, ty = 0;
    let cursorVisible = false;

    window.addEventListener('mousemove', e => {
        tx = e.clientX;
        ty = e.clientY;
        if (!cursorVisible) {
            cursorVisible = true;
            dot.style.opacity = '1';
            ring.style.opacity = '1';
        }
    }, { passive: true });

    function tickCursor() {
        dotX += (tx - dotX) * 0.9;
        dotY += (ty - dotY) * 0.9;
        ringX += (tx - ringX) * 0.18;
        ringY += (ty - ringY) * 0.18;
        dot.style.transform = `translate(${dotX}px, ${dotY}px) translate(-50%,-50%)`;
        ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%,-50%)`;
        requestAnimationFrame(tickCursor);
    }
    tickCursor();

    document.addEventListener('mousedown', () => ring.classList.add('is-down'));
    document.addEventListener('mouseup', () => ring.classList.remove('is-down'));

    document.querySelectorAll('a, button, .pricing-card, .service-card').forEach(el => {
        el.addEventListener('mouseenter', () => ring.classList.add('is-active'));
        el.addEventListener('mouseleave', () => ring.classList.remove('is-active'));
    });
}

/* ═══════════════════════════════════════════════════════════
   9. TOUCH RIPPLE EFFECT (mobile)
═══════════════════════════════════════════════════════════ */
if (isMobile || !hasFinePointer) {
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
        if (!touch) return;
        const ripple = document.createElement('div');
        ripple.className = 'tap-ripple';
        ripple.style.left = touch.clientX + 'px';
        ripple.style.top = touch.clientY + 'px';
        document.body.appendChild(ripple);
        setTimeout(() => ripple.remove(), 500);
    }, { passive: true });
}

/* ═══════════════════════════════════════════════════════════
   10. PARALLAX BACKGROUND
═══════════════════════════════════════════════════════════ */
if (!isMobile) {
    const parallaxLayers = document.querySelectorAll('.parallax-layer, .marque-band__layer');

    if (parallaxLayers.length) {
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            try {
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
            } catch (err) {
                console.warn('GSAP parallax error:', err);
            }
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

/* ═══════════════════════════════════════════════════════════
   11. SMOOTH SCROLL FOR ANCHOR LINKS
═══════════════════════════════════════════════════════════ */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (!href || href === '#' || href.length < 2) return;
        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            const offset = 80;
            const targetPos = target.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({
                top: targetPos,
                behavior: 'smooth'
            });
        }
    });
});

/* ═══════════════════════════════════════════════════════════
   12. HERO TICKER — duplicate for infinite scroll
═══════════════════════════════════════════════════════════ */
const tickerTrack = document.querySelector('.hero__ticker-track');
if (tickerTrack && tickerTrack.children.length > 0) {
    const clone = tickerTrack.cloneNode(true);
    tickerTrack.appendChild(clone);
}

/* ═══════════════════════════════════════════════════════════
   13. GLOBAL BACKGROUND PATTERN PARALLAX
═══════════════════════════════════════════════════════════ */
const bgPattern = document.querySelector('.global-bg-pattern');
if (bgPattern && !isMobile) {
    bgPattern.classList.add('parallax-active');
    
    let bgRaf = null;
    
    function updateBgPattern() {
        const scrollY = window.scrollY;
        const heroHeight = document.querySelector('.hero')?.offsetHeight || 800;
        
        if (scrollY > heroHeight * 0.5) {
            const progress = (scrollY - heroHeight * 0.5) / (document.body.scrollHeight - heroHeight);
            const moveY = progress * 100;
            
            bgPattern.style.transform = `translateY(${moveY}px)`;
        }
        
        bgRaf = null;
    }
    
    window.addEventListener('scroll', () => {
        if (!bgRaf) {
            bgRaf = requestAnimationFrame(updateBgPattern);
        }
    }, { passive: true });
}

/* ═══════════════════════════════════════════════════════════
   14. LOGIN PAGE FUNCTIONALITY
═══════════════════════════════════════════════════════════ */
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    const roleBtns = document.querySelectorAll('.auth-role-btn');
    const staffWarning = document.getElementById('staffWarning');
    const authTitle = document.getElementById('authTitle');
    const authSubtitle = document.getElementById('authSubtitle');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const loginError = document.getElementById('loginError');
    const emailInput = document.getElementById('email');
    const loginBtn = document.getElementById('loginBtn');
    const backToHome = document.getElementById('backToHome');

    let currentRole = 'customer';

    // Role Toggle
    roleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            roleBtns.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');
            
            currentRole = btn.dataset.role;
            loginForm.setAttribute('data-role', currentRole);
            
            if (currentRole === 'staff') {
                staffWarning.style.display = 'flex';
                authTitle.textContent = 'Staff Login';
                authSubtitle.textContent = 'Access the admin dashboard';
            } else {
                staffWarning.style.display = 'none';
                authTitle.textContent = 'Welcome Back';
                authSubtitle.textContent = 'Sign in to access your account';
            }
        });
    });

    // Password Toggle
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            togglePassword.querySelector('i').className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
        });
    }

    // Show Loader Function
    function showLoader() {
        if (!loader) return;
        
        loader.classList.remove('hidden');
        loader.style.opacity = '1';
        loader.style.visibility = 'visible';
        loader.style.pointerEvents = 'all';
        
        const barFill = loader.querySelector('.loader__bar-fill');
        if (barFill) {
            barFill.style.animation = 'none';
            barFill.offsetHeight;
            barFill.style.animation = 'barFill 1.3s var(--ease-out) 0.3s both';
        }
        
        document.body.style.overflow = 'hidden';
    }

    // Form Submit
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        document.querySelectorAll('.form-group').forEach(g => g.classList.remove('invalid'));
        loginError.style.display = 'none';
        
        let isValid = true;
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailInput.value || !emailRegex.test(emailInput.value)) {
            emailInput.closest('.form-group').classList.add('invalid');
            isValid = false;
        }
        
        if (!passwordInput.value || passwordInput.value.length < 6) {
            passwordInput.closest('.form-group').classList.add('invalid');
            isValid = false;
        }
        
        if (!isValid) return;
        
        // Show loader before login
        showLoader();
        
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Logging in...</span>';
        
        setTimeout(() => {
            loginError.style.display = 'flex';
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> <span>Login</span>';
            
            setTimeout(() => {
                hideLoader();
            }, 1500);
        }, 2000);
    });

    // Remove invalid state
    [emailInput, passwordInput].forEach(input => {
        input.addEventListener('input', () => {
            input.closest('.form-group').classList.remove('invalid');
            loginError.style.display = 'none';
        });
    });

    // Back to home with loader
    if (backToHome) {
        backToHome.addEventListener('click', (e) => {
            e.preventDefault();
            showLoader();
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 700);
        });
    }

    // Forgot password
    document.getElementById('forgotLink')?.addEventListener('click', (e) => {
        e.preventDefault();
        alert('Password reset link will be sent to your email.');
    });

    // Register link
    document.getElementById('registerLink')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'https://wa.me/201114171416?text=Hello, I would like to register an account.';
    });
}

/* ═══════════════════════════════════════════════════════════
   15. CONSOLE BRANDING
═══════════════════════════════════════════════════════════ */
console.log(
    '%c JOHNSON SMART FILM %c Premium Protection Solutions ',
    'background:#00d4ff;color:#000;padding:6px 12px;font-weight:bold;border-radius:4px 0 0 4px;',
    'background:#0c0c10;color:#c8a97e;padding:6px 12px;border-radius:0 4px 4px 0;'
);
}); // end DOMContentLoaded
