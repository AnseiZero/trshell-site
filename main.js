// Small, dependency-free behaviour. Everything degrades: with no JS the page
// is fully readable, the nav is reachable at every width it is shown, and
// mailto links still work.
(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const hasIO = "IntersectionObserver" in window;

  // ---- reveal on scroll ----
  const items = document.querySelectorAll(".reveal");
  if (hasIO && !reduce.matches) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.08 });
    items.forEach((el) => io.observe(el));
  } else {
    items.forEach((el) => el.classList.add("in"));
  }

  // ---- header border once scrolled ----
  const top = document.querySelector(".top");
  const onScroll = () => top.classList.toggle("scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  // ---- one primary CTA per screen: the header's turns primary once the hero's is gone ----
  const topCta = document.getElementById("topCta");
  const heroCtas = document.querySelector(".hero .ctas");
  if (topCta && heroCtas && hasIO) {
    new IntersectionObserver(([e]) => topCta.classList.toggle("is-primary", !e.isIntersecting)).observe(heroCtas);
  } else if (topCta) {
    topCta.classList.add("is-primary");
  }

  // ---- mobile menu: a disclosure with Escape, outside-click and link-click to close ----
  const menuBtn = document.getElementById("menuBtn");
  const nav = document.getElementById("mainNav");
  if (menuBtn && nav) {
    const setOpen = (open, { focusButton = false } = {}) => {
      menuBtn.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("open", open);
      if (!open && focusButton) menuBtn.focus();
    };
    menuBtn.addEventListener("click", () => setOpen(menuBtn.getAttribute("aria-expanded") !== "true"));
    nav.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("open")) setOpen(false, { focusButton: true });
    });
    document.addEventListener("click", (e) => {
      if (nav.classList.contains("open") && !nav.contains(e.target) && !menuBtn.contains(e.target)) setOpen(false);
    });
    window.matchMedia("(min-width: 768px)").addEventListener?.("change", (m) => { if (m.matches) setOpen(false); });
  }

  // ---- where you are: mark the nav link for the section in view ----
  const links = [...document.querySelectorAll('.nav a[href^="#"]')];
  const sections = links.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  if (hasIO && sections.length) {
    const visible = new Map();
    const mark = () => {
      let best = null, bestRatio = 0;
      for (const [id, r] of visible) if (r > bestRatio) { best = id; bestRatio = r; }
      links.forEach((a) => {
        if (a.getAttribute("href") === `#${best}`) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    };
    const spy = new IntersectionObserver((entries) => {
      for (const e of entries) visible.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0);
      mark();
    }, { rootMargin: "-68px 0px -40% 0px", threshold: [0, 0.15, 0.35, 0.6] });
    sections.forEach((s) => spy.observe(s));
  }

  // ---- hero loop: reduced motion, Save-Data and slow networks start paused ----
  const v = document.getElementById("heroVideo");
  const btn = document.getElementById("heroToggle");
  if (v && btn) {
    const conn = navigator.connection || {};
    const lean = conn.saveData === true || /(^|-)2g$/.test(conn.effectiveType || "");
    let userPaused = reduce.matches || lean;
    if (lean) v.preload = "none";
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
    if (hasIO) {
      new IntersectionObserver(([e]) => { if (e.isIntersecting) tryPlay(); else v.pause(); }, { threshold: 0.25 }).observe(v);
    } else { tryPlay(); }
    reduce.addEventListener?.("change", (e) => { if (e.matches) { userPaused = true; v.pause(); } });
    sync();
  }

  // ---- copy email: mailto fails silently without a desktop mail app ----
  const copy = document.getElementById("copyEmail");
  const status = document.getElementById("copyStatus");
  if (copy && status) {
    copy.hidden = false;
    const label = copy.querySelector(".copy-l");
    let t;
    copy.addEventListener("click", async () => {
      const email = copy.dataset.email;
      clearTimeout(t);
      try {
        await navigator.clipboard.writeText(email);
        status.classList.remove("err");
        status.textContent = "Copied — paste it into your mail app.";
        label.textContent = "Copied";
        // success is a brief confirmation; it clears itself
        t = setTimeout(() => { label.textContent = "Copy email"; status.textContent = ""; }, 4000);
      } catch {
        // a failure carries the recovery path, so it stays until the next attempt
        status.classList.add("err");
        status.textContent = `Couldn't copy automatically. Select the address above: ${email}`;
      }
    });
  }

  // ---- request form: posts to Formspree without leaving the page ----
  // Without JS the form still posts normally and Formspree shows its own
  // thank-you page. Buttons elsewhere carry data-interest to preselect the choice.
  const form = document.getElementById("rform");
  if (form) {
    const interest = document.getElementById("fInterest");
    const subject = document.getElementById("rSubject");
    const send = document.getElementById("rSend");
    const rstatus = document.getElementById("rStatus");
    const done = document.getElementById("rDone");
    const syncSubject = () => { subject.value = interest.value ? `TRShell: ${interest.value} request` : "TRShell request"; };
    document.querySelectorAll("[data-interest]").forEach((a) => a.addEventListener("click", () => {
      interest.value = a.dataset.interest; syncSubject(); setError(interest, "");
      // focus after the jump so the first field is ready to type into
      setTimeout(() => document.getElementById("fName").focus({ preventScroll: true }), reduce.matches ? 0 : 450);
    }));
    interest.addEventListener("change", syncSubject);

    const setError = (el, msg) => {
      const out = document.getElementById(`${el.id}-e`);
      if (out) out.textContent = msg;
      if (msg) el.setAttribute("aria-invalid", "true"); else el.removeAttribute("aria-invalid");
    };
    const check = (el) => {
      const v = el.value.trim();
      if (el.id === "fName") return v ? "" : "Enter your name.";
      if (el.id === "fEmail") return !v ? "Enter your email so we can reply." : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "Check the email address, for example name@company.com.";
      if (el.id === "fInterest") return v ? "" : "Choose what you're interested in.";
      return "";
    };
    const required = ["fName", "fEmail", "fInterest"].map((id) => document.getElementById(id));
    // validate on leaving a field, and clear an error as soon as it's fixed
    required.forEach((el) => {
      el.addEventListener("blur", () => { if (el.value.trim()) setError(el, check(el)); });
      el.addEventListener("input", () => { if (el.getAttribute("aria-invalid")) setError(el, check(el)); });
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      let first = null;
      for (const el of required) { const m = check(el); setError(el, m); if (m && !first) first = el; }
      if (first) { first.focus(); return; }
      syncSubject();
      send.disabled = true; send.textContent = "Sending…";
      rstatus.classList.remove("err"); rstatus.textContent = "";
      try {
        const res = await fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error(String(res.status));
        const name = document.getElementById("fName").value.trim().split(/\s+/)[0];
        const email = document.getElementById("fEmail").value.trim();
        document.getElementById("rDoneText").textContent = `Thanks, ${name}. We'll reply to ${email} within 24 hours.`;
        form.hidden = true; done.hidden = false; done.focus();
      } catch {
        // keep everything they typed, and give them another way through
        rstatus.classList.add("err");
        rstatus.textContent = "That didn't send. Check your connection and try again, or email trust.oluwasegun@trackedincorp.org.";
        send.disabled = false; send.textContent = "Send request";
      }
    });
  }

  const yr = document.getElementById("yr");
  if (yr) yr.textContent = String(new Date().getFullYear());
})();
