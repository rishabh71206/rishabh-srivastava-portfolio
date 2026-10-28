const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

const cursor = document.querySelector(".cursor");
if (window.matchMedia("(hover: hover) and (pointer: fine)").matches && cursor) {
  document.body.classList.add("has-cursor");
  window.addEventListener("pointermove", (event) => {
    cursor.style.left = `${event.clientX}px`;
    cursor.style.top = `${event.clientY}px`;
  });
  document.querySelectorAll("a, button").forEach((node) => {
    node.addEventListener("pointerenter", () => cursor.classList.add("grow"));
    node.addEventListener("pointerleave", () => cursor.classList.remove("grow"));
  });
}

const animateCount = (el) => {
  const end = Number(el.dataset.count);
  if (!Number.isFinite(end)) return;
  const start = performance.now();
  const duration = 1100;
  const tick = (now) => {
    const t = Math.min(1, (now - start) / duration);
    el.textContent = Math.round(end * (1 - Math.pow(1 - t, 3)));
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

const fillMeter = (el) => {
  const value = el.dataset.meter;
  if (!value) return;
  el.style.width = `${value}%`;
};

const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("in");
      entry.target.querySelectorAll("[data-count]").forEach(animateCount);
      entry.target.querySelectorAll("[data-meter]").forEach(fillMeter);
      io.unobserve(entry.target);
    });
  },
  { threshold: 0.18 }
);

document.querySelectorAll(".reveal, .stats, .project, .skills li").forEach((el) => io.observe(el));

const sections = [...document.querySelectorAll("section[id]")];
const navLinks = [...document.querySelectorAll(".nav nav a")];

const setActive = () => {
  const y = window.scrollY + 120;
  let current = sections[0]?.id;
  sections.forEach((section) => {
    if (section.offsetTop <= y) current = section.id;
  });
  navLinks.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === `#${current}`);
  });
};

setActive();
window.addEventListener("scroll", setActive, { passive: true });
