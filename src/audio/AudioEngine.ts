import { lerp3 } from '../engine/particles';

/**
 * Web Audio wiring for one ambiance: a looping bed (volume/pitch tied to
 * storm intensity) plus one-shot accent sounds (thunder) with distance-based
 * filtering/panning. Must be constructed from a user-gesture handler —
 * AudioContext can't start otherwise.
 */
export class AudioEngine {
  private ctx: AudioContext;
  private masterGain: GainNode;
  private accentBuffers: AudioBuffer[] = [];
  private loopGainNode: GainNode | null = null;
  private loopSourceNode: AudioBufferSourceNode | null = null;
  private muted = false;

  constructor() {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctor();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 1;
    this.masterGain.connect(this.ctx.destination);
  }

  get state(): AudioContextState {
    return this.ctx.state;
  }

  resume(): void {
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  private loadSound(url: string): Promise<AudioBuffer> {
    return fetch(url)
      .then((r) => r.arrayBuffer())
      .then((buf) => this.ctx.decodeAudioData(buf));
  }

  async loadAccent(urls: string[]): Promise<void> {
    this.accentBuffers = await Promise.all(urls.map((url) => this.loadSound(url)));
  }

  async startLoop(url: string): Promise<void> {
    const buffer = await this.loadSound(url);
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    this.loopGainNode = this.ctx.createGain();
    this.loopGainNode.gain.value = 0;
    source.connect(this.loopGainNode).connect(this.masterGain);
    source.start();

    this.loopSourceNode = source;

    // Fade the loop in from silence over the first few seconds rather than
    // snapping it on; intensity owns the level from here on.
    this.applyIntensity(0.5, 2.5);
  }

  // distanceFactor: 0 = right overhead, 1 = far away. Farther sounds
  // quieter/duller (air absorbs high frequencies over distance).
  playAccent(distanceFactor: number, pan: number): void {
    if (!this.accentBuffers.length || this.muted) return;

    const source = this.ctx.createBufferSource();
    source.buffer = this.accentBuffers[Math.floor(Math.random() * this.accentBuffers.length)];
    source.playbackRate.value = 0.95 + Math.random() * 0.1;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 9000 - distanceFactor * 7000;

    const gainNode = this.ctx.createGain();
    gainNode.gain.value = (0.85 - distanceFactor * 0.5) * (0.85 + Math.random() * 0.3);

    source.connect(filter);
    let node: AudioNode = filter;

    if (this.ctx.createStereoPanner) {
      const panner = this.ctx.createStereoPanner();
      panner.pan.value = pan * 0.7;
      node.connect(panner);
      node = panner;
    }

    node.connect(gainNode);
    gainNode.connect(this.masterGain);
    source.start();
  }

  // Speeds up/slows down the loop by resampling (pitch shifts with it —
  // inherent to this technique, not a bug). rampSeconds glides instead of
  // jumping.
  private setLoopPlaybackRate(rate: number, rampSeconds: number): void {
    if (!this.loopSourceNode) return;
    if (rampSeconds) {
      this.loopSourceNode.playbackRate.linearRampToValueAtTime(rate, this.ctx.currentTime + rampSeconds);
    } else {
      this.loopSourceNode.playbackRate.value = rate;
    }
  }

  applyIntensity(intensity: number, rampSeconds = 0.15): void {
    if (this.loopGainNode) {
      this.loopGainNode.gain.linearRampToValueAtTime(lerp3(0.25, 0.7, 1, intensity), this.ctx.currentTime + rampSeconds);
    }
    // Pitch shift capped more conservatively than the other knobs — past
    // this it starts sounding chipmunked rather than "more intense".
    this.setLoopPlaybackRate(lerp3(0.75, 1, 1.4, intensity), rampSeconds);
  }

  // Stops the loop and closes the context — no sound survives past this,
  // including any accent already scheduled to play.
  dispose(): void {
    this.loopSourceNode?.stop();
    void this.ctx.close();
  }
}
