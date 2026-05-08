const root = document.documentElement;
const themeToggle = document.querySelector(".theme-toggle");
const storedTheme = localStorage.getItem("portfolio-theme");

if (storedTheme === "dark") {
  root.classList.add("dark");
}

themeToggle?.addEventListener("click", () => {
  root.classList.toggle("dark");
  localStorage.setItem("portfolio-theme", root.classList.contains("dark") ? "dark" : "light");
});

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!reducedMotion) {
  window.addEventListener("pointermove", (event) => {
    root.style.setProperty("--mouse-x", `${event.clientX}px`);
    root.style.setProperty("--mouse-y", `${event.clientY}px`);
  });
}

const revealItems = document.querySelectorAll("[data-reveal]");
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

revealItems.forEach((item) => revealObserver.observe(item));

const countTarget = document.querySelector("[data-count]");
let countStarted = false;

const countObserver = new IntersectionObserver(
  (entries) => {
    const entry = entries[0];
    if (!entry?.isIntersecting || countStarted || !countTarget) return;

    countStarted = true;
    const target = Number(countTarget.dataset.count);
    const start = performance.now();
    const duration = 1100;

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      countTarget.textContent = Math.round(target * eased).toString();

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
    countObserver.disconnect();
  },
  { threshold: 0.5 }
);

if (countTarget) {
  countObserver.observe(countTarget);
}

const heroPanel = document.querySelector(".hero-panel");

heroPanel?.addEventListener("pointermove", (event) => {
  if (reducedMotion) return;

  const rect = heroPanel.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width - 0.5;
  const y = (event.clientY - rect.top) / rect.height - 0.5;
  heroPanel.style.transform = `rotateX(${y * -8}deg) rotateY(${x * 10}deg)`;
});

heroPanel?.addEventListener("pointerleave", () => {
  heroPanel.style.transform = "";
});

const filterButtons = document.querySelectorAll("[data-filter]");
const projectCards = document.querySelectorAll("[data-category]");

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

    projectCards.forEach((item) => {
      if (item !== card) item.classList.remove("is-open");
    });
    card.classList.toggle("is-open");
  });
});

document.querySelector(".contact-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const status = form.querySelector(".form-status");

  if (status) {
    status.textContent = "Placeholder status message.";
  }

  form.reset();
});

// Blink animation for hero heading split_2 spans
const triggerBlink = () => {
  if (reducedMotion) return;
  const spans = Array.from(document.querySelectorAll("h1 .split_2"));
  if (!spans.length) return;

  // Batch the reflow to a single pass: set delays, then force one reflow, then add class
  spans.forEach((span, index) => {
    span.classList.remove("blink");
    span.style.animationDelay = `${index * 0.18}s`;
  });

  void document.body.offsetWidth; // single reflow for all
  spans.forEach((span) => span.classList.add("blink"));
};

// Trigger blink on page load (respect reduced-motion)
window.addEventListener("load", () => {
  if (!reducedMotion) triggerBlink();
});

// Trigger blink when hero section scrolls into view and fade based on distance
const heroSection = document.querySelector(".hero");
if (heroSection) {
  if (reducedMotion) {
    // Ensure full visibility when reduced motion is requested
    document.querySelectorAll("h1 .split_2").forEach((s) => (s.style.opacity = "1"));
  } else {
    let rafId = null;
    const spans = Array.from(document.querySelectorAll("h1 .split_2"));
    if (!spans.length) {
      // nothing to animate
    } else {
      let currentOpacities = spans.map((s) => {
        const v = parseFloat(getComputedStyle(s).opacity);
        return Number.isFinite(v) ? v : 1;
      });
      let targetOpacities = currentOpacities.slice();
      const easing = 0.08; // interpolation per frame

      const computeTargets = (rect) => {
        const heroCenter = rect.top + rect.height / 2;
        const viewportCenter = window.innerHeight / 2;
        const distance = Math.abs(heroCenter - viewportCenter);
        const maxDistance = window.innerHeight; // tuning value
        const raw = 1 - distance / maxDistance;
        const normalized = Math.max(0, Math.min(1, raw));
        const minOpacity = 0.03; // how invisible at far distance
        const target = minOpacity + normalized * (1 - minOpacity);
        for (let i = 0; i < targetOpacities.length; i++) targetOpacities[i] = target;

        // Blink when hero becomes visible
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          if (!heroSection.dataset.blinkTriggered) {
            triggerBlink();
            heroSection.dataset.blinkTriggered = "true";
          }
        } else {
          heroSection.dataset.blinkTriggered = "false";
        }
      };

      const animate = () => {
        const rect = heroSection.getBoundingClientRect();
        computeTargets(rect);

        for (let i = 0; i < spans.length; i++) {
          const diff = targetOpacities[i] - currentOpacities[i];
          if (Math.abs(diff) > 0.0005) currentOpacities[i] += diff * easing;
          else currentOpacities[i] = targetOpacities[i];
          spans[i].style.opacity = String(currentOpacities[i]);
          if (targetOpacities[i] < 0.99) spans[i].classList.remove("blink");
        }

        rafId = requestAnimationFrame(animate);
      };

      const start = () => {
        if (!rafId) rafId = requestAnimationFrame(animate);
      };
      const stop = () => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
      };

      // Pause when tab is hidden
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) stop();
        else start();
      });

      // Re-init on resize
      window.addEventListener("resize", () => {
        currentOpacities = spans.map((s) => {
          const v = parseFloat(getComputedStyle(s).opacity);
          return Number.isFinite(v) ? v : 1;
        });
      });

      // start loop right away
      start();

      // Update immediately during scroll/touch on mobile to ensure responsiveness
      let pendingScroll = false;
      const onScrollOrTouch = () => {
        if (pendingScroll) return;
        pendingScroll = true;
        requestAnimationFrame(() => {
          const rect = heroSection.getBoundingClientRect();
          computeTargets(rect);
          for (let i = 0; i < spans.length; i++) {
            currentOpacities[i] = targetOpacities[i];
            spans[i].style.opacity = String(currentOpacities[i]);
            if (targetOpacities[i] < 0.99) spans[i].classList.remove("blink");
          }
          pendingScroll = false;
        });
      };

      window.addEventListener("scroll", onScrollOrTouch, { passive: true });
      window.addEventListener("touchmove", onScrollOrTouch, { passive: true });
      window.addEventListener("orientationchange", () => onScrollOrTouch());

      // cleanup
      window.addEventListener("beforeunload", () => {
        stop();
        window.removeEventListener("scroll", onScrollOrTouch);
        window.removeEventListener("touchmove", onScrollOrTouch);
        window.removeEventListener("orientationchange", () => onScrollOrTouch());
      });
    }
  }
}

