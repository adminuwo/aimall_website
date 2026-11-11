// AI-MALL™ — Universal Cinematic Engine
// Smooth Scroll + Universal Reveal System

document.addEventListener('DOMContentLoaded', () => {
    // ── Neural Gateway Configuration (Smart Domain Detection) ──
    const host = window.location.hostname;
    const isLive = host === 'ai-mall.in' || host.includes('run.app');

    // API Base URL (empty string means same-origin relative URLs for LIVE production)
    window.API_BASE_URL = import.meta.env.VITE_API_BASE_URL || window.API_BASE_URL || '';

    // ── Global Interface Controls ──
    // (Consolidated in gateway.js for cinematic performance)

    // ═══════════════════════════════════════════
    // 1. LENIS SMOOTH SCROLL
    // ═══════════════════════════════════════════
    const lenis = new Lenis({
        duration: 1.6,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        smoothTouch: false,
        wheelMultiplier: 1,
        touchMultiplier: 2,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Link GSAP ScrollTrigger with Lenis
    gsap.registerPlugin(ScrollTrigger);
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);


    // ═══════════════════════════════════════════
    // NAVIGATION MOBILE TOGGLE (Global)
    // ═══════════════════════════════════════════
    const mobileToggle = document.getElementById('mobile-toggle');
    const navMenu = document.getElementById('nav-menu');

    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            mobileToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
            document.body.classList.toggle('no-scroll');
        });

        navMenu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                mobileToggle.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.classList.remove('no-scroll');
            });
        });

        document.addEventListener('click', (e) => {
            if (!navMenu.contains(e.target) && !mobileToggle.contains(e.target) && navMenu.classList.contains('active')) {
                mobileToggle.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.classList.remove('no-scroll');
            }
        });
    }

    // Touch device detection
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) {
        // Handle touch-specific behaviors if needed
    }


    // ═══════════════════════════════════════════
    // 2. ONBOARDING & LOADER FLOW
    // ═══════════════════════════════════════════
    const loaderOverlay = document.getElementById('onboarding-overlay');
    const newLoader = document.getElementById('new-loader');
    const welcomeCard = document.getElementById('welcome-card');
    const chatAssistant = document.getElementById('ai-chat-assistant');
    const body = document.body;

    // Check if user has already onboarded
    const hasOnboarded = sessionStorage.getItem('ai_mall_onboarded');

    if (loaderOverlay && !hasOnboarded) {
        body.classList.add('onboarding-active');
        if (typeof lenis !== 'undefined') lenis.stop();

        // Prevent background scrolling via wheel/touch outside the card
        const preventOutside = (e) => {
            if (welcomeCard && !welcomeCard.contains(e.target)) {
                e.preventDefault();
                e.stopPropagation();
            }
        };
        loaderOverlay.addEventListener('wheel', preventOutside, { passive: false });
        loaderOverlay.addEventListener('touchmove', preventOutside, { passive: false });

        const header = document.getElementById('header');
        if (header) {
            // Hide header during onboarding (intro video & welcome card)
            // It will be revealed in completeOnboarding() when main page appears
            header.style.opacity = '0';
            header.style.visibility = 'hidden';
            header.style.pointerEvents = 'none';
        }

        // Hide chatbot while onboarding
        if (chatAssistant) chatAssistant.classList.add('ai-chat-hidden');

        const introControls = document.querySelector('.intro-controls-v2');
        const soundToggle = document.getElementById('toggle-sound');
        const skipBtn = document.getElementById('skip-intro');
        const introVideo = document.getElementById('intro-video');

        function showWelcomeCard() {
            if (welcomeCard) {
                welcomeCard.style.display = 'block';
                welcomeCard.offsetHeight;
                welcomeCard.classList.add('visible');
                // Added: Trigger the blur background switch only when bot card appears
                if (loaderOverlay) loaderOverlay.classList.add('show-blur');
            }
        }

        function handleVideoEnd() {
            if (introVideo) {
                introVideo.classList.remove('playing');
                introVideo.pause();
            }
            if (introControls) {
                introControls.classList.remove('visible');
                setTimeout(() => introControls.style.display = 'none', 400);
            }
            // Transition to card (Step 3)
            setTimeout(showWelcomeCard, 600);
        }

        function updateSoundUI(video, isMuted) {
            const sOn = document.getElementById('sound-on');
            const sOff = document.getElementById('sound-off');
            const sLbl = document.querySelector('.control-label');
            if (!sOn || !sOff || !sLbl) return;
            if (isMuted) {
                sOn.style.display = 'none'; sOff.style.display = 'block';
                sLbl.textContent = "Unmute"; video.muted = true;
            } else {
                sOn.style.display = 'block'; sOff.style.display = 'none';
                sLbl.textContent = "Mute"; video.muted = false;
            }
        }

        // STEP 1 & 2: Start with Logo, transition to Video
        setTimeout(() => {
            // Fade out logo components (Step 1 end)
            if (newLoader) {
                newLoader.style.opacity = '0';
                newLoader.style.transform = 'scale(0.95)';
                setTimeout(() => newLoader.style.display = 'none', 600);
            }

            // Clean move: Hide background text to avoid overlap with video
            const bgText = document.querySelector('.loader-bg-text');
            if (bgText) {
                bgText.style.transition = 'opacity 0.6s ease';
                bgText.style.opacity = '0';
                setTimeout(() => bgText.style.display = 'none', 600);
            }

            // Start Video (Step 2 start)
            if (introVideo) {
                introVideo.classList.add('playing');
                if (introControls) {
                    introControls.style.display = 'flex';
                    setTimeout(() => introControls.classList.add('visible'), 150);
                }

                introVideo.play().then(() => {
                    updateSoundUI(introVideo, false);
                }).catch(() => {
                    introVideo.muted = true;
                    introVideo.play();
                    updateSoundUI(introVideo, true);
                });

                if (soundToggle) soundToggle.onclick = () => {
                    introVideo.muted = !introVideo.muted;
                    updateSoundUI(introVideo, introVideo.muted);
                };
                if (skipBtn) skipBtn.onclick = handleVideoEnd;
                introVideo.addEventListener('ended', handleVideoEnd);
            } else {
                // If no video, skip directly to Step 3
                showWelcomeCard();
            }
        }, 2200); // 2.2s for the initial brand reveal
    } else {
        // Already onboarded or elements missing, normal load
        if (loaderOverlay) loaderOverlay.style.display = 'none';
        body.classList.remove('loading');
        body.classList.remove('onboarding-active');
        // Ensure chatbot is visible if already onboarded
        if (chatAssistant) {
            chatAssistant.classList.remove('ai-chat-hidden');
            chatAssistant.style.opacity = '1';
            chatAssistant.style.visibility = 'visible';
        }
        // Ensure header is visible on main page for returning users
        const header = document.getElementById('header');
        if (header) {
            header.style.opacity = '1';
            header.style.visibility = 'visible';
            header.style.pointerEvents = 'auto';
        }
        startHeroAnimations();
    }

    // Onboarding Interactions
    const btnTryNow = document.getElementById('btn-try-now');
    const btnGotIt = document.getElementById('btn-got-it');

    function completeOnboarding(openChat = false) {
        sessionStorage.setItem('ai_mall_onboarded', 'true');

        // Hide card first
        if (welcomeCard) welcomeCard.classList.remove('visible');

        setTimeout(() => {
            // Fade out overlay revealing the homepage
            if (loaderOverlay) {
                loaderOverlay.style.opacity = '0';
                loaderOverlay.style.pointerEvents = 'none';
            }
            body.classList.remove('loading');
            body.classList.remove('onboarding-active');
            if (typeof lenis !== 'undefined') lenis.start();

            setTimeout(() => {
                if (loaderOverlay) loaderOverlay.style.display = 'none';
                // Trigger hero animation smoothly once homepage revealed
                startHeroAnimations();

                // Pop-in chatbot after reveal
                if (chatAssistant) {
                    chatAssistant.classList.remove('ai-chat-hidden');
                    chatAssistant.classList.add('ai-chat-pop-in');
                    if (openChat && window.toggleChat) {
                        setTimeout(() => window.toggleChat(), 500);
                    }
                }

                // Reveal Header on main landing page
                const header = document.getElementById('header');
                if (header) {
                    header.style.transition = 'opacity 1.2s ease, visibility 1.2s ease';
                    header.style.opacity = '1';
                    header.style.visibility = 'visible';
                    header.style.pointerEvents = 'auto';
                }
            }, 800);
        }, 400);
    }

    if (btnTryNow) btnTryNow.addEventListener('click', () => completeOnboarding(true));
    if (btnGotIt) btnGotIt.addEventListener('click', () => completeOnboarding(false));


    // ═══════════════════════════════════════════
    // 3. HERO ENTRY ANIMATION
    // ═══════════════════════════════════════════
    function startHeroAnimations() {
        const tl = gsap.timeline();
        tl.to('.reveal-text', { opacity: 1, y: 0, duration: 1.4, ease: 'expo.out', stagger: 0.15 })
            .to('.reveal-subtext', { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out' }, '-=1')
            .from('.cta-group .btn, .cta-group .btn-premium', { y: 24, opacity: 0, stagger: 0.15, duration: 1, ease: 'expo.out' }, '-=0.8')
            .from('.scroll-indicator', { opacity: 0, duration: 1 }, '-=0.5');

        // Parallax on hero bg
        const heroTrigger = document.querySelector('#hero, #about-hero, #aseries-hero, #partner-hero, #contact-hero');
        if (heroTrigger) {
            gsap.to('.hero-bg img, .hero-bg .parallax-img', {
                scale: 1.25,
                ease: 'none',
                scrollTrigger: {
                    trigger: heroTrigger,
                    start: 'top top',
                    end: 'bottom top',
                    scrub: true
                }
            });
        }
    }


    // ═══════════════════════════════════════════
    // 4. UNIVERSAL SCROLL REVEAL SYSTEM
    //    — Works across ALL pages automatically
    // ═══════════════════════════════════════════

    // Helper: register a stagger-group reveal
    function revealGroup(selector, from, options = {}) {
        const els = gsap.utils.toArray(selector);
        if (!els.length) return;
        els.forEach((el, i) => {
            gsap.fromTo(el, from, {
                ...from,
                opacity: 1,
                y: 0,
                x: 0,
                scale: 1,
                filter: 'blur(0px)',
                delay: (options.staggerDelay || 0) * i,
                duration: options.duration || 0.85,
                ease: options.ease || 'power3.out',
                scrollTrigger: {
                    trigger: el,
                    start: options.start || 'top 88%',
                    once: true,
                    toggleActions: 'play none none none'
                }
            });
        });
    }

    // ── Section Labels / Badges ──
    revealGroup(
        '.section-label, .hstrip-label, .uwo-badge, .m-badge, .v3-badge',
        { opacity: 0, y: 20 },
        { duration: 0.7, start: 'top 90%' }
    );

    // ── Section Titles / Headings ──
    revealGroup(
        '.section-title, .hstrip-title, .uwo-title, .hstrip-header h2, .founder-name, .premium-heading',
        { opacity: 0, y: 40 },
        { duration: 1, ease: 'power4.out', start: 'top 88%' }
    );

    // ── Subtitles / Descriptions / Paragraphs ──
    revealGroup(
        '.subheadline, .hstrip-sub, .uwo-description, .uwo-subtext, .founder-quote, .founder-bio, .m-support-line, .footer-description',
        { opacity: 0, y: 30 },
        { duration: 0.9, start: 'top 88%' }
    );

    // ── Generic Reveal Items Tagged by Class ──
    revealGroup(
        '.reveal-on-scroll',
        { opacity: 0, y: 36 },
        { duration: 0.9, start: 'top 88%' }
    );

    // ── Feature/Stat Items (stagger via group) ──
    gsap.utils.toArray('.uwo-features, .uwo-stats-row, .m-stats-row, .v3-stats-row, .founder-traits').forEach(group => {
        const children = gsap.utils.toArray(group.children);
        gsap.fromTo(children,
            { opacity: 0, y: 30 },
            {
                opacity: 1, y: 0,
                duration: 0.7,
                stagger: 0.12,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: group,
                    start: 'top 88%',
                    once: true
                }
            }
        );
    });

    // ── Buttons / CTAs ──
    revealGroup(
        '.cta-minimal, .v3-btn-primary, .social-links-minimal, .btn-premium',
        { opacity: 0, y: 20 },
        { duration: 0.8, start: 'top 90%' }
    );

    // ── Image Wrappers ──
    revealGroup(
        '.image-wrapper, .uwo-video-card-reveal, .v3-video-card, .reveal-card-v3',
        { opacity: 0, y: 50, scale: 0.96 },
        { duration: 1.1, ease: 'expo.out', start: 'top 85%' }
    );

    // ── Footer Columns ──
    gsap.utils.toArray('.footer-brand, .footer-col, .footer-social-hub').forEach((el, i) => {
        gsap.fromTo(el,
            { opacity: 0, y: 30 },
            {
                opacity: 1, y: 0,
                duration: 0.8,
                delay: i * 0.1,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 95%',
                    once: true
                }
            }
        );
    });


    // ═══════════════════════════════════════════
    // 5. SECTION-SPECIFIC ANIMATIONS
    // ═══════════════════════════════════════════

    // Parallax on section background images removed — caused white gap between sections during scroll

    // ── Pillar Cards (Home) ──
    const pillars = document.querySelector('.pillars-grid');
    if (pillars) {
        const pCards = gsap.utils.toArray(pillars.children);
        gsap.set(pCards, { xPercent: 100, opacity: 0, scale: 0.95, filter: 'blur(8px)' });

        const pTL = gsap.timeline({
            scrollTrigger: {
                trigger: '#pillars',
                start: 'top 75%',
                end: 'bottom -20%',
                scrub: 1.2
            }
        });
        pTL
            .to(pCards, { xPercent: 0, opacity: 1, scale: 1, filter: 'blur(0px)', stagger: 0.15, duration: 2, ease: 'power2.out' })
            .to(pCards, { duration: 2.5 })
            .to(pCards, { xPercent: 90, opacity: 0, scale: 0.85, filter: 'blur(15px)', stagger: 0.08, duration: 1.5, ease: 'power2.in' });
    }

    // ── A-Series Tiles (Home + A-Series page) ──
    const aGrid = document.querySelector('.a-series-grid');
    if (aGrid) {
        const tiles = gsap.utils.toArray(aGrid.children);
        gsap.fromTo(tiles,
            { opacity: 0, y: 35, scale: 0.88 },
            {
                opacity: 1, y: 0, scale: 1,
                duration: 0.8,
                stagger: 0.07,
                ease: 'expo.out',
                scrollTrigger: { trigger: aGrid, start: 'top 85%', once: true }
            }
        );
        // Tilt on hover
        tiles.forEach(tile => {
            tile.addEventListener('mousemove', (e) => {
                const rect = tile.getBoundingClientRect();
                const dx = e.clientX - rect.left - rect.width / 2;
                const dy = e.clientY - rect.top - rect.height / 2;
                gsap.to(tile, { rotateY: dx / 14, rotateX: -dy / 14, scale: 1.02, duration: 0.4, ease: 'power2.out' });
                tile.style.setProperty('--mouse-x', `${((e.clientX - rect.left) / rect.width) * 100}%`);
                tile.style.setProperty('--mouse-y', `${((e.clientY - rect.top) / rect.height) * 100}%`);
            });
            tile.addEventListener('mouseleave', () => {
                gsap.to(tile, { rotateY: 0, rotateX: 0, scale: 1, duration: 0.7, ease: 'elastic.out(1, 0.3)' });
            });
        });
    }

    // ── Stack Cards (A-Series page) ──
    const stackCards = gsap.utils.toArray('.stack-card');
    stackCards.forEach((card, i) => {
        // Cards are visible by default — only compress when next card enters
        if (i < stackCards.length - 1) {
            gsap.to(card, {
                scale: 0.94,
                opacity: 0.4,
                scrollTrigger: {
                    trigger: stackCards[i + 1],
                    start: 'top 80%',
                    end: 'top 20%',
                    scrub: true
                }
            });
        }
    });

    // ── Vision Section Premium (Home Redesign) ──
    const visionPremium = document.querySelector('.vision-premium-redesign');
    if (visionPremium) {
        const textArea = visionPremium.querySelector('.vision-text-area');
        const textChildren = textArea ? textArea.children : [];
        const mainCard = visionPremium.querySelector('.premium-main-card');
        const nestedCard = visionPremium.querySelector('.nested-glass-card');

        ScrollTrigger.create({
            trigger: visionPremium,
            start: 'top 70%',
            once: true,
            onEnter: () => {
                // Slide from Left for Text
                gsap.fromTo(textChildren,
                    { opacity: 0, x: -60 },
                    { opacity: 1, x: 0, duration: 1.2, stagger: 0.15, ease: 'expo.out' }
                );

                // Scale + Fade for Main Card
                if (mainCard) {
                    gsap.fromTo(mainCard,
                        { opacity: 0, scale: 0.95 },
                        { opacity: 1, scale: 1, duration: 1.5, ease: 'expo.out' }
                    );
                }
            }
        });

        // Parallax Tilt for Nested Card
        if (nestedCard) {
            nestedCard.addEventListener('mousemove', (e) => {
                const rect = nestedCard.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                gsap.to(nestedCard, {
                    rotateY: x / 12,
                    rotateX: -y / 12,
                    x: x / 18,
                    y: y / 18,
                    duration: 0.6,
                    ease: 'power2.out'
                });
            });
            nestedCard.addEventListener('mouseleave', () => {
                gsap.to(nestedCard, { rotateY: 0, rotateX: 0, x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.3)' });
            });
        }

        // Mouse follow glow for the main card container
        if (mainCard) {
            mainCard.addEventListener('mousemove', (e) => {
                const rect = mainCard.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                mainCard.style.setProperty('--mouse-x', `${x}px`);
                mainCard.style.setProperty('--mouse-y', `${y}px`);
            });
        }
    }

    // ── UWO Story Section (About) ──
    const uwoSection = document.getElementById('uwo-story');
    if (uwoSection) {
        const uwoWords = uwoSection.querySelectorAll('.u-word');
        const uwoItems = uwoSection.querySelectorAll('.reveal-item');
        const uwoCard = uwoSection.querySelector('.uwo-video-card-reveal');

        const uwoTL = gsap.timeline({
            scrollTrigger: { trigger: uwoSection, start: 'top 70%', once: true }
        });
        uwoTL.to(uwoWords, { opacity: 1, y: 0, duration: 0.9, stagger: 0.1, ease: 'expo.out' })
            .to(uwoItems, { opacity: 1, y: 0, duration: 0.7, stagger: 0.13, ease: 'power2.out' }, '-=0.5')
            .to(uwoCard, { opacity: 1, x: 0, scale: 1, duration: 1.3, ease: 'expo.out' }, '-=1');

        // Counters
        uwoSection.querySelectorAll('.stat-value[data-val]').forEach(stat => {
            const val = parseInt(stat.getAttribute('data-val'));
            uwoTL.to(stat, { innerText: val, duration: 1.8, snap: { innerText: 1 }, ease: 'power2.out' }, '-=0.8');
        });
    }

    // ── Mission V2 Section (About) ──
    const missionV2 = document.getElementById('mission-v2');
    if (missionV2) {
        const mWords = missionV2.querySelectorAll('.m-word');
        const mItems = missionV2.querySelectorAll('.reveal-item');
        const mCounts = missionV2.querySelectorAll('.min-val.m-count');

        const mTL = gsap.timeline({
            scrollTrigger: { trigger: missionV2, start: 'top 75%', once: true }
        });
        mTL.to(mWords, { opacity: 1, y: 0, duration: 0.9, stagger: 0.07, ease: 'expo.out' })
            .to(mItems, { opacity: 1, y: 0, duration: 0.7, stagger: 0.18, ease: 'power2.out' }, '-=0.5');

        mCounts.forEach(stat => {
            const val = parseInt(stat.getAttribute('data-val'));
            mTL.to(stat, { innerText: val, duration: 1.8, snap: { innerText: 1 }, ease: 'power2.out' }, '-=0.8');
        });
    }

    // ── Horizontal Feature Strip (About Roadmap) ──
    const hstripOuter = document.getElementById('hstrip-outer');
    const hstripTrack = document.getElementById('hstrip-track');
    const hstripProgress = document.getElementById('hstrip-progress');
    const hstripDots = document.getElementById('hstrip-dots');
    const dots = [];

    if (hstripOuter && hstripTrack) {
        const items = hstripTrack.querySelectorAll('.hstrip-item');

        gsap.fromTo(items,
            { opacity: 0, x: 100 },
            {
                opacity: 1, x: 0, duration: 1.2, stagger: 0.18, ease: 'power3.out',
                scrollTrigger: { trigger: hstripOuter, start: 'top 85%', once: true }
            }
        );

        // Inertial Drag Utility
        let isDown = false, startX, scrollLeft, vel = 0, lastX;
        hstripOuter.addEventListener('mousedown', (e) => {
            isDown = true;
            hstripOuter.classList.add('is-dragging');
            startX = e.pageX - hstripOuter.offsetLeft;
            lastX = startX;
            scrollLeft = hstripOuter.scrollLeft;
            vel = 0;
            cancelAnimationFrame(scrollInertia);
        });
        hstripOuter.addEventListener('mouseleave', () => { isDown = false; hstripOuter.classList.remove('is-dragging'); });
        hstripOuter.addEventListener('mouseup', () => { isDown = false; hstripOuter.classList.remove('is-dragging'); applyInertia(); });

        let scrollInertia;
        const applyInertia = () => {
            if (Math.abs(vel) < 0.1) return;
            hstripOuter.scrollLeft += vel;
            if (clampScroll()) {
                vel = 0;
                return;
            }
            vel *= 0.95; // Inertia damping
            scrollInertia = requestAnimationFrame(applyInertia);
        };

        // Touch Swipe Support for Mobile
        let touchStartX = 0;
        hstripOuter.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            lastX = touchStartX;
            scrollLeft = hstripOuter.scrollLeft;
            vel = 0;
            cancelAnimationFrame(scrollInertia);
        }, { passive: true });

        hstripOuter.addEventListener('touchmove', (e) => {
            const x = e.touches[0].clientX;
            const walk = (x - touchStartX) * 1.5;
            hstripOuter.scrollLeft = scrollLeft - walk;
        }, { passive: true });

        hstripOuter.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const dx = endX - touchStartX;
            if (Math.abs(dx) > 30) {
                const current = getActiveIndex();
                if (dx < 0 && current < items.length - 1) {
                    scrollToItem(current + 1);
                } else if (dx > 0 && current > 0) {
                    scrollToItem(current - 1);
                }
            }
        }, { passive: true });

        // Compute the exact scroll position required to center a card
        const getScrollTargetForItem = (target) => {
            const targetCenter = target.offsetLeft + (target.offsetWidth / 2);
            const halfViewport = hstripOuter.clientWidth / 2;
            const maxScroll = hstripOuter.scrollWidth - hstripOuter.clientWidth;
            const targetScroll = targetCenter - halfViewport;
            return Math.min(Math.max(targetScroll, 0), maxScroll);
        };

        const scrollToItem = (index) => {
            if (!items[index]) return;
            const target = items[index];
            const targetScroll = getScrollTargetForItem(target);

            gsap.to(hstripOuter, {
                scrollLeft: targetScroll,
                duration: 1.2,
                ease: "expo.inOut",
                overwrite: true
            });
        };

        // Navigation Buttons Logic
        const hPrev = document.getElementById('hstrip-prev');
        const hNext = document.getElementById('hstrip-next');

        const getActiveIndex = () => {
            const viewportCenter = hstripOuter.scrollLeft + hstripOuter.clientWidth / 2;
            let closestIndex = 0;
            let minDiff = Infinity;
            items.forEach((item, i) => {
                const diff = Math.abs((item.offsetLeft + item.offsetWidth / 2) - viewportCenter);
                if (diff < minDiff) {
                    minDiff = diff;
                    closestIndex = i;
                }
            });
            return closestIndex;
        };

        if (hPrev) {
            hPrev.addEventListener('click', (e) => {
                e.preventDefault();
                const current = getActiveIndex();
                if (current > 0) {
                    scrollToItem(current - 1);
                }
            });
        }
        if (hNext) {
            hNext.addEventListener('click', (e) => {
                e.preventDefault();
                const current = getActiveIndex();
                if (current < items.length - 1) {
                    scrollToItem(current + 1);
                }
            });
        }

        // Generate Dots with precise hit areas
        if (hstripDots) {
            hstripDots.innerHTML = '';
            items.forEach((_, i) => {
                const dot = document.createElement('div');
                dot.className = 'hstrip-dot';
                dot.addEventListener('click', (e) => {
                    e.stopPropagation();
                    scrollToItem(i);
                });
                hstripDots.appendChild(dot);
                dots.push(dot);
            });
        }

        const updateArc = () => {
            const viewportCenter = hstripOuter.scrollLeft + hstripOuter.clientWidth / 2;
            const scrollMax = hstripOuter.scrollWidth - hstripOuter.clientWidth;
            if (hstripProgress) hstripProgress.style.width = (scrollMax > 0 ? (hstripOuter.scrollLeft / scrollMax) * 100 : 0) + '%';

            items.forEach((item, i) => {
                const itemCenter = item.offsetLeft + item.offsetWidth / 2;
                const distance = itemCenter - viewportCenter;
                // Use viewport-based normalization for consistent scaling across sizes
                const normalizedDist = Math.max(-1, Math.min(1, distance / (hstripOuter.clientWidth / 2)));

                // Smooth scale between side and center
                const scale = 1 - Math.abs(normalizedDist) * 0.18; // side cards ~0.82, center ~1.0 (CSS adds is-active scale)
                const opacity = 1 - Math.abs(normalizedDist) * 0.35;
                const blur = Math.abs(normalizedDist) * 1.5; // small blur for side cards
                const translateX = normalizedDist * 12; // subtle horizontal nudge for parallax

                gsap.set(item, {
                    x: translateX,
                    scale: scale,
                    opacity: Math.max(0.5, opacity),
                    filter: `blur(${blur}px)`,
                    zIndex: Math.round(50 - Math.abs(normalizedDist) * 40)
                });

                // Detect center card for dots (use smaller threshold to ensure single active)
                const isActive = Math.abs(distance) < (item.offsetWidth * 0.52);
                item.classList.toggle('is-active', isActive);

                if (isActive && dots[i]) {
                    dots.forEach(d => d.classList.remove('active'));
                    dots[i].classList.add('active');
                }
            });
        };

        // Navigation Sync Logic (Handled in the refined block above)


        const clampScroll = () => {
            const maxScroll = Math.max(0, hstripOuter.scrollWidth - hstripOuter.clientWidth);
            const clampedScroll = Math.min(Math.max(hstripOuter.scrollLeft, 0), maxScroll);
            const wasClamped = clampedScroll !== hstripOuter.scrollLeft;
            hstripOuter.scrollLeft = clampedScroll;
            return wasClamped;
        };

        const updatePadding = () => {
            if (!items.length) return;
            const cardWidth = items[0].offsetWidth;
            const maxScale = 1.25;
            const maxVisualCardWidth = cardWidth * (maxScale + 0.1);
            const basePadding = Math.max((hstripOuter.clientWidth - cardWidth) / 2, 0);
            const scaleMargin = (maxVisualCardWidth - cardWidth) / 2;
            const rotationMargin = Math.max(cardWidth * 0.14, 30);
            const sidePadding = Math.max(basePadding + scaleMargin + rotationMargin, 0);
            hstripTrack.style.paddingLeft = `${sidePadding}px`;
            hstripTrack.style.paddingRight = `${sidePadding}px`;
            clampScroll();
            updateArc();
        };

        // Add wheel support for horizontal scroll (premium feel)
        hstripOuter.addEventListener('wheel', (e) => {
            if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
                // convert vertical wheel into horizontal
                e.preventDefault();
                hstripOuter.scrollLeft += e.deltaY * 1.2;
            }
        }, { passive: false });

        hstripOuter.addEventListener('scroll', updateArc);
        // Recalculate padding and visuals on resize and orientation changes
        window.addEventListener('resize', updatePadding);
        window.addEventListener('orientationchange', () => setTimeout(updatePadding, 300));
        updatePadding();

        // Click to Focus / Center Card
        items.forEach(item => {
            item.addEventListener('click', () => {
                const targetScroll = getScrollTargetForItem(item);
                gsap.to(hstripOuter, {
                    scrollLeft: targetScroll,
                    duration: 0.8,
                    ease: 'power3.inOut'
                });
            });
        });

        // Mouse Move Interaction (Micro-tilts)
        hstripOuter.addEventListener('mousemove', (e) => {
            if (isDown) {
                e.preventDefault();
                const x = e.pageX - hstripOuter.offsetLeft;
                const walk = (x - startX) * 2.2; // Slightly faster drag
                hstripOuter.scrollLeft = scrollLeft - walk;
                vel = (x - lastX) * 2;
                lastX = x;
            } else {
                // Subtle tilt for the visible cards
                const rect = hstripOuter.getBoundingClientRect();
                const mx = (e.clientX - (rect.left + rect.width / 2)) / rect.width;
                items.forEach(item => {
                    if (item.classList.contains('is-active')) {
                        gsap.to(item, {
                            rotateX: (e.clientY / window.innerHeight - 0.5) * -15,
                            rotateY: (mx * 10) + (parseFloat(item.style.rotateY) || 0), // Base arc + tilt
                            duration: 0.6,
                            ease: 'power2.out'
                        });
                    }
                });
            }
        });
    }

    // ── Trust / Connect Grid (Contact page) ──
    const whyUsGrid = document.querySelector('.why-us-cinematic .trust-grid');
    if (whyUsGrid) {
        const left = document.querySelector('.card-left');
        const center = document.querySelector('.card-center');
        const right = document.querySelector('.card-right');
        gsap.timeline({ scrollTrigger: { trigger: whyUsGrid, start: 'top 75%', once: true } })
            .to(left, { x: 0, scale: 1, opacity: 1, duration: 1.3, ease: 'expo.out' })
            .to(center, { rotateX: 0, scale: 1, opacity: 1, duration: 1.5, ease: 'elastic.out(1, 0.75)' }, '-=0.9')
            .to(right, { x: 0, scale: 1, opacity: 1, duration: 1.3, ease: 'expo.out' }, '-=1.1');
    }

    const connectGrid = document.querySelector('.connect-grid');
    if (connectGrid) {
        const cl = document.querySelector('.connect-left');
        const cc = document.querySelector('.connect-center-reveal');
        const cr = document.querySelector('.connect-right');
        gsap.timeline({ scrollTrigger: { trigger: connectGrid, start: 'top 80%', once: true } })
            .to(cl, { x: 0, scale: 1, opacity: 1, duration: 1.3, ease: 'expo.out' })
            .to(cc, { scale: 1.05, rotateY: 0, opacity: 1, duration: 1.5, ease: 'elastic.out(1, 0.75)' }, '-=0.9')
            .to(cr, { x: 0, scale: 1, opacity: 1, duration: 1.3, ease: 'expo.out' }, '-=1.1');
    }

    // ── A-Series Stream Grid / Module rows ──
    gsap.utils.toArray('.streams-grid, .stream-card, .module-preview, .a-series-module').forEach(el => {
        const children = el.querySelectorAll(':scope > *');
        if (children.length > 1) {
            gsap.fromTo(children,
                { opacity: 0, y: 40 },
                {
                    opacity: 1, y: 0, duration: 0.75, stagger: 0.1, ease: 'power3.out',
                    scrollTrigger: { trigger: el, start: 'top 86%', once: true }
                }
            );
        } else {
            gsap.fromTo(el, { opacity: 0, y: 40 }, {
                opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
                scrollTrigger: { trigger: el, start: 'top 86%', once: true }
            });
        }
    });

    // ── Standalone Dividers / Lines / Animated elements ──
    revealGroup(
        '.animated-line, .animated-divider, .footer-divider',
        { opacity: 0, scaleX: 0 },
        { duration: 0.9, ease: 'power3.out', start: 'top 92%' }
    );




    // --- Global Smooth Cinematic Text Reveal ---
    const revealObserverOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -10px 0px"
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                revealObserver.unobserve(entry.target);
            }
        });
    }, revealObserverOptions);

    // Apply reveal class to all text-heavy elements across all pages
    const textSelectors = [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li', 'span:not(.nav-logo-text)',
        '.v3-badge', '.aseries-subtext', '.subheadline', '.section-label',
        '.module-title', '.module-desc', '.footer-link',
        '.stat-num', '.stat-label', '.lt-uwo-badge', '.lt-feat-text',
        '.m-badge', '.m-word', '.min-val', '.min-label', '.hstrip-label',
        '.hstrip-title', '.hstrip-item-title', '.hstrip-item-desc',
        '.founder-name', '.founder-role', '.founder-quote', '.founder-bio',
        '.trait-chip', '.v-num', '.v-lbl'
    ].join(', ');

    document.querySelectorAll(textSelectors).forEach(el => {
        if (!el.classList.contains('smooth-reveal')) {
            el.classList.add('smooth-reveal');
        }
        revealObserver.observe(el);
    });


    // ═══════════════════════════════════════════
    // 7. 3D TILT EFFECT (data-tilt)
    // ═══════════════════════════════════════════
    document.querySelectorAll('[data-tilt]').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const rx = (rect.height / 2 - (e.clientY - rect.top)) / 14;
            const ry = ((e.clientX - rect.left) - rect.width / 2) / 14;
            gsap.to(card, { rotateX: rx, rotateY: ry, scale: 1.02, duration: 0.4, ease: 'power2.out' });
            card.style.setProperty('--mouse-x', `${((e.clientX - rect.left) / rect.width) * 100}%`);
            card.style.setProperty('--mouse-y', `${((e.clientY - rect.top) / rect.height) * 100}%`);
        });
        card.addEventListener('mouseleave', () => {
            gsap.to(card, { rotateX: 0, rotateY: 0, scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.3)' });
        });
    });


    // ═══════════════════════════════════════════
    // 8. STICKY HEADER STATE
    // ═══════════════════════════════════════════
    const header = document.getElementById('header');
    if (header) {
        const checkScroll = () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        };
        window.addEventListener('scroll', checkScroll, { passive: true });
        checkScroll(); // Check on load
    }

    // ═══════════════════════════════════════════
    // 9. PREMIUM CHATBOT LOGIC (AISA™)
    // ═══════════════════════════════════════════
    let lastChatToggle = 0;
    window.toggleChat = () => {
        const now = Date.now();
        if (now - lastChatToggle < 400) return; // Prevent double-triggering
        lastChatToggle = now;

        const win = document.getElementById('chat-window');
        const tooltip = document.getElementById('chat-tooltip');
        const orb = document.querySelector('.chatbot-chat-icon');

        if (win) {
            console.log('🔄 Toggling Chat Window');
            win.classList.toggle('active');

            if (win.classList.contains('active')) {
                if (tooltip) tooltip.classList.remove('visible');
                if (orb) orb.classList.remove('active-pop');
            }
        }
    };

    // Robust Close Listener with absolute propagation stop
    document.addEventListener('click', (e) => {
        if (e.target.closest('.chat-close')) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🎯 Close Button Hit (Global Intercept)');
            window.toggleChat();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const win = document.getElementById('chat-window');
            if (win && win.classList.contains('active')) {
                window.toggleChat();
            }
        }
    });

    // Proactive Chatbot Engagement (trigger after delay)
    // Delay: 45 seconds for a premium, non-intrusive feel
    const ENGAGEMENT_DELAY = 45000;
    setTimeout(() => {
        const tooltip = document.getElementById('chat-tooltip');
        const orb = document.querySelector('.chatbot-chat-icon');
        const win = document.getElementById('chat-window');

        // Only trigger if chat window is NOT already active
        if (win && !win.classList.contains('active')) {
            if (tooltip) tooltip.classList.add('visible');
            if (orb) orb.classList.add('active-pop');
        }
    }, ENGAGEMENT_DELAY);

    window.handleChatReg = (e) => {
        e.preventDefault();
        const n = document.getElementById('chat-reg-name')?.value;
        const email = document.getElementById('chat-reg-email')?.value;
        if (!n || !email) return;

        localStorage.setItem('chat_registered', 'true');
        localStorage.setItem('chat_user', n);
        localStorage.setItem('chat_email', email);

        const regView = document.getElementById('registration-view');
        const msgView = document.getElementById('chat-messages');
        const input = document.getElementById('chat-main-input');

        if (regView) regView.style.display = 'none';
        if (msgView) msgView.style.display = 'flex';
        if (input) {
            input.placeholder = "Type message...";
            input.readOnly = false;
        }

        // Do not append welcome message on first registration as requested
        const msgBox = document.getElementById('chat-messages');
        if (msgBox) {
            msgBox.scrollTop = msgBox.scrollHeight;
        }
    };

    window.sendMessage = async () => {
        const input = document.getElementById('chat-main-input');
        const val = input?.value.trim();
        if (!val || input.readOnly) return;

        const msgBox = document.getElementById('chat-messages');
        if (!msgBox) return;

        // User Message
        const u = document.createElement('div');
        u.className = 'chat-msg msg-user';
        u.textContent = val;
        msgBox.appendChild(u);
        input.value = "";
        msgBox.scrollTop = msgBox.scrollHeight;

        // Show Thinking Indicator
        const thinking = document.createElement('div');
        thinking.className = 'thinking';
        thinking.innerHTML = '<span></span><span></span><span></span>';
        msgBox.appendChild(thinking);
        msgBox.scrollTop = msgBox.scrollHeight;

        // Prepare AI Message Container (HIDDEN initially)
        const aiMsg = document.createElement('div');
        aiMsg.className = 'chat-msg msg-ai';
        aiMsg.style.display = 'none';
        msgBox.appendChild(aiMsg);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, 45000); // 45s Timeout

        try {
            const baseUrl = window.API_BASE_URL;
            // Standardize path with /api prefix
            const response = await fetch(`${baseUrl}/api/rag/chat/stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: val, sessionId: 'floating-assistant' }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) throw new Error(`Server ${response.status}`);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = "";
            let firstChunk = true;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            if (data.type === 'chunk') {
                                if (firstChunk) {
                                    thinking.remove();
                                    aiMsg.style.display = 'block';
                                    firstChunk = false;
                                }
                                fullText += data.text;

                                // Simple markdown-to-HTML parser (Refined for spacing)
                                let processedText = fullText
                                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
                                    .split('\n').map(line => {
                                        let trimmed = line.trim();
                                        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
                                            return `<li>${trimmed.substring(2)}</li>`;
                                        }
                                        return trimmed;
                                    }).join('\n');

                                // Group <li> into <ul> and handle line breaks concisely
                                aiMsg.innerHTML = processedText
                                    .replace(/(<li>.*?<\/li>[\n\s]*)+/g, (match) => {
                                        return `<ul style="margin: 4px 0;">${match.trim().replace(/\n/g, '')}</ul>`;
                                    })
                                    .replace(/\n\n+/g, '<br>') // Collapse multiple newlines to a single break
                                    .replace(/\n/g, '<br>');   // Map single newline to single break

                                msgBox.scrollTop = msgBox.scrollHeight;
                            }
                        } catch (e) { /* partial chunk */ }
                    }
                }
            }
        } catch (err) {
            clearTimeout(timeoutId);
            console.error('Chat Error:', err);
            thinking.remove();
            aiMsg.style.display = 'block';
            if (err.name === 'AbortError') {
                aiMsg.textContent = "Request timed out. The AI is taking too long to synthesize - please try again later.";
            } else {
                aiMsg.textContent = "Connectivity error. Unable to reach AI-MALL™ servers.";
            }
        }
        msgBox.scrollTop = msgBox.scrollHeight;
    };

    // Initialize Chat state
    if (localStorage.getItem('chat_registered') === 'true') {
        const rv = document.getElementById('registration-view');
        const mv = document.getElementById('chat-messages');
        const ci = document.getElementById('chat-main-input');
        const n = localStorage.getItem('chat_user') || "User";

        if (rv) rv.style.display = 'none';
        if (mv) {
            mv.style.display = 'flex';
            // Replace general greeting with personalized welcome for returning users
            mv.innerHTML = `<div class="chat-msg msg-ai">Welcome back, ${n}! How can I assist you with the AI-MALL™ ecosystem today?</div>`;
        }
        if (ci) {
            ci.placeholder = "Type message...";
            ci.readOnly = false;
        }
    }

    // Enter Key to Send
    const chatInput = document.getElementById('chat-main-input');
    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                window.sendMessage();
            }
        });
    }

    // ═══════════════════════════════════════════
    // 10. PREMIUM GALLERY MODAL LOGIC
    // ═══════════════════════════════════════════
    window.premiumImages = [
        "aimallproject/slide-1.png", "aimallproject/slide-2.png", "aimallproject/slide-3.png",
        "aimallproject/slide-4.png", "aimallproject/slide-5.png", "aimallproject/slide-6.png",
        "aimallproject/slide-7.png", "aimallproject/slide-8.png", "aimallproject/slide-9.png",
        "aimallproject/slide-10.png", "aimallproject/slide-11.png", "aimallproject/slide-12.png"
    ];
    window.currentPremiumIndex = 0;
    window.galleryAutoPlayInterval = null;
    window.isGalleryLiked = false;
    window.isGalleryRepeat = false;
    window.isGalleryMuted = false;

    window.openPremiumModal = function () {
        const modal = document.getElementById('premium-gallery-modal');
        if (modal) {
            modal.classList.add('open');
            document.body.classList.add('modal-active');
            window.currentPremiumIndex = 0; // Reset or sync
            window.updatePremiumImage();
            document.body.style.overflow = 'hidden';

            // Auto-start playing when opened
            window.startGalleryAutoPlay();
        }
    };

    window.closePremiumModal = function () {
        const modal = document.getElementById('premium-gallery-modal');
        if (modal) {
            modal.classList.remove('open');
            document.body.classList.remove('modal-active');
            document.body.style.overflow = '';
            if (window.galleryAutoPlayInterval) {
                window.stopGalleryAutoPlay();
            }
        }
    };

    window.premiumGalleryNext = function () {
        window.currentPremiumIndex = (window.currentPremiumIndex + 1) % window.premiumImages.length;
        window.updatePremiumImage();
    };

    window.premiumGalleryPrev = function () {
        window.currentPremiumIndex = (window.currentPremiumIndex - 1 + window.premiumImages.length) % window.premiumImages.length;
        window.updatePremiumImage();
    };

    window.updatePremiumImage = function () {
        const img = document.getElementById('premium-gallery-img');
        if (img) {
            img.style.opacity = '0';
            setTimeout(() => {
                img.src = window.premiumImages[window.currentPremiumIndex];
                img.style.opacity = '1';
            }, 250);
        }
        const curr = document.getElementById('gallery-current');
        if (curr) curr.innerText = window.currentPremiumIndex + 1;
    };

    window.toggleGalleryAutoPlay = function () {
        if (window.galleryAutoPlayInterval) {
            window.stopGalleryAutoPlay();
        } else {
            window.startGalleryAutoPlay();
        }
    };

    window.startGalleryAutoPlay = function () {
        const pBtn = document.getElementById('play-icon');
        const sBtn = document.getElementById('pause-icon');
        if (pBtn) pBtn.style.display = 'none';
        if (sBtn) sBtn.style.display = 'block';
        window.premiumGalleryNext(); // Immediate next slide
        window.galleryAutoPlayInterval = setInterval(window.premiumGalleryNext, 3500);
    };

    window.stopGalleryAutoPlay = function () {
        const pBtn = document.getElementById('play-icon');
        const sBtn = document.getElementById('pause-icon');
        if (pBtn) pBtn.style.display = 'block';
        if (sBtn) sBtn.style.display = 'none';
        clearInterval(window.galleryAutoPlayInterval);
        window.galleryAutoPlayInterval = null;
    };

    window.toggleGalleryLike = function () {
        window.isGalleryLiked = !window.isGalleryLiked;
        const btn = document.getElementById('gallery-like-btn');
        if (btn) btn.classList.toggle('active', window.isGalleryLiked);
    };

    window.shuffleGallery = function () {
        window.currentPremiumIndex = Math.floor(Math.random() * window.premiumImages.length);
        window.updatePremiumImage();
    };

    window.toggleGalleryRepeat = function () {
        window.isGalleryRepeat = !window.isGalleryRepeat;
        const btn = document.getElementById('gallery-repeat-btn');
        if (btn) btn.classList.toggle('active', window.isGalleryRepeat);
    };

    window.toggleGalleryVolume = function () {
        window.isGalleryMuted = !window.isGalleryMuted;
        const btn = document.getElementById('gallery-volume-btn');
        if (btn) btn.classList.toggle('active', window.isGalleryMuted);
    };

    // ═══════════════════════════════════════════
    // 11. LEGAL MODAL LOGIC (TERMS & PRIVACY)
    // ═══════════════════════════════════════════
    const legalContent = {
        terms: `
            <div class="legal-content-header">
                <h2 class="legal-content-title"><img src="logos/Logo.png" alt="AI-MALL" class="legal-logo-icon"> AI-MALL™ – Terms & Conditions</h2>
            </div>
            <div class="legal-content-scroll-box">
                <div class="legal-content-section">
                    <h3>1. 🔹 Acceptance of Terms</h3>
                    <p>Welcome to AI-MALL™, a platform owned and operated by <strong>Unified Web Options (UWO™)</strong>.</p>
                    <p>By accessing, registering, or using AI-MALL™, you confirm that you have read, understood, and agreed to be bound by these Terms & Conditions. If you do not agree, you must discontinue use immediately.</p>
                </div>
                <div class="legal-content-section">
                    <h3>2. 🔹 About AI-MALL™</h3>
                    <p>AI-MALL™ is a unified AI marketplace and execution ecosystem that enables users to access multiple AI tools, perform tasks (content creation, automation, data processing), and interact through AISA™ (AI Super Assistant). AI-MALL™ functions as an orchestration platform, not a standalone AI model provider.</p>
                </div>
                <div class="legal-content-section">
                    <h3>3. 🔹 Eligibility</h3>
                    <p>Have legal capacity for agreements, and provide accurate registration information.</p>
                </div>
                <div class="legal-content-section">
                    <h3>4. 🔹 Account Security</h3>
                    <p>You are responsible for maintaining credential confidentiality and all activities under your account. AI-MALL™ is not liable for unauthorized access.</p>
                </div>
                <div class="legal-content-section">
                    <h3>5. 🔹 Use of the Platform</h3>
                    <p>Lawful use only. No fraudulent activity, hacking, IP infringement, or distribution of abusive content.</p>
                </div>
                <div class="legal-content-section">
                    <h3>6. 🔹 AI Functionality & Limitations</h3>
                    <p>AI outputs may be inaccurate, incomplete, or biased. AI should NOT be relied upon for critical, legal, medical, or financial decisions without human validation. AI-MALL™ is an assistive system, not a replacement for human judgment.</p>
                </div>
                <div class="legal-content-section">
                    <h3>7. 🔹 Third-Party Services</h3>
                    <p>Access to third-party AI tools is subject to their own terms. AI-MALL™ does not control or guarantee their performance.</p>
                </div>
                <div class="legal-content-section">
                    <h3>8. 🔹 Intellectual Property</h3>
                    <p>Platform technology, branding, and AISA™ are owned by UWO™. Users retain ownership of created content but grant AI-MALL™ a license for platform functionality.</p>
                </div>
                <div class="legal-content-section">
                    <h3>9. 🔹 Payments & Subscriptions</h3>
                    <p>Fees apply for paid plans. Pricing may change. Payments are non-refundable unless stated otherwise.</p>
                </div>
                <div class="legal-content-section">
                    <h3>12. 🔹 Limitation of Liability</h3>
                    <p>AI-MALL™/UWO™ shall not be liable for errors in AI outputs, loss of data, revenue, or decisions made based on platform data. Use is at your own risk.</p>
                </div>
                <div class="legal-content-section">
                    <h3>15. 🔹 Governing Law</h3>
                    <p>Governed by the laws of <strong>India</strong>. Disputes subject to <strong>Jabalpur / Delhi</strong> jurisdiction.</p>
                </div>
                <div class="legal-content-section">
                    <h3>17. 🔹 Contact</h3>
                    <p>📧 admin@uwo24.com | 🌐 aimall24.com</p>
                </div>
            </div>
            <div style="text-align: center; margin-top: 20px;">
                <button class="modal-action-btn" onclick="closeLegalModal()">Accept & Close</button>
            </div>
        `,
        privacy: `
            <div class="legal-content-header">
                <h2 class="legal-content-title"><img src="logos/Logo.png" alt="AI-MALL" class="legal-logo-icon"> AI-MALL™ – Privacy Policy</h2>
            </div>
            <div class="legal-content-scroll-box">
                <div class="legal-content-section">
                    <h3>1. Data Collection</h3>
                    <p>We process information required for account registration (name, email) and data generated during your interactions with AI agents to facilitate platform services.</p>
                </div>
                <div class="legal-content-section">
                    <h3>2. Data Sovereignty & Usage</h3>
                    <p>Inputs are used to generate AI outputs via orchestrated models. We do not sell personal data to third parties without consent. Data is processed to improve your individual user experience.</p>
                </div>
                <div class="legal-content-section">
                    <h3>3. Third-Party AI Data Processing</h3>
                    <p>When you utilize third-party AI tools via AI-MALL™, relevant data may be processed by those providers according to their respective privacy policies.</p>
                </div>
                <div class="legal-content-section">
                    <h3>4. Security Measures</h3>
                    <p>We implement industry-standard security to protect your account and data. Users are urged not to upload highly sensitive confidential data unless specifically permitted by their plan.</p>
                </div>
                <div class="legal-content-section">
                    <h3>5. User Rights</h3>
                    <p>You have the right to update your information and discontinue service at any time. For data inquiries, contact us at <strong>admin@uwo24.com</strong>.</p>
                </div>
            </div>
            <div style="text-align: center; margin-top: 20px;">
                <button class="modal-action-btn" onclick="closeLegalModal()">I Understand</button>
            </div>
        `
    };

    window.openLegalModal = function (type) {
        const modal = document.getElementById('legal-modal');
        const contentBox = document.getElementById('legal-modal-content');
        const card = modal?.querySelector('.legal-modal-card');
        if (modal && contentBox && legalContent[type]) {
            contentBox.innerHTML = legalContent[type];
            // Ensure card exists and set attribute before showing
            if (card) {
                card.setAttribute('data-lenis-prevent', 'true');
                card.scrollTop = 0;
            }
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('active'), 10);
            document.body.style.overflow = 'hidden';
            if (window.lenis) window.lenis.stop();
        }
    };

    window.closeLegalModal = function () {
        const modal = document.getElementById('legal-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
                document.body.style.overflow = '';
                if (window.lenis) window.lenis.start();
            }, 500);
        }
    };

    // Keyboard support for Legal Modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') window.closeLegalModal();
    });
    /* ═══════════════════════════════════════════════════════════════
       VISION™ PREMIUM WHITE THEME ENGINE
       Mirroring the A-Series logic but for the Vision section
       ═══════════════════════════════════════════════════════════════ */
    (function initVisionShowcase() {
        const fullImages = window.galleryImages || [
            'aimallproject/slide-1.png', 'aimallproject/slide-2.png',
            'aimallproject/slide-3.png', 'aimallproject/slide-4.png'
        ];
        const IMAGES = fullImages.slice(0, 11);

        let vIndex = 0;
        let vAutoplayTimer = null;
        let vIsAutoPlaying = false;
        let vIsLiked = false;
        let vIsRepeat = false;

        const vWrapper = document.getElementById('vision-carousel-wrapper');
        const vDotsEl = document.getElementById('vision-dots');
        const vPrevBtn = document.getElementById('vision-prev');
        const vNextBtn = document.getElementById('vision-next');
        const vPlayIcon = document.getElementById('vision-play-icon');
        const vPauseIcon = document.getElementById('vision-pause-icon');

        if (!vWrapper) return;

        function buildVisionCards() {
            vWrapper.innerHTML = '';
            IMAGES.forEach((img, i) => {
                const card = document.createElement('div');
                card.className = 'vision-v2-card';
                card.dataset.index = i;
                card.innerHTML = `
                    <img class="vision-v2-card-img" src="${img}" alt="Vision slide ${i + 1}" loading="lazy">
                    <div class="vision-v2-card-overlay">
                        <div class="vision-v2-view-info">View Gallery</div>
                    </div>
                    <div class="vision-v2-card-info">
                        <span class="vision-v2-card-label">Gallery Slide ${i + 1}</span>
                        <span class="vision-v2-card-tag">Intelligence View</span>
                    </div>
                `;
                card.addEventListener('click', () => {
                    const offset = getVisionOffset(i);
                    if (offset === 0) {
                        if (typeof window.openPremiumModal === 'function') {
                            window.openPremiumModal(i);
                        }
                    } else {
                        goToVision(i);
                    }
                });
                vWrapper.appendChild(card);
            });
            buildVisionDots();
            updateVisionOffsets();
        }

        function getVisionOffset(i) {
            let o = i - vIndex;
            const n = IMAGES.length;
            if (o > n / 2) o -= n;
            if (o < -n / 2) o += n;
            return o;
        }

        function updateVisionOffsets() {
            const cards = vWrapper.querySelectorAll('.vision-v2-card');
            cards.forEach((card, i) => {
                const off = getVisionOffset(i);
                card.dataset.offset = Math.max(-2, Math.min(2, off));
            });
            updateVisionDots();
        }

        function buildVisionDots() {
            if (!vDotsEl) return;
            vDotsEl.innerHTML = '';
            IMAGES.forEach((_, i) => {
                const dot = document.createElement('button');
                dot.className = 'vision-v2-dot' + (i === vIndex ? ' active' : '');
                dot.addEventListener('click', () => goToVision(i));
                vDotsEl.appendChild(dot);
            });
        }

        function updateVisionDots() {
            if (!vDotsEl) return;
            const dots = vDotsEl.querySelectorAll('.vision-v2-dot');
            dots.forEach((d, i) => d.classList.toggle('active', i === vIndex));
        }

        function goToVision(idx) {
            vIndex = ((idx % IMAGES.length) + IMAGES.length) % IMAGES.length;
            updateVisionOffsets();
        }

        function goNext() { goToVision(vIndex + 1); }
        function goPrev() { goToVision(vIndex - 1); }

        if (vPrevBtn) vPrevBtn.addEventListener('click', () => { goPrev(); resetVisionAutoplay(); });
        if (vNextBtn) vNextBtn.addEventListener('click', () => { goNext(); resetVisionAutoplay(); });

        /* Touch Swipe for mobile */
        let vTouchStartX = 0;
        if (vWrapper) {
            vWrapper.addEventListener('touchstart', (e) => { vTouchStartX = e.touches[0].clientX; }, { passive: true });
            vWrapper.addEventListener('touchend', (e) => {
                const dx = e.changedTouches[0].clientX - vTouchStartX;
                if (Math.abs(dx) > 40) { dx < 0 ? goNext() : goPrev(); resetVisionAutoplay(); }
            }, { passive: true });
        }

        /* Player logic mirrors a-series */
        function startVisionAutoplay() {
            clearInterval(vAutoplayTimer);
            vIsAutoPlaying = true;
            goNext(); // Immediate transition
            vAutoplayTimer = setInterval(goNext, 2200);
            if (vPlayIcon) vPlayIcon.style.display = 'none';
            if (vPauseIcon) vPauseIcon.style.display = '';
            const btn = document.getElementById('vision-autoplay-btn');
            if (btn) btn.classList.add('active');
        }
        function stopVisionAutoplay() {
            clearInterval(vAutoplayTimer);
            vIsAutoPlaying = false;
            if (vPlayIcon) vPlayIcon.style.display = '';
            if (vPauseIcon) vPauseIcon.style.display = 'none';
            document.getElementById('vision-autoplay-btn')?.classList.remove('active');
        }
        function resetVisionAutoplay() { if (vIsAutoPlaying) { stopVisionAutoplay(); startVisionAutoplay(); } }

        window.toggleVisionAutoplay = function () { vIsAutoPlaying ? stopVisionAutoplay() : startVisionAutoplay(); };
        window.shuffleVisionCarousel = function () {
            goToVision(Math.floor(Math.random() * IMAGES.length));
            resetVisionAutoplay();
        };
        window.toggleVisionRepeat = function () {
            vIsRepeat = !vIsRepeat;
            document.getElementById('vision-repeat-btn')?.classList.toggle('active', vIsRepeat);
        };
        window.toggleVisionLike = function () {
            vIsLiked = !vIsLiked;
            document.getElementById('vision-like-btn')?.classList.toggle('active', vIsLiked);
        };

        let vIsMuted = false;
        window.toggleVisionVolume = function () {
            vIsMuted = !vIsMuted;
            const btn = document.getElementById('vision-volume-btn');
            if (btn) btn.classList.toggle('active', vIsMuted);
        };

        buildVisionCards();
    })();
});


/* ═══════════════════════════════════════════════════════════════
   A-SERIES™ PREMIUM SHOWCASE ENGINE
   Self-initialising — runs after full DOM load
   ═══════════════════════════════════════════════════════════════ */
(function initAseriesShowcase() {

    /* ── Module Data ── */
    const MODULES = [
        {
            label: 'Ai-Hire™',
            tag: 'Recruitment AI',
            img: '/logos/aihire_logo.jpeg',
            desc: 'AI-powered recruitment engine that screens, ranks, and interviews candidates — cutting time-to-hire by 70%.'
        },
        {
            label: 'Ai-Base™',
            tag: 'Knowledge AI',
            img: '/logos/aibase_logo.jpeg',
            desc: 'Enterprise knowledge management powered by RAG. Instantly surface answers from your organization\'s entire data corpus.'
        },
        {
            label: 'Ai-Biz™',
            tag: 'Business AI',
            img: '/logos/aibiz_logo.jpeg',
            desc: 'End-to-end business intelligence module. Automate decisions, forecast trends, and power data-driven growth.'
        },
        {
            label: 'Derm-Foundation™',
            tag: 'Healthcare AI',
            img: '/logos/Derm.jpeg',
            desc: 'Clinical-grade dermatology AI trained on millions of skin pathology cases. Enables early, accurate detection.'
        },
        {
            label: 'Geospatial-Foundation™',
            tag: 'Remote Sensing AI',
            img: '/logos/GEOspatial.jpeg',
            desc: 'Satellite & aerial imagery analysis at enterprise scale. Urban planning, agriculture, environmental monitoring.'
        },
        {
            label: 'Bio-Psync™',
            tag: 'Pathology AI',
            img: '/logos/Biopsync.jpeg',
            desc: 'AI pathology engine for digital biopsy analysis. Accelerates diagnosis with precision histopathology models.'
        },
        {
            label: 'Ai-SuperAssistant™',
            tag: 'Cognitive AI',
            img: '/logos/aipersonal_logo.jpeg',
            desc: 'Omni-channel intelligent assistant with memory, context, and enterprise integrations. Your AI co-pilot.'
        },
        {
            label: 'Ai-Sales™',
            tag: 'Revenue AI',
            img: '/logos/aisales_logo.jpeg',
            desc: 'Predictive sales intelligence that scores leads, drafts outreach, and closes the loop on revenue growth.'
        }
    ];

    /* ── State ── */
    let currentIndex = 0;
    let autoplayTimer = null;
    let isAutoPlaying = false;
    let isLiked = false;
    let isRepeat = false;
    let isMuted = false;
    let dragStartX = 0;
    let isDragging = false;
    let modalIndex = 0;

    /* ── DOM Refs ── */
    const wrapper = document.getElementById('aseries-carousel-wrapper');
    const dotsEl = document.getElementById('aseries-dots');
    const prevBtn = document.getElementById('aseries-prev');
    const nextBtn = document.getElementById('aseries-next');
    const playIcon = document.getElementById('aseries-play-icon');
    const pauseIcon = document.getElementById('aseries-pause-icon');
    const modal = document.getElementById('aseries-modal');
    const modalImg = document.getElementById('aseries-modal-img');
    const modalTitle = document.getElementById('aseries-modal-title');
    const modalDesc = document.getElementById('aseries-modal-desc');
    const modalCtr = document.getElementById('aseries-modal-counter');
    const textCol = document.getElementById('aseries-text-col');
    const carouselCol = wrapper ? wrapper.closest('.aseries-carousel-col') : null;
    const canvas = document.getElementById('aseries-particles');

    if (!wrapper) return; // Not on home page

    /* ══════════════════════════════
       BUILD CAROUSEL CARDS
    ══════════════════════════════ */
    function buildCards() {
        wrapper.innerHTML = '';
        MODULES.forEach((mod, i) => {
            const card = document.createElement('div');
            card.className = 'aseries-card';
            card.dataset.index = i;
            card.innerHTML = `
                <img class="aseries-card-img" src="${mod.img}" alt="${mod.label}" loading="lazy">
                <div class="aseries-card-overlay">
                    <div class="aseries-view-info">View Info</div>
                </div>
                <div class="aseries-card-info">
                    <span class="aseries-card-label">${mod.label}</span>
                    <span class="aseries-card-tag">${mod.tag}</span>
                </div>
            `;
            card.addEventListener('click', () => {
                const offset = getOffset(i);
                if (offset === 0) {
                    openAseriesModal(i);
                } else {
                    goTo(i);
                }
            });
            /* 3D tilt + cursor glow on center card hover */
            card.addEventListener('mousemove', (e) => {
                if (getOffset(i) !== 0) return;
                const rect = card.getBoundingClientRect();
                const cx = ((e.clientX - rect.left) / rect.width) * 100;
                const cy = ((e.clientY - rect.top) / rect.height) * 100;
                card.style.setProperty('--cx', cx + '%');
                card.style.setProperty('--cy', cy + '%');
                const rx = (rect.height / 2 - (e.clientY - rect.top)) / 18;
                const ry = ((e.clientX - rect.left) - rect.width / 2) / 18;
                card.style.transform = `translate(-50%, -50%) scale(1.04) rotateX(${rx}deg) rotateY(${ry}deg)`;
            });
            card.addEventListener('mouseleave', () => {
                if (getOffset(i) !== 0) return;
                // smooth back
                card.style.transform = '';
                setTimeout(() => { updateOffsets(); }, 50);
            });
            wrapper.appendChild(card);
        });
        buildDots();
        updateOffsets();
    }

    function getOffset(i) {
        let o = i - currentIndex;
        const n = MODULES.length;
        if (o > n / 2) o -= n;
        if (o < -n / 2) o += n;
        return o;
    }

    function updateOffsets() {
        const cards = wrapper.querySelectorAll('.aseries-card');
        cards.forEach((card, i) => {
            const off = getOffset(i);
            // clamp display to ±3
            card.dataset.offset = Math.max(-3, Math.min(3, off));
        });
        updateDots();
    }

    function buildDots() {
        dotsEl.innerHTML = '';
        MODULES.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.className = 'aseries-dot' + (i === currentIndex ? ' active' : '');
            dot.setAttribute('aria-label', `Module ${i + 1}`);
            dot.addEventListener('click', () => goTo(i));
            dotsEl.appendChild(dot);
        });
    }

    function updateDots() {
        const dots = dotsEl.querySelectorAll('.aseries-dot');
        dots.forEach((d, i) => d.classList.toggle('active', i === currentIndex));
    }

    function goTo(idx) {
        currentIndex = ((idx % MODULES.length) + MODULES.length) % MODULES.length;
        updateOffsets();
    }

    function goNext() {
        goTo(currentIndex + 1);
        if (modal && modal.classList.contains('open')) {
            modalIndex = currentIndex;
            updateModalContent(modalIndex);
        }
    }
    function goPrev() {
        goTo(currentIndex - 1);
        if (modal && modal.classList.contains('open')) {
            modalIndex = currentIndex;
            updateModalContent(modalIndex);
        }
    }

    /* ══════════════════════════════
       NAVIGATION CONTROLS
    ══════════════════════════════ */
    if (prevBtn) prevBtn.addEventListener('click', () => { goPrev(); resetAutoplay(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { goNext(); resetAutoplay(); });

    /* ══════════════════════════════
       DRAG / SWIPE
    ══════════════════════════════ */
    wrapper.addEventListener('mousedown', (e) => { isDragging = true; dragStartX = e.clientX; });
    wrapper.addEventListener('mousemove', (e) => { if (!isDragging) return; e.preventDefault(); });
    wrapper.addEventListener('mouseup', (e) => {
        if (!isDragging) return;
        isDragging = false;
        const dx = e.clientX - dragStartX;
        if (Math.abs(dx) > 40) { dx < 0 ? goNext() : goPrev(); resetAutoplay(); }
    });
    wrapper.addEventListener('mouseleave', () => { isDragging = false; });

    wrapper.addEventListener('touchstart', (e) => { dragStartX = e.touches[0].clientX; }, { passive: true });
    wrapper.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].clientX - dragStartX;
        if (Math.abs(dx) > 40) { dx < 0 ? goNext() : goPrev(); resetAutoplay(); }
    }, { passive: true });

    /* ══════════════════════════════
       AUTOPLAY
    ══════════════════════════════ */
    function startAutoplay() {
        clearInterval(autoplayTimer);
        isAutoPlaying = true;
        goNext(); // Immediate transition
        autoplayTimer = setInterval(goNext, 2800);

        // Handle icons in main section
        if (playIcon) playIcon.style.display = 'none';
        if (pauseIcon) pauseIcon.style.display = '';

        // Handle icons in modal if open
        const mpIcon = document.getElementById('aseries-modal-play-icon');
        const msIcon = document.getElementById('aseries-modal-pause-icon');
        if (mpIcon) mpIcon.style.display = 'none';
        if (msIcon) msIcon.style.display = 'block';

        const b = document.getElementById('aseries-autoplay-btn');
        if (b) b.classList.add('active');
    }
    function stopAutoplay() {
        clearInterval(autoplayTimer);
        isAutoPlaying = false;

        // Handle icons in main section
        if (playIcon) playIcon.style.display = '';
        if (pauseIcon) pauseIcon.style.display = 'none';

        // Handle icons in modal if open
        const mpIcon = document.getElementById('aseries-modal-play-icon');
        const msIcon = document.getElementById('aseries-modal-pause-icon');
        if (mpIcon) mpIcon.style.display = 'block';
        if (msIcon) msIcon.style.display = 'none';

        const b = document.getElementById('aseries-autoplay-btn');
        if (b) b.classList.remove('active');
    }
    function resetAutoplay() { if (isAutoPlaying) { stopAutoplay(); startAutoplay(); } }

    window.toggleAseriesAutoplay = function () {
        isAutoPlaying ? stopAutoplay() : startAutoplay();
    };
    window.shuffleAseriesCarousel = function () {
        goTo(Math.floor(Math.random() * MODULES.length));
        resetAutoplay();
        const btn = document.getElementById('aseries-shuffle-btn');
        if (btn) { btn.classList.add('active'); setTimeout(() => btn.classList.remove('active'), 700); }
    };
    window.toggleAseriesRepeat = function () {
        isRepeat = !isRepeat;
        const btn = document.getElementById('aseries-repeat-btn');
        if (btn) btn.classList.toggle('active', isRepeat);
    };
    window.toggleAseriesLike = function () {
        isLiked = !isLiked;
        const btns = document.querySelectorAll('#aseries-like-btn, .aseries-modal-footer .aseries-modal-ctrl-btn:first-child');
        btns.forEach(b => {
            b.classList.toggle('active', isLiked);
            b.querySelector('svg path') && (b.querySelector('svg path').style.fill = isLiked ? '#f43f5e' : 'none');
        });
    };
    window.toggleAseriesVolume = function () {
        isMuted = !isMuted;
        const btns = document.querySelectorAll('#aseries-volume-btn, #aseries-modal-volume-btn');
        btns.forEach(b => b.classList.toggle('active', isMuted));
    };

    /* ══════════════════════════════
       FULLSCREEN MODAL
    ══════════════════════════════ */
    function updateModalContent(idx) {
        const mod = MODULES[idx];
        if (!mod) return;
        if (modalImg) {
            modalImg.style.opacity = '0';
            requestAnimationFrame(() => {
                modalImg.src = mod.img;
                modalImg.onload = () => { modalImg.style.opacity = '1'; };
                if (modalImg.complete) modalImg.style.opacity = '1';
            });
        }
        if (modalTitle) modalTitle.textContent = mod.label;
        if (modalDesc) modalDesc.textContent = mod.desc;
        if (modalCtr) modalCtr.textContent = `${idx + 1} / ${MODULES.length}`;
    }

    window.openAseriesModal = function (idx) {
        modalIndex = (idx !== undefined) ? idx : currentIndex;
        updateModalContent(modalIndex);
        if (modal) {
            modal.classList.add('open');
            document.body.classList.add('modal-active');
            modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        }
    };
    window.closeAseriesModal = function () {
        if (modal) {
            modal.classList.remove('open');
            document.body.classList.remove('modal-active');
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }
    };
    window.nextAseriesModal = function () {
        modalIndex = (modalIndex + 1) % MODULES.length;
        updateModalContent(modalIndex);
        goTo(modalIndex); // Keep main carousel in sync
    };
    window.prevAseriesModal = function () {
        modalIndex = (modalIndex - 1 + MODULES.length) % MODULES.length;
        updateModalContent(modalIndex);
        goTo(modalIndex); // Keep main carousel in sync
    };

    /* Keyboard nav for modal */
    document.addEventListener('keydown', (e) => {
        if (!modal || !modal.classList.contains('open')) return;
        if (e.key === 'ArrowRight') window.nextAseriesModal();
        if (e.key === 'ArrowLeft') window.prevAseriesModal();
        if (e.key === 'Escape') window.closeAseriesModal();
    });

    /* ══════════════════════════════
       PARTICLE CANVAS
    ══════════════════════════════ */
    function initParticles() {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const PARTICLE_COUNT = 80;
        const particles = [];

        function resize() {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        }
        resize();
        window.addEventListener('resize', resize);

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                r: Math.random() * 1.8 + 0.3,
                vx: (Math.random() - 0.5) * 0.35,
                vy: (Math.random() - 0.5) * 0.35,
                alpha: Math.random() * 0.6 + 0.15,
                hue: Math.random() > 0.5 ? 250 : 280  // indigo or violet
            });
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${p.alpha})`;
                ctx.fill();

                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;
            });

            // draw connecting lines between nearby particles
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 100) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(129,140,248,${(1 - dist / 100) * 0.18})`;
                        ctx.lineWidth = 0.8;
                        ctx.stroke();
                    }
                }
            }
            requestAnimationFrame(draw);
        }
        draw();
    }

    /* ══════════════════════════════
       SCROLL REVEAL ENTRANCE
    ══════════════════════════════ */
    function setupReveal() {
        const section = document.getElementById('a-series');
        if (!section) return;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (textCol) textCol.classList.add('revealed');
                    if (carouselCol) carouselCol.classList.add('revealed');
                    observer.disconnect();
                    // Start autoplay on enter
                    setTimeout(() => startAutoplay(), 1200);
                }
            });
        }, { threshold: 0.25 });
        observer.observe(section);
    }

    buildCards();
    initParticles();
    setupReveal();
})();
