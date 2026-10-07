(() => {
  "use strict";

  const ready = (fn) => {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  };

  ready(() => {
    // ==============================
    // Theme toggle (label shows target)
    // ==============================
    const root = document.documentElement;
    const btnTheme = document.getElementById("btnTheme");
    const themeLabel = document.getElementById("themeLabel");

    const getTheme = () => root.getAttribute("data-theme") || "light";
    const setTheme = (t) => {
      root.setAttribute("data-theme", t);
      try { localStorage.setItem("theme", t); } catch {}
      if (themeLabel) themeLabel.textContent = (t === "dark") ? "Light" : "Dark";
    };

    try {
      const saved = localStorage.getItem("theme");
      if (saved === "dark" || saved === "light") setTheme(saved);
      else setTheme("dark");
    } catch { setTheme("dark"); }

    if (btnTheme) {
      btnTheme.addEventListener("click", () => {
        setTheme(getTheme() === "dark" ? "light" : "dark");
      });
    }

    // ==============================
    // Back to top
    // ==============================
    const toTop = document.getElementById("toTop");
    if (toTop) toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

    // ==============================
    // Guestbook (compat payload + compat render)
    // ==============================
    const gbForm = document.getElementById("gbForm");
    const gbName = document.getElementById("gbName");
    const gbText = document.getElementById("gbText");
    const gbHint = document.getElementById("gbHint");
    const gbList = document.getElementById("gbList");
    const gbSubmit = document.getElementById("gbSubmit");

    const apiBase = "/guestbook/api";

    const esc = (s) =>
      String(s ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

    const pickText = (it) =>
      it?.content ?? it?.message ?? it?.text ?? it?.body ?? it?.msg ?? it?.comment ?? "";

    const pickTime = (it) => it?.created_at ?? it?.createdAt ?? it?.time ?? it?.created ?? "";

    const renderMsgs = (items) => {
      if (!gbList) return;
      gbList.innerHTML = "";

      if (!items || items.length === 0) {
        gbList.innerHTML = `<div class="muted small">No messages yet.</div>`;
        return;
      }

      for (const it of items.sort((a,b)=> new Date(b.created_at||b.createdAt||b.time||0)-new Date(a.created_at||a.createdAt||a.time||0))) {
        const el = document.createElement("div");
        el.className = "gbitem";

        const name = esc(it?.name || it?.author || "Anonymous");
        const rawText = pickText(it);
        const text = esc(rawText);
        const tRaw = pickTime(it);
        const t = tRaw ? new Date(tRaw).toLocaleString() : "";

        el.innerHTML = `
          <div class="meta"><span><strong>${name}</strong></span><span>${esc(t)}</span></div>
          <p class="text">${text ? text.replaceAll("\n", "<br/>") : '<span class="muted small">(no content)</span>'}</p>
        `;
        gbList.appendChild(el);
      }
    };

    const loadMsgs = async () => {
      if (!gbList) return;
      try {
        const r = await fetch(`${apiBase}/messages`, { cache: "no-store" });
        const txt = await r.text();
        let j = null;
        try { j = JSON.parse(txt); } catch {}

        if (!r.ok) {
          console.warn("[guestbook] GET failed:", r.status, txt);
          gbList.innerHTML = `<div class="muted small">Failed to load messages. (${r.status})</div>`;
          return;
        }

        const items = (j && (j.messages || j.items || j.data || j)) || [];
        renderMsgs(Array.isArray(items) ? items : []);
      } catch (e) {
        gbList.innerHTML = `<div class="muted small">Failed to load messages. (network)</div>`;
        console.warn("[guestbook] load error:", e);
      }
    };

    if (gbForm && gbName && gbText && gbSubmit) {
      gbForm.addEventListener("submit", async (ev) => {
        ev.preventDefault();
        const name = (gbName.value || "").trim();
        const content = (gbText.value || "").trim();

        if (!content) {
          if (gbHint) gbHint.textContent = "Message cannot be empty.";
          return;
        }

        gbSubmit.disabled = true;
        if (gbHint) gbHint.textContent = "Submitting…";

        try {
          const payload = { name, content, message: content, text: content, body: content };

          const r = await fetch(`${apiBase}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          const txt = await r.text();
          if (!r.ok) {
            console.warn("[guestbook] POST failed:", r.status, txt);
            if (gbHint) gbHint.textContent = `Submit failed. (${r.status})`;
            return;
          }

          gbText.value = "";
          if (gbHint) gbHint.textContent = "Submitted! Waiting for approval.";
          await loadMsgs();
        } catch (e) {
          if (gbHint) gbHint.textContent = "Submit failed. Please try again.";
          console.warn("[guestbook] submit network error:", e);
        } finally {
          gbSubmit.disabled = false;
        }
      });
    }

    loadMsgs();

    // ==============================
    // Sakura (few, very slow)
    // ==============================
    const makeSakura = () => {
      const layer = document.getElementById("sakura-layer");
      if (!layer) return;

      layer.innerHTML = "";
      const count = 14;

      for (let i = 0; i < count; i++) {
        const p = document.createElement("div");
        p.className = "sakura";

        const x = Math.random() * 100;
        const size = 7 + Math.random() * 7;
        const dur = 46 + Math.random() * 30;
        const delay = -Math.random() * dur;
        const op = 0.14 + Math.random() * 0.12;
        const sway = 14 + Math.random() * 26;
        const swayDur = 10 + Math.random() * 12;

        p.style.setProperty("--x", `${x}vw`);
        p.style.setProperty("--size", `${size}px`);
        p.style.setProperty("--dur", `${dur}s`);
        p.style.setProperty("--delay", `${delay}s`);
        p.style.setProperty("--op", `${op}`);
        p.style.setProperty("--sway", `${sway}px`);
        p.style.setProperty("--swayDur", `${swayDur}s`);

        layer.appendChild(p);
      }
    };

    // ==============================
    // Scroll thread: growing silk + windchime (subtle swing)
    // ==============================
    const bindScrollThread = () => {
      const host = document.getElementById("scroll-thread");
      const line = host ? host.querySelector(".thread-line") : null;
      const chime = document.getElementById("windchime");
      if (!host || !line || !chime) return;

      let ticking = false;

      // swing state
      let lastY = window.scrollY || 0;
      let lastT = performance.now();
      let ang = 0;   // current angle (deg)
      let vel = 0;   // angular velocity

      const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

      const update = () => {
        ticking = false;

        const doc = document.documentElement;
        const scrollTop = window.scrollY || doc.scrollTop || 0;
        const maxScroll = doc.scrollHeight - window.innerHeight;
        const progress = maxScroll > 0 ? Math.min(1, Math.max(0, scrollTop / maxScroll)) : 0;

        const trackH = host.clientHeight;

        // thread length grows with scroll
        const minLen = 18;
        const maxLen = Math.max(minLen + 80, trackH - 32);
        const len = minLen + progress * (maxLen - minLen);

        line.style.height = `${len}px`;

        // windchime at the end of thread
        const knotOffset = 6;
        chime.style.top = `${Math.max(0, len - knotOffset)}px`;

        // ----- subtle swing based on scroll speed -----
        const now = performance.now();
        const dt = Math.max(1, now - lastT);
        const dy = scrollTop - lastY;
        lastY = scrollTop;
        lastT = now;

        const speed = dy / dt;                 // px per ms (signed)
        const target = clamp(speed * 220, -6, 6); // deg (very small)

        const k = 0.12;
        const damping = 0.86;

        vel = (vel + (target - ang) * k) * damping;
        ang = (ang + vel) * 0.985;             // gentle return to center

        chime.style.transform = `translateX(-50%) rotate(${ang.toFixed(2)}deg)`;
      };

      const onScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
      };

      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", () => requestAnimationFrame(update));
      requestAnimationFrame(update);
    };

    makeSakura();
    bindScrollThread();

    // ==============================
    // Sakana (local)
    // ==============================
    const skHost = document.getElementById("sakana-host");
    const skBtn  = document.getElementById("sakana-switch");

    let sk = null;
    let idx = 0;
    const chars = ["chisato", "takina"];

    const setSwitchLabel = () => {
      if (!skBtn) return;
      const name = chars[idx] === "chisato" ? "Chisato" : "Takina";
      const strong = skBtn.querySelector("strong");
      if (strong) strong.textContent = `Switch · ${name}`;
    };

    const getSakanaLib = () => {
      if (typeof Sakana !== "undefined" && Sakana && typeof Sakana.init === "function") return Sakana;
      const w = window;
      if (w.Sakana && typeof w.Sakana.init === "function") return w.Sakana;
      if (w.SakanaWidget && typeof w.SakanaWidget.init === "function") return w.SakanaWidget;
      return null;
    };

    const mount = () => {
      if (!skHost) return false;
      skHost.innerHTML = "";
      const S = getSakanaLib();
      if (!S) return false;

      try {
        sk = S.init({
          el: skHost,
          character: chars[idx],
          inertia: 0.08,
          decay: 0.99,
          scale: 0.4,
          translateY: 0,
          canSwitchCharacter: false
        });
        setSwitchLabel();
        return true;
      } catch (e) {
        console.warn("[sakana] init error:", e);
        return false;
      }
    };

    const sw = () => {
      idx = (idx + 1) % chars.length;
      try {
        if (sk && typeof sk.setCharacter === "function") sk.setCharacter(chars[idx]);
        setSwitchLabel();
      } catch {
        mount();
      }
    };

    if (skBtn) skBtn.addEventListener("click", sw);

    const ok = mount();
    setSwitchLabel();
    if (!ok) setTimeout(mount, 800);
  });
})();
// v2.0 navigation only. Legacy component and Guestbook blocks above are unchanged.
(() => {
  "use strict";
  const init = () => {
    const button = document.getElementById("btnMenu");
    const navigation = document.getElementById("primaryNav");
    if (button && navigation) {
      const close = () => {
        button.setAttribute("aria-expanded", "false");
        navigation.classList.remove("is-open");
      };
      button.addEventListener("click", () => {
        const open = button.getAttribute("aria-expanded") !== "true";
        button.setAttribute("aria-expanded", String(open));
        navigation.classList.toggle("is-open", open);
      });
      navigation.addEventListener("click", (event) => {
        if (event.target.closest("a")) close();
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && button.getAttribute("aria-expanded") === "true") {
          close();
          button.focus();
        }
      });
      window.addEventListener("resize", () => { if (window.innerWidth > 1080) close(); });
    }
    if (document.body.classList.contains("archive-home") && navigation && "IntersectionObserver" in window) {
      const links = Array.from(navigation.querySelectorAll('a[href^="#"]'));
      const sections = links.map(link => document.getElementById(link.hash.slice(1))).filter(Boolean);
      const observer = new IntersectionObserver(entries => {
        const visible = entries.filter(entry => entry.isIntersecting);
        if (!visible.length) return;
        const id = visible[0].target.id;
        links.forEach(link => {
          if (link.hash === `#${id}`) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      }, { rootMargin: "-20% 0px -65% 0px", threshold: 0 });
      sections.forEach(section => observer.observe(section));
    }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
