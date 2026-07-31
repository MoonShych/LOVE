/* =====================================================================
   ANNIVERSARY GIFT SITE — SCRIPT
   Vanilla JS only. No frameworks, no dependencies.

   HOW TO EDIT THIS GIFT
   ---------------------
   Everything you are likely to want to change lives in the CONFIG
   object right below. You should not need to touch anything past
   the "APP LOGIC" divider unless you want to change behaviour.
   ===================================================================== */

const CONFIG = {

  // Password required on Page 2. Digits only, shown as a 6-character code.
  password: "011025",

  // The moment your relationship "officially" began.
  // Format: new Date(YEAR, MONTH_INDEX(0-11), DAY, HOUR, MINUTE)
  anniversaryDate: new Date(2025, 9, 1, 0, 0, 0), // 1 October 2025

  // Background music for pages 3 onward. If the file is missing,
  // the site keeps working silently — no errors, no broken UI.
  musicSrc: "music/song.mp3",
  musicVolume: 0.55,

  // Sound effects. Any of these can be missing safely.
  sounds: {
    click:   "sounds/click.mp3",
    unlock:  "sounds/unlock.mp3",
    paper:   "sounds/paper.mp3",
    magic:   "sounds/magic.mp3",
    success: "sounds/success.mp3",
  },

  // Photo gallery — add/remove entries freely. If an image file is
  // missing, that slot just shows a soft placeholder instead of
  // breaking the page.
  photos: [
    { src: "images/photo1.jpg", caption: "วันแรกที่เราเจอกัน" },
    { src: "images/photo2.jpg", caption: "ทริปเล็ก ๆ ของเราสองคน" },
    { src: "images/photo3.jpg", caption: "วันที่หัวเราะกันทั้งวัน" },
    { src: "images/photo4.jpg", caption: "ทุกวันธรรมดาที่มีอ้วนอยู่ด้วย" },
  ],

  // The couple photo shown in the final surprise + ending.
  couplePhoto: "images/couple.jpg",

  // Love letter text (Page 5). Use blank lines for paragraph breaks.
  loveLetterText:
`ถึงอ้วน,

เค้าไม่รู้จะเริ่มต้นยังไงดี รู้แค่ว่าตั้งแต่มีอ้วนเข้ามา วันธรรมดา ๆ กลายเป็นวันที่เค้ารอคอยทุกวัน

ขอบคุณที่อดทนกับเค้า ขอบคุณที่อยู่ตรงนี้เสมอไม่ว่าเรื่องเล็กหรือเรื่องใหญ่ และขอบคุณที่ทำให้เค้าได้เรียนรู้ว่าความรักที่ดี หน้าตาเป็นแบบไหน

ต่อจากนี้ไม่ว่าจะมีวันไหนที่ยากลำบาก เค้าอยากให้อ้วนรู้ไว้ว่ามีเค้าอยู่ตรงนี้เสมอ

รักอ้วนมากนะ 🤍`,

};

/* =====================================================================
   APP LOGIC — you probably don't need to edit below this line
   ===================================================================== */

