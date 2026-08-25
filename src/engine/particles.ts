import type { ParticleType, WindDirection } from '../types';

// 0-0.5 -> calm..rest, 0.5-1 -> rest..wild. 0.5 is the resting default,
// chosen so every tuned value below matches pre-intensity-control behavior.
export function lerp3(calmVal: number, restVal: number, wildVal: number, t: number): number {
  if (t <= 0.5) return calmVal + (restVal - calmVal) * (t / 0.5);
  return restVal + (wildVal - restVal) * ((t - 0.5) / 0.5);
}

interface Drop {
  x: number;
  y: number;
  len: number;
  speed: number;
  sway: number;
  weight: number; // 0-1, derived from size — thicker/brighter, and louder/lower splash
  originX: number; // offset from the vanishing point; only used in 'front' direction
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

interface Snowflake {
  x: number;
  y: number;
  r: number;
  speed: number;
  swayPhase: number;
  swaySpeed: number;
  swayAmount: number;
}

interface WindStreak {
  x: number;
  y: number;
  len: number;
  speed: number;
  driftY: number;
}

const DROP_COUNT = 220;
const SNOW_COUNT = 160;
const WIND_COUNT = 140;

export class ParticleSystem {
  private type: ParticleType;
  private direction: WindDirection;
  private width = 0;
  private height = 0;
  private drops: Drop[] = [];
  private ripples: Ripple[] = [];
  private snowflakes: Snowflake[] = [];
  private windStreaks: WindStreak[] = [];

  constructor(type: ParticleType, direction: WindDirection = 'front') {
    this.type = type;
    this.direction = direction;
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    if (this.drops.length === 0 && this.type === 'rain') {
      for (let i = 0; i < DROP_COUNT; i++) this.drops.push(this.makeDrop());
    }
    if (this.snowflakes.length === 0 && this.type === 'snow') {
      for (let i = 0; i < SNOW_COUNT; i++) this.snowflakes.push(this.makeSnowflake());
    }
    if (this.windStreaks.length === 0 && this.type === 'wind') {
      for (let i = 0; i < WIND_COUNT; i++) this.windStreaks.push(this.makeWindStreak());
    }
  }

  private makeDrop(): Drop {
    const len = 10 + Math.random() * 18;
    // 'front': no lean, just a small ambient jitter. 'left'/'right': every
    // drop leans the same way, only the strength (magnitude) varies.
    const sway =
      this.direction === 'left'
        ? -(8 + Math.random() * 16)
        : this.direction === 'right'
          ? 8 + Math.random() * 16
          : (Math.random() - 0.5) * 8;
    return {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      len,
      speed: 420 + Math.random() * 380,
      sway,
      weight: (len - 10) / 18,
      originX: (Math.random() - 0.5) * this.width,
    };
  }

  private makeSnowflake(): Snowflake {
    return {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      r: 1.5 + Math.random() * 2.5,
      speed: 30 + Math.random() * 45,
      swayPhase: Math.random() * Math.PI * 2,
      swaySpeed: 0.5 + Math.random() * 1,
      swayAmount: 10 + Math.random() * 22,
    };
  }

  private makeWindStreak(): WindStreak {
    return {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      len: 15 + Math.random() * 35,
      speed: 260 + Math.random() * 260,
      driftY: (Math.random() - 0.5) * 30,
    };
  }

  // Ripples read as rain hitting the window pane itself, not a puddle along
  // a ground line — spread across the lower third of the frame instead of
  // clinging to a thin strip at the very bottom edge. They also shrink/fade
  // toward the screen's sides: a drop landing dead center (in 'front' mode,
  // where fanned-out drops converge — right in front of the viewer) keeps
  // today's baseline size as its ceiling, drops off to either side land
  // more glancingly. Never bigger than the existing baseline, only smaller.
  private spawnRipple(x: number, weight: number): void {
    const centerFactor = 1 - Math.min(1, Math.abs(x - this.width / 2) / (this.width * 0.55));
    const sizeFactor = 0.55 + 0.45 * centerFactor;
    this.ripples.push({
      x,
      y: this.height * 0.65 + Math.random() * this.height * 0.35,
      radius: 1,
      maxRadius: (14 + weight * 22) * sizeFactor,
      alpha: (0.5 + weight * 0.2) * (0.65 + 0.35 * centerFactor),
    });
    if (this.ripples.length > 150) this.ripples.shift();
  }

