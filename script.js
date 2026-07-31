/* =========================================================
   ANNIVERSARY WEBSITE — SCRIPT
   Vanilla JS only. Controls: PIN unlock, heart curtain,
   envelope, typewriter letter, gallery, live counter,
   voice message ducking, and the ending hug burst.
========================================================= */

(() => {
  "use strict";

  /* ---------- CONFIG — edit these two lines for your story ---------- */
  const CORRECT_PIN = "011025";
  const RELATIONSHIP_START = new Date("2025-01-01T00:00:00"); // วันเริ่มคบ (ปรับได้ตรงนี้)

  const LETTER_TEXT =
    "ถึงคนที่เค้ารักที่สุด,\n\n" +
    "ขอบคุณนะที่เดินเข้ามาในชีวิตเค้า และอยู่ตรงนี้เสมอมา\n" +
    "ทุกวันที่ผ่านไปกับเธอ มันเต็มไปด้วยรอยยิ้มและความอบอุ่น\n\n" +
    "วันนี้เป็นอีกหนึ่งวันพิเศษของเรา เค้าอยากให้เธอรู้ว่า\n" +
    "เค้ารักเธอมากแค่ไหน และจะรักแบบนี้ต่อไปเรื่อย ๆ ❤️";

  const ENDING_TEXT =
    "สุขสันต์วันครบรอบนะ ❤️\n" +
    "ขอบคุณที่อยู่ข้างกันมาตลอด\n" +
    "เค้ารักเธอมากนะ";

  const HEART_EMOJIS = ["❤️", "💖", "💗", "💕", "💞", "💘", "🩷", "🤍"];

  /* ---------- helpers ---------- */
  const $ = (id) => document.getElementById(id);
  const rand = (min, max) => Math.random() * (max - min) + min;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function playSound(audioEl) {
    if (!audioEl) return;
    try {
      audioEl.currentTime = 0;
      audioEl.play().catch(() => {});
    } catch (e) {
      /* asset missing — fail silently so the experience keeps going */
    }
  }

  function goToPage(fromId, toId) {
    const from = $(fromId);
    const to = $(toId);
    if (from) from.classList.remove("page-active");
    if (to) to.classList.add("page-active");
  }

  /* =========================================================
     AMBIENT DUST / FLOATING HEARTS (shared background effect)
  ========================================================= */
  function spawnDust(containerId, count) {
    const el = $(containerId);
    if (!el) return;
    for (let i = 0; i < count; i++) {
      const mote = document.createElement("div");
      mote.className = "dust-mote";
      mote.style.left = rand(0, 100) + "%";
      mote.style.bottom = rand(-10, 0) + "%";
      mote.style.animationDuration = rand(6, 12) + "s";
      mote.style.animationDelay = rand(0, 8) + "s";
      el.appendChild(mote);
    }
  }

  function spawnSoftHearts(containerId, count) {
    const el = $(containerId);
    if (!el) return;
    for (let i = 0; i < count; i++) {
      const h = document.createElement("span");
      h.className = "soft-heart";
      h.textContent = pick(HEART_EMOJIS);
      h.style.left = rand(0, 100) + "%";
      h.style.fontSize = rand(14, 26) + "px";
      h.style.setProperty("--drift", rand(-30, 30) + "px");
      h.style.animationDuration = rand(9, 18) + "s";
      h.style.animationDelay = rand(0, 10) + "s";
      el.appendChild(h);
    }
  }

  spawnDust("dust-lock", 22);
  ["dust-envelope", "dust-letter", "dust-counter", "dust-voice", "dust-ending"].forEach(
    (id) => spawnSoftHearts(id, 10)
  );

  /* =========================================================
     PAGE 1 — LOCK SCREEN / CUSTOM KEYPAD
  ========================================================= */
  let enteredPin = "";
  const pinDotsWrap = $("pin-dots");
  const pinDots = pinDotsWrap.querySelectorAll(".pin-dot");
  const lockScreen = $("page-lock");
  const audioClick = $("audio-click");
  const audioUnlock = $("audio-unlock");

  function refreshDots() {
    pinDots.forEach((dot, i) => {
      dot.classList.toggle("filled", i < enteredPin.length);
    });
  }

  function wrongPin() {
    pinDotsWrap.classList.add("shake");
    lockScreen.classList.add("shake-screen");
    if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
    setTimeout(() => {
      pinDotsWrap.classList.remove("shake");
      lockScreen.classList.remove("shake-screen");
      enteredPin = "";
      refreshDots();
    }, 420);
  }

  function correctPin() {
    playSound(audioUnlock);
    const mask = $("lock-mask");
    mask.classList.add("active");
    setTimeout(() => {
      goToPage("page-lock", "page-curtain");
      startHeartCurtain();
      mask.classList.remove("active");
    }, 650);
  }

  function ripple(button, evt) {
    const r = document.createElement("span");
    r.className = "ripple";
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    r.style.width = r.style.height = size + "px";
    const x = (evt.touches ? evt.touches[0].clientX : evt.clientX) - rect.left - size / 2;
    const y = (evt.touches ? evt.touches[0].clientY : evt.clientY) - rect.top - size / 2;
    r.style.left = x + "px";
    r.style.top = y + "px";
    button.appendChild(r);
    setTimeout(() => r.remove(), 500);
  }

  $("keypad").querySelectorAll(".key").forEach((btn) => {
    const handler = (evt) => {
      evt.preventDefault();
      ripple(btn, evt);
      playSound(audioClick);

      const key = btn.dataset.key;
      if (key === "back") {
        enteredPin = enteredPin.slice(0, -1);
        refreshDots();
        return;
      }
      if (key === "heart") {
        // heart key submits early / acts as decorative confirm
        if (enteredPin.length === 6) {
          enteredPin === CORRECT_PIN ? correctPin() : wrongPin();
        }
        return;
      }
      if (enteredPin.length >= 6) return;
      enteredPin += key;
      refreshDots();

      if (enteredPin.length === 6) {
        setTimeout(() => {
          enteredPin === CORRECT_PIN ? correctPin() : wrongPin();
        }, 150);
      }
    };
    btn.addEventListener("touchstart", handler, { passive: false });
    btn.addEventListener("click", handler);
  });

  /* =========================================================
     PAGE 2 — HEART CURTAIN TRANSITION
  ========================================================= */
  const audioWhoosh = $("audio-whoosh");

  function buildCurtainSide(sideEl) {
    sideEl.innerHTML = "";
    const cols = 4;
    const rows = 10; // ~40 hearts per side x2 sides ≈ 80–100+ visible, tiled to feel dense
    const total = cols * rows;
    for (let i = 0; i < total; i++) {
      const tile = document.createElement("div");
      tile.className = "heart-tile";
      const size = pick([70, 90, 110, 130]) * 0.55; // scaled down to fit tile grid on mobile
      tile.style.fontSize = size + "px";
      tile.textContent = pick(HEART_EMOJIS);
      sideEl.appendChild(tile);
    }
  }

  function startHeartCurtain() {
    const left = $("curtain-left");
    const right = $("curtain-right");
    buildCurtainSide(left);
    buildCurtainSide(right);
    left.classList.remove("sweep-in", "sweep-out", "bloom");
    right.classList.remove("sweep-in", "sweep-out", "bloom");
    // force reflow so animation restarts cleanly
    void left.offsetWidth;

    left.classList.add("sweep-in");
    right.classList.add("sweep-in");
    playSound(audioWhoosh);

    setTimeout(() => {
      left.classList.add("bloom");
      right.classList.add("bloom");
      flashPink();
    }, 700);

    setTimeout(() => {
      left.classList.remove("sweep-in");
      right.classList.remove("sweep-in");
      left.classList.add("sweep-out");
      right.classList.add("sweep-out");
      playSound(audioWhoosh);
    }, 1700);

    setTimeout(() => {
      goToPage("page-curtain", "page-envelope");
    }, 2500);
  }

  function flashPink() {
    const flash = document.createElement("div");
    flash.className = "curtain-flash flash-active";
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 1050);
  }

  /* =========================================================
     PAGE 3 — ENVELOPE + MUSIC START
  ========================================================= */
  const audioPaper = $("audio-paper");
  const audioSong = $("audio-song");
  const musicToggle = $("music-toggle");
  let songStarted = false;
  let musicOn = true;

  function fadeInSong() {
    if (songStarted) return;
    songStarted = true;
    audioSong.volume = 0;
    audioSong.play().catch(() => {});
    let vol = 0;
    const step = setInterval(() => {
      vol += 0.05;
      audioSong.volume = Math.min(vol, 1);
      if (vol >= 1) clearInterval(step);
    }, 120); // ~2.4s fade-in
  }

  $("envelope").addEventListener("click", () => {
    const flap = $("envelope-flap");
    const paper = $("envelope-paper");
    const seal = $("envelope-seal");
    if (flap.classList.contains("open")) return;

    seal.classList.add("hide");
    flap.classList.add("open");
    playSound(audioPaper);

    setTimeout(() => {
      paper.classList.add("rise");
      fadeInSong();
    }, 350);

    setTimeout(() => {
      goToPage("page-envelope", "page-letter");
      startLetterTypewriter();
    }, 1900);
  });

  musicToggle.addEventListener("click", () => {
    musicOn = !musicOn;
    musicToggle.textContent = musicOn ? "🎵" : "🔇";
    if (musicOn) {
      audioSong.play().catch(() => {});
    } else {
      audioSong.pause();
    }
  });

  /* =========================================================
     PAGE 4 — LOVE LETTER (typewriter)
  ========================================================= */
  function startLetterTypewriter() {
    const el = $("letter-text");
    const nextBtn = $("letter-next-btn");
    el.textContent = "";
    nextBtn.style.display = "none";
    let i = 0;
    const speed = 38;

    function typeChar() {
      if (i < LETTER_TEXT.length) {
        el.textContent += LETTER_TEXT.charAt(i);
        i++;
        setTimeout(typeChar, speed);
      } else {
        nextBtn.style.display = "inline-block";
      }
    }
    typeChar();
  }

  $("letter-next-btn").addEventListener("click", () => {
    goToPage("page-letter", "page-gallery");
    if (!galleryBuilt) buildGallery();
  });

  /* =========================================================
     PAGE 5 — GALLERY
  ========================================================= */
  let galleryBuilt = false;
  const MAX_IMAGE_PROBE = 20; // tries assets/images/1.jpg ... 20.jpg, skips missing ones

  function buildGallery() {
    galleryBuilt = true;
    const track = $("gallery-track");
    const dotsWrap = $("gallery-dots");
    let loaded = 0;

    for (let i = 1; i <= MAX_IMAGE_PROBE; i++) {
      const img = new Image();
      img.src = `assets/images/${i}.jpg`;
      img.onload = () => {
        const slide = document.createElement("div");
        slide.className = "gallery-slide";
        const imgEl = document.createElement("img");
        imgEl.src = img.src;
        imgEl.alt = "ความทรงจำ " + i;
        imgEl.addEventListener("click", () => openFullscreen(img.src));
        slide.appendChild(imgEl);
        track.appendChild(slide);

        const dot = document.createElement("span");
        dot.className = "gallery-dot";
        dotsWrap.appendChild(dot);
        if (loaded === 0) dot.classList.add("active");
        loaded++;
      };
      img.onerror = () => {
        /* image N doesn't exist — just skip it */
      };
    }

    track.addEventListener("scroll", () => {
      const idx = Math.round(track.scrollLeft / track.clientWidth);
      dotsWrap.querySelectorAll(".gallery-dot").forEach((d, i) => {
        d.classList.toggle("active", i === idx);
      });
    });
  }

  function openFullscreen(src) {
    $("fullscreen-img").src = src;
    $("fullscreen-viewer").classList.add("open");
  }
  $("fullscreen-viewer").addEventListener("click", () => {
    $("fullscreen-viewer").classList.remove("open");
  });

  $("gallery-next-btn").addEventListener("click", () => {
    goToPage("page-gallery", "page-counter");
    startCounter();
  });

  /* =========================================================
     PAGE 6 — ANNIVERSARY COUNTER
  ========================================================= */
  let counterInterval = null;
  let counterStarted = false;

  function computeElapsed() {
    const now = new Date();
    let diff = Math.max(0, now - RELATIONSHIP_START);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return { days, hours, minutes, seconds };
  }

  function animateNumberTo(el, target, duration) {
    const start = performance.now();
    function frame(now) {
      const progress = Math.min((now - start) / duration, 1);
      const value = Math.floor(progress * target);
      el.textContent = value;
      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        el.textContent = target;
      }
    }
    requestAnimationFrame(frame);
  }

  function pulse(el) {
    el.classList.remove("pulse");
    void el.offsetWidth;
    el.classList.add("pulse");
  }

  function startCounter() {
    if (counterStarted) return;
    counterStarted = true;
    const { days, hours, minutes, seconds } = computeElapsed();
    const dEl = $("count-days"), hEl = $("count-hours"), mEl = $("count-minutes"), sEl = $("count-seconds");

    animateNumberTo(dEl, days, 800);
    animateNumberTo(hEl, hours, 800);
    animateNumberTo(mEl, minutes, 800);
    animateNumberTo(sEl, seconds, 800);

    let last = { days, hours, minutes, seconds };

    setTimeout(() => {
      counterInterval = setInterval(() => {
        const now = computeElapsed();
        if (now.seconds !== last.seconds) { sEl.textContent = now.seconds; pulse(sEl); }
        if (now.minutes !== last.minutes) { mEl.textContent = now.minutes; pulse(mEl); }
        if (now.hours !== last.hours) { hEl.textContent = now.hours; pulse(hEl); }
        if (now.days !== last.days) { dEl.textContent = now.days; pulse(dEl); }
        last = now;
      }, 1000);
    }, 850);
  }

  $("counter-next-btn").addEventListener("click", () => {
    goToPage("page-counter", "page-voice");
  });

  /* =========================================================
     PAGE 7 — VOICE MESSAGE (ducks background song)
  ========================================================= */
  const audioVoice = $("audio-voice");
  const voiceWave = $("voice-wave");
  const voicePlayBtn = $("voice-play-btn");

  function fadeSongTo(target, duration) {
    const startVol = audioSong.volume;
    const startTime = performance.now();
    function step(now) {
      const p = Math.min((now - startTime) / duration, 1);
      audioSong.volume = startVol + (target - startVol) * p;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  voicePlayBtn.addEventListener("click", () => {
    if (!audioVoice.paused) return;
    fadeSongTo(0.2, 400);
    audioVoice.currentTime = 0;
    audioVoice.play().catch(() => {});
    voiceWave.classList.add("playing");
    voicePlayBtn.textContent = "🔊 กำลังเล่น...";
  });

  audioVoice.addEventListener("ended", () => {
    voiceWave.classList.remove("playing");
    voicePlayBtn.textContent = "▶ เล่นอีกครั้ง";
    fadeSongTo(1, 800);
  });

  $("voice-next-btn").addEventListener("click", () => {
    goToPage("page-voice", "page-ending");
    startEnding();
  });

  /* =========================================================
     PAGE 8 — ENDING
  ========================================================= */
  let endingStarted = false;

  function spawnStars() {
    const wrap = $("ending-stars");
    for (let i = 0; i < 40; i++) {
      const s = document.createElement("div");
      s.className = "star";
      s.style.left = rand(0, 100) + "%";
      s.style.top = rand(0, 100) + "%";
      s.style.animationDelay = rand(0, 3) + "s";
      wrap.appendChild(s);
    }
  }
  spawnStars();

  function startEnding() {
    if (endingStarted) return;
    endingStarted = true;
    const el = $("ending-text");
    const hugBtn = $("hug-btn");
    let i = 0;
    function typeChar() {
      if (i < ENDING_TEXT.length) {
        el.textContent += ENDING_TEXT.charAt(i);
        i++;
        setTimeout(typeChar, 40);
      } else {
        hugBtn.style.display = "inline-block";
      }
    }
    typeChar();
  }

  $("hug-btn").addEventListener("click", () => {
    const burst = $("hug-burst");
    burst.innerHTML = "";
    for (let i = 0; i < 240; i++) {
      const h = document.createElement("span");
      h.className = "hug-burst-heart";
      h.textContent = pick(HEART_EMOJIS);
      h.style.left = rand(0, 100) + "%";
      h.style.fontSize = rand(18, 42) + "px";
      h.style.animationDuration = rand(1.8, 2.8) + "s";
      h.style.animationDelay = rand(0, 0.6) + "s";
      burst.appendChild(h);
    }
    setTimeout(() => {
      burst.classList.add("fade-out");
    }, 2600);
  });
})();