(() => {
  "use strict";

  /* ---------------------------------------------------------------
     Small utilities
     --------------------------------------------------------------- */
  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

  function showScreen(id) {
    document.querySelectorAll(".screen").forEach((el) => el.classList.remove("active"));
    $(id).classList.add("active");
  }

  /* ---------------------------------------------------------------
     Sound effects — every call is safe even if the file is missing
     --------------------------------------------------------------- */
  function playSound(name) {
    const path = CONFIG.sounds[name];
    if (!path) return;
    try {
      const audio = new Audio(path);
      audio.volume = 0.6;
      const p = audio.play();
      if (p && p.catch) p.catch(() => {}); // ignore missing file / autoplay block
    } catch (e) { /* silently ignore */ }
  }

  /* ---------------------------------------------------------------
     Background music — fade in / fade out, never throws
     --------------------------------------------------------------- */
  const bgMusic = $("bg-music");
  bgMusic.volume = 0;
  let musicStarted = false;

  function fadeAudio(audioEl, targetVolume, durationMs) {
    const startVolume = audioEl.volume;
    const startTime = performance.now();
    function step(now) {
      const t = clamp01((now - startTime) / durationMs);
      audioEl.volume = lerp(startVolume, targetVolume, t);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function startMusic() {
    if (musicStarted) return;
    musicStarted = true;
    try {
      const p = bgMusic.play();
      if (p && p.catch) {
        p.then(() => fadeAudio(bgMusic, CONFIG.musicVolume, 2500))
         .catch(() => { musicStarted = false; }); // will retry on next user gesture
      } else {
        fadeAudio(bgMusic, CONFIG.musicVolume, 2500);
      }
    } catch (e) { musicStarted = false; }
  }

  function stopMusic(durationMs = 2500) {
    if (!musicStarted) return;
    fadeAudio(bgMusic, 0, durationMs);
    setTimeout(() => { try { bgMusic.pause(); } catch (e) {} }, durationMs + 50);
  }

  /* ---------------------------------------------------------------
     Canvas setup helper (handles DPR + resize for crisp lines)
     --------------------------------------------------------------- */
  function setupCanvas(canvas) {
    const ctx = canvas.getContext("2d");
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);
    return ctx;
  }

  /* =================================================================
     AMBIENT BACKGROUND — soft floating sparkles behind every page
     ================================================================= */
  (function ambientSparkles() {
    const canvas = $("ambient-canvas");
    const ctx = setupCanvas(canvas);
    const COUNT = window.innerWidth < 500 ? 26 : 42;
    const sparkles = [];

    const palette = ["#F3C6D6", "#FFFFFF", "#E4DCF5", "#E8C9A0"];

    function spawn() {
      return {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 1.6 + 0.6,
        speedY: Math.random() * 0.12 + 0.03,
        drift: Math.random() * 0.4 - 0.2,
        alpha: Math.random() * 0.5 + 0.15,
        twinkleSpeed: Math.random() * 0.015 + 0.005,
        twinklePhase: Math.random() * Math.PI * 2,
        color: palette[Math.floor(Math.random() * palette.length)],
      };
    }
    for (let i = 0; i < COUNT; i++) sparkles.push(spawn());

    function tick(t) {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (const s of sparkles) {
        s.y -= s.speedY;
        s.x += s.drift * 0.05;
        if (s.y < -10) { s.y = window.innerHeight + 10; s.x = Math.random() * window.innerWidth; }
        const twinkle = (Math.sin(t * s.twinkleSpeed + s.twinklePhase) + 1) / 2;
        ctx.beginPath();
        ctx.globalAlpha = s.alpha * (0.5 + twinkle * 0.5);
        ctx.fillStyle = s.color;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  })();

  /* =================================================================
     HEART GEOMETRY — parametric heart curve, used by both the main
     ribbon-of-light transition and the final-surprise heart
     ================================================================= */
  function heartPoint(t, scale) {
    // t in [0, 2*PI)
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    return { x: x * scale, y: y * scale };
  }

  function heartPoints(count, scale) {
    const pts = [];
    for (let i = 0; i < count; i++) {
      const t = (i / count) * Math.PI * 2;
      pts.push(heartPoint(t, scale));
    }
    return pts;
  }

  /* =================================================================
     RIBBON-OF-LIGHT → HEART SEQUENCE
     A single reusable engine used for:
       (a) the Page 2 → Page 3 unlock transition (long, ribbons)
       (b) the Page 7 final-surprise heart (shorter, no ribbons)
     ================================================================= */
  function runHeartSequence({
    canvas,
    totalDuration,      // ms
    particleCount = 140,
    withRibbons = true, // spiral ribbon entrance vs. gentle converge
    heartScale = 11,
    beatCount = 2,
    onFormed = null,    // called once the heart has fully formed
    onExplodeStart = null,
    onComplete = null,
  }) {
    const ctx = setupCanvas(canvas);
    canvas.classList.add("active");

    const cx = () => window.innerWidth / 2;
    const cy = () => window.innerHeight / 2.15;

    const targets = heartPoints(particleCount, heartScale);
    const particles = targets.map((target, i) => {
      let start;
      if (withRibbons) {
        // Enter from the right edge, staggered vertically
        start = {
          x: window.innerWidth + Math.random() * 260,
          y: Math.random() * window.innerHeight,
        };
      } else {
        // Gentle converge from a soft halo around the target
        const ang = Math.random() * Math.PI * 2;
        const rad = 60 + Math.random() * 120;
        start = {
          x: cx() + Math.cos(ang) * rad * 3,
          y: cy() + Math.sin(ang) * rad * 3,
        };
      }
      return {
        sx: start.x, sy: start.y,
        tx: target.x, ty: target.y,
        // per-particle stagger so they don't all move in lockstep
        delay: Math.random() * 0.25,
        spinTurns: withRibbons ? (1.5 + Math.random() * 1.2) : (0.15 + Math.random() * 0.15),
        size: Math.random() * 2 + 1.4,
        color: Math.random() < 0.55 ? "#F3C6D6" : (Math.random() < 0.8 ? "#FFFFFF" : "#E8C9A0"),
        // explosion direction (set later)
        ex: 0, ey: 0,
      };
    });

    // Explosion directions: burst outward, biased slightly left+up
    for (const p of particles) {
      const ang = Math.random() * Math.PI * 2;
      const force = 220 + Math.random() * 340;
      p.ex = Math.cos(ang) * force - 60; // slight leftward bias
      p.ey = Math.sin(ang) * force - 40; // slight upward bias
    }

    // Phase split of the total timeline
    const formEnd = totalDuration * (withRibbons ? 0.52 : 0.45);
    const beatEnd = formEnd + totalDuration * 0.22;
    const explodeStart = beatEnd;

    let formedFired = false;
    let explodeFired = false;
    const startTime = performance.now();

    function drawGlow(x, y, r, color, alpha) {
      ctx.save();
      ctx.globalAlpha = alpha;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
      grad.addColorStop(0, color);
      grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r * 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function frame(now) {
      const elapsed = now - startTime;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      if (elapsed < formEnd) {
        /* ---------- PHASE 1: converge into heart shape ---------- */
        const rawT = clamp01(elapsed / formEnd);
        for (const p of particles) {
          const t = clamp01((rawT - p.delay) / (1 - p.delay));
          const et = easeOutCubic(t);
          const targetX = cx() + p.tx;
          const targetY = cy() + p.ty;

          let x, y;
          if (withRibbons) {
            // spiral interpolation: blend straight-line progress with an
            // orbiting offset that decays as the particle arrives
            const spiralAngle = (1 - et) * Math.PI * 2 * p.spinTurns;
            const baseX = lerp(p.sx, targetX, et);
            const baseY = lerp(p.sy, targetY, et);
            const swirl = (1 - et) * 70;
            x = baseX + Math.cos(spiralAngle) * swirl;
            y = baseY + Math.sin(spiralAngle) * swirl * 0.6;
          } else {
            x = lerp(p.sx, targetX, et);
            y = lerp(p.sy, targetY, et);
          }
          p.cx = x; p.cy = y;

          ctx.beginPath();
          ctx.globalAlpha = 0.85;
          ctx.fillStyle = p.color;
          ctx.arc(x, y, p.size, 0, Math.PI * 2);
          ctx.fill();

          // faint trailing glow for the ribbon feel
          if (withRibbons && t < 1) drawGlow(x, y, p.size, p.color, 0.10);
        }
      } else if (elapsed < beatEnd) {
        /* ---------- PHASE 2: heart holds + beats ---------- */
        if (!formedFired) { formedFired = true; if (onFormed) onFormed(); }

        const bt = clamp01((elapsed - formEnd) / (beatEnd - formEnd));
        const beatWave = Math.sin(bt * Math.PI * beatCount);
        const pulse = 1 + Math.max(0, beatWave) * 0.09;

        for (const p of particles) {
          const targetX = cx() + p.tx * pulse;
          const targetY = cy() + p.ty * pulse;
          p.cx = targetX; p.cy = targetY;
          ctx.beginPath();
          ctx.globalAlpha = 0.95;
          ctx.fillStyle = p.color;
          ctx.arc(targetX, targetY, p.size * pulse, 0, Math.PI * 2);
          ctx.fill();
          drawGlow(targetX, targetY, p.size, p.color, 0.16 * pulse);
        }
      } else {
        /* ---------- PHASE 3: explode into sparkles ---------- */
        if (!explodeFired) { explodeFired = true; if (onExplodeStart) onExplodeStart(); }

        const et = clamp01((elapsed - explodeStart) / (totalDuration - explodeStart));
        const ease = easeOutCubic(et);
        for (const p of particles) {
          const x = cx() + p.tx + p.ex * ease;
          const y = cy() + p.ty + p.ey * ease - ease * ease * 40; // slight arc
          const alpha = (1 - et) * 0.9;
          ctx.beginPath();
          ctx.globalAlpha = Math.max(0, alpha);
          ctx.fillStyle = p.color;
          const size = p.size * (1 - et * 0.5);
          ctx.arc(x, y, Math.max(0.2, size), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;

      if (elapsed < totalDuration) {
        requestAnimationFrame(frame);
      } else {
        canvas.classList.remove("active");
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        if (onComplete) onComplete();
      }
    }
    requestAnimationFrame(frame);
  }

  /* =================================================================
     PAGE 1 — WELCOME
     ================================================================= */
  $("btn-open-gift").addEventListener("click", () => {
    playSound("click");
    showScreen("page-password");
    setTimeout(() => $("password-input").focus({ preventScroll: true }), 400);
  });

  /* =================================================================
     PAGE 2 — PASSWORD
     ================================================================= */
  const passwordInput = $("password-input");
  const passwordBox = $("password-box");
  const passwordHint = $("password-hint");

  function attemptUnlock() {
    const value = passwordInput.value.trim();
    if (value.length === 0) return;

    if (value === CONFIG.password) {
      playSound("success");
      passwordHint.classList.remove("show");
      $("btn-unlock").blur();
      passwordInput.blur();
      beginMainTransition();
    } else {
      playSound("click");
      passwordHint.textContent = "ยังไม่ถูกน้า 🤍";
      passwordHint.classList.add("show");
      passwordBox.classList.remove("shake");
      // force reflow so the shake animation can restart
      void passwordBox.offsetWidth;
      passwordBox.classList.add("shake");
      passwordInput.value = "";
      passwordInput.focus();
    }
  }

  $("btn-unlock").addEventListener("click", attemptUnlock);
  passwordInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") attemptUnlock();
  });
  passwordInput.addEventListener("input", () => {
    passwordInput.value = passwordInput.value.replace(/[^0-9]/g, "");
  });

  /* ---------------- Transition: Page 2 → Page 3 ---------------- */
  function beginMainTransition() {
    const canvas = $("transition-canvas");
    let memoriesRevealed = false;

    runHeartSequence({
      canvas,
      totalDuration: 12000,
      particleCount: 150,
      withRibbons: true,
      heartScale: 10,
      beatCount: 2,
      onExplodeStart: () => {
        // let Page 3 begin fading in underneath the dispersing sparkles
        if (!memoriesRevealed) {
          memoriesRevealed = true;
          showScreen("page-memories");
          startMusic();
          startCounter();
        }
      },
      onComplete: () => {
        if (!memoriesRevealed) {
          memoriesRevealed = true;
          showScreen("page-memories");
          startMusic();
          startCounter();
        }
      },
    });
  }

  /* =================================================================
     PAGE 3 — MEMORIES / LIVE COUNTER
     ================================================================= */
  let counterInterval = null;
  function startCounter() {
    if (counterInterval) return;
    function update() {
      const now = new Date();
      let diff = now - CONFIG.anniversaryDate;
      if (diff < 0) diff = 0;

      const seconds = Math.floor(diff / 1000) % 60;
      const minutes = Math.floor(diff / (1000 * 60)) % 60;
      const hours = Math.floor(diff / (1000 * 60 * 60)) % 24;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      $("count-days").textContent = days.toLocaleString("th-TH");
      $("count-hours").textContent = String(hours).padStart(2, "0");
      $("count-minutes").textContent = String(minutes).padStart(2, "0");
      $("count-seconds").textContent = String(seconds).padStart(2, "0");
    }
    update();
    counterInterval = setInterval(update, 1000);
  }

  $("btn-to-gallery").addEventListener("click", () => {
    playSound("click");
    showScreen("page-gallery");
    initGalleryIfNeeded();
  });

  /* =================================================================
     PAGE 4 — PHOTO GALLERY
     ================================================================= */
  let galleryIndex = 0;
  let galleryInitialized = false;

  function initGalleryIfNeeded() {
    if (galleryInitialized) return;
    galleryInitialized = true;

    const dotsWrap = $("gallery-dots");
    CONFIG.photos.forEach((_, i) => {
      const dot = document.createElement("div");
      dot.className = "gallery-dot" + (i === 0 ? " active" : "");
      dotsWrap.appendChild(dot);
    });
    renderGalleryImage();
  }

  function renderGalleryImage() {
    const photo = CONFIG.photos[galleryIndex];
    const imgEl = $("gallery-image");
    const frameEl = $("gallery-frame");
    const captionEl = $("gallery-caption");

    imgEl.classList.remove("show");
    frameEl.classList.remove("empty");

    setTimeout(() => {
      imgEl.onerror = () => {
        frameEl.classList.add("empty");
        imgEl.classList.remove("show");
      };
      imgEl.onload = () => {
        imgEl.classList.add("show");
      };
      imgEl.src = photo.src;
      imgEl.alt = photo.caption || "";
      captionEl.textContent = photo.caption || "";
    }, 120);

    document.querySelectorAll(".gallery-dot").forEach((d, i) => {
      d.classList.toggle("active", i === galleryIndex);
    });
  }

  function galleryStep(dir) {
    playSound("click");
    galleryIndex = (galleryIndex + dir + CONFIG.photos.length) % CONFIG.photos.length;
    renderGalleryImage();
  }

  $("gallery-next").addEventListener("click", () => galleryStep(1));
  $("gallery-prev").addEventListener("click", () => galleryStep(-1));

  // basic swipe support
  (function enableSwipe() {
    const stage = $("gallery-stage");
    let startX = null;
    stage.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener("touchend", (e) => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) galleryStep(dx < 0 ? 1 : -1);
      startX = null;
    }, { passive: true });
  })();

  $("btn-to-letter").addEventListener("click", () => {
    playSound("click");
    showScreen("page-letter");
  });

  /* =================================================================
     PAGE 5 — LOVE LETTER
     ================================================================= */
  let letterOpened = false;
  const envelope = $("envelope");
  const letterTextEl = $("letter-text");

  envelope.addEventListener("click", () => {
    if (letterOpened) return;
    letterOpened = true;
    playSound("paper");
    envelope.classList.add("open");
    $("letter-hint").classList.add("hidden");

    setTimeout(typeLetter, 1000);
  });

  function typeLetter() {
    const full = CONFIG.loveLetterText;
    let i = 0;
    letterTextEl.textContent = "";
    const cursor = document.createElement("span");
    cursor.className = "cursor";
    cursor.textContent = "\u00A0";

    function typeChar() {
      if (i < full.length) {
        letterTextEl.textContent = full.slice(0, i + 1);
        letterTextEl.appendChild(cursor);
        i++;
        letterTextEl.scrollTop = letterTextEl.scrollHeight;
        const char = full[i - 1];
        const delay = char === "\n" ? 140 : (Math.random() * 18 + 22);
        setTimeout(typeChar, delay);
      } else {
        cursor.remove();
        $("btn-to-thankyou").classList.remove("hidden");
      }
    }
    typeChar();
  }

  $("btn-to-thankyou").addEventListener("click", () => {
    playSound("click");
    showScreen("page-thankyou");
  });

  /* =================================================================
     PAGE 6 — THANK YOU
     ================================================================= */
  $("btn-final-surprise").addEventListener("click", () => {
    playSound("click");
    showScreen("page-final");
    runFinalSurprise();
  });

  /* =================================================================
     PAGE 7 — FINAL SURPRISE + ENDING
     ================================================================= */
  let finalSurpriseStarted = false;
  async function runFinalSurprise() {
    if (finalSurpriseStarted) return;
    finalSurpriseStarted = true;

    await sleep(1000);
    playSound("magic");

    const canvas = $("transition-canvas");
    await new Promise((resolve) => {
      runHeartSequence({
        canvas,
        totalDuration: 6500,
        particleCount: 110,
        withRibbons: false,
        heartScale: 9,
        beatCount: 2,
        onExplodeStart: () => {
          // reveal the glowing text right as the heart bursts into sparkles
          $("final-love-text").classList.remove("hidden");
          playSound("success");
        },
        onComplete: resolve,
      });
    });

    await sleep(1800);
    $("final-love-text").classList.add("hidden");
    $("couple-photo-wrap").classList.remove("hidden");
    $("couple-photo").onerror = () => {
      $("couple-photo").style.display = "none";
      $("couple-photo-wrap").style.background =
        "linear-gradient(160deg, var(--color-blush), var(--color-lavender))";
      $("couple-photo-wrap").style.display = "flex";
      $("couple-photo-wrap").style.alignItems = "center";
      $("couple-photo-wrap").style.justifyContent = "center";
      $("couple-photo-wrap").innerHTML += '<span style="font-size:44px;">🤍</span>';
    };

    // sparkles running across the photo for ~8s
    runPhotoSparkles(8000);
    await sleep(8000);

    $("ending-line").classList.remove("hidden");
    await sleep(5000);

    // fade everything out, then show the closing card
    document.querySelectorAll(".screen.active .content-wrap > *").forEach((el) => {
      el.classList.add("site-fadeout");
    });
    stopMusic(2200);
    await sleep(1600);

    $("final-love-text").classList.add("hidden", "site-fadeout");
    $("final-love-text").classList.remove("site-fadeout");
    $("couple-photo-wrap").classList.add("hidden");
    $("ending-line").classList.add("hidden");
    document.body.style.background = "var(--color-blush)";
    $("ending-final").classList.remove("hidden");
  }

  function runPhotoSparkles(duration) {
    const wrap = $("couple-photo-wrap");
    if (!wrap || wrap.classList.contains("hidden")) return;
    const canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.inset = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.pointerEvents = "none";
    wrap.appendChild(canvas);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = wrap.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const sparkles = Array.from({ length: 18 }, () => ({
      x: Math.random() * rect.width,
      y: Math.random() * rect.height,
      r: Math.random() * 1.6 + 0.6,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      phase: Math.random() * Math.PI * 2,
    }));

    const start = performance.now();
    function frame(now) {
      const elapsed = now - start;
      ctx.clearRect(0, 0, rect.width, rect.height);
      for (const s of sparkles) {
        s.x += s.vx; s.y += s.vy;
        if (s.x < 0 || s.x > rect.width) s.vx *= -1;
        if (s.y < 0 || s.y > rect.height) s.vy *= -1;
        const tw = (Math.sin(elapsed * 0.004 + s.phase) + 1) / 2;
        ctx.beginPath();
        ctx.globalAlpha = 0.35 + tw * 0.5;
        ctx.fillStyle = "#FFFFFF";
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (elapsed < duration) requestAnimationFrame(frame);
      else canvas.remove();
    }
    requestAnimationFrame(frame);
  }

})();
