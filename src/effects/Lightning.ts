import { rand } from '../core/Noise';
import type { Scheduler } from '../core/Scheduler';

interface Bolt {
  points: { x: number; y: number }[];
  life: number;
  maxLife: number;
  branches: Bolt[];
}

export class Lightning {
  private flash = 0;
  private bolts: Bolt[] = [];
  private w = 0;
  private h = 0;

  constructor(private scheduler: Scheduler) {}

  resize(w: number, h: number): void {
    this.w = w;
    this.h = h;
  }

  strike(onFlash?: (intensity: number) => void): void {
    const bolt = this.generateBolt(rand(this.w * 0.2, this.w * 0.8));
    this.bolts.push(bolt);
    this.flash = 1;

    // double éclair : petit flash avant le principal
    this.scheduler.after(0.12, () => {
      this.flash = Math.max(this.flash, 0.5);
    });

    onFlash?.(rand(0.5, 1));
  }

  private generateBolt(x: number): Bolt {
    const makeSegment = (
      sx: number, sy: number, ex: number, ey: number, depth: number,
    ): Bolt => {
      const pts = [{ x: sx, y: sy }];
      const segments = 8;
      let offset = rand(40, 90);
      for (let i = 1; i <= segments; i++) {
        const t = i / segments;
        pts.push({
          x: sx + (ex - sx) * t + rand(-offset, offset),
          y: sy + (ey - sy) * t,
        });
        offset *= 0.65;
      }
      const branches: Bolt[] = [];
      if (depth < 2) {
        const n = Math.random() < 0.6 ? 1 : 2;
        for (let b = 0; b < n; b++) {
          const origin = pts[Math.floor(rand(2, pts.length - 1))];
          branches.push(
            makeSegment(
              origin.x, origin.y,
              origin.x + rand(-120, 120), origin.y + rand(60, 160),
              depth + 1,
            ),
          );
        }
      }
      return { points: pts, life: rand(0.15, 0.35), maxLife: 0.35, branches };
    };
    return makeSegment(x, -20, x + rand(-100, 100), this.h * rand(0.55, 0.85), 0);
  }

  update(dt: number): void {
    this.flash = Math.max(0, this.flash - dt * 3.5);
    const decay = (b: Bolt) => {
      b.life -= dt;
      b.branches.forEach(decay);
    };
    this.bolts.forEach(decay);
    this.bolts = this.bolts.filter((b) => b.life > 0);
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.flash > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(200, 215, 255, ${this.flash * 0.35})`;
      ctx.fillRect(0, 0, this.w, this.h);
      ctx.restore();
    }

    const draw = (b: Bolt, width: number) => {
      const alpha = Math.max(0, b.life / b.maxLife);
      ctx.strokeStyle = `rgba(220, 230, 255, ${alpha})`;
      ctx.lineWidth = width;
      ctx.shadowColor = '#bcd0ff';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(b.points[0].x, b.points[0].y);
      for (const p of b.points.slice(1)) ctx.lineTo(p.x, p.y);
      ctx.stroke();
      b.branches.forEach((br) => draw(br, width * 0.5));
    };
    ctx.save();
    for (const b of this.bolts) draw(b, 2.5);
    ctx.restore();
  }
}
