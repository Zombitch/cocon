import type { DeviceProfile } from '../core/DeviceProfile';
import { rand } from '../core/Noise';

interface Drop {
  x: number; y: number;
  len: number; speed: number;
  alpha: number;
}

export class Rain {
  intensity = 0.3;
  wind = 0;
  private drops: Drop[] = [];
  private w = 0;
  private h = 0;

  constructor(private profile: DeviceProfile) {}

  resize(w: number, h: number): void {
    this.w = w;
    this.h = h;
  }

  setIntensity(v: number): void {
    this.intensity = v;
  }

  setWind(v: number): void {
    this.wind = v;
  }

  update(dt: number): void {
    const targetCount = Math.floor(this.profile.maxParticles * this.intensity);

    while (this.drops.length < targetCount) {
      this.drops.push({
        x: rand(-100, this.w + 100),
        y: rand(-this.h, -10),
        len: rand(8, 22),
        speed: rand(700, 1100),
        alpha: rand(0.15, 0.4),
      });
    }
    while (this.drops.length > targetCount) this.drops.pop();

    for (const d of this.drops) {
      d.y += d.speed * dt;
      d.x += this.wind * 300 * dt;
      if (d.y > this.h) {
        d.y = rand(-60, -10);
        d.x = rand(-100, this.w + 100);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.strokeStyle = '#aac4dd';
    ctx.lineWidth = 1;
    for (const d of this.drops) {
      ctx.globalAlpha = d.alpha;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - this.wind * 4, d.y - d.len);
      ctx.stroke();
    }
    ctx.restore();
  }
}
