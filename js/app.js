/* ============================================================
   ANNIVERSARY LOVE STORY — APP.JS
   Vanilla JS only. No frameworks.
   ============================================================ */

(function(){
  'use strict';

  /* ============================================================
     CONFIG SYSTEM — edit these values for your own story
     ============================================================ */
const CONFIG = {
    password: "011025",

    startDate: "2025-10-01T00:00:00",

    hint: "💭 Hint : วันที่ที่ทุกอย่างเริ่มต้น",

    music: "assets/music/song.mp3",
    voice: "assets/voice/voice1.mp3",
    letter: "assets/letter/letter.txt",

    imageCount: 10,
    imagePath: "assets/images/",

    imageExt: [
        ".jpg",
        ".jpeg",
        ".png",
        ".webp"
    ]
};

  // Fallback letter text used only if letter.txt can't be fetched
  // (e.g. opening the file directly with file:// instead of a local server)
  const FALLBACK_LETTER =
`ถึงคนที่รักที่สุด

จำวันแรกที่เราเจอกันได้ไหม
ตอนนั้นฉันไม่รู้เลยว่าวันธรรมดาวันหนึ่ง
จะกลายเป็นจุดเริ่มต้นของเรื่องราวที่สวยที่สุดในชีวิตฉัน

ขอบคุณที่เลือกเดินเข้ามาในชีวิตฉัน
ขอบคุณที่ยังอยู่ตรงนี้ จนถึงวันนี้

Happy Anniversary นะ
รักเธอที่สุดในโลกเลย ❤️`;

  /* ============================================================
     STATE
     ============================================================ */
  let enteredCode = "";
  let musicStarted = false;
  let currentPage = "lock";
  let galleryImages = [];
  let lightboxIndex = 0;
  let audioCtx = null;

  /* ============================================================
     SMALL UTILS
     ============================================================ */
  const $ = (sel) => document.querySelector(sel);
  const $all = (sel) => Array.from(document.querySelectorAll(sel));

  function ensureAudioCtx(){
    if (!audioCtx){
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  // Tiny synthesized "tick" sound for keypad presses (no audio file needed)
  function playTick(){
    const ctx = ensureAudioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 720;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }

  // Tiny synthesized "success" chime for correct password
  function playSuccess(){
    const ctx = ensureAudioCtx();
    if (!ctx) return;
    const notes = [523.25, 659.25, 783.99]; // C5 E5 G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.11;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.12, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.4);
    });
  }

  /* ============================================================
     AMBIENT BACKGROUND — floating hearts / sparkles / petals
     Runs continuously behind every page.
     ============================================================ */
  const AMBIENT_GLYPHS = ['❤️','💕','✨','🌸','💜'];
  function spawnFloaty(){
    const layer = $('#ambient-layer');
    if (!layer) return;
    const el = document.createElement('span');
    el.className = 'floaty';
    el.textContent = AMBIENT_GLYPHS[Math.floor(Math.random()*AMBIENT_GLYPHS.length)];
    const size = 12 + Math.random()*16;
    const left = Math.random()*100;
    const duration = 9 + Math.random()*8;
    const dx = (Math.random()*80 - 40) + 'px';
    el.style.left = left + 'vw';
    el.style.fontSize = size + 'px';
    el.style.setProperty('--dx', dx);
    el.style.setProperty('--o', (0.4 + Math.random()*0.4).toFixed(2));
    el.style.setProperty('--s', (0.7 + Math.random()*0.6).toFixed(2));
    el.style.animationDuration = duration + 's';
    layer.appendChild(el);
    setTimeout(() => el.remove(), duration*1000 + 200);
  }
  setInterval(spawnFloaty, 900);
  for (let i=0;i<5;i++) setTimeout(spawnFloaty, i*300);

  // Gentle parallax when tilting the phone
  function initTilt(){
    if (typeof DeviceOrientationEvent === 'undefined') return;
    window.addEventListener('deviceorientation', (e) => {
      const x = (e.gamma || 0) / 45; // -1..1 roughly
      const y = (e.beta || 0) / 90;
      const blobs = $all('.glow-blob');
      blobs.forEach((b, i) => {
        const mult = i === 0 ? 12 : -12;
        b.style.transform = `translate(${x*mult}px, ${y*mult}px)`;
      });
    }, true);
  }

  /* ============================================================
     ROUTER
     ============================================================ */
  const PAGE_ORDER = ['lock','home','letter','gallery','voice','ending'];

  function goTo(pageId){
    const target = $('#page-' + pageId);
    if (!target) return;
    $all('.page').forEach(p => p.classList.remove('active'));
    target.classList.add('active');
    currentPage = pageId;

    const chrome = pageId !== 'lock';
    $('#topActions').style.display = chrome ? 'flex' : 'none';
    $('#bottomNav').style.display = chrome ? 'flex' : 'none';

    $all('.nav-dot').forEach(d => {
      d.classList.toggle('active', d.dataset.goto === pageId);
    });

    if (pageId === 'home') startLoveTimer();
    window.scrollTo(0,0);
  }

  $all('[data-goto]').forEach(btn => {
    btn.addEventListener('click', () => goTo(btn.dataset.goto));
  });

  /* ============================================================
     PAGE 1 — PASSWORD / KEYPAD SYSTEM
     (no <input>, so mobile keyboard never pops up)
     ============================================================ */
  $('#lockHint').textContent = CONFIG.hint;

  function renderDots(){
    const dots = $all('#dotsRow .dot');
    dots.forEach((d, i) => d.classList.toggle('filled', i < enteredCode.length));
  }

  function shakeDots(){
    const row = $('#dotsRow');
    row.classList.add('shake');
    $all('#dotsRow .dot').forEach(d => d.classList.add('shake'));
    setTimeout(() => {
      row.classList.remove('shake');
      $all('#dotsRow .dot').forEach(d => d.classList.remove('shake'));
      enteredCode = "";
      renderDots();
    }, 480);
  }

  function pressKey(key, btnEl){
    if (btnEl){
      btnEl.classList.add('pressed');
      setTimeout(() => btnEl.classList.remove('pressed'), 140);
    }

    if (key === 'back'){
      playTick();
      enteredCode = enteredCode.slice(0, -1);
      renderDots();
      return;
    }

    if (key === 'ok'){
      if (enteredCode.length === 0) return;
      if (enteredCode === CONFIG.password){
        btnEl && btnEl.classList.add('glow');
        checkPasswordSuccess();
      } else {
        shakeDots();
      }
      return;
    }

    // number key
    playTick();
    if (enteredCode.length < 6){
      enteredCode += key;
      renderDots();
    }
  }

  $all('.key').forEach(btn => {
    btn.addEventListener('click', () => pressKey(btn.dataset.key, btn));
  });

  /* ============================================================
     UNLOCK TRANSITION — "Heart Portal"
     ============================================================ */
  function checkPasswordSuccess(){
    playSuccess();
    const portal = $('#portal');
    const heart = $('#portalHeart');
    const flood = $('#portalFlood');

    portal.classList.add('running');
    portal.style.transition = 'opacity .2s ease';
    portal.style.opacity = '1';

    // 1-2: button glow + success sound already triggered
    // 3: small heart appears center
    heart.style.opacity = '1';
    heart.style.transform = 'scale(1)';
    heart.classList.add('beat');

    // 4: heart beats twice (~1s via CSS), then 5-6: grows to fill screen
    setTimeout(() => {
      heart.classList.remove('beat');
      heart.classList.add('grow');
      flood.classList.add('show');
    }, 950);

    // 8: start music as the screen floods with gradient
    setTimeout(() => {
      startBackgroundMusic();
    }, 1350);

    // 9-10: fade portal out, enter Home
    setTimeout(() => {
      portal.style.transition = 'opacity .5s ease';
      portal.style.opacity = '0';
      setTimeout(() => {
        portal.classList.remove('running');
        heart.classList.remove('grow');
        heart.style.transform = '';
        heart.style.opacity = '0';
        flood.classList.remove('show');
        goTo('home');
      }, 500);
    }, 1900);
  }

  /* ============================================================
     BACKGROUND MUSIC
     ============================================================ */
  const bgMusic = $('#bgMusic');
  bgMusic.src = CONFIG.music;
  bgMusic.volume = 0.7;

  function startBackgroundMusic(){
    if (musicStarted) return;
    musicStarted = true;
    bgMusic.play().catch(() => {
      // Autoplay might be blocked on some browsers; user can tap the music icon
    });
    $('#musicToggle').classList.remove('muted');
  }

  $('#musicToggle').addEventListener('click', () => {
    const btn = $('#musicToggle');
    if (bgMusic.paused){
      bgMusic.play().catch(()=>{});
      btn.classList.remove('muted');
    } else {
      bgMusic.pause();
      btn.classList.add('muted');
    }
  });

  /* ============================================================
     PAGE 2 — HOME + LOVE TIMER (real time)
     ============================================================ */
  const startDate = new Date(CONFIG.startDate);
  $('#startDateLabel').textContent = formatThaiDate(startDate);

  function formatThaiDate(d){
    const dd = String(d.getDate()).padStart(2,'0');
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  let timerInterval = null;
  function startLoveTimer(){
    if (timerInterval) return;
    updateLoveTimer();
    timerInterval = setInterval(updateLoveTimer, 1000);
  }

  function updateLoveTimer(){
    const now = new Date();
    let years = now.getFullYear() - startDate.getFullYear();
    let months = now.getMonth() - startDate.getMonth();
    let days = now.getDate() - startDate.getDate();
    let hours = now.getHours() - startDate.getHours();
    let minutes = now.getMinutes() - startDate.getMinutes();
    let seconds = now.getSeconds() - startDate.getSeconds();

    if (seconds < 0){ seconds += 60; minutes--; }
    if (minutes < 0){ minutes += 60; hours--; }
    if (hours < 0){ hours += 24; days--; }
    if (days < 0){
      const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      days += prevMonth.getDate();
      months--;
    }
    if (months < 0){ months += 12; years--; }

    if (years < 0){ years = 0; months = 0; days = 0; hours = 0; minutes = 0; seconds = 0; }

    $('#tYears').textContent = years;
    $('#tMonths').textContent = months;
    $('#tDays').textContent = days;
    $('#tHours').textContent = String(hours).padStart(2,'0');
    $('#tMinutes').textContent = String(minutes).padStart(2,'0');
    $('#tSeconds').textContent = String(seconds).padStart(2,'0');
  }

  /* ============================================================
     PAGE 3 — LOVE LETTER (envelope + typewriter)
     ============================================================ */
  const envelope = $('#envelope');
  let letterOpened = false;

  envelope.addEventListener('click', () => {
    if (letterOpened) return;
    letterOpened = true;
    envelope.classList.add('open');
    $('#envelopeHint').style.opacity = '0';

    setTimeout(async () => {
      const paper = $('#letterPaper');
      paper.classList.add('show');
      let text = FALLBACK_LETTER;
      try {
        const res = await fetch(CONFIG.letter);
        if (res.ok) text = await res.text();
      } catch (e){
        // running from file:// — fallback text is used instead
      }
      typewriteLetter(text.trim());
    }, 650);
  });

  function typewriteLetter(text){
    const target = $('#letterText');
    target.textContent = '';
    const chars = Array.from(text); // respects unicode / emoji
    let i = 0;
    function step(){
      if (i < chars.length){
        target.textContent += chars[i];
        i++;
        const delay = chars[i-1] === '\n' ? 90 : 22;
        setTimeout(step, delay);
      } else {
        $('#letterCursor').style.display = 'none';
      }
    }
    step();
  }

  /* ============================================================
     PAGE 4 — MEMORY GALLERY
     ============================================================ */
function buildGallery(){
    const grid = $('#galleryGrid');
    grid.innerHTML = '';
    galleryImages = [];

    for (let i = 1; i <= CONFIG.imageCount; i++){

        const cell = document.createElement('div');
        cell.className = 'gallery-item';
        cell.dataset.index = i - 1;

        const img = document.createElement('img');
        img.alt = 'memory ' + i;
        img.loading = 'lazy';

        let found = false;

        // ลองหาทุกนามสกุล
        for (const ext of CONFIG.imageExt){

            const src = `${CONFIG.imagePath}${i}${ext}`;

            const testImg = new Image();

            testImg.onload = () => {
                if (!found){
                    found = true;
                    img.src = src;
                    galleryImages[i - 1] = src;
                }
            };

            testImg.src = src;
        }

        img.onerror = () => {
            cell.innerHTML = `
            <div class="ph">
                📷<br>
                เพิ่มรูปที่<br>
                ${CONFIG.imagePath}${i}
            </div>`;
        };


        cell.appendChild(img);

        cell.addEventListener('click', () => {
            openLightbox(i - 1);
        });

        grid.appendChild(cell);
    }
}

  function openLightbox(index){
    const cell = $('#galleryGrid').children[index];
    if (cell && cell.querySelector('.ph')) return; // no real photo uploaded yet
    lightboxIndex = index;
    showLightboxImage();
    $('#lightbox').classList.add('show');
  }

  function showLightboxImage(){
    $('#lightboxImg').src = galleryImages[lightboxIndex];
    $('#lightboxImg').style.transform = 'scale(1)';
    $('#lightboxCounter').textContent = `${lightboxIndex+1} / ${galleryImages.length}`;
  }

  $('#lightboxClose').addEventListener('click', () => {
    $('#lightbox').classList.remove('show');
  });

  // swipe to change photo
  let touchStartX = 0;
  const lightboxImg = $('#lightboxImg');
  $('#lightbox').addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  }, {passive:true});
  $('#lightbox').addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50){
      if (dx < 0) lightboxIndex = (lightboxIndex + 1) % galleryImages.length;
      else lightboxIndex = (lightboxIndex - 1 + galleryImages.length) % galleryImages.length;
      showLightboxImage();
    }
  }, {passive:true});

  // double-tap to zoom
  let lastTap = 0;
  let zoomed = false;
  lightboxImg.addEventListener('touchend', () => {
    const now = Date.now();
    if (now - lastTap < 300){
      zoomed = !zoomed;
      lightboxImg.style.transform = zoomed ? 'scale(1.9)' : 'scale(1)';
    }
    lastTap = now;
  });

  /* ============================================================
     PAGE 5 — VOICE MESSAGE
     (background music keeps playing alongside the voice note)
     ============================================================ */
  const voiceAudio = $('#voiceAudio');
  voiceAudio.src = CONFIG.voice;
  const voiceBtn = $('#voicePlayBtn');

  voiceBtn.addEventListener('click', () => {
    if (voiceAudio.paused){
      voiceAudio.play().catch(()=>{});
      voiceBtn.textContent = '❚❚';
      voiceBtn.classList.add('playing');
    } else {
      voiceAudio.pause();
      voiceBtn.textContent = '▶';
      voiceBtn.classList.remove('playing');
    }
  });

  voiceAudio.addEventListener('ended', () => {
    voiceBtn.textContent = '▶';
    voiceBtn.classList.remove('playing');
  });

  voiceAudio.addEventListener('timeupdate', () => {
    const pct = voiceAudio.duration ? (voiceAudio.currentTime / voiceAudio.duration) * 100 : 0;
    $('#voiceProgressFill').style.width = pct + '%';
    $('#voiceTime').textContent = `${formatTime(voiceAudio.currentTime)} / ${formatTime(voiceAudio.duration || 0)}`;
  });

  function formatTime(sec){
    if (!isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2,'0')}`;
  }

  /* ============================================================
     FINAL ENDING — cinematic 5-stage sequence
     ============================================================ */
  $('#endingStartBtn').addEventListener('click', runEndingSequence);
  $('#replayBtn').addEventListener('click', resetEnding);

  function runEndingSequence(){
    $('#topActions').style.display = 'none';
    $('#bottomNav').style.display = 'none';
    $('#endingStage').classList.add('show');

    // ---- Stage 1: screen darkens, hearts rise, music keeps playing ----
    const riseLayer = $('#riseHeartsLayer');
    riseLayer.innerHTML = '';
    for (let i = 0; i < 10; i++){
      setTimeout(() => spawnRiseHeart(riseLayer), i * 160);
    }

    setTimeout(startHeartRain, 1600);
  }

  function spawnRiseHeart(layer){
    const el = document.createElement('span');
    el.className = 'rise-heart';
    el.textContent = Math.random() > 0.5 ? '❤️' : '💜';
    el.style.left = (10 + Math.random()*80) + 'vw';
    el.style.animationDelay = (Math.random()*0.6) + 's';
    layer.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }

  let rainInterval = null;
  function startHeartRain(){
    // ---- Stage 2: heart rain falls from the sky ----
    const rainLayer = $('#rainHeartsLayer');
    rainInterval = setInterval(() => {
      for (let i = 0; i < 3; i++) spawnRainHeart(rainLayer);
    }, 140);

    // ---- Stage 3: show hug button after the rain builds up ----
    setTimeout(() => {
      $('#hugBtn').classList.remove('hidden');
    }, 2400);
  }

  const RAIN_COLORS = ['#F4A6D0','#D6A6EE','#B48CE0','#FBD3E9'];
  function spawnRainHeart(layer){
    const el = document.createElement('span');
    el.className = 'rain-heart';
    const isSparkle = Math.random() > 0.85;
    el.textContent = isSparkle ? '✨' : (Math.random() > 0.5 ? '❤️' : '💜');
    const size = 14 + Math.random()*22;
    const duration = 3 + Math.random()*3;
    el.style.left = Math.random()*100 + 'vw';
    el.style.fontSize = size + 'px';
    el.style.setProperty('--dx', (Math.random()*120 - 60) + 'px');
    el.style.setProperty('--rot', (Math.random()*720 - 360) + 'deg');
    el.style.color = RAIN_COLORS[Math.floor(Math.random()*RAIN_COLORS.length)];
    el.style.animationDuration = duration + 's';
    el.dataset.rain = '1';
    layer.appendChild(el);
    setTimeout(() => el.remove(), duration*1000 + 100);
  }

  $('#hugBtn').addEventListener('click', () => {
    // ---- Stage 3: hug tapped — hearts freeze, phone vibrates ----
    clearInterval(rainInterval);
    $all('.rain-heart').forEach(h => { h.style.animationPlayState = 'paused'; });
    if (navigator.vibrate) navigator.vibrate([80, 40, 80, 40, 140]);
    $('#hugBtn').classList.add('hidden');

    setTimeout(convergeHearts, 300);
  });

  function convergeHearts(){
    // ---- Stage 4: hearts fly together, merge, then burst into light ----
    const rainHearts = $all('.rain-heart');
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const picked = rainHearts.slice(0, Math.min(16, rainHearts.length));

    const converged = [];
    picked.forEach(h => {
      const rect = h.getBoundingClientRect();
      const clone = document.createElement('span');
      clone.className = 'converge-heart';
      clone.textContent = '❤️';
      clone.style.left = rect.left + 'px';
      clone.style.top = rect.top + 'px';
      document.body.appendChild(clone);
      converged.push(clone);
    });

    $('#rainHeartsLayer').innerHTML = '';
    $('#riseHeartsLayer').innerHTML = '';

    requestAnimationFrame(() => {
      converged.forEach(c => {
        c.style.left = (centerX - 12) + 'px';
        c.style.top = (centerY - 12) + 'px';
        c.style.opacity = '0.9';
        c.style.transform = 'scale(1.6)';
      });
    });

    setTimeout(() => {
      converged.forEach(c => c.remove());
      $('#lightBurst').classList.add('burst');
    }, 1050);

    setTimeout(showFinalMessage, 1900);
  }

  function showFinalMessage(){
    // ---- Stage 5: final message ----
    $('#finalMessage').classList.add('show');
  }

  function resetEnding(){
    $('#finalMessage').classList.remove('show');
    $('#lightBurst').classList.remove('burst');
    $('#rainHeartsLayer').innerHTML = '';
    $('#riseHeartsLayer').innerHTML = '';
    $('#endingStage').classList.remove('show');
    $('#topActions').style.display = 'flex';
    $('#bottomNav').style.display = 'flex';
    goTo('ending');
  }

  /* ============================================================
     INIT
     ============================================================ */
  function init(){
    renderDots();
    buildGallery();
    initTilt();
    goTo('lock');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