  private updateAndDrawRipples(ctx: CanvasRenderingContext2D, dt: number): void {
    for (let r = this.ripples.length - 1; r >= 0; r--) {
      const rp = this.ripples[r];
      rp.radius += 60 * dt;
      rp.alpha -= dt * 1.1;
      if (rp.alpha <= 0 || rp.radius >= rp.maxRadius) {
        this.ripples.splice(r, 1);
        continue;
      }
      ctx.beginPath();
      ctx.strokeStyle = `rgba(210, 230, 255, ${Math.max(0, rp.alpha)})`;
      ctx.lineWidth = 1;
      ctx.ellipse(rp.x, rp.y, rp.radius, rp.radius * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  private updateAndDrawRain(ctx: CanvasRenderingContext2D, dt: number, intensity: number): void {
    this.updateAndDrawRipples(ctx, dt);

    const speedFactor = lerp3(0.4, 1, 2.5, intensity);
    const windFactor = lerp3(0.15, 1, 4.5, intensity);
    const isFront = this.direction === 'front';
    const vpX = this.width / 2;

    for (const d of this.drops) {
      // 'front': fake depth — drops swell as they fall and fan out a bit
      // more near the bottom, instead of leaning sideways. originX is a
      // full-width spawn offset (like plain random x) — posScale only ever
      // grows it outward, never compresses it, so the whole width always
      // has drops, top to bottom.
      const t = isFront ? Math.max(0, Math.min(1, d.y / this.height)) : 0;
      const scale = isFront ? 0.35 + t * t * 0.9 : 1;
      const posScale = isFront ? 1 + t * 0.5 : 1;

      d.y += d.speed * speedFactor * (isFront ? 0.5 + scale : 1) * dt;
      if (isFront) {
        d.x = vpX + d.originX * posScale;
      } else {
        d.x += d.sway * windFactor * dt;
      }

      const drawLen = d.len * scale;
      const drawWeight = d.weight * scale;
      const tailX = isFront ? d.x : d.x - d.sway * windFactor * 0.05;
      const tailY = d.y - drawLen;

      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(tailX, tailY);
      ctx.strokeStyle = `rgba(190, 215, 255, ${0.1 + drawWeight * 0.08})`;
      ctx.lineWidth = 3 + drawWeight * 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(tailX, tailY);
      ctx.strokeStyle = `rgba(228, 242, 255, ${0.55 + drawWeight * 0.3})`;
      ctx.lineWidth = 1 + drawWeight;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(d.x, d.y, 1 + drawWeight, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(235, 247, 255, 0.55)';
      ctx.fill();

      const offscreenX = !isFront && (d.x < -60 || d.x > this.width + 60);
      if (d.y > this.height || offscreenX) {
        if (!offscreenX && Math.random() < 0.35) this.spawnRipple(d.x, d.weight);
        d.y = -d.len - Math.random() * 40;
        d.x = Math.random() * this.width;
        d.originX = (Math.random() - 0.5) * this.width;
      }
    }
  }

  private updateAndDrawSnow(ctx: CanvasRenderingContext2D, dt: number, intensity: number): void {
    const speedFactor = lerp3(0.5, 1, 2, intensity);
    for (const f of this.snowflakes) {
      f.y += f.speed * speedFactor * dt;
      f.swayPhase += f.swaySpeed * dt;
      const x = f.x + Math.sin(f.swayPhase) * f.swayAmount;

      ctx.beginPath();
      ctx.arc(x, f.y, f.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fill();

      if (f.y - f.r > this.height) {
        f.y = -f.r;
        f.x = Math.random() * this.width;
      }
    }
  }

  private updateAndDrawWind(ctx: CanvasRenderingContext2D, dt: number, intensity: number): void {
    const speedFactor = lerp3(0.5, 1, 2.2, intensity);
    for (const p of this.windStreaks) {
      p.x += p.speed * speedFactor * dt;
      p.y += p.driftY * speedFactor * dt * 0.2;

      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.len, p.y - p.len * 0.15);
      ctx.strokeStyle = 'rgba(210, 198, 172, 0.35)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      if (p.x - p.len > this.width) {
        p.x = -p.len;
        p.y = Math.random() * this.height;
      }
    }
  }

  update(ctx: CanvasRenderingContext2D, dt: number, intensity: number): void {
    if (this.type === 'rain') this.updateAndDrawRain(ctx, dt, intensity);
    else if (this.type === 'snow') this.updateAndDrawSnow(ctx, dt, intensity);
    else this.updateAndDrawWind(ctx, dt, intensity);
  }
}
