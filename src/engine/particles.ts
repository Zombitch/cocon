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
  wobblePhase: number; // per-drop offset so falls aren't perfectly straight lines
  wobbleAmp: number;
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
  size: number; // base size before perspective scale
  speed: number;
  originX: number; // offset from the vanishing point, same 'front' trick as rain
  wobblePhase: number;
  wobbleAmp: number;
  rotation: number;
  rotationSpeed: number;
}

// A brief puff of flurries where a flake lands, mirroring rain's ripple
// splash but with specks that drift instead of a ring that expands.
interface SnowSplash {
  x: number;
  y: number;
  size: number;
  age: number;
  life: number;
  specks: { angle: number; speed: number }[];
}

// Frost creeping in from the window's corners — a fixed pattern generated
// once per resize, not simulated, since real window frost doesn't move.
interface FrostPatch {
  x: number;
  y: number;
  r: number;
  alpha: number;
}

interface WindStreak {
  x: number;
  y: number;
  len: number;
  speed: number;
  driftY: number;
}

const DROP_COUNT = 220;
const SNOW_COUNT = 340;
const WIND_COUNT = 140;

export class ParticleSystem {
  private type: ParticleType;
  private direction: WindDirection;
  private width = 0;
  private height = 0;
  private drops: Drop[] = [];
  private ripples: Ripple[] = [];
  private snowflakes: Snowflake[] = [];
  private snowSplashes: SnowSplash[] = [];
  private frostPatches: FrostPatch[] = [];
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
    // Corner positions are size-dependent, so this is rebuilt on every
    // resize rather than once — real frost wouldn't jump around on rotate,
    // but here it's cheaper and simpler than reprojecting the old pattern.
    if (this.type === 'snow') this.buildFrost();
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
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleAmp: 3 + Math.random() * 9,
    };
  }

  private makeSnowflake(): Snowflake {
    return {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      size: 2 + Math.random() * 3.5,
      speed: 26 + Math.random() * 42,
      originX: (Math.random() - 0.5) * this.width,
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleAmp: 6 + Math.random() * 14,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 1.2,
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
      // Real drops don't fall in a perfectly straight line — a small,
      // slowly-shifting side wobble so the streak drifts rather than
      // tracking a ruler-straight path frame to frame.
      d.x += Math.sin(d.y * 0.02 + d.wobblePhase) * d.wobbleAmp * (isFront ? 0.2 + t * 0.6 : 0.35);

      const drawLen = d.len * scale;
      const dropGrowthMultiplier = 1.9
      const drawWeight = d.weight * scale * dropGrowthMultiplier;
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

      // Soft ambient glow behind the streak — same straight stroke as
      // before, kept faint so it reads as light bleed, not the drop itself.
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(tailX, tailY);
      ctx.strokeStyle = `rgba(190, 215, 255, ${0.08 + drawWeight * 0.06})`;
      ctx.lineWidth = 4 + drawWeight * 4;
      ctx.stroke();

      // The drop itself: a tapered needle (thin trailing tail, fuller near
      // the head) instead of a uniform-width line, with a gradient fill so
      // it fades into the glow rather than cutting off — a rough stand-in
      // for motion blur on a falling drop.
      const segDx = d.x - tailX;
      const segDy = d.y - tailY;
      const segLen = Math.hypot(segDx, segDy) || 1;
      const nx = -segDy / segLen;
      const ny = segDx / segLen;
      const headHalfW = 0.5 + drawWeight * 1.3;
      const tailHalfW = headHalfW * 0.18;

      const bodyGrad = ctx.createLinearGradient(tailX, tailY, d.x, d.y);
      bodyGrad.addColorStop(0, 'rgba(215, 232, 255, 0)');
      bodyGrad.addColorStop(1, `rgba(228, 242, 255, ${0.55 + drawWeight * 0.3})`);

      ctx.beginPath();
      ctx.moveTo(tailX + nx * tailHalfW, tailY + ny * tailHalfW);
      ctx.lineTo(d.x + nx * headHalfW, d.y + ny * headHalfW);
      ctx.lineTo(d.x - nx * headHalfW, d.y - ny * headHalfW);
      ctx.lineTo(tailX - nx * tailHalfW, tailY - ny * tailHalfW);
      ctx.closePath();
      ctx.fillStyle = bodyGrad;
      ctx.fill();

      // Glint: the brightest point on the drop, where it catches the light
      // — elongated along the fall direction, sitting toward the head.
      const glintX = tailX + segDx * 0.78;
      const glintY = tailY + segDy * 0.78;
      const angle = Math.atan2(segDy, segDx);
      ctx.beginPath();
      ctx.ellipse(
        glintX,
        glintY,
        drawLen * 0.16 + headHalfW * 0.6,
        headHalfW * 0.65,
        angle,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = `rgba(245, 251, 255, ${0.5 + drawWeight * 0.35})`;
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

  // A hex ice crystal: 6 spokes from the center, each with a pair of side
  // branches near the tip, plus a bright center glint. Only worth drawing
  // once a flake is big enough (close enough, per the 'front' scale) for
  // the arms to actually resolve — see the size check in updateAndDrawSnow.
  private drawSnowCrystal(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rotation: number, alpha: number): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = Math.max(0.6, r * 0.16);
    ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      ctx.rotate(Math.PI / 3);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -r);
      ctx.moveTo(0, -r * 0.55);
      ctx.lineTo(r * 0.28, -r * 0.75);
      ctx.moveTo(0, -r * 0.55);
      ctx.lineTo(-r * 0.28, -r * 0.75);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.16, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fill();
    ctx.restore();
  }

  // Bottom-of-fall puff: a handful of specks flick outward from the
  // landing point and drift up slightly before fading, rather than a rain
  // ripple's expanding ring — snow doesn't splash, it puffs.
  private spawnSnowSplash(x: number, y: number, size: number): void {
    const speckCount = 4 + Math.floor(Math.random() * 3);
    const specks: { angle: number; speed: number }[] = [];
    for (let i = 0; i < speckCount; i++) {
      specks.push({ angle: Math.random() * Math.PI * 2, speed: 12 + Math.random() * 22 });
    }
    this.snowSplashes.push({ x, y, size, age: 0, life: 0.45 + Math.random() * 0.25, specks });
    if (this.snowSplashes.length > 80) this.snowSplashes.shift();
  }

  private updateAndDrawSnowSplashes(ctx: CanvasRenderingContext2D, dt: number): void {
    for (let i = this.snowSplashes.length - 1; i >= 0; i--) {
      const s = this.snowSplashes[i];
      s.age += dt;
      if (s.age >= s.life) {
        this.snowSplashes.splice(i, 1);
        continue;
      }
      const t = s.age / s.life; // 0 at spawn -> 1 as it fades out
      const alpha = (1 - t) * 0.7;
      for (const speck of s.specks) {
        const dist = speck.speed * s.age;
        const px = s.x + Math.cos(speck.angle) * dist;
        const py = s.y + Math.sin(speck.angle) * dist * 0.5 - t * 6;
        ctx.beginPath();
        ctx.arc(px, py, Math.max(0.4, s.size * 0.18 * (1 - t)), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
      }
    }
  }

  // Fixed pattern of soft blobs biased toward each corner, denser and
  // brighter the closer they sit to it — a cheap stand-in for the way
  // frost fans out from a window's edges instead of covering it evenly.
  private buildFrost(): void {
    this.frostPatches = [];
    const reach = Math.min(this.width, this.height) * 0.42;
    const corners = [
      { cx: 0, cy: 0, sx: 1, sy: 1 },
      { cx: this.width, cy: 0, sx: -1, sy: 1 },
      { cx: 0, cy: this.height, sx: 1, sy: -1 },
      { cx: this.width, cy: this.height, sx: -1, sy: -1 },
    ];
    for (const c of corners) {
      for (let i = 0; i < 30; i++) {
        const dist = Math.pow(Math.random(), 1.7) * reach;
        const spread = Math.pow(Math.random(), 1.3) * reach * 0.7;
        const x = c.cx + c.sx * dist;
        const y = c.cy + c.sy * spread;
        const fromCorner = Math.hypot(x - c.cx, y - c.cy);
        const falloff = Math.max(0, 1 - fromCorner / reach);
        this.frostPatches.push({
          x,
          y,
          r: 6 + Math.random() * 26 * falloff,
          alpha: 0.05 + falloff * 0.35,
        });
      }
    }
  }

  // Drawn on top of the falling snow, like frost sitting on the near face
  // of the glass with the weather behind it. Transparent throughout (see
  // FrostPatch.alpha) so it reads as icy buildup, not an opaque border.
  private drawFrost(ctx: CanvasRenderingContext2D): void {
    if (!this.frostPatches.length) return;
    ctx.save();
    ctx.filter = 'blur(2px)';
    for (const p of this.frostPatches) {
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      grad.addColorStop(0, `rgba(225, 240, 255, ${p.alpha})`);
      grad.addColorStop(1, 'rgba(225, 240, 255, 0)');
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }
    ctx.restore();
  }

  private updateAndDrawSnow(ctx: CanvasRenderingContext2D, dt: number, intensity: number): void {
    this.updateAndDrawSnowSplashes(ctx, dt);

    const speedFactor = lerp3(0.5, 1, 2, intensity);
    const windFactor = lerp3(0.2, 1, 3, intensity);
    const vpX = this.width / 2;

    for (const f of this.snowflakes) {
      // Same 'front' technique as rain: flakes spawn at a full-width offset
      // from a center vanishing point and grow as they approach, faking
      // depth instead of just drifting at a constant size.
      const t = Math.max(0, Math.min(1, f.y / this.height));
      const scale = 0.35 + t * t * 0.9;
      const posScale = 1 + t * 0.5;

      f.y += f.speed * speedFactor * (0.5 + scale) * dt;
      f.x = vpX + f.originX * posScale;
      f.x += Math.sin(f.y * 0.015 + f.wobblePhase) * f.wobbleAmp * windFactor * (0.2 + t * 0.6);
      f.rotation += f.rotationSpeed * dt;

      const r = f.size * scale;
      const alpha = 0.35 + t * 0.5;

      if (r < 2.2) {
        // Too small/far for the crystal arms to read — a soft dot instead.
        ctx.beginPath();
        ctx.arc(f.x, f.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
        ctx.fill();
      } else {
        this.drawSnowCrystal(ctx, f.x, f.y, r, f.rotation, alpha);
      }

      if (f.y - r > this.height) {
        if (Math.random() < 0.4) this.spawnSnowSplash(f.x, this.height - 1, r);
        f.y = -r - Math.random() * 40;
        f.x = Math.random() * this.width;
        f.originX = (Math.random() - 0.5) * this.width;
      }
    }

    this.drawFrost(ctx);
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
