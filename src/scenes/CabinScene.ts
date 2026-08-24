import type { Scene } from './Scene';
import type { Scheduler } from '../core/Scheduler';
import type { AudioManager } from '../audio/AudioManager';
import type { DeviceProfile } from '../core/DeviceProfile';
import { WeatherDirector } from '../director/WeatherDirector';
import { Rain } from '../effects/Rain';
import { Lightning } from '../effects/Lightning';
import { rand, pick } from '../core/Noise';

/**
 * 🌲 Cocon « Cabane dans la forêt »
 * Vue intérieure : fenêtre sur la forêt pluvieuse, orage, feu de cheminée.
 */
export class CabinScene implements Scene {
  private director: WeatherDirector;
  private rain: Rain;
  private lightning: Lightning;

  private w = 0;
  private h = 0;

  constructor(
    scheduler: Scheduler,
    private audio: AudioManager,
    profile: DeviceProfile,
  ) {
    this.director = new WeatherDirector();
    this.rain = new Rain(profile);
    this.lightning = new Lightning(scheduler);

    // liaison directeur → effets
    this.director.onLightning = () => {
      this.lightning.strike((intensity) => {
        const distance = rand(0.8, 5);
        scheduler.after(distance, () => {
          this.audio.play('/audio/thunder.mp3', {
            volume: 0.25 + intensity * 0.6 * (1 - distance / 6),
            pan: rand(-0.7, 0.7),
          });
        });
      });
    };

    // sons d'ambiance aléatoires
    scheduler.everyRandom(15, 90, () => {
      this.audio.play('/audio/wood-crack.mp3', {
        volume: rand(0.08, 0.25),
        pan: rand(-0.5, 0.5),
      });
    });

    // boucles sonores
    audio.addLoop('rain', '/audio/rain.mp3', 0.3);
    audio.addLoop('wind', '/audio/wind.mp3', 0.15);
    audio.addLoop('fire', '/audio/fire-crackle.mp3', 0.35);
  }

  update(dt: number): void {
    this.director.update(dt);
    this.rain.setIntensity(this.director.rainLevel);
    this.rain.setWind(this.director.windLevel);
    this.rain.update(dt);
    this.lightning.update(dt);

    this.audio.setLoopVolume('rain', 0.15 + this.director.rainLevel * 0.7);
    this.audio.setLoopVolume('wind', 0.05 + this.director.windLevel * 0.5);
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.drawBackground(ctx);
    this.rain.render(ctx);
    this.drawWindowFrame(ctx);
    this.drawFireplaceGlow(ctx);
    this.lightning.render(ctx);
  }

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    const grad = ctx.createLinearGradient(0, 0, 0, this.h);
    grad.addColorStop(0, '#0d1420');
    grad.addColorStop(1, '#16202e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.w, this.h);

    ctx.fillStyle = '#0a0f16';
    for (let i = 0; i < 14; i++) {
      const x = ((i * 137.5) % (this.w + 200)) - 100;
      const treeH = this.h * (0.35 + ((i * 53) % 30) / 100);
      const sway =
        Math.sin(performance.now() / 900 + i) * this.director.windLevel * 12;
      ctx.beginPath();
      ctx.moveTo(x - 28 + sway, this.h);
      ctx.quadraticCurveTo(x - 10 + sway, this.h - treeH * 0.6, x + sway, this.h - treeH);
      ctx.quadraticCurveTo(x + 10 + sway, this.h - treeH * 0.6, x + 28 + sway, this.h);
      ctx.fill();
    }
  }

  private drawWindowFrame(ctx: CanvasRenderingContext2D): void {
    const m = Math.min(this.w, this.h) * 0.08;
    ctx.fillStyle = '#241a12';
    ctx.fillRect(m - 14, m - 14, this.w - 2 * m + 28, 14);
    ctx.fillRect(m - 14, this.h - m, this.w - 2 * m + 28, 14);
    ctx.fillRect(m - 14, m - 14, 14, this.h - 2 * m + 28);
    ctx.fillRect(this.w - m, m - 14, 14, this.h - 2 * m + 28);
    ctx.fillRect(this.w / 2 - 5, m, 10, this.h - 2 * m);
    ctx.fillRect(m, this.h / 2 - 5, this.w - 2 * m, 10);
  }

  private drawFireplaceGlow(ctx: CanvasRenderingContext2D): void {
    const now = performance.now();
    const flicker =
      0.8 +
      Math.sin(now / 130) * 0.1 +
      Math.sin(now / 47) * 0.06 +
      Math.sin(now / 311) * 0.04;

    const cx = this.w * 0.5;
    const cy = this.h * 1.05;
    const r = Math.min(this.w, this.h) * 0.7;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, `rgba(255, 140, 40, ${0.22 * flicker})`);
    grad.addColorStop(0.5, `rgba(200, 80, 20, ${0.08 * flicker})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.w, this.h);
  }

  resize(w: number, h: number): void {
    this.w = w;
    this.h = h;
    this.rain.resize(w, h);
    this.lightning.resize(w, h);
  }
}
