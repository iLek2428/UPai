// UPai Warp Effects — Thammasat Edition
// Streak engine ported from upai-login-demo.html
// Light / Dark mode aware, no mouse tracking

// ─── Types ───────────────────────────────────────────────────────────────────

interface Streak {
  angle  : number;
  speed  : number;
  len    : number;
  dist   : number;
  color  : string;
  width  : number;
  opacity: number;
}

interface WarpState {
  canvas        : HTMLCanvasElement | null;
  ctx           : CanvasRenderingContext2D | null;
  streaks       : Streak[];
  animationId   : number | null;
  isRunning     : boolean;
  reducedMotion : boolean;
  resizeObserver: ResizeObserver | null;
  themeObserver : MutationObserver | null;
  W: number; H: number; CX: number; CY: number; maxR: number;
  last: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const COLORS_RGBA_DARK = [
  'rgba(255, 215, 100, ',
  'rgba(244, 162,  45, ',
  'rgba(232,  90,  10, ',
  'rgba(193,  40,  28, ',
  'rgba(255, 240, 160, ',
];

const COLORS_RGBA_LIGHT = [
  'rgba(180, 100,  10, ',
  'rgba(160,  60,   5, ',
  'rgba(140,  30,  10, ',
  'rgba(120,  20,  15, ',
  'rgba(160,  80,   0, ',
];

const STREAK_COUNT = 120;

// ─── State ────────────────────────────────────────────────────────────────────

const state: WarpState = {
  canvas        : null,
  ctx           : null,
  streaks       : [],
  animationId   : null,
  isRunning     : false,
  reducedMotion : false,
  resizeObserver: null,
  themeObserver : null,
  W: 0, H: 0, CX: 0, CY: 0, maxR: 1,
  last: 0,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTheme(): string {
  return document.documentElement.getAttribute('data-theme') ?? 'dark';
}

function randomColor(isLight: boolean): string {
  const palette = isLight ? COLORS_RGBA_LIGHT : COLORS_RGBA_DARK;
  return palette[Math.floor(Math.random() * palette.length)];
}

function applyBodyBg(): void {
  const isLight = getTheme() === 'light';
  document.body.style.backgroundColor = isLight ? '#ffffff' : 'rgb(10,6,3)';
  document.documentElement.style.backgroundColor = isLight ? '#ffffff' : 'rgb(10,6,3)';
}

// ─── Streak Factory ───────────────────────────────────────────────────────────

function makeStreak(initScatter: boolean): Streak {
  const isLight = getTheme() === 'light';
  return {
    angle  : Math.random() * Math.PI * 2,
    speed  : 0.2 + Math.pow(Math.random(), 2.8) * 1.8,
    len    : 0.04 + Math.random() * 0.18,
    dist   : initScatter ? Math.random() : Math.random() * 0.06,
    color  : randomColor(isLight),
    width  : 0.3 + Math.random() * 0.9,
    opacity: 0,
  };
}

function resetStreak(s: Streak): void {
  const isLight = getTheme() === 'light';
  s.angle   = Math.random() * Math.PI * 2;
  s.speed   = 0.2 + Math.pow(Math.random(), 2.8) * 1.8;
  s.len     = 0.04 + Math.random() * 0.18;
  s.dist    = Math.random() * 0.06;
  s.color   = randomColor(isLight);
  s.width   = 0.3 + Math.random() * 0.9;
  s.opacity = 0;
}

// ─── Canvas Setup ─────────────────────────────────────────────────────────────

function setupCanvas(): void {
  document.getElementById('upai-warp-canvas')?.remove();

  const canvas = document.createElement('canvas');
  canvas.id = 'upai-warp-canvas';
  canvas.style.cssText = `
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 0;
  `;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  state.canvas = canvas;
  state.ctx    = ctx;

  document.body.prepend(canvas);
  resizeCanvas();
  applyBodyBg();

  // Fill ทันทีก่อน frame แรก
  const isLight = getTheme() === 'light';
  ctx.fillStyle = isLight ? 'rgb(255,255,255)' : 'rgb(10,6,3)';
  ctx.fillRect(0, 0, state.W, state.H);
}

function resizeCanvas(): void {
  const { canvas, ctx } = state;
  if (!canvas || !ctx) return;

  const dpr  = window.devicePixelRatio || 1;
  state.W    = window.innerWidth;
  state.H    = window.innerHeight;
  state.CX   = state.W / 2;
  state.CY   = state.H / 2;
  canvas.width  = state.W * dpr;
  canvas.height = state.H * dpr;
  canvas.style.width  = state.W + 'px';
  canvas.style.height = state.H + 'px';
  ctx.scale(dpr, dpr);
  state.maxR = Math.sqrt(state.CX * state.CX + state.CY * state.CY) * 1.05;
  state.streaks = Array.from({ length: STREAK_COUNT }, () => makeStreak(true));
}

// ─── Draw Loop ────────────────────────────────────────────────────────────────

function drawFrame(ts: number): void {
  const { ctx, streaks, W, H, CX, CY, maxR } = state;
  if (!ctx) return;

  const dt   = Math.min((ts - state.last) / 16.67, 3);
  state.last = ts;

  const isLight = getTheme() === 'light';

  if (isLight) {
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgb(255,255,255)';
    ctx.fillRect(0, 0, W, H);
  } else {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(10,6,3,0.55)';
    ctx.fillRect(0, 0, W, H);
  }

  for (const s of streaks) {
    s.dist += s.speed * dt * 0.012;

    if (s.dist < 0.15)      s.opacity = s.dist / 0.15;
    else if (s.dist > 0.8)  s.opacity = 1 - (s.dist - 0.8) / 0.2;
    else                     s.opacity = 1;

    if (s.dist >= 1.0) { resetStreak(s); continue; }

    const r   = s.dist * maxR;
    const rT  = Math.max(0, s.dist - s.len) * maxR;
    const cos = Math.cos(s.angle);
    const sin = Math.sin(s.angle);
    const x1  = CX + cos * r,  y1 = CY + sin * r;
    const x0  = CX + cos * rT, y0 = CY + sin * rT;

    ctx.globalCompositeOperation = 'source-over';

    const grad = ctx.createLinearGradient(x0, y0, x1, y1);
    grad.addColorStop(0,   s.color + '0)');
    grad.addColorStop(0.4, s.color + (s.opacity * 0.25).toFixed(3) + ')');
    grad.addColorStop(1,   s.color + (s.opacity * 0.92).toFixed(3) + ')');

    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = grad;
    ctx.lineWidth   = s.width * (0.5 + s.dist * 0.5);
    ctx.lineCap     = 'round';
    ctx.stroke();

    if (s.speed > 1.4 && s.dist > 0.25) {
      ctx.beginPath();
      ctx.arc(x1, y1, s.width * 1.2, 0, Math.PI * 2);
      ctx.fillStyle = s.color + (s.opacity * 0.7).toFixed(3) + ')';
      ctx.fill();
    }
  }

  // Central lens flare
  const flare = ctx.createRadialGradient(CX, CY, 0, CX, CY, 80);
  if (isLight) {
    flare.addColorStop(0,   'rgba(200,120,20,0.15)');
    flare.addColorStop(0.3, 'rgba(180,80,10,0.05)');
    flare.addColorStop(1,   'rgba(0,0,0,0)');
  } else {
    flare.addColorStop(0,   'rgba(255,230,140,0.22)');
    flare.addColorStop(0.3, 'rgba(244,162, 45,0.08)');
    flare.addColorStop(1,   'rgba(0,0,0,0)');
  }
  ctx.fillStyle = flare;
  ctx.beginPath();
  ctx.arc(CX, CY, 80, 0, Math.PI * 2);
  ctx.fill();

  state.animationId = requestAnimationFrame(drawFrame);
}

// ─── Theme Observer ───────────────────────────────────────────────────────────

function watchTheme(): void {
  state.themeObserver?.disconnect();
  state.themeObserver = new MutationObserver(() => {
    applyBodyBg();
    if (state.ctx) {
      const isLight = getTheme() === 'light';
      state.ctx.globalCompositeOperation = 'source-over';
      state.ctx.clearRect(0, 0, state.W, state.H);
      state.ctx.fillStyle = isLight ? 'rgb(255,255,255)' : 'rgb(10,6,3)';
      state.ctx.fillRect(0, 0, state.W, state.H);
    }
    state.streaks = Array.from({ length: STREAK_COUNT }, () => makeStreak(true));
  });
  state.themeObserver.observe(document.documentElement, {
    attributes     : true,
    attributeFilter: ['data-theme'],
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function initWarpEffect(): void {
  const isLoginPage =
    window.location.pathname.includes('login') ||
    window.location.pathname === '/';

  if (!isLoginPage) return;

  state.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.body.classList.add('upai-warp-active');

  setTimeout(() => {
    setupCanvas();
    watchTheme();

    state.resizeObserver = new ResizeObserver(() => resizeCanvas());
    state.resizeObserver.observe(document.documentElement);

    if (state.reducedMotion) return;

    state.isRunning   = true;
    state.last        = performance.now();
    state.animationId = requestAnimationFrame(drawFrame);
  }, 80);
}

export function cleanupWarpEffect(): void {
  state.isRunning = false;

  if (state.animationId !== null) {
    cancelAnimationFrame(state.animationId);
    state.animationId = null;
  }

  state.resizeObserver?.disconnect();
  state.resizeObserver = null;

  state.themeObserver?.disconnect();
  state.themeObserver = null;

  state.canvas?.remove();
  state.canvas  = null;
  state.ctx     = null;
  state.streaks = [];

  // คืนค่า body background เมื่อออกจาก login
  document.body.style.backgroundColor = '';
  document.documentElement.style.backgroundColor = '';
  document.body.classList.remove('upai-warp-active');
}

export function pauseWarpEffect(): void {
  if (!state.isRunning || state.animationId === null) return;
  state.isRunning = false;
  cancelAnimationFrame(state.animationId);
  state.animationId = null;
}

export function resumeWarpEffect(): void {
  if (state.isRunning || state.reducedMotion) return;
  state.isRunning   = true;
  state.last        = performance.now();
  state.animationId = requestAnimationFrame(drawFrame);
}

document.addEventListener('visibilitychange', () => {
  document.hidden ? pauseWarpEffect() : resumeWarpEffect();
});