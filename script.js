/** @format */

// Module scope to organize code and cache selectors
(() => {
  const root = document.documentElement;
  const themeToggle = document.querySelector(".theme-toggle");
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");
  const appGrid = document.querySelector("[data-app-grid]");
  const storedTheme = (() => {
    try {
      return localStorage.getItem("portfolio-theme");
    } catch {
      return null;
    }
  })();
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const isTouch =
    "ontouchstart" in window ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);

  // Conditional heavy styles loader: only load on non-touch, fine-pointer, not reduced-motion
  const shouldLoadHeavy = () => {
    try {
      return (
        !isTouch &&
        !reducedMotion &&
        window.matchMedia("(pointer: fine)").matches
      );
    } catch (e) {
      return !isTouch && !reducedMotion;
    }
  };

  const loadHeavyStyles = () => {
    if (!shouldLoadHeavy()) return;
    if (document.querySelector('link[href="heavy.css"]')) return;
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "heavy.css";
    l.media = "all";
    document.head.appendChild(l);
  };

  // Cached selectors
  const revealItems = Array.from(document.querySelectorAll("[data-reveal]"));
  const heroPanel = document.querySelector(".hero-panel");
  const heroSection = document.querySelector(".hero");
  const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
  const contactForm = document.querySelector(".contact-form");
  const getProjectCards = () =>
    Array.from(document.querySelectorAll(".app-card[data-category]"));

  // Theme
  const initTheme = () => {
    if (storedTheme === "dark") root.classList.add("dark");
    const syncThemeControl = () => {
      const isDark = root.classList.contains("dark");
      themeToggle?.setAttribute("aria-pressed", String(isDark));
      themeToggle?.setAttribute(
        "aria-label",
        isDark ? "Switch to light theme" : "Switch to dark theme",
      );
      const icon = themeToggle?.querySelector(".toggle-icon");
      if (icon) icon.textContent = isDark ? "☀" : "☾";
    };
    syncThemeControl();
    themeToggle?.addEventListener("click", () => {
      root.classList.toggle("dark");
      try {
        localStorage.setItem(
          "portfolio-theme",
          root.classList.contains("dark") ? "dark" : "light",
        );
      } catch {
        /* storage unavailable */
      }
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
      navToggle.setAttribute(
        "aria-label",
        isOpen ? "Close navigation" : "Open navigation",
      );
    });
    navLinks.addEventListener("click", (event) => {
      if (event.target.closest("a")) closeNavigation();
    });
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeNavigation();
    });
    const desktopQuery = window.matchMedia("(min-width: 821px)");
    const handleDesktopChange = (event) => {
      if (event.matches) closeNavigation();
    };
    if (typeof desktopQuery.addEventListener === "function") {
      desktopQuery.addEventListener("change", handleDesktopChange);
    } else if (typeof desktopQuery.addListener === "function") {
      // Safari versions before 14.1 use the legacy MediaQueryList API.
      desktopQuery.addListener(handleDesktopChange);
    }
  };

  // Reveal observer
  const initReveal = () => {
    if (!revealItems.length) return;
    if (typeof IntersectionObserver !== "function") {
      revealItems.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );
    revealItems.forEach((el) => observer.observe(el));
  };

  const initTilt = (selector) => {
    const elements = document.querySelectorAll(selector);
    if (!elements.length || reducedMotion || isTouch) return;

    elements.forEach((element) => {
      let lastPointerEvent = null;
      let frame = 0;

      const updateTransform = (event) => {
        const rect = element.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;

        element.style.transform = `rotateX(${y * -8}deg) rotateY(${x * 10}deg)`;
      };

      const onMove = (event) => {
        lastPointerEvent = event;

        if (!frame) {
          frame = requestAnimationFrame(() => {
            updateTransform(lastPointerEvent);
            frame = 0;
          });
        }
      };

      const reset = () => {
        element.style.transform = "";
        lastPointerEvent = null;

        if (frame) cancelAnimationFrame(frame);
        frame = 0;
      };

      element.addEventListener("pointermove", onMove, { passive: true });
      element.addEventListener("pointerleave", reset);

      window.addEventListener("resize", () => {
        if (lastPointerEvent) {
          updateTransform(lastPointerEvent);
        } else {
          reset();
        }
      });
    });
  };

  // Filters and project card interactions
  const initFilters = () => {
    if (!filterButtons.length || !getProjectCards().length) return;
    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const filter = button.dataset.filter;
        const projectCards = getProjectCards();
        filterButtons.forEach((item) =>
          item.classList.toggle("is-active", item === button),
        );
        projectCards.forEach((card) => {
          const isMatch = filter === "all" || card.dataset.category === filter;
          card.classList.toggle("is-hidden", !isMatch);
          card.classList.remove("is-active");
        });
        updateAppGridLayout();
      });
    });
  };

  const updateAppGridLayout = () => {
    if (!appGrid) return;

    const visibleCards = getProjectCards().filter(
      (card) => !card.classList.contains("is-hidden"),
    );
    const viewportWidth = window.innerWidth;

    let maxColumns = 4;
    if (viewportWidth <= 380) maxColumns = 1;
    else if (viewportWidth <= 560) maxColumns = 2;
    else if (viewportWidth <= 1040) maxColumns = 3;

    const activeColumns = Math.max(
      1,
      Math.min(maxColumns, visibleCards.length || maxColumns),
    );

    appGrid.style.setProperty("--app-columns", String(activeColumns));
    appGrid.dataset.visibleCount = String(visibleCards.length);
  };

  const renderAppShowcase = async () => {
    if (!appGrid) return;
    const response = await fetch("apps.json?v=1", { cache: "no-store" });
    if (!response.ok)
      throw new Error(`Failed to load apps.json: ${response.status}`);
    const apps = await response.json();
    appGrid.innerHTML = apps
      .map((app) => {
        return `
        <a
          class="project-card app-card card"
          href="${app.previewUrl}"
          target="_blank"
          rel="noreferrer"
          data-category="${app.category}"
          data-size="${app.size}"
          style="--card-accent:${app.accent};"
        >
          <div class="app-visual ${app.size}">
            <div class="app-preview-frame ${app.size}">
              <img src="${app.previewImage}" alt="${app.title} preview" loading="lazy" decoding="async">
            </div>
            <div class="app-card-overlay">
              <div class="app-logo" aria-hidden="true">${app.logo}</div>
              <p class="app-card-tag">${app.tag}</p>
              <h3 class="app-card-title">${app.title}</h3>
              <p class="app-card-description">${app.description}</p>
              <p class="app-card-stack">${app.stack}</p>
            </div>
          </div>
        </a>`;
      })
      .join("");
  };

  const initAppTiles = () => {
    const projectCards = getProjectCards();
    if (!projectCards.length) return;

    const closeCards = () =>
      projectCards.forEach((card) => card.classList.remove("is-active"));

    projectCards.forEach((card) => {
      card.addEventListener("pointerenter", () => {
        if (isTouch || card.classList.contains("is-hidden")) return;
        card.classList.add("is-active");
      });

      card.addEventListener("focusin", () => {
        if (card.classList.contains("is-hidden")) return;
        card.classList.add("is-active");
      });

      card.addEventListener("pointerleave", () => {
        if (isTouch) return;
        card.classList.remove("is-active");
      });

      card.addEventListener("click", (event) => {
        if (card.classList.contains("is-hidden")) return;
        if (isTouch) {
          const isActive = card.classList.contains("is-active");
          closeCards();
          if (isActive) return;
          event.preventDefault();
          card.classList.add("is-active");
          return;
        }
      });

      card.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        if (event.key === " ") {
          event.preventDefault();
          card.classList.toggle("is-active");
        }
      });
    });

    document.addEventListener("pointerdown", (event) => {
      if (!isTouch) return;
      if (event.target.closest(".app-grid")) return;
      closeCards();
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeCards();
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
    const touchDevice = window.matchMedia(
      "(hover: none), (pointer: coarse)",
    ).matches;

    const triggerBlink = () => {
      if (reducedMotion) return;
      const now = performance.now();
      if (now - lastBlinkAt < minBlinkInterval) return;
      lastBlinkAt = now;
      spans.forEach((span, i) => {
        span.classList.remove("blink");
        span.style.animationDelay = `${i * 0.18}s`;
      });
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
      const isAtHeroStart = window.scrollY <= 8 && rect.top >= -8;
      const opacity = isAtHeroStart
        ? 1
        : rect.bottom <= 0 || rect.top >= window.innerHeight
          ? 0
          : Math.max(0, Math.min(1, 1 - distance / maxDistance));

      spans.forEach((span) => {
        span.style.opacity = String(opacity);
        if (opacity < 0.99) span.classList.remove("blink");
      });

      return opacity > 0;
    };

    // Desktop waits for intentional scroll; phones use the older scroll-driven blink.
    let scrollIntentUntil = 0;
    let heroWasVisible = false;
    const markScrollIntent = () => {
      scrollIntentUntil = performance.now() + (touchDevice ? 1200 : 250);
    };
    window.addEventListener("wheel", markScrollIntent, { passive: true });
    window.addEventListener("touchmove", markScrollIntent, { passive: true });
    window.addEventListener("keydown", (event) => {
      if (
        [
          " ",
          "ArrowDown",
          "ArrowUp",
          "PageDown",
          "PageUp",
          "Home",
          "End",
        ].includes(event.key)
      ) {
        markScrollIntent();
      }
    });

    // Update only on scroll to avoid an always-running animation loop.
    let pending = false;
    let lastScrollY = window.scrollY;
    const onScroll = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const isScrollingDown = currentScrollY > lastScrollY;
        const rect = heroSection.getBoundingClientRect();
        const heroIsVisible = updateOpacity(rect);
        const canBlink =
          isScrollingDown &&
          (touchDevice ||
            (!heroWasVisible && performance.now() < scrollIntentUntil));
        if (heroIsVisible && canBlink) {
          triggerBlink();
        }
        heroWasVisible = heroIsVisible;
        lastScrollY = currentScrollY;
        pending = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  };

  const heroTitle = document.querySelector(".hero-title");
  // Text scramble for specific heading span (show on hover only)
  const initTextScramble = () => {
    if (reducedMotion) return;
    if (!heroTitle) return;
    const candidates = Array.from(
      document.querySelectorAll(".hero-title .split_2"),
    );
    if (!candidates.length) return;
    const targetSpan = candidates.find((s) => s.textContent.trim() === "SPOKE");
    if (!targetSpan) return;

    const from = "SPOKE";
    const to = "ST";
    const alphabet = "OKE";
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
            const targetChar = end[i] || "";
            const revealProb = eased * ((i + 1) / Math.max(1, displayLen));
            if (Math.random() < revealProb) out.push(targetChar);
            else
              out.push(alphabet[Math.floor(Math.random() * alphabet.length)]);
          }

          targetSpan.textContent = out.join("");
          if (elapsed < duration) requestAnimationFrame(tick);
          else {
            targetSpan.textContent = end;
            resolve();
          }
        };
        requestAnimationFrame(tick);
      });
    };

    // reveal on enter, revert on leave
    heroTitle.addEventListener("pointerenter", async () => {
      if (animating || showingTo) return;
      animating = true;
      try {
        await scrambleOnce(from, to);
        showingTo = true;
      } catch (e) {}
      animating = false;
    });

    heroTitle.addEventListener("pointerleave", async () => {
      if (animating || !showingTo) return;
      animating = true;
      try {
        await scrambleOnce(to, from);
        showingTo = false;
      } catch (e) {}
      animating = false;
    });
  };

  // Init all. Reveal effects are optional; never let them blank the page.
  const init = async () => {
    root.classList.add("js");
    try {
      initTheme();
      initMobileNavigation();
      loadHeavyStyles();
      await renderAppShowcase();
      updateAppGridLayout();
      initReveal();
      initTilt(".hero-panel, .app-card");
      initFilters();
      initAppTiles();
      window.addEventListener("resize", updateAppGridLayout);
      initContactForm();
      initHeadingEffects();
      initTextScramble();
    } catch (error) {
      root.classList.remove("js");
      console.error("Optional page enhancement failed:", error);
    }
  };

  init();
})();
