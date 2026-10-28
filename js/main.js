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
  /* Split section headings into animated letters                        */
  /* ------------------------------------------------------------------ */
  if (!prefersReducedMotion.matches) {
    document.querySelectorAll(".section-head h2").forEach((heading) => {
      const words = heading.textContent.trim().split(/\s+/);
      const fragment = document.createDocumentFragment();
      let index = 0;

      words.forEach((word, wordIndex) => {
        const wordEl = document.createElement("span");
        wordEl.className = "word";

        [...word].forEach((character) => {
          const charEl = document.createElement("span");
          charEl.className = "char";
          charEl.style.setProperty("--i", String(index));
          charEl.textContent = character;
          wordEl.appendChild(charEl);
          index += 1;
        });

        fragment.appendChild(wordEl);
        if (wordIndex < words.length - 1) fragment.appendChild(document.createTextNode(" "));
      });

      heading.textContent = "";
      heading.appendChild(fragment);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Pointer spotlight on cards                                          */
  /* ------------------------------------------------------------------ */
  if (finePointer.matches && !prefersReducedMotion.matches) {
    document
      .querySelectorAll(".feature-grid article, .skills li, .project.compact, .timeline li")
      .forEach((card) => {
        card.addEventListener(
          "pointermove",
          (event) => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
            card.style.setProperty("--my", `${event.clientY - rect.top}px`);
          },
          { passive: true }
        );
      });
  }

  /* ------------------------------------------------------------------ */
  /* Hero particle constellation                                         */
  /* ------------------------------------------------------------------ */
  const canvas = document.querySelector(".particles");
  const hero = document.querySelector(".hero");

  if (canvas && hero && !prefersReducedMotion.matches) {
    const ctx = canvas.getContext("2d");
    const nodes = [];
    const pointer = { x: -9999, y: -9999 };
    let width = 0;
    let height = 0;
    let frame = 0;
    let visible = true;

    const palette = () => {
      const styles = getComputedStyle(document.documentElement);
      return {
        dot: styles.getPropertyValue("--accent").trim() || "#d8b36a",
        line: styles.getPropertyValue("--accent-2").trim() || "#6f9e8a",
      };
    };

    const seed = () => {
      const count = Math.max(26, Math.min(72, Math.round((width * height) / 20000)));
      nodes.length = 0;

      for (let i = 0; i < count; i += 1) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.32,
          vy: (Math.random() - 0.5) * 0.32,
          r: Math.random() * 1.5 + 0.6,
        });
      }
    };

    const resize = () => {
      const rect = hero.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      width = rect.width;
      height = rect.height;

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const { dot, line } = palette();

      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < -20) node.x = width + 20;
        if (node.x > width + 20) node.x = -20;
        if (node.y < -20) node.y = height + 20;
        if (node.y > height + 20) node.y = -20;

        const dx = node.x - pointer.x;
        const dy = node.y - pointer.y;
        const distance = Math.hypot(dx, dy);

        if (distance < 150 && distance > 0.01) {
          node.x += (dx / distance) * 0.7;
          node.y += (dy / distance) * 0.7;
        }

        ctx.globalAlpha = 0.55;
        ctx.fillStyle = dot;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.strokeStyle = line;
      ctx.lineWidth = 1;

      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const a = nodes[i];
          const b = nodes[j];
          const distance = Math.hypot(a.x - b.x, a.y - b.y);

          if (distance < 130) {
            ctx.globalAlpha = (1 - distance / 130) * 0.26;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1;
      frame = requestAnimationFrame(draw);
    };

    const start = () => {
      if (frame) return;
      frame = requestAnimationFrame(draw);
    };

    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    resize();
    start();

    window.addEventListener("resize", () => {
      resize();
    });

    hero.addEventListener(
      "pointermove",
      (event) => {
        const rect = canvas.getBoundingClientRect();
        pointer.x = event.clientX - rect.left;
        pointer.y = event.clientY - rect.top;
      },
      { passive: true }
    );

    hero.addEventListener("pointerleave", () => {
      pointer.x = -9999;
      pointer.y = -9999;
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            visible = entry.isIntersecting;
            if (visible) start();
            else stop();
          });
        },
        { threshold: 0 }
      ).observe(hero);
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else if (visible) start();
    });
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
