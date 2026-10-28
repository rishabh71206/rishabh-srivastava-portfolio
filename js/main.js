/* ==========================================================================
   Rishabh Srivastava — portfolio interactions
   Vanilla JS (ES2022), no dependencies. Everything degrades gracefully and
   every motion effect is disabled when the visitor prefers reduced motion.
   ========================================================================== */

(() => {
  "use strict";

  const root = document.documentElement;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

  /* ------------------------------------------------------------------ */
  /* Footer year                                                         */
  /* ------------------------------------------------------------------ */
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ------------------------------------------------------------------ */
  /* Theme: follow the system until the visitor chooses                  */
  /* ------------------------------------------------------------------ */
  const themeToggle = document.querySelector("[data-theme-toggle]");
  const systemPrefersLight = window.matchMedia("(prefers-color-scheme: light)");

  const effectiveTheme = () =>
    root.dataset.theme || (systemPrefersLight.matches ? "light" : "dark");

  const syncThemeButton = () => {
    if (!themeToggle) return;
    const next = effectiveTheme() === "light" ? "dark" : "light";
    themeToggle.setAttribute("aria-label", `Switch to ${next} theme`);
    themeToggle.setAttribute("title", `Switch to ${next} theme`);
    themeToggle.setAttribute("aria-pressed", String(effectiveTheme() === "light"));
  };

  themeToggle?.addEventListener("click", () => {
    const next = effectiveTheme() === "light" ? "dark" : "light";
    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch (error) {
      /* private mode — the choice just will not persist */
    }
    syncThemeButton();
  });

  systemPrefersLight.addEventListener("change", syncThemeButton);
  syncThemeButton();

  /* ------------------------------------------------------------------ */
  /* Mobile navigation                                                   */
  /* ------------------------------------------------------------------ */
  const header = document.querySelector(".nav");
  const menuToggle = document.querySelector(".menu-toggle");
  const navLinks = [...document.querySelectorAll("#site-nav a")];

  const setMenu = (open) => {
    if (!header || !menuToggle) return;
    header.classList.toggle("is-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };

  menuToggle?.addEventListener("click", () => {
    setMenu(!header.classList.contains("is-open"));
  });

  navLinks.forEach((link) => link.addEventListener("click", () => setMenu(false)));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && header?.classList.contains("is-open")) {
      setMenu(false);
      menuToggle?.focus();
    }
  });

  document.addEventListener("click", (event) => {
    if (!header?.classList.contains("is-open")) return;
    if (!header.contains(event.target)) setMenu(false);
  });

  /* ------------------------------------------------------------------ */
  /* Scroll progress bar                                                 */
  /* ------------------------------------------------------------------ */
  const progressBar = document.querySelector(".progress i");
  let progressQueued = false;

  const paintProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    if (progressBar) progressBar.style.transform = `scaleX(${ratio})`;
    progressQueued = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (progressQueued) return;
      progressQueued = true;
      requestAnimationFrame(paintProgress);
    },
    { passive: true }
  );

  paintProgress();

  /* ------------------------------------------------------------------ */
  /* Reveal on scroll, counters and meters                               */
  /* ------------------------------------------------------------------ */
  const animateCount = (element) => {
    const target = Number(element.dataset.count);
    if (!Number.isFinite(target)) return;
    if (prefersReducedMotion.matches) {
      element.textContent = String(target);
      return;
    }

    const duration = 1100;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = String(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  const fillMeter = (element) => {
    const value = element.dataset.meter;
    if (value == null) return;
    element.style.setProperty("--w", `${value}%`);
    requestAnimationFrame(() => {
      element.style.width = `${value}%`;
    });
  };

  const revealTargets = document.querySelectorAll(
    ".reveal, .stats, .project, .feature-grid article, .skills li, .timeline li"
  );

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          entry.target.querySelectorAll("[data-count]").forEach(animateCount);
          entry.target.querySelectorAll("[data-meter]").forEach(fillMeter);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );

    revealTargets.forEach((element) => observer.observe(element));
  } else {
    revealTargets.forEach((element) => {
      element.classList.add("in");
      element.querySelectorAll("[data-count]").forEach(animateCount);
      element.querySelectorAll("[data-meter]").forEach(fillMeter);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Active section in the navigation                                    */
  /* ------------------------------------------------------------------ */
  const sections = [...document.querySelectorAll("main section[id]")];

  if (sections.length && "IntersectionObserver" in window) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((link) => {
            link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );

    sections.forEach((section) => spy.observe(section));
  }

  /* ------------------------------------------------------------------ */
  /* Pointer effects: custom cursor, magnetic buttons, card tilt         */
  /* ------------------------------------------------------------------ */
  const cursor = document.querySelector(".cursor");

  if (cursor && finePointer.matches && !prefersReducedMotion.matches) {
    document.body.classList.add("has-cursor");

    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let cursorX = pointerX;
    let cursorY = pointerY;
    let cursorFrame = 0;
    let hasMoved = false;

    const renderCursor = () => {
      cursorX += (pointerX - cursorX) * 0.18;
      cursorY += (pointerY - cursorY) * 0.18;
      cursor.style.transform = `translate(${cursorX}px, ${cursorY}px) translate(-50%, -50%)`;
      cursorFrame = requestAnimationFrame(renderCursor);
    };

    window.addEventListener(
      "pointermove",
      (event) => {
        pointerX = event.clientX;
        pointerY = event.clientY;
        if (!hasMoved) {
          hasMoved = true;
          cursorX = pointerX;
          cursorY = pointerY;
          cursor.classList.add("is-visible");
        }
      },
      { passive: true }
    );

    document.querySelectorAll("a, button").forEach((node) => {
      node.addEventListener("pointerenter", () => cursor.classList.add("is-growing"));
      node.addEventListener("pointerleave", () => cursor.classList.remove("is-growing"));
    });

    cursorFrame = requestAnimationFrame(renderCursor);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        cancelAnimationFrame(cursorFrame);
      } else {
        cursorFrame = requestAnimationFrame(renderCursor);
      }
    });
  }

  if (finePointer.matches && !prefersReducedMotion.matches) {
    /* Magnetic primary buttons */
    document.querySelectorAll(".btn.primary").forEach((button) => {
      button.addEventListener("pointermove", (event) => {
        const rect = button.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) * 0.16;
        const y = (event.clientY - rect.top - rect.height / 2) * 0.24;
        button.style.transform = `translate(${x}px, ${y}px)`;
      });

      button.addEventListener("pointerleave", () => {
        button.style.transform = "";
      });
    });

    /* Subtle 3D tilt on the app-window mockup */
    const tiltTarget = document.querySelector(".window");

    if (tiltTarget) {
      tiltTarget.style.transformStyle = "preserve-3d";

      tiltTarget.addEventListener("pointermove", (event) => {
        const rect = tiltTarget.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;
        tiltTarget.style.transform = `perspective(900px) rotateX(${(-py * 8).toFixed(
          2
        )}deg) rotateY(${(px * 10).toFixed(2)}deg) translateZ(6px)`;
      });

      tiltTarget.addEventListener("pointerleave", () => {
        tiltTarget.style.transform = "";
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Parallax orbs driven by pointer + scroll                            */
  /* ------------------------------------------------------------------ */
  if (!prefersReducedMotion.matches) {
    const orbs = [...document.querySelectorAll(".orb")];

    if (orbs.length) {
      let targetX = 0;
      let targetY = 0;
      let currentX = 0;
      let currentY = 0;
      let orbFrame = 0;

      const renderOrbs = () => {
        currentX += (targetX - currentX) * 0.05;
        currentY += (targetY - currentY) * 0.05;

        orbs.forEach((orb, index) => {
          const depth = (index + 1) * 8;
          orb.style.translate = `${(currentX * depth).toFixed(2)}px ${(currentY * depth).toFixed(
            2
          )}px`;
        });

        orbFrame = requestAnimationFrame(renderOrbs);
      };

      window.addEventListener(
        "pointermove",
        (event) => {
          targetX = event.clientX / window.innerWidth - 0.5;
          targetY = event.clientY / window.innerHeight - 0.5;
        },
        { passive: true }
      );

      orbFrame = requestAnimationFrame(renderOrbs);

      document.addEventListener("visibilitychange", () => {
        if (document.hidden) cancelAnimationFrame(orbFrame);
        else orbFrame = requestAnimationFrame(renderOrbs);
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Copy email to clipboard                                             */
  /* ------------------------------------------------------------------ */
  const copyButtons = document.querySelectorAll("[data-copy-email]");

  copyButtons.forEach((button) => {
    const label = button.querySelector("span") ?? button;
    const original = label.textContent;

    button.addEventListener("click", async () => {
      const email = button.dataset.copyEmail;
      if (!email) return;

      try {
        await navigator.clipboard.writeText(email);
        label.textContent = "Copied!";
      } catch (error) {
        label.textContent = email;
      }

      window.setTimeout(() => {
        label.textContent = original;
      }, 1600);
    });
  });
})();
