/* =====================================================================
   สคริปต์หลักของเว็บไซต์บอกรัก
   แบ่งเป็นฟังก์ชันย่อยตามฉาก เพื่อให้อ่านง่ายและดูแลง่าย
   ===================================================================== */
document.addEventListener('DOMContentLoaded', () => {

  /* ---------------------------------------------------------------
     1) สร้างดาวระยิบระยับพื้นหลัง
  --------------------------------------------------------------- */
  function createStars(){
    const container = document.getElementById('bg-stars');
    const count = window.innerWidth < 600 ? 45 : 80;
    const frag = document.createDocumentFragment();
    for(let i = 0; i < count; i++){
      const star = document.createElement('div');
      star.className = 'star';
      star.style.left = Math.random() * 100 + 'vw';
      star.style.top = Math.random() * 100 + 'vh';
      star.style.animationDelay = (Math.random() * 2.6) + 's';
      star.style.animationDuration = (2 + Math.random() * 2) + 's';
      frag.appendChild(star);
    }
    container.appendChild(frag);
  }

  /* ---------------------------------------------------------------
     2) หัวใจลอยขึ้นเรื่อย ๆ ตลอดทั้งเว็บ
  --------------------------------------------------------------- */
  function spawnFloatingHeart(){
    const container = document.getElementById('bg-hearts');
    const heart = document.createElement('div');
    heart.className = 'floating-heart';
    const emojis = ['❤️','💕','💖','💗','🌸'];
    heart.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    heart.style.left = Math.random() * 100 + 'vw';
    heart.style.setProperty('--drift', (Math.random() * 80 - 40) + 'px');
    const duration = 7 + Math.random() * 6;
    heart.style.animationDuration = duration + 's';
    heart.style.fontSize = (14 + Math.random() * 14) + 'px';
    container.appendChild(heart);
    setTimeout(() => heart.remove(), duration * 1000 + 200);
  }
  setInterval(spawnFloatingHeart, 650);

  /* ---------------------------------------------------------------
     3) หัวใจฟองสบู่เมื่อแตะ/คลิกหน้าจอ
  --------------------------------------------------------------- */
  function spawnTapBubble(x, y){
    const bubble = document.createElement('div');
    bubble.className = 'tap-bubble';
    const emojis = ['💖','💕','❤️','💗'];
    bubble.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    bubble.style.left = (x - 10) + 'px';
    bubble.style.top = (y - 10) + 'px';
    document.body.appendChild(bubble);
    setTimeout(() => bubble.remove(), 1150);
  }
  document.addEventListener('pointerdown', (e) => {
    spawnTapBubble(e.clientX, e.clientY);
  });

  /* ---------------------------------------------------------------
     4) เพลงพื้นหลัง
  --------------------------------------------------------------- */
  const music = document.getElementById('bg-music');
  const musicPlayer = document.getElementById('music-player');
  const musicToggle = document.getElementById('music-toggle');
  const musicIcon = document.getElementById('music-icon');
  const volumeSlider = document.getElementById('volume-slider');
  let musicStarted = false;

  music.volume = parseFloat(volumeSlider.value);

  function playMusic(){
    if(musicStarted) return;
    musicStarted = true;
    music.play().catch(() => { /* บางเบราว์เซอร์อาจบล็อกจนกว่าจะมีการโต้ตอบเพิ่ม */ });
    musicIcon.textContent = '🎵';
    musicPlayer.classList.remove('hidden');
  }

  musicToggle.addEventListener('click', () => {
    if(music.paused){
      music.play().catch(() => {});
      musicIcon.textContent = '🎵';
    } else {
      music.pause();
      musicIcon.textContent = '🔇';
    }
  });

  volumeSlider.addEventListener('input', () => {
    music.volume = parseFloat(volumeSlider.value);
  });

  /* ---------------------------------------------------------------
     5) เปิดซองจดหมาย 3 มิติ -> เข้าสู่ฉากจดหมาย
  --------------------------------------------------------------- */
  const envelope = document.getElementById('envelope');
  const introScene = document.getElementById('intro-scene');
  const letterScene = document.getElementById('letter-scene');
  const tapHint = document.getElementById('tap-hint');
  let opened = false;

  function openEnvelope(){
    if(opened) return;
    opened = true;

    envelope.classList.add('is-open');
    tapHint.style.opacity = '0';
    playMusic();
    burstPetals(26); // กลีบกุหลาบโปรยหลังเปิดจดหมาย

    // รอให้แอนิเมชันซองเปิดและซูมเข้าเสร็จก่อนค่อยเลื่อนไปฉากจดหมาย
    setTimeout(() => {
      introScene.classList.add('scene-exit');
      setTimeout(() => {
        introScene.style.display = 'none';
        letterScene.classList.add('scene-enter');
        letterScene.scrollIntoView({ behavior: 'instant', block: 'start' });
        startTypewriter();
      }, 900);
    }, 1000);
  }

  envelope.addEventListener('click', openEnvelope);
  envelope.addEventListener('keydown', (e) => {
    if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openEnvelope(); }
  });

  /* ---------------------------------------------------------------
     6) เอฟเฟกต์พิมพ์ดีดสำหรับข้อความจดหมาย
  --------------------------------------------------------------- */
  const letterMessage =
`ถึงอ้วน 💌

เค้ารักอ้วนน้ารักมากๆ

เค้าจะไม่ทิ้งอ้วนเค้าสัญญา

กอดๆน้า

จากคนที่รักอ้วนที่สุด`;

  const typewriterEl = document.getElementById('typewriter-text');
  let typewriterDone = false;

  function startTypewriter(){
    if(typewriterDone) return;
    typewriterDone = true;
    let i = 0;
    const speed = 32; // ms ต่ออักษร ให้ความรู้สึกลื่นไหลไม่ช้าเกินไป

    function typeNext(){
      if(i < letterMessage.length){
        typewriterEl.textContent += letterMessage[i];
        i++;
        // พิมพ์เร็วขึ้นเล็กน้อยสำหรับช่องว่าง เพื่อจังหวะที่เป็นธรรมชาติ
        const delay = letterMessage[i - 1] === '\n' ? speed * 4 : speed;
        setTimeout(typeNext, delay);
      }
    }
    typeNext();
  }

  /* ---------------------------------------------------------------
     7) ตัวนับเวลาที่คบกันแบบ Real-time
  --------------------------------------------------------------- */
  const startDate = new Date(2025, 9, 1, 0, 0, 0); // 01/10/2025 (เดือน index เริ่มที่ 0)
  const elDays = document.getElementById('count-days');
  const elHours = document.getElementById('count-hours');
  const elMinutes = document.getElementById('count-minutes');
  const elSeconds = document.getElementById('count-seconds');

  function updateCounter(){
    const now = new Date();
    let diff = Math.max(0, now - startDate);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= days * (1000 * 60 * 60 * 24);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * (1000 * 60 * 60);
    const minutes = Math.floor(diff / (1000 * 60));
    diff -= minutes * (1000 * 60);
    const seconds = Math.floor(diff / 1000);

    elDays.textContent = days;
    elHours.textContent = String(hours).padStart(2, '0');
    elMinutes.textContent = String(minutes).padStart(2, '0');
    elSeconds.textContent = String(seconds).padStart(2, '0');
  }
  updateCounter();
  setInterval(updateCounter, 1000);

  /* ---------------------------------------------------------------
     8) แกลเลอรี: เล่นแอนิเมชันตามเอฟเฟกต์ที่กำหนดเมื่อเลื่อนเข้ามาในจอ
  --------------------------------------------------------------- */
  const galleryItems = document.querySelectorAll('.gallery-item');
  const galleryObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('in-view');
        galleryObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.25, rootMargin: '0px 0px -8% 0px' });

  galleryItems.forEach(item => galleryObserver.observe(item));

  // เอฟเฟกต์ parallax เบา ๆ ตอนเลื่อนหน้าจอ สำหรับรูปที่กำหนด data-effect="parallax"
  const parallaxItems = document.querySelectorAll('.gallery-item[data-effect="parallax"]');
  function updateParallax(){
    parallaxItems.forEach(item => {
      if(!item.classList.contains('in-view')) return;
      const rect = item.getBoundingClientRect();
      const offset = (rect.top - window.innerHeight / 2) * 0.06;
      item.style.transform = `translateY(${offset}px)`;
    });
  }
  window.addEventListener('scroll', () => requestAnimationFrame(updateParallax), { passive: true });

  /* ---------------------------------------------------------------
     9) ตอนจบ: กลีบกุหลาบเต็มจอ + Confetti + ข้อความใหญ่ (เล่นครั้งเดียว)
  --------------------------------------------------------------- */
  function burstPetals(amount){
    const layer = document.getElementById('petals-fall');
    const petalEmojis = ['🌸','🌹','💮'];
    for(let i = 0; i < amount; i++){
      const petal = document.createElement('div');
      petal.className = 'petal';
      petal.textContent = petalEmojis[Math.floor(Math.random() * petalEmojis.length)];
      petal.style.left = Math.random() * 100 + '%';
      petal.style.setProperty('--drift', (Math.random() * 120 - 60) + 'px');
      const duration = 3 + Math.random() * 2.5;
      petal.style.animationDuration = duration + 's';
      petal.style.animationDelay = (Math.random() * 1.2) + 's';
      petal.style.fontSize = (14 + Math.random() * 12) + 'px';
      layer.appendChild(petal);
      setTimeout(() => petal.remove(), (duration + 1.5) * 1000);
    }
  }

  function burstConfetti(amount){
    const layer = document.getElementById('confetti-layer');
    const colors = ['#F0A9BC', '#D4AF7A', '#F8D2DC', '#EAD3A3', '#E27E97'];
    for(let i = 0; i < amount; i++){
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      const duration = 3 + Math.random() * 2;
      piece.style.animationDuration = duration + 's';
      piece.style.animationDelay = (Math.random() * 0.8) + 's';
      layer.appendChild(piece);
      setTimeout(() => piece.remove(), (duration + 1.2) * 1000);
    }
  }

  const endingScene = document.getElementById('ending-scene');
  let endingPlayed = false;
  const endingObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting && !endingPlayed){
        endingPlayed = true;
        burstPetals(40);
        burstConfetti(60);
        // โปรยกลีบกุหลาบซ้ำเป็นระลอกให้ตอนจบดูอบอุ่นและมีชีวิตชีวา
        setTimeout(() => burstPetals(30), 1400);
        setTimeout(() => burstConfetti(40), 1600);
      }
    });
  }, { threshold: 0.4 });

  endingObserver.observe(endingScene);

});
