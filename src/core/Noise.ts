/** Bruit fluide 1D sans dépendance : somme de sinus déphasés → [0, 1] */
export class Noise1D {
  private t = Math.random() * 1000;

  constructor(private speed = 0.05) {}

  next(dt: number): number {
    this.t += dt * this.speed * 10;
    const v =
      Math.sin(this.t) * 0.5 +
      Math.sin(this.t * 2.3 + 1.7) * 0.3 +
      Math.sin(this.t * 4.1 + 4.2) * 0.2;
    return v * 0.5 + 0.5;
  }
}

export function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function clamp(v: number, lo = 0, hi = 1): number {
  return Math.max(lo, Math.min(hi, v));
}
