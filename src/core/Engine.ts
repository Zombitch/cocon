import type { Scene } from '../scenes/Scene';
import type { DeviceProfile } from './DeviceProfile';

export class Engine {
  private ctx: CanvasRenderingContext2D;
  private lastTime = 0;
  private rafId = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    private scene: Scene,
    private profile: DeviceProfile,
  ) {
    this.ctx = canvas.getContext('2d')!;
    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  start(): void {
    this.lastTime = performance.now();
    const loop = (t: number) => {
      const dt = Math.min((t - this.lastTime) / 1000, 0.05);
      this.lastTime = t;
      this.scene.update(dt);
      this.scene.render(this.ctx);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop(): void {
    cancelAnimationFrame(this.rafId);
  }

  resize(): void {
    this.canvas.width = innerWidth * this.profile.dpr;
    this.canvas.height = innerHeight * this.profile.dpr;
    this.ctx.setTransform(this.profile.dpr, 0, 0, this.profile.dpr, 0, 0);
    this.scene.resize(innerWidth, innerHeight);
  }
}
