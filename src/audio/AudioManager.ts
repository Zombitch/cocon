type LoopHandle = { el: HTMLAudioElement; gain: GainNode };

export class AudioManager {
  private ctx: AudioContext;
  private loops = new Map<string, LoopHandle>();

  constructor() {
    this.ctx = new AudioContext();
  }

  resume(): void {
    this.ctx.resume();
  }

  /** Boucle sonore continue avec volume réglable dynamiquement */
  addLoop(id: string, src: string, volume = 0.5): void {
    const el = new Audio(src);
    el.loop = true;
    el.crossOrigin = 'anonymous';
    const source = this.ctx.createMediaElementSource(el);
    const gain = this.ctx.createGain();
    gain.gain.value = volume;
    source.connect(gain).connect(this.ctx.destination);
    el.play().catch(() => {});
    this.loops.set(id, { el, gain });
  }

  setLoopVolume(id: string, volume: number): void {
    const loop = this.loops.get(id);
    if (!loop) return;
    loop.gain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 0.5);
  }

  /** Son ponctuel spatialisé (tonnerre, craquement…) */
  play(src: string, opts: { volume?: number; pan?: number } = {}): void {
    const el = new Audio(src);
    el.crossOrigin = 'anonymous';
    const source = this.ctx.createMediaElementSource(el);
    const gain = this.ctx.createGain();
    const pan = this.ctx.createStereoPanner();
    gain.gain.value = opts.volume ?? 0.5;
    pan.pan.value = opts.pan ?? 0;
    source.connect(gain).connect(pan).connect(this.ctx.destination);
    el.play().catch(() => {});
    el.onended = () => {
      source.disconnect();
      gain.disconnect();
      pan.disconnect();
    };
  }
}
