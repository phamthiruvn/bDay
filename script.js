// Module scope to organize code and cache selectors
(() => {
  const root = document.documentElement;
  const themeToggle = document.querySelector(".theme-toggle");
  const storedTheme = localStorage.getItem("portfolio-theme");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Cached selectors
  const revealItems = Array.from(document.querySelectorAll("[data-reveal]"));
  const countTarget = document.querySelector("[data-count]");
  const heroPanel = document.querySelector(".hero-panel");
  const heroSection = document.querySelector(".hero");
  const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
  const projectCards = Array.from(document.querySelectorAll("[data-category]"));
  const contactForm = document.querySelector(".contact-form");

  // Theme
  const initTheme = () => {
    if (storedTheme === "dark") root.classList.add("dark");
    themeToggle?.addEventListener("click", () => {
      root.classList.toggle("dark");
      localStorage.setItem("portfolio-theme", root.classList.contains("dark") ? "dark" : "light");
    });
  };

  // Ambient pointer (mouse) parallax
  const initPointer = () => {
    if (reducedMotion) return;
    window.addEventListener("pointermove", (event) => {
      root.style.setProperty("--mouse-x", `${event.clientX}px`);
      root.style.setProperty("--mouse-y", `${event.clientY}px`);
    }, { passive: true });
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

  // Count animation
  const initCount = () => {
    if (!countTarget) return;
    let started = false;
    const observer = new IntersectionObserver((entries, obs) => {
      const entry = entries[0];
      if (!entry?.isIntersecting || started) return;
      started = true;
      const target = Number(countTarget.dataset.count) || 0;
      const start = performance.now();
      const duration = 1100;
      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        countTarget.textContent = Math.round(target * eased).toString();
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      obs.disconnect();
    }, { threshold: 0.5 });
    observer.observe(countTarget);
  };

  // Hero panel tilt
  const initHeroPanel = () => {
    if (!heroPanel || reducedMotion) return;
    const onMove = (event) => {
      const rect = heroPanel.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      heroPanel.style.transform = `rotateX(${y * -8}deg) rotateY(${x * 10}deg)`;
    };
    heroPanel.addEventListener("pointermove", onMove, { passive: true });
    heroPanel.addEventListener("pointerleave", () => { heroPanel.style.transform = ""; });
    window.addEventListener("resize", () => { heroPanel.style.transform = ""; });
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
    if (!spans.length) return;

    const triggerBlink = () => {
      if (reducedMotion) return;
      spans.forEach((span, i) => { span.classList.remove("blink"); span.style.animationDelay = `${i * 0.18}s`; });
      void document.body.offsetWidth;
      spans.forEach((s) => s.classList.add("blink"));
    };

    // Per-frame interpolation for opacity; pause when hidden
    if (reducedMotion) {
      spans.forEach((s) => (s.style.opacity = "1"));
      return { triggerBlink };
    }

    let raf = null;
    let current = spans.map((s) => parseFloat(getComputedStyle(s).opacity) || 1);
    let target = current.slice();
    const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) || window.innerWidth <= 768;
    const easing = isMobile ? 0.3 : 0.1; // faster interpolation on mobile
    const maxDistanceFactor = isMobile ? 0.3 : 0.45; // smaller distance -> quicker transparency on mobile

    const computeTarget = (rect) => {
      const heroCenter = rect.top + rect.height / 2;
      const viewportCenter = window.innerHeight / 2;
      const distance = Math.abs(heroCenter - viewportCenter);
      const maxDistance = window.innerHeight * maxDistanceFactor;
      const raw = 1 - distance / maxDistance;
      const normalized = Math.max(0, Math.min(1, raw));
      const minOpacity = 0;
      const val = minOpacity + normalized * (1 - minOpacity);
      // If hero fully scrolled past (above) or completely below viewport, snap to min immediately
      if (rect.bottom <= 0 || rect.top >= window.innerHeight) {
        for (let i = 0; i < target.length; i++) {
          target[i] = minOpacity;
          current[i] = minOpacity;
          spans[i].style.opacity = String(minOpacity);
          spans[i].classList.remove("blink");
        }
        return;
      }

      for (let i = 0; i < target.length; i++) target[i] = val;
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        if (!heroSection.dataset.blinkTriggered) { triggerBlink(); heroSection.dataset.blinkTriggered = "true"; }
      } else heroSection.dataset.blinkTriggered = "false";
    };

    const step = () => {
      const rect = heroSection.getBoundingClientRect();
      computeTarget(rect);
      for (let i = 0; i < spans.length; i++) {
        const diff = target[i] - current[i];
        if (Math.abs(diff) > 0.0005) current[i] += diff * easing;
        else current[i] = target[i];
        spans[i].style.opacity = String(current[i]);
        if (target[i] < 0.99) spans[i].classList.remove("blink");
      }
      raf = requestAnimationFrame(step);
    };

    // start
    raf = requestAnimationFrame(step);

    // mobile: immediate updates on scroll/touch for responsiveness
    let pending = false;
    const onScroll = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        const rect = heroSection.getBoundingClientRect();
        computeTarget(rect);
        for (let i = 0; i < spans.length; i++) { current[i] = target[i]; spans[i].style.opacity = String(current[i]); if (target[i] < 0.99) spans[i].classList.remove("blink"); }
        pending = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchmove", onScroll, { passive: true });
    window.addEventListener("orientationchange", onScroll);

    // lifecycle
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else raf = requestAnimationFrame(step);
    });

    window.addEventListener("beforeunload", () => { cancelAnimationFrame(raf); window.removeEventListener("scroll", onScroll); window.removeEventListener("touchmove", onScroll); window.removeEventListener("orientationchange", onScroll); });

    return { triggerBlink };
  };
  const heroTittle = document.querySelector('.hero-title');
  // Text scramble for specific heading span (show on hover only)
  const initTextScramble = () => {
    if (reducedMotion) return;
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
    heroTittle.addEventListener('pointerenter', async () => {
      if (animating || showingTo) return;
      animating = true;
      try {
        await scrambleOnce(from, to);
        showingTo = true;
      } catch (e) {}
      animating = false;
    });

    heroTittle.addEventListener('pointerleave', async () => {
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
  initPointer();
  initReveal();
  initCount();
  initHeroPanel();
  initFilters();
  initContactForm();
  initHeadingEffects();
  initTextScramble();

})();
