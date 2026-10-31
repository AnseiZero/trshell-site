// Small, dependency-free behaviour: reveal-on-scroll, a header border once you
// scroll, and a hero loop that respects reduced motion, pauses when off-screen
// and always has a visible pause control.
(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  // reveal on scroll
  const items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce.matches) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.08 });
    items.forEach((el) => io.observe(el));
  } else {
    items.forEach((el) => el.classList.add("in"));
  }

  // header border after the first scroll
  const top = document.querySelector(".top");
  const onScroll = () => top.classList.toggle("scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  // hero loop
  const v = document.getElementById("heroVideo");
  const btn = document.getElementById("heroToggle");
  if (v && btn) {
    let userPaused = reduce.matches;              // reduced motion: start paused on the poster
    const label = btn.querySelector(".vt-label");
    const sync = () => {
      btn.setAttribute("aria-pressed", String(v.paused));
      label.textContent = v.paused ? "Play" : "Pause";
    };
    const tryPlay = () => { if (!userPaused) v.play().catch(() => {}).finally(sync); };
    btn.hidden = false;
    btn.addEventListener("click", () => {
      if (v.paused) { userPaused = false; v.play().catch(() => {}).finally(sync); }
      else { userPaused = true; v.pause(); sync(); }
    });
    v.addEventListener("play", sync); v.addEventListener("pause", sync);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => { if (e.isIntersecting) tryPlay(); else v.pause(); }, { threshold: 0.25 }).observe(v);
    } else { tryPlay(); }
    reduce.addEventListener?.("change", (e) => { if (e.matches) { userPaused = true; v.pause(); } });
    sync();
  }

  const yr = document.getElementById("yr");
  if (yr) yr.textContent = String(new Date().getFullYear());
})();
