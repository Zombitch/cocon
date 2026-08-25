type Point = [number, number];

interface Bolt {
  main: Point[];
  branches: Point[][];
  startTime: number;
}

interface LightningState {
  boltAlpha: number;
  skyAlpha: number;
}

function midpointDisplace(p0: Point, p1: Point, displace: number, depth: number, out: Point[]): void {
  if (depth <= 0) {
    out.push(p1);
    return;
  }
  const mx = (p0[0] + p1[0]) / 2;
  const my = (p0[1] + p1[1]) / 2;
  const dx = p1[0] - p0[0];
  const dy = p1[1] - p0[1];
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const offset = (Math.random() * 2 - 1) * displace;
  const mid: Point = [mx + nx * offset, my + ny * offset];
  midpointDisplace(p0, mid, displace * 0.55, depth - 1, out);
  midpointDisplace(mid, p1, displace * 0.55, depth - 1, out);
}

function generateBoltPath(x0: number, y0: number, x1: number, y1: number, displace: number, depth: number): Point[] {
  const points: Point[] = [[x0, y0]];
  midpointDisplace([x0, y0], [x1, y1], displace, depth, points);
  return points;
}

function generateBranches(mainPoints: Point[]): Point[][] {
  const branches: Point[][] = [];
  const count = 1 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(mainPoints.length * (0.2 + Math.random() * 0.5));
    const start = mainPoints[idx];
    const length = 60 + Math.random() * 140;
    const angle = Math.PI / 2 + (Math.random() - 0.5) * 1.2; // mostly downward, spread sideways
    const end: Point = [start[0] + Math.cos(angle) * length, start[1] + Math.sin(angle) * length];
    branches.push(generateBoltPath(start[0], start[1], end[0], end[1], length * 0.25, 3));
  }
  return branches;
}

function drawBoltPath(ctx: CanvasRenderingContext2D, points: Point[], alpha: number, lineWidth: number, glow: number): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = '#eaf2ff';
  ctx.lineWidth = lineWidth;
  ctx.shadowColor = '#bcd7ff';
  ctx.shadowBlur = glow;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.stroke();
  ctx.restore();
}

function drawBolt(ctx: CanvasRenderingContext2D, bolt: Bolt, alpha: number): void {
  drawBoltPath(ctx, bolt.main, alpha, 3, 25);
  for (const branch of bolt.branches) {
    drawBoltPath(ctx, branch, alpha * 0.7, 1.6, 15);
  }
}

// Real lightning flickers — a bright instant strike, a brief dark gap, a
// dimmer second flash, then the sky afterglow fades out.
function getLightningState(elapsedMs: number): LightningState | null {
  if (elapsedMs < 40) return { boltAlpha: 1, skyAlpha: 0.6 };
  if (elapsedMs < 90) return { boltAlpha: 0, skyAlpha: 0.1 };
  if (elapsedMs < 130) return { boltAlpha: 0.75, skyAlpha: 0.35 };
  if (elapsedMs < 300) return { boltAlpha: 0, skyAlpha: 0.16 * (1 - (elapsedMs - 130) / 170) };
  return null;
}

export class LightningEngine {
  private width = 0;
  private height = 0;
  private activeBolt: Bolt | null = null;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private lastStrikeTime = -Infinity;
  private onThunder: (distanceFactor: number, pan: number) => void;
  private onFlash: (alpha: number) => void;
  private onStrike: () => void;

  constructor(onThunder: (distanceFactor: number, pan: number) => void, onFlash: (alpha: number) => void, onStrike: () => void) {
    this.onThunder = onThunder;
    this.onFlash = onFlash;
    this.onStrike = onStrike;
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  get timeSinceLastStrike(): number {
    return performance.now() - this.lastStrikeTime;
  }

  trigger(): void {
    this.lastStrikeTime = performance.now();
    this.onStrike();

    const x0 = this.width * 0.15 + Math.random() * this.width * 0.7;
    const y0 = 0;
    const x1 = x0 + (Math.random() - 0.5) * this.width * 0.3;
    const y1 = this.height * (0.35 + Math.random() * 0.4);
    const mainPoints = generateBoltPath(x0, y0, x1, y1, Math.max(20, (y1 - y0) * 0.12), 6);

    this.activeBolt = {
      main: mainPoints,
      branches: generateBranches(mainPoints),
      startTime: this.lastStrikeTime,
    };

    // The delay before thunder arrives IS how far away the strike was —
    // reuse it to shape how the thunder sounds too.
    const thunderDelay = 250 + Math.random() * 1300;
    const distanceFactor = (thunderDelay - 250) / 1300;
    const pan = Math.max(-1, Math.min(1, (x0 / this.width) * 2 - 1));
    setTimeout(() => this.onThunder(distanceFactor, pan), thunderDelay);

    if (this.timeoutId) clearTimeout(this.timeoutId);
    this.scheduleNext();
  }

  scheduleNext(): void {
    const minDelay = 10000;
    const maxDelay = 120000;
    const next = minDelay + Math.random() * (maxDelay - minDelay);
    this.timeoutId = setTimeout(() => this.trigger(), next);
  }

  update(ctx: CanvasRenderingContext2D, timestamp: number): void {
    if (!this.activeBolt) return;
    const state = getLightningState(timestamp - this.activeBolt.startTime);
    if (!state) {
      this.activeBolt = null;
      this.onFlash(0);
      return;
    }
    this.onFlash(state.skyAlpha);
    if (state.boltAlpha > 0) drawBolt(ctx, this.activeBolt, state.boltAlpha);
  }

  dispose(): void {
    if (this.timeoutId) clearTimeout(this.timeoutId);
  }
}
