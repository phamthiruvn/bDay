// Module scope to organize code and cache selectors
(() => {
  const root = document.documentElement;
  const themeToggle = document.querySelector(".theme-toggle");
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");
  const storedTheme = (() => {
    try { return localStorage.getItem("portfolio-theme"); } catch { return null; }
  })();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);

  // Conditional heavy styles loader: only load on non-touch, fine-pointer, not reduced-motion
  const shouldLoadHeavy = () => {
    try {
      return !isTouch && !reducedMotion && window.matchMedia('(pointer: fine)').matches;
    } catch (e) {
      return !isTouch && !reducedMotion;
    }
  };

  const loadHeavyStyles = () => {
    if (!shouldLoadHeavy()) return;
    if (document.querySelector('link[href="heavy.css"]')) return;
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'heavy.css';
    l.media = 'all';
    document.head.appendChild(l);
  };

  // Cached selectors
  const revealItems = Array.from(document.querySelectorAll("[data-reveal]"));
  const heroPanel = document.querySelector(".hero-panel");
  const heroSection = document.querySelector(".hero");
  const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
  const projectCards = Array.from(document.querySelectorAll("[data-category]"));
  const contactForm = document.querySelector(".contact-form");

  // Theme
  const initTheme = () => {
    if (storedTheme === "dark") root.classList.add("dark");
    const syncThemeControl = () => {
      const isDark = root.classList.contains("dark");
      themeToggle?.setAttribute("aria-pressed", String(isDark));
      themeToggle?.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
      const icon = themeToggle?.querySelector(".toggle-icon");
      if (icon) icon.textContent = isDark ? "☀" : "☾";
    };
    syncThemeControl();
    themeToggle?.addEventListener("click", () => {
      root.classList.toggle("dark");
      try { localStorage.setItem("portfolio-theme", root.classList.contains("dark") ? "dark" : "light"); } catch { /* storage unavailable */ }
      syncThemeControl();
    });
  };

  const initMobileNavigation = () => {
    if (!navToggle || !navLinks) return;
    const closeNavigation = () => {
      navLinks.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Open navigation");
    };

    navToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
      navToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
    });
    navLinks.addEventListener("click", (event) => {
      if (event.target.closest("a")) closeNavigation();
    });
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeNavigation();
    });
    window.matchMedia("(min-width: 821px)").addEventListener("change", (event) => {
      if (event.matches) closeNavigation();
    });
  };

  // Reveal observer
  const initReveal = () => {
    if (!revealItems.length) return;
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealItems.forEach((el) => observer.observe(el));
  };

  // Hero panel tilt
  const initHeroPanel = () => {
    if (!heroPanel || reducedMotion || isTouch) return;
    let lastPointerEvent = null;
    let frame = 0;

    const updateTransform = (event) => {
      const rect = heroPanel.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      heroPanel.style.transform = `rotateX(${y * -8}deg) rotateY(${x * 10}deg)`;
    };

    const onMove = (event) => {
      lastPointerEvent = event;
      if (!frame) frame = requestAnimationFrame(() => {
        updateTransform(lastPointerEvent);
        frame = 0;
      });
    };

    const onResize = () => {
      if (lastPointerEvent) {
        updateTransform(lastPointerEvent);
      } else {
        heroPanel.style.transform = "";
      }
    };

    heroPanel.addEventListener("pointermove", onMove, { passive: true });
    heroPanel.addEventListener("pointerleave", () => {
      heroPanel.style.transform = "";
      lastPointerEvent = null;
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    });
    window.addEventListener("resize", onResize);
  };

  // Filters and project card interactions
  const initFilters = () => {
    if (!filterButtons.length || !projectCards.length) return;
    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const filter = button.dataset.filter;
        filterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
        projectCards.forEach((card) => {
          const isMatch = filter === "all" || card.dataset.category === filter;
          card.classList.toggle("is-hidden", !isMatch);
          card.classList.remove("is-open");
        });
      });
    });

    projectCards.forEach((card) => {
      card.addEventListener("click", () => {
        if (card.classList.contains("is-hidden")) return;
        projectCards.forEach((item) => { if (item !== card) item.classList.remove("is-open"); });
        card.classList.toggle("is-open");
      });
    });
  };

  // Contact form
  const initContactForm = () => {
    if (!contactForm) return;
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const status = contactForm.querySelector(".form-status");
      if (status) status.textContent = "Placeholder status message.";
      contactForm.reset();
    });
  };

  // Blink + fade animation for heading parts
  const initHeadingEffects = () => {
    const spans = Array.from(document.querySelectorAll(".hero-title .split_2"));
    if (!spans.length || !heroSection) return;

    let lastBlinkAt = 0;
    const minBlinkInterval = 1200;

    const triggerBlink = () => {
      if (reducedMotion) return;
      const now = performance.now();
      if (now - lastBlinkAt < minBlinkInterval) return;
      lastBlinkAt = now;
      spans.forEach((span, i) => { span.classList.remove("blink"); span.style.animationDelay = `${i * 0.18}s`; });
      void document.body.offsetWidth;
      spans.forEach((s) => s.classList.add("blink"));
    };

    // Opacity follows the current scroll position.
    if (reducedMotion) {
      spans.forEach((s) => (s.style.opacity = "1"));
      return;
    }

    const updateOpacity = (rect) => {
      const isMobile = window.matchMedia("(max-width: 768px)").matches;
      const maxDistanceFactor = isMobile ? 0.3 : 0.45;
      const heroCenter = rect.top + rect.height / 2;
      const viewportCenter = window.innerHeight / 2;
      const distance = Math.abs(heroCenter - viewportCenter);
      const maxDistance = window.innerHeight * maxDistanceFactor;
      const opacity = rect.bottom <= 0 || rect.top >= window.innerHeight
        ? 0
        : Math.max(0, Math.min(1, 1 - distance / maxDistance));

      spans.forEach((span) => {
        span.style.opacity = String(opacity);
        if (opacity < 0.99) span.classList.remove("blink");
      });

      return opacity > 0;
    };

    // Blink only after an intentional user scroll, never on page restoration or resize.
    let scrollIntentUntil = 0;
    let heroWasVisible = false;
    const markScrollIntent = () => {
      scrollIntentUntil = performance.now() + 250;
    };
    window.addEventListener("wheel", markScrollIntent, { passive: true });
    window.addEventListener("touchmove", markScrollIntent, { passive: true });
    window.addEventListener("keydown", (event) => {
      if ([" ", "ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End"].includes(event.key)) {
        markScrollIntent();
      }
    });

    // Update only on scroll to avoid an always-running animation loop.
    let pending = false;
    const onScroll = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        const rect = heroSection.getBoundingClientRect();
        const heroIsVisible = updateOpacity(rect);
        if (heroIsVisible && !heroWasVisible && performance.now() < scrollIntentUntil) {
          triggerBlink();
        }
        heroWasVisible = heroIsVisible;
        pending = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
  };


  const heroTitle = document.querySelector('.hero-title');
  // Text scramble for specific heading span (show on hover only)
  const initTextScramble = () => {
    if (reducedMotion) return;
    if (!heroTitle) return;
    const candidates = Array.from(document.querySelectorAll('.hero-title .split_2'));
    if (!candidates.length) return;
    const targetSpan = candidates.find(s => s.textContent.trim() === 'SPOKE');
    if (!targetSpan) return;

    const from = 'SPOKE';
    const to = 'ST';
    const alphabet = 'OKE';
    let animating = false;
    let showingTo = false;

    const scrambleOnce = (start, end, duration = 100) => {
      return new Promise((resolve) => {
        const startTime = performance.now();
        const startLen = start.length;
        const endLen = end.length;
        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        const tick = () => {
          const now = performance.now();
          const elapsed = Math.min(now - startTime, duration);
          const progress = elapsed / duration;
          const eased = easeOut(progress);

          const displayLen = startLen + Math.floor((endLen - startLen) * eased);
          const out = [];
          out.push("S");
          for (let i = 1; i < displayLen; i++) {
            const targetChar = end[i] || '';
            const revealProb = eased * ((i + 1) / Math.max(1, displayLen));
            if (Math.random() < revealProb) out.push(targetChar);
            else out.push(alphabet[Math.floor(Math.random() * alphabet.length)]);
          }

          targetSpan.textContent = out.join('');
          if (elapsed < duration) requestAnimationFrame(tick);
          else { targetSpan.textContent = end; resolve(); }
        };
        requestAnimationFrame(tick);
      });
    };

    // reveal on enter, revert on leave
    heroTitle.addEventListener('pointerenter', async () => {
      if (animating || showingTo) return;
      animating = true;
      try {
        await scrambleOnce(from, to);
        showingTo = true;
      } catch (e) {}
      animating = false;
    });

    heroTitle.addEventListener('pointerleave', async () => {
      if (animating || !showingTo) return;
      animating = true;
      try {
        await scrambleOnce(to, from);
        showingTo = false;
      } catch (e) {}
      animating = false;
    });
  };

  // Init all
  initTheme();
  initMobileNavigation();
  loadHeavyStyles();
  initReveal();
  initHeroPanel();
  initFilters();
  initContactForm();
  initHeadingEffects();
  initTextScramble();

  // App hover preview: floating open-graph style preview for app tiles
  const initAppPreview = () => {
    const showcase = document.querySelector('.app-showcase');
    const tiles = Array.from(document.querySelectorAll('.app-tile'));
    if (!showcase || !tiles.length) return;

    const preview = document.createElement('div');
    preview.className = 'app-preview';
    preview.setAttribute('aria-hidden', 'true');
    preview.innerHTML = `
      <div class="preview-card browser-mock">
        <div class="mock-topbar"><span></span><span></span><span></span></div>
        <div class="mock-main">
          <div class="mock-line wide"></div>
          <div class="mock-grid"><i></i><i></i></div>
        </div>
        <div class="preview-meta">
          <strong class="preview-title">Preview</strong>
          <span class="preview-desc">Placeholder description</span>
        </div>
      </div>`;
    showcase.appendChild(preview);

    let activeTimer = null;
    preview._currentTile = null;

    const showPreview = (tile, x, y) => {
      const title = tile.querySelector('.app-label strong')?.textContent?.trim() || 'Preview';
      const desc = tile.querySelector('.app-label span')?.textContent?.trim() || 'Short preview of the app or project.';
      preview.querySelector('.preview-title').textContent = title;
      preview.querySelector('.preview-desc').textContent = desc;

      // Position preview: prefer to the right of tile, but clamp to viewport
      const rect = showcase.getBoundingClientRect();
      const previewCard = preview.querySelector('.preview-card');
      const previewBounds = previewCard.getBoundingClientRect();
      const maxX = Math.max(12, window.innerWidth - previewBounds.width - 12);
      const maxY = Math.max(12, window.innerHeight - previewBounds.height - 12);
      const px = Math.min(maxX, Math.max(12, x - rect.left + 18));
      const py = Math.min(maxY, Math.max(12, y - rect.top - 8));
      preview.style.left = px + 'px';
      preview.style.top = py + 'px';
      preview.classList.add('is-visible');
      preview.setAttribute('aria-hidden', 'false');
      preview._currentTile = tile;
    };

    const hidePreview = () => {
      preview.classList.remove('is-visible');
      preview.setAttribute('aria-hidden', 'true');
      preview._currentTile = null;
    };
    if (isTouch) {
      // Tap to open / toggle preview on touch devices
      tiles.forEach((tile) => {
        tile.addEventListener('click', (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          const rect = tile.getBoundingClientRect();
          if (preview.classList.contains('is-visible') && preview._currentTile === tile) {
            hidePreview();
          } else {
            showPreview(tile, rect.right, rect.top + rect.height / 2);
          }
        });
      });

      // hide when clicking outside
      document.addEventListener('pointerdown', (e) => { if (!showcase.contains(e.target)) hidePreview(); }, true);
      return;
    }

    // Non-touch: hover + keyboard support
    tiles.forEach((tile) => {
      // pointerenter to prepare and show after tiny delay
      tile.addEventListener('pointerenter', (ev) => {
        if (activeTimer) clearTimeout(activeTimer);
        activeTimer = setTimeout(() => showPreview(tile, ev.clientX, ev.clientY), 90);
      });
      tile.addEventListener('pointermove', (ev) => {
        if (preview.classList.contains('is-visible')) showPreview(tile, ev.clientX, ev.clientY);
      });
      tile.addEventListener('pointerleave', () => { if (activeTimer) clearTimeout(activeTimer); hidePreview(); });

      // keyboard focus support
      tile.addEventListener('focus', (ev) => { showPreview(tile, tile.getBoundingClientRect().right, tile.getBoundingClientRect().top); }, true);
      tile.addEventListener('blur', () => hidePreview(), true);
    });

    // hide on escape
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') hidePreview(); });
    // hide when clicking outside
    document.addEventListener('pointerdown', (e) => { if (!showcase.contains(e.target)) hidePreview(); });
  };

  initAppPreview();

})();
