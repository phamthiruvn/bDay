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
