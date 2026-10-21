/* Manifest Sky — animated universe background.
   Mirrors the app's UniverseCanvas: night radial gradient, ambient dust,
   category-coloured stars with layered halos, breathing sky, shooting stars. */

(function () {
  'use strict';

  const canvas = document.getElementById('sky');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Star category colours from the app (lib/universe.ts)
  const COLORS = [
    '#F2A0BC', // love
    '#8FD0A8', // career
    '#E8C87E', // money
    '#7EC8E3', // travel
    '#F2B880', // family
    '#B4A7FB', // personal
    '#DFA0DF', // creativity
    '#F09B7A', // confidence
    '#EDEBFB', // other
    '#F5D78E', // manifested
  ];

  let W = 0, H = 0, DPR = 1;
  let stars = [];
  let dust = [];
  let shooting = null;
  let lastShoot = 0;

  function rand(min, max) { return min + Math.random() * (max - min); }

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    seed();
  }

  function seed() {
    const area = W * H;
    const nStars = Math.min(140, Math.round(area / 16000));
    const nDust = Math.min(220, Math.round(area / 9000));

    stars = Array.from({ length: nStars }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: rand(0.8, 2.6),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      phase: Math.random() * Math.PI * 2,
      speed: rand(0.3, 1.1),       // twinkle speed
      driftX: rand(-0.02, 0.02),   // slow parallax drift
      driftY: rand(-0.012, 0.012),
    }));

    dust = Array.from({ length: nDust }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: rand(0.3, 0.9),
      a: rand(0.08, 0.35),
    }));
  }

  function drawBackground(t) {
    // Breathing sky: gradient centre pulses gently like the app (0.86 → 1.0)
    const breath = REDUCED ? 1 : 0.93 + 0.07 * Math.sin(t / 2600 * Math.PI);
    const g = ctx.createRadialGradient(W / 2, H * 0.42, 0, W / 2, H * 0.42, Math.max(W, H) * 0.75);
    g.addColorStop(0, 'rgba(27, 21, 56, ' + breath + ')');
    g.addColorStop(1, '#0E0B1E');
    ctx.fillStyle = '#0E0B1E';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function drawDust() {
    ctx.fillStyle = '#CFC9EE';
    for (const d of dust) {
      ctx.globalAlpha = d.a;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawStar(s, t) {
    const tw = REDUCED ? 1 : 0.7 + 0.3 * Math.sin(s.phase + t / 1000 * s.speed);
    const r = s.r * tw;

    // Layered halos matching the app's star rendering
    ctx.globalAlpha = 0.10 * tw;
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, r * 2.9, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.22 * tw;
    ctx.beginPath();
    ctx.arc(s.x, s.y, r * 1.7, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = tw;
    ctx.beginPath();
    ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
    ctx.fill();

    // White highlight spark
    ctx.globalAlpha = 0.85 * tw;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(s.x, s.y, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function updateShooting(t) {
    if (REDUCED) return;
    if (!shooting && t - lastShoot > rand(6000, 14000)) {
      lastShoot = t;
      const fromLeft = Math.random() > 0.5;
      shooting = {
        x: fromLeft ? -40 : W + 40,
        y: rand(H * 0.05, H * 0.45),
        vx: (fromLeft ? 1 : -1) * rand(6, 9),
        vy: rand(1.5, 3),
        life: 1,
      };
    }
    if (shooting) {
      shooting.x += shooting.vx;
      shooting.y += shooting.vy;
      shooting.life -= 0.012;
      if (shooting.life <= 0 || shooting.x < -60 || shooting.x > W + 60) {
        shooting = null;
        return;
      }
      const tail = 14;
      const grad = ctx.createLinearGradient(
        shooting.x, shooting.y,
        shooting.x - shooting.vx * tail, shooting.y - shooting.vy * tail
      );
      grad.addColorStop(0, 'rgba(245, 215, 142, ' + 0.9 * shooting.life + ')');
      grad.addColorStop(1, 'rgba(245, 215, 142, 0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(shooting.x, shooting.y);
      ctx.lineTo(shooting.x - shooting.vx * tail, shooting.y - shooting.vy * tail);
      ctx.stroke();
    }
  }

  function frame(t) {
    drawBackground(t);
    drawDust();
    for (const s of stars) {
      if (!REDUCED) {
        s.x += s.driftX;
        s.y += s.driftY;
        if (s.x < -10) s.x = W + 10; else if (s.x > W + 10) s.x = -10;
        if (s.y < -10) s.y = H + 10; else if (s.y > H + 10) s.y = -10;
      }
      drawStar(s, t);
    }
    updateShooting(t);
    if (!REDUCED) requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(frame);

  // Reveal journey steps on scroll
  const steps = document.querySelectorAll('.step');
  if ('IntersectionObserver' in window && steps.length) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      }
    }, { threshold: 0.25 });
    steps.forEach((s) => io.observe(s));
  } else {
    steps.forEach((s) => s.classList.add('visible'));
  }
})();
