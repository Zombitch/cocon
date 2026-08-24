import { Noise1D, rand, clamp } from '../core/Noise';

export type Phase = 'calme' | 'averse' | 'orage' | 'apaisement';

const PHASES: Record<
  Phase,
  { rain: number; wind: number; lightningEvery: [number, number]; duration: [number, number] }
> = {
  calme:      { rain: 0.25, wind: 0.15, lightningEvery: [40, 90], duration: [60, 150] },
  averse:     { rain: 0.75, wind: 0.45, lightningEvery: [20, 50], duration: [50, 120] },
  orage:      { rain: 0.95, wind: 0.80, lightningEvery: [6, 18],  duration: [40, 90] },
  apaisement: { rain: 0.45, wind: 0.30, lightningEvery: [30, 70], duration: [60, 140] },
};

const ORDER: Phase[] = ['calme', 'averse', 'orage', 'apaisement'];

/**
 * Orchestre l'ambiance de la session : phases météo, niveaux continus,
 * déclenchement des éclairs. Chaque session suit un cycle différent.
 */
export class WeatherDirector {
  phase: Phase = 'calme';
  phaseIndex = 0;
  rainLevel = PHASES.calme.rain;
  windLevel = PHASES.calme.wind;

  onLightning?: () => void;

  private noiseRain = new Noise1D(0.03);
  private noiseWind = new Noise1D(0.02);
  private phaseTimer = rand(...PHASES.calme.duration);

  update(dt: number): void {
    // progression des phases
    this.phaseTimer -= dt;
    if (this.phaseTimer <= 0) this.nextPhase();

    // niveaux cibles + oscillation organique
    const target = PHASES[this.phase];
    const rainTarget = target.rain + (this.noiseRain.next(dt) - 0.5) * 0.25;
    const windTarget = target.wind + (this.noiseWind.next(dt) - 0.5) * 0.3;

    // lissage doux vers la cible
    this.rainLevel += (clamp(rainTarget) - this.rainLevel) * dt * 0.15;
    this.windLevel += (clamp(windTarget) - this.windLevel) * dt * 0.08;

    // éclairs : re-planifiés en continu selon la phase courante
    this.lightningTimer -= dt;
    if (this.lightningTimer <= 0) {
      const [min, max] = PHASES[this.phase].lightningEvery;
      this.lightningTimer = rand(min, max);
      if (Math.random() < 0.85) this.onLightning?.();
    }
  }

  private lightningTimer = rand(10, 30);

  private nextPhase(): void {
    this.phaseIndex = (this.phaseIndex + 1) % ORDER.length;
    this.phase = ORDER[this.phaseIndex];
    this.phaseTimer = rand(...PHASES[this.phase].duration);
    console.log(`[director] phase → ${this.phase}`);
  }
}
