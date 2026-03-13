/* ======================================================
   Zachary Eldred Photography — Main JS v2
   GSAP-powered interactions & animations
   ====================================================== */

(function () {
  'use strict';

  /* ---------- Utility ---------- */
  const qs  = (s, c) => (c || document).querySelector(s);
  const qsa = (s, c) => [...(c || document).querySelectorAll(s)];
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

  /* ---------- Register GSAP Plugins ---------- */
  gsap.registerPlugin(ScrollTrigger);
  if (typeof Flip !== 'undefined') gsap.registerPlugin(Flip);

  /* ==============================================
     1. LOADING SCREEN
     ============================================== */
  function initLoader() {
    const loader = qs('#loader');
    if (!loader) return Promise.resolve();

    return new Promise(resolve => {
      const tl = gsap.timeline({
        onComplete() {
          gsap.to(loader, {
            opacity: 0,
            duration: 0.6,
            ease: 'power2.inOut',
            onComplete() {
              loader.style.display = 'none';
              resolve();
            }
          });
        }
      });

      // Animate the SVG letters
      const letters = qsa('.loader__letter', loader);
      const line = qs('.loader__line', loader);

      // Draw in the line
      if (line) {
        tl.to(line, { strokeDashoffset: 0, duration: 0.8, ease: 'power2.out' }, 0);
      }

      // Fade in letters
      if (letters.length) {
        tl.to(letters, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.15,
          ease: 'power3.out'
        }, 0.3);
      }

      // Hold for a beat
      tl.to({}, { duration: 0.5 });
    });
  }

  /* ==============================================
     2. CUSTOM CURSOR WITH LIGHT TRAIL
     ============================================== */
  function initCursor() {
    const cursor = qs('#cursor');
    if (!cursor || window.matchMedia('(max-width: 600px)').matches) return;

    const dot  = qs('.cursor__dot', cursor);
    const ring = qs('.cursor__ring', cursor);

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let cx = mx, cy = my;
    let trailDots = [];
    const TRAIL_COUNT = 8;

    // Create trail particles
    for (let i = 0; i < TRAIL_COUNT; i++) {
      const d = document.createElement('div');
      d.className = 'cursor-trail-dot';
      d.style.opacity = '0';
      document.body.appendChild(d);
      trailDots.push({ el: d, x: mx, y: my });
    }

    document.addEventListener('mousemove', e => {
      mx = e.clientX;
      my = e.clientY;
    });

    document.addEventListener('mousedown', () => cursor.classList.add('cursor--click'));
    document.addEventListener('mouseup', () => cursor.classList.remove('cursor--click'));

    // Hover targets
    const hoverTargets = 'a, button, .filter-btn, .gallery-item, .gallery-h-item, .view-btn, .inspo-tag, .form-submit, .nav__toggle, .tag';
    document.addEventListener('mouseover', e => {
      if (e.target.closest(hoverTargets)) cursor.classList.add('cursor--hover');
    });
    document.addEventListener('mouseout', e => {
      if (e.target.closest(hoverTargets)) cursor.classList.remove('cursor--hover');
    });

    // Animation loop
    function tick() {
      cx = lerp(cx, mx, 0.15);
      cy = lerp(cy, my, 0.15);

      cursor.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
      ring.style.transform = `translate3d(${cx - mx}px, ${cy - my}px, 0)`;

      // Trail
      for (let i = trailDots.length - 1; i > 0; i--) {
        trailDots[i].x = lerp(trailDots[i].x, trailDots[i - 1].x, 0.35);
        trailDots[i].y = lerp(trailDots[i].y, trailDots[i - 1].y, 0.35);
      }
      trailDots[0].x = lerp(trailDots[0].x, mx, 0.4);
      trailDots[0].y = lerp(trailDots[0].y, my, 0.4);

      trailDots.forEach((d, i) => {
        d.el.style.transform = `translate3d(${d.x}px, ${d.y}px, 0)`;
        d.el.style.opacity = String(0.12 - i * 0.014);
      });

      requestAnimationFrame(tick);
    }
    tick();
  }

  /* ==============================================
     3. MAGNETIC BUTTONS
     ============================================== */
  function initMagnetic() {
    if (window.matchMedia('(max-width: 600px)').matches) return;

    qsa('.magnetic').forEach(el => {
      const strength = parseFloat(el.dataset.strength) || 0.3;

      el.addEventListener('mousemove', e => {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) * strength;
        const dy = (e.clientY - cy) * strength;
        gsap.to(el, { x: dx, y: dy, duration: 0.3, ease: 'power2.out' });
      });

      el.addEventListener('mouseleave', () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
      });
    });
  }

  /* ==============================================
     4. TEXT SCRAMBLE / DECODE ANIMATION
     ============================================== */
  function initTextScramble() {
    const el = qs('#heroName');
    if (!el) return;

    const text = (el.dataset.text || el.textContent).replace('|', '\n');
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';

    // Build character spans
    el.innerHTML = '';
    const lines = text.split('\n');

    lines.forEach((line, li) => {
      line.split('').forEach(ch => {
        const span = document.createElement('span');
        span.className = 'char';
        span.dataset.char = ch;
        span.textContent = ch === ' ' ? '\u00A0' : chars[Math.floor(Math.random() * chars.length)];
        el.appendChild(span);
      });
      if (li < lines.length - 1) el.appendChild(document.createElement('br'));
    });

    el.style.opacity = '1';

    const charSpans = qsa('.char', el);
    charSpans.forEach((span, i) => {
      const finalChar = span.dataset.char === ' ' ? '\u00A0' : span.dataset.char;
      const delay = 0.6 + i * 0.04;
      let iterations = 0;
      const maxIterations = 4 + Math.floor(Math.random() * 4);

      gsap.to(span, {
        opacity: 1,
        duration: 0.05,
        delay: delay - 0.1
      });

      const interval = setInterval(() => {
        if (iterations >= maxIterations) {
          span.textContent = finalChar;
          clearInterval(interval);
          return;
        }
        span.textContent = chars[Math.floor(Math.random() * chars.length)];
        iterations++;
      }, 50);

      setTimeout(() => {
        clearInterval(interval);
        span.textContent = finalChar;
      }, (delay + 0.3) * 1000);
    });
  }

  /* ==============================================
     5. ANIMATED GRADIENT MESH (Hero Canvas)
     ============================================== */
  function initHeroMesh() {
    const canvas = qs('#heroMesh');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let w, h;

    function resize() {
      w = canvas.width  = canvas.parentElement.offsetWidth;
      h = canvas.height = canvas.parentElement.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Organic blobs
    const blobs = [
      { x: 0.3, y: 0.4, r: 0.4, speed: 0.0003, phase: 0 },
      { x: 0.7, y: 0.6, r: 0.35, speed: 0.0004, phase: 2 },
      { x: 0.5, y: 0.3, r: 0.3, speed: 0.0005, phase: 4 },
      { x: 0.2, y: 0.7, r: 0.25, speed: 0.00035, phase: 1 },
    ];

    function draw(time) {
      ctx.clearRect(0, 0, w, h);

      blobs.forEach(b => {
        const bx = (b.x + Math.sin(time * b.speed + b.phase) * 0.15) * w;
        const by = (b.y + Math.cos(time * b.speed * 0.8 + b.phase) * 0.1) * h;
        const br = b.r * Math.min(w, h);

        const grad = ctx.createRadialGradient(bx, by, 0, bx, by, br);
        grad.addColorStop(0, 'rgba(40, 40, 40, 0.5)');
        grad.addColorStop(0.5, 'rgba(25, 25, 25, 0.3)');
        grad.addColorStop(1, 'rgba(10, 10, 10, 0)');

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      });

      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  /* ==============================================
     6. PAGE TRANSITIONS
     ============================================== */
  function initPageTransitions() {
    const overlay = qs('#pageTransition');
    if (!overlay) return;

    // Intercept internal links
    qsa('a[href]').forEach(link => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) return;

      link.addEventListener('click', e => {
        e.preventDefault();

        const tl = gsap.timeline();
        tl.to(overlay, {
          scaleX: 1,
          duration: 0.5,
          ease: 'power3.inOut',
          onComplete() { window.location.href = href; }
        });
      });
    });

    // Entry animation — wipe out
    gsap.set(overlay, { scaleX: 1, transformOrigin: 'right' });
    gsap.to(overlay, {
      scaleX: 0,
      duration: 0.6,
      ease: 'power3.inOut',
      delay: 0.1
    });
  }

  /* ==============================================
     7. NAVIGATION
     ============================================== */
  function initNav() {
    const nav = qs('.nav');
    const toggle = qs('.nav__toggle');
    const links = qs('.nav__links');
    if (!nav) return;

    // Scroll behaviour
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      nav.classList.toggle('nav--scrolled', window.scrollY > 60);
      lastScroll = window.scrollY;
    });

    // Mobile toggle
    if (toggle && links) {
      toggle.addEventListener('click', () => {
        toggle.classList.toggle('open');
        links.classList.toggle('open');
      });

      qsa('a', links).forEach(a => {
        a.addEventListener('click', () => {
          toggle.classList.remove('open');
          links.classList.remove('open');
        });
      });
    }
  }

  /* ==============================================
     8. HERO SCROLL ANIMATIONS
     ============================================== */
  function initHeroAnimations() {
    const hero = qs('.hero');
    if (!hero) return;

    // Hero content reveal
    const greeting = qs('.hero__greeting', hero);
    const line     = qs('.hero__line', hero);
    const tagline  = qs('.hero__tagline', hero);
    const scroll   = qs('.hero__scroll', hero);

    const tl = gsap.timeline({ delay: 1.2 });

    if (greeting) tl.to(greeting, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 0);
    if (line) tl.to(line, { opacity: 1, scaleX: 1, duration: 0.8, ease: 'power3.out' }, 0.4);
    if (tagline) tl.to(tagline, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 0.6);
    if (scroll) tl.to(scroll, { opacity: 1, duration: 0.8, ease: 'power2.out' }, 1);

    // Hero mouse glow
    const glow = qs('#heroMouseGlow');
    if (glow) {
      hero.addEventListener('mousemove', e => {
        gsap.to(glow, {
          left: e.clientX,
          top: e.clientY,
          duration: 0.6,
          ease: 'power2.out'
        });
      });
    }
  }

  /* ==============================================
     9. SCROLL TRIGGER REVEALS
     ============================================== */
  function initScrollReveals() {
    // General section reveals
    qsa('.about, .stats, .work-preview, .contact-section, .gallery-hero, .gallery-controls, .gear, .process').forEach(section => {
      gsap.from(section, {
        scrollTrigger: {
          trigger: section,
          start: 'top 85%',
          once: true
        },
        opacity: 0,
        y: 40,
        duration: 0.8,
        ease: 'power3.out'
      });
    });

    // Image reveals
    qsa('.image-reveal').forEach(el => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 80%',
        once: true,
        onEnter() { el.classList.add('revealed'); }
      });
    });

    // Gallery items stagger
    const galleryItems = qsa('.gallery-item');
    if (galleryItems.length) {
      gsap.from(galleryItems, {
        scrollTrigger: {
          trigger: qs('.gallery-grid'),
          start: 'top 80%',
          once: true
        },
        opacity: 0,
        y: 30,
        duration: 0.5,
        stagger: 0.06,
        ease: 'power3.out'
      });
    }

    // Work preview items
    qsa('.work-preview__item').forEach((item, i) => {
      gsap.from(item, {
        scrollTrigger: {
          trigger: item,
          start: 'top 85%',
          once: true
        },
        opacity: 0,
        y: 30,
        scale: 0.97,
        duration: 0.6,
        delay: i * 0.08,
        ease: 'power3.out'
      });
    });

    // Tags
    qsa('.tag, .inspo-tag').forEach((tag, i) => {
      gsap.from(tag, {
        scrollTrigger: {
          trigger: tag,
          start: 'top 90%',
          once: true
        },
        opacity: 0,
        x: -10,
        duration: 0.3,
        delay: i * 0.03,
        ease: 'power2.out'
      });
    });
  }

  /* ==============================================
     10. STAT COUNTER ANIMATION
     ============================================== */
  function initCounters() {
    qsa('.stat__number[data-target]').forEach(el => {
      const target = parseInt(el.dataset.target, 10);

      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        once: true,
        onEnter() {
          const obj = { val: 0 };
          gsap.to(obj, {
            val: target,
            duration: 1.8,
            ease: 'power2.out',
            onUpdate() {
              el.textContent = Math.round(obj.val);
            }
          });
        }
      });
    });
  }

  /* ==============================================
     11. 3D TILT ON GALLERY ITEMS
     ============================================== */
  function initTilt() {
    if (window.matchMedia('(max-width: 600px)').matches) return;

    qsa('.tilt-card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const rx = -(e.clientY - cy) / rect.height * 10;
        const ry =  (e.clientX - cx) / rect.width * 10;

        gsap.to(card, {
          rotateX: rx,
          rotateY: ry,
          duration: 0.4,
          ease: 'power2.out',
          transformPerspective: 800
        });
      });

      card.addEventListener('mouseleave', () => {
        gsap.to(card, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.6,
          ease: 'elastic.out(1, 0.6)',
          transformPerspective: 800
        });
      });
    });
  }

  /* ==============================================
     12. GSAP FILTER TRANSITIONS (Gallery)
     ============================================== */
  function initFilterTransitions() {
    const grid = qs('#galleryGrid');
    const filters = qsa('.filter-btn[data-filter]');
    if (!grid || !filters.length) return;

    filters.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;

        // Update active state
        filters.forEach(f => f.classList.remove('active'));
        btn.classList.add('active');

        const items = qsa('.gallery-item', grid);

        // If Flip is available use it — otherwise simple fade
        if (typeof Flip !== 'undefined') {
          const state = Flip.getState(items);

          items.forEach(item => {
            const match = filter === 'all' || item.dataset.category === filter;
            item.style.display = match ? '' : 'none';
          });

          Flip.from(state, {
            duration: 0.5,
            ease: 'power2.inOut',
            stagger: 0.03,
            absolute: true,
            onEnter: elements => gsap.fromTo(elements, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.4 }),
            onLeave: elements => gsap.to(elements, { opacity: 0, scale: 0.9, duration: 0.3 })
          });
        } else {
          // Fallback: simple hide/show
          items.forEach(item => {
            const match = filter === 'all' || item.dataset.category === filter;
            gsap.to(item, {
              opacity: match ? 1 : 0,
              scale: match ? 1 : 0.9,
              duration: 0.3,
              ease: 'power2.inOut',
              onComplete() {
                item.style.display = match ? '' : 'none';
              }
            });
          });
        }
      });
    });
  }

  /* ==============================================
     13. GSAP LIGHTBOX
     ============================================== */
  function initLightbox() {
    const lightbox  = qs('#lightbox');
    if (!lightbox) return;

    const backdrop  = qs('.lightbox__backdrop', lightbox);
    const imageWrap = qs('.lightbox__image-wrap', lightbox);
    const content   = qs('.lightbox__content', lightbox);
    const closeBtn  = qs('.lightbox__close', lightbox);
    const info      = qs('.lightbox__info', lightbox);
    const titleEl   = qs('#lightboxTitle');
    const catEl     = qs('#lightboxCat');
    const prevBtn   = qs('#lightboxPrev');
    const nextBtn   = qs('#lightboxNext');

    let galleryItems = [];
    let currentIndex = 0;

    // Gather clickable items
    function gatherItems() {
      galleryItems = qsa('.gallery-item, .gallery-h-item');
    }

    function openLightbox(item, index) {
      currentIndex = index;
      const overlay = qs('.gallery-item__overlay span', item);
      if (titleEl) titleEl.textContent = overlay ? overlay.textContent : '';
      if (catEl) catEl.textContent = item.dataset.category || '';
      if (content) content.textContent = overlay ? overlay.textContent : 'Image Preview';

      const rect = item.getBoundingClientRect();

      lightbox.classList.add('open');

      const tl = gsap.timeline();
      tl.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' }, 0);
      tl.fromTo(imageWrap, {
        scale: 0.5,
        opacity: 0,
        x: rect.left + rect.width / 2 - window.innerWidth / 2,
        y: rect.top + rect.height / 2 - window.innerHeight / 2,
      }, {
        scale: 1,
        opacity: 1,
        x: 0, y: 0,
        duration: 0.6,
        ease: 'power3.out'
      }, 0.1);
      tl.fromTo(info, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4 }, 0.4);
    }

    function closeLightbox() {
      const tl = gsap.timeline({
        onComplete() { lightbox.classList.remove('open'); }
      });
      tl.to(imageWrap, { scale: 0.8, opacity: 0, duration: 0.35, ease: 'power3.in' }, 0);
      tl.to(backdrop, { opacity: 0, duration: 0.3 }, 0.1);
      tl.to(info, { opacity: 0, duration: 0.2 }, 0);
    }

    function navigateLB(dir) {
      currentIndex = (currentIndex + dir + galleryItems.length) % galleryItems.length;
      const item = galleryItems[currentIndex];
      const overlay = qs('.gallery-item__overlay span', item);
      if (titleEl) titleEl.textContent = overlay ? overlay.textContent : '';
      if (catEl) catEl.textContent = item.dataset.category || '';
      if (content) content.textContent = overlay ? overlay.textContent : 'Image Preview';

      gsap.fromTo(imageWrap, { opacity: 0, x: dir * 40 }, { opacity: 1, x: 0, duration: 0.35, ease: 'power2.out' });
    }

    // Event bindings
    gatherItems();
    galleryItems.forEach((item, i) => {
      item.addEventListener('click', () => openLightbox(item, i));
    });

    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    if (backdrop) backdrop.addEventListener('click', closeLightbox);
    if (prevBtn) prevBtn.addEventListener('click', () => navigateLB(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => navigateLB(1));

    // Keyboard
    document.addEventListener('keydown', e => {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') navigateLB(-1);
      if (e.key === 'ArrowRight') navigateLB(1);
    });
  }

  /* ==============================================
     14. DRAG-TO-SCROLL HORIZONTAL GALLERY
     ============================================== */
  function initDragScroll() {
    const track = qs('#horizontalTrack');
    if (!track) return;

    let isDown = false, startX, scrollLeft;

    track.addEventListener('mousedown', e => {
      isDown = true;
      track.style.cursor = 'grabbing';
      startX = e.pageX - track.parentElement.offsetLeft;
      scrollLeft = track.parentElement.scrollLeft;
    });

    document.addEventListener('mouseup', () => {
      isDown = false;
      if (track) track.style.cursor = 'grab';
    });

    track.parentElement.addEventListener('mousemove', e => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - track.parentElement.offsetLeft;
      const walk = (x - startX) * 1.5;
      track.parentElement.scrollLeft = scrollLeft - walk;
    });

    // Allow scrolling horizontally
    track.parentElement.style.overflowX = 'auto';
    track.parentElement.style.scrollbarWidth = 'none';
    track.parentElement.style.msOverflowStyle = 'none';
  }

  /* ==============================================
     15. VIEW TOGGLE (Grid ↔ Horizontal)
     ============================================== */
  function initViewToggle() {
    const btns  = qsa('.view-btn[data-view]');
    const grid  = qs('#galleryGrid');
    const horiz = qs('#galleryHorizontal');
    if (!btns.length || !grid) return;

    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const view = btn.dataset.view;

        if (view === 'grid') {
          gsap.to(horiz, { opacity: 0, duration: 0.3, onComplete() { horiz.style.display = 'none'; } });
          grid.style.display = '';
          gsap.fromTo(grid, { opacity: 0 }, { opacity: 1, duration: 0.4 });
        } else {
          gsap.to(grid, { opacity: 0, duration: 0.3, onComplete() { grid.style.display = 'none'; } });
          horiz.style.display = '';
          gsap.fromTo(horiz, { opacity: 0 }, { opacity: 1, duration: 0.4 });
        }
      });
    });
  }

  /* ==============================================
     16. GLOW EFFECT TRACKING
     ============================================== */
  function initGlowTracking() {
    qsa('.glow-target, .glow-subtle').forEach(el => {
      el.addEventListener('mousemove', e => {
        const rect = el.getBoundingClientRect();
        el.style.setProperty('--glow-x', (e.clientX - rect.left) + 'px');
        el.style.setProperty('--glow-y', (e.clientY - rect.top) + 'px');
      });
    });
  }

  /* ==============================================
     17. PARALLAX LAYERS
     ============================================== */
  function initParallax() {
    qsa('.parallax-layer[data-speed]').forEach(layer => {
      const speed = parseFloat(layer.dataset.speed) || 0.5;
      gsap.to(layer, {
        y: () => window.innerHeight * speed * 0.3,
        ease: 'none',
        scrollTrigger: {
          trigger: layer.parentElement,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });
    });
  }

  /* ==============================================
     18. INSPO BOARD (Contact Page)
     ============================================== */
  function initInspoBoard() {
    const container = qs('#inspoLinks');
    const addBtn    = qs('#addInspoBtn');
    if (!container || !addBtn) return;

    function createEntry() {
      const entry = document.createElement('div');
      entry.className = 'inspo-link-entry';
      entry.innerHTML = `
        <input type="url" placeholder="Paste a link…" />
        <select>
          <option value="">Category</option>
          <option value="lighting">Lighting</option>
          <option value="composition">Composition</option>
          <option value="color">Color/Tone</option>
          <option value="mood">Mood/Feel</option>
          <option value="style">Style/Genre</option>
        </select>
        <button type="button" class="inspo-link-remove" aria-label="Remove">×</button>
      `;
      entry.querySelector('.inspo-link-remove').addEventListener('click', () => {
        gsap.to(entry, {
          opacity: 0, height: 0, marginBottom: 0,
          duration: 0.3,
          onComplete() { entry.remove(); }
        });
      });
      container.appendChild(entry);
      gsap.fromTo(entry, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.3 });
    }

    addBtn.addEventListener('click', createEntry);

    // Remove buttons for initial entries
    qsa('.inspo-link-remove', container).forEach(btn => {
      btn.addEventListener('click', () => {
        const entry = btn.closest('.inspo-link-entry');
        gsap.to(entry, {
          opacity: 0, height: 0, marginBottom: 0,
          duration: 0.3,
          onComplete() { entry.remove(); }
        });
      });
    });

    // Quick-select tags
    qsa('.inspo-tag').forEach(tag => {
      tag.addEventListener('click', () => tag.classList.toggle('selected'));
    });
  }

  /* ==============================================
     19. CONTACT FORM HANDLER
     ============================================== */

  /* ==============================================
     20. THREE.JS 3D CAMERA MODEL (Sony A7R III)
     ============================================== */
  function initCameraModel() {
    const canvas = qs('#cameraCanvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const wrap = canvas.parentElement;
    let w = wrap.offsetWidth;
    let h = wrap.offsetHeight;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const cam = new THREE.PerspectiveCamera(35, w / h, 0.1, 100);
    cam.position.set(3.5, 2.2, 4.5);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    // Controls
    let controls;
    if (typeof THREE.OrbitControls !== 'undefined') {
      controls = new THREE.OrbitControls(cam, canvas);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 1.2;
      controls.minPolarAngle = Math.PI * 0.3;
      controls.maxPolarAngle = Math.PI * 0.65;
    }

    // Materials
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.35,
      metalness: 0.8,
    });
    const gripMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.9,
      metalness: 0.05,
    });
    const lensMat = new THREE.MeshStandardMaterial({
      color: 0x0d0d0d,
      roughness: 0.25,
      metalness: 0.9,
    });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x1a1a3a,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.6,
      thickness: 0.5,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.5,
      metalness: 0.7,
    });
    const mountMat = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.3,
      metalness: 0.9,
    });

    // Build camera group
    const cameraGroup = new THREE.Group();

    // -- Body (main block)
    const bodyW = 1.28, bodyH = 0.96, bodyD = 0.6;
    const bodyGeo = new THREE.BoxGeometry(bodyW, bodyH, bodyD, 2, 2, 2);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    cameraGroup.add(body);

    // -- Top plate (slightly raised)
    const topGeo = new THREE.BoxGeometry(bodyW * 0.98, 0.06, bodyD * 0.92);
    const top = new THREE.Mesh(topGeo, accentMat);
    top.position.y = bodyH / 2 + 0.03;
    cameraGroup.add(top);

    // -- Viewfinder bump (EVF)
    const evfGeo = new THREE.BoxGeometry(0.22, 0.15, 0.12);
    const evf = new THREE.Mesh(evfGeo, bodyMat);
    evf.position.set(0, bodyH / 2 + 0.06 + 0.075, -bodyD / 2 + 0.06);
    cameraGroup.add(evf);

    // -- EVF eyecup
    const eyecupGeo = new THREE.BoxGeometry(0.26, 0.12, 0.06);
    const eyecup = new THREE.Mesh(eyecupGeo, gripMat);
    eyecup.position.set(0, bodyH / 2 + 0.12, -bodyD / 2 + 0.0);
    cameraGroup.add(eyecup);

    // -- Hot shoe on top
    const shoeGeo = new THREE.BoxGeometry(0.18, 0.02, 0.16);
    const shoe = new THREE.Mesh(shoeGeo, mountMat);
    shoe.position.set(0, bodyH / 2 + 0.07, 0.05);
    cameraGroup.add(shoe);

    // -- Mode dial (top left)
    const dialGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.04, 24);
    const dial1 = new THREE.Mesh(dialGeo, accentMat);
    dial1.position.set(-0.42, bodyH / 2 + 0.08, 0.12);
    cameraGroup.add(dial1);

    // -- Shutter button (top right)
    const shutterGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.03, 16);
    const shutter = new THREE.Mesh(shutterGeo, mountMat);
    shutter.position.set(0.42, bodyH / 2 + 0.08, 0.18);
    cameraGroup.add(shutter);

    // -- Control dial (top right)
    const dial2Geo = new THREE.CylinderGeometry(0.06, 0.06, 0.04, 24);
    const dial2 = new THREE.Mesh(dial2Geo, accentMat);
    dial2.position.set(0.42, bodyH / 2 + 0.08, -0.05);
    cameraGroup.add(dial2);

    // -- Grip (right side, front)
    const gripGeo = new THREE.BoxGeometry(0.18, bodyH * 0.85, bodyD * 0.7);
    const grip = new THREE.Mesh(gripGeo, gripMat);
    grip.position.set(bodyW / 2 + 0.05, -0.04, 0.06);
    cameraGroup.add(grip);

    // -- Grip contour (rounded front)
    const gripFrontGeo = new THREE.CylinderGeometry(0.08, 0.08, bodyH * 0.85, 12, 1, false, 0, Math.PI);
    const gripFront = new THREE.Mesh(gripFrontGeo, gripMat);
    gripFront.rotation.z = Math.PI / 2;
    gripFront.rotation.y = Math.PI / 2;
    gripFront.position.set(bodyW / 2 + 0.14, -0.04, 0.06);
    cameraGroup.add(gripFront);

    // -- Lens mount ring (front)
    const mountGeo = new THREE.TorusGeometry(0.25, 0.025, 16, 48);
    const mount = new THREE.Mesh(mountGeo, mountMat);
    mount.position.set(-0.04, 0, bodyD / 2 + 0.01);
    cameraGroup.add(mount);

    // -- Lens barrel (cylinder)
    const lensBarrelGeo = new THREE.CylinderGeometry(0.24, 0.22, 0.7, 32);
    const lensBarrel = new THREE.Mesh(lensBarrelGeo, lensMat);
    lensBarrel.rotation.x = Math.PI / 2;
    lensBarrel.position.set(-0.04, 0, bodyD / 2 + 0.35);
    lensBarrel.castShadow = true;
    cameraGroup.add(lensBarrel);

    // -- Lens focus ring
    const focusRingGeo = new THREE.TorusGeometry(0.245, 0.015, 12, 48);
    const focusRing = new THREE.Mesh(focusRingGeo, gripMat);
    focusRing.position.set(-0.04, 0, bodyD / 2 + 0.18);
    cameraGroup.add(focusRing);

    // -- Lens zoom ring
    const zoomRingGeo = new THREE.TorusGeometry(0.235, 0.012, 12, 48);
    const zoomRing = new THREE.Mesh(zoomRingGeo, gripMat);
    zoomRing.position.set(-0.04, 0, bodyD / 2 + 0.50);
    cameraGroup.add(zoomRing);

    // -- Lens hood (front wider barrel)
    const hoodGeo = new THREE.CylinderGeometry(0.27, 0.24, 0.15, 32, 1, true);
    const hood = new THREE.Mesh(hoodGeo, lensMat);
    hood.rotation.x = Math.PI / 2;
    hood.position.set(-0.04, 0, bodyD / 2 + 0.72);
    cameraGroup.add(hood);

    // -- Front glass element
    const glassGeo = new THREE.CircleGeometry(0.2, 32);
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(-0.04, 0, bodyD / 2 + 0.78);
    cameraGroup.add(glass);

    // -- Inner lens ring (decorative)
    const innerRingGeo = new THREE.TorusGeometry(0.14, 0.008, 8, 32);
    const innerRing = new THREE.Mesh(innerRingGeo, mountMat);
    innerRing.position.set(-0.04, 0, bodyD / 2 + 0.785);
    cameraGroup.add(innerRing);

    // -- Screen on back
    const screenGeo = new THREE.PlaneGeometry(0.7, 0.5);
    const screenMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a12,
      roughness: 0.1,
      metalness: 0.3,
      emissive: 0x050510,
      emissiveIntensity: 0.3,
    });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(0.02, -0.04, -bodyD / 2 - 0.005);
    screen.rotation.y = Math.PI;
    cameraGroup.add(screen);

    // -- Sony badge (small box on front)
    const badgeGeo = new THREE.BoxGeometry(0.18, 0.03, 0.005);
    const badgeMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.9, roughness: 0.3 });
    const badge = new THREE.Mesh(badgeGeo, badgeMat);
    badge.position.set(0.35, 0.28, bodyD / 2 + 0.002);
    cameraGroup.add(badge);

    // -- Memory card door (small line on right)
    const cardGeo = new THREE.BoxGeometry(0.005, 0.35, 0.3);
    const card = new THREE.Mesh(cardGeo, accentMat);
    card.position.set(bodyW / 2 + 0.003, -0.05, -0.05);
    cameraGroup.add(card);

    // Position entire camera
    cameraGroup.position.y = 0;
    cameraGroup.rotation.y = -Math.PI * 0.15;

    scene.add(cameraGroup);

    // Ground plane (shadow catcher)
    const planeGeo = new THREE.PlaneGeometry(8, 8);
    const planeMat = new THREE.ShadowMaterial({ opacity: 0.15 });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -0.7;
    plane.receiveShadow = true;
    scene.add(plane);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.25);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(3, 4, 2);
    key.castShadow = true;
    key.shadow.mapSize.width = 1024;
    key.shadow.mapSize.height = 1024;
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xccccff, 0.3);
    fill.position.set(-3, 2, -1);
    scene.add(fill);

    const rim = new THREE.PointLight(0xffffff, 0.5, 10);
    rim.position.set(-2, 1, -3);
    scene.add(rim);

    const topLight = new THREE.PointLight(0xffffff, 0.3, 10);
    topLight.position.set(0, 4, 0);
    scene.add(topLight);

    // GSAP entrance animation
    gsap.fromTo(cameraGroup.position, { y: -1.5 }, { y: 0, duration: 1.2, ease: 'power3.out', delay: 0.3 });
    gsap.fromTo(cameraGroup.rotation, { y: Math.PI * 0.5 }, { y: -Math.PI * 0.15, duration: 1.5, ease: 'power3.out', delay: 0.2 });

    // ScrollTrigger entry
    ScrollTrigger.create({
      trigger: canvas.closest('.gear'),
      start: 'top 80%',
      once: true,
      onEnter() {
        gsap.fromTo(cameraGroup.scale,
          { x: 0, y: 0, z: 0 },
          { x: 1, y: 1, z: 1, duration: 1, ease: 'back.out(1.5)' }
        );
      }
    });

    // Resize
    function onResize() {
      w = wrap.offsetWidth;
      h = wrap.offsetHeight;
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener('resize', onResize);

    // Render loop
    function animate() {
      requestAnimationFrame(animate);
      if (controls) controls.update();
      renderer.render(scene, cam);
    }
    animate();
  }

  /* ==============================================
     21. PROCESS TIMELINE SCROLL ANIMATION
     ============================================== */
  function initProcessTimeline() {
    const timeline = qs('.process__timeline');
    const line = qs('.process__line', timeline);
    if (!timeline || !line) return;

    const steps = qsa('.process__step', timeline);

    // Animate the line fill on scroll
    ScrollTrigger.create({
      trigger: timeline,
      start: 'top 70%',
      end: 'bottom 60%',
      scrub: 0.5,
      onUpdate(self) {
        const after = line.querySelector('::after') || line;
        line.style.setProperty('--fill', (self.progress * 100) + '%');
      }
    });

    // Use CSS custom property for the line fill
    gsap.to(line, {
      '--fill-height': '100%',
      ease: 'none',
      scrollTrigger: {
        trigger: timeline,
        start: 'top 70%',
        end: 'bottom 60%',
        scrub: 0.5,
      }
    });

    // Each step fades in staggered
    steps.forEach((step, i) => {
      const content = qs('.process__step-content', step);
      const dot = qs('.process__step-dot', step);

      gsap.from(content, {
        scrollTrigger: {
          trigger: step,
          start: 'top 80%',
          once: true,
          onEnter() { step.classList.add('active'); }
        },
        opacity: 0,
        x: -20,
        duration: 0.6,
        delay: 0.1,
        ease: 'power3.out'
      });
    });
  }

  /* ==============================================
     19. CONTACT FORM HANDLER (continued)
     ============================================== */
  function initContactForm() {
    const form = qs('#contactForm');
    if (!form) return;

    form.addEventListener('submit', e => {
      e.preventDefault();

      const btn = qs('.form-submit', form);
      const origText = btn.textContent;
      btn.textContent = 'SENT ✓';
      btn.style.background = 'var(--gray-700)';
      btn.style.borderColor = 'var(--gray-700)';
      btn.style.color = 'var(--white)';

      setTimeout(() => {
        btn.textContent = origText;
        btn.style.background = '';
        btn.style.borderColor = '';
        btn.style.color = '';
        form.reset();
      }, 2500);
    });
  }

  /* ==============================================
     INIT
     ============================================== */
  async function init() {
    await initLoader();
    initCursor();
    initMagnetic();
    initTextScramble();
    initHeroMesh();
    initPageTransitions();
    initNav();
    initHeroAnimations();
    initScrollReveals();
    initCounters();
    initTilt();
    initFilterTransitions();
    initLightbox();
    initDragScroll();
    initViewToggle();
    initGlowTracking();
    initParallax();
    initInspoBoard();
    initContactForm();
    initCameraModel();
    initProcessTimeline();
  }

  // Fire when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
