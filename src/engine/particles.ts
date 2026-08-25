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
  maxAlpha: number;
  spikes: number[]; // angles for the brief splash burst at impact
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

  // A splash against the glass itself, not a puddle on the ground: a brief
  // burst of droplets radiating from the impact point, then a plain
  // circular ring expanding outward. Drawn as a true circle rather than a
  // squashed ellipse, since we're looking straight at a vertical pane, not
  // down at an angle onto standing water.
  private spawnRipple(x: number, y: number, weight: number): void {
    const maxAlpha = 0.4 + weight * 0.3;
    const spikeCount = 4 + Math.floor(Math.random() * 3);
    const spikes: number[] = [];
    for (let i = 0; i < spikeCount; i++) spikes.push(Math.random() * Math.PI * 2);
    this.ripples.push({
      x,
      y,
      radius: 1,
      maxRadius: 8 + weight * 16,
      alpha: maxAlpha,
      maxAlpha,
      spikes,
    });
    if (this.ripples.length > 200) this.ripples.shift();
  }

  private updateAndDrawRipples(ctx: CanvasRenderingContext2D, dt: number): void {
    for (let r = this.ripples.length - 1; r >= 0; r--) {
      const rp = this.ripples[r];
      rp.radius += 50 * dt;
      rp.alpha -= dt * 1.4;
      if (rp.alpha <= 0 || rp.radius >= rp.maxRadius) {
        this.ripples.splice(r, 1);
        continue;
      }
      const life = rp.alpha / rp.maxAlpha; // 1 at spawn -> 0 at death

      // Splash burst: droplets flick outward and vanish in the first
      // instant, so the ripple reads as an impact rather than just a ring.
      if (life > 0.55) {
        const burstT = 1 - (life - 0.55) / 0.45; // 0 at spawn -> 1 as burst ends
        const spikeLen = rp.maxRadius * 0.6 * burstT;
        ctx.strokeStyle = `rgba(225, 240, 255, ${(1 - burstT) * rp.maxAlpha})`;
        ctx.lineWidth = 1;
        for (const angle of rp.spikes) {
          ctx.beginPath();
          ctx.moveTo(rp.x, rp.y);
          ctx.lineTo(rp.x + Math.cos(angle) * spikeLen, rp.y + Math.sin(angle) * spikeLen);
          ctx.stroke();
        }
      }

      ctx.beginPath();
      ctx.strokeStyle = `rgba(210, 230, 255, ${Math.max(0, rp.alpha)})`;
      ctx.lineWidth = 1;
      ctx.arc(rp.x, rp.y, rp.radius, 0, Math.PI * 2);
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

      // 'front': the drop is hitting a pane of glass right in front of the
      // viewer, not falling toward a distant ground — so splashes should
      // happen anywhere along its fall (top, middle, bottom of the screen),
      // not just once it reaches the bottom edge. Heavier/closer (bigger
      // scale) drops splash more often and leave bigger marks.
      if (isFront) {
        const impactChance = speedFactor * (0.04 + drawWeight * 0.2) * dt;
        if (Math.random() < impactChance) this.spawnRipple(d.x, d.y, drawWeight);
      }

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
        // 'front' drops already splash continuously on the way down; only
        // leaning ('left'/'right') drops still need a splash marking where
        // they run off the bottom edge.
        if (!isFront && !offscreenX && Math.random() < 0.35) {
          const y = this.height * 0.85 + Math.random() * this.height * 0.15;
          this.spawnRipple(d.x, y, d.weight);
        }
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
