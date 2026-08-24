export type ParticleType = 'rain' | 'snow' | 'wind';

// Where rain leans from. Rain-only — unrelated to the 'wind' ParticleType
// (the desert streak effect). 'front' fakes depth: drops spawn near a
// vanishing point and grow as they fall, no horizontal lean. 'left'/'right'
// give every drop the same lean direction instead.
export type WindDirection = 'front' | 'left' | 'right';

export interface AmbianceSounds {
  loop?: string;
  accent?: string;
}

export interface AmbianceImages {
  background?: string;
  foreground?: string;
}

// Anchors a smoke/steam wisp to a spot in the foreground image (candle
// flame, cup rim, ...). Percentages are of the *image itself* (measured
// against the art, 0-100 each axis) — setupEmitters replicates the
// background-size: cover math at runtime to convert that into an exact
// on-screen position regardless of how the image ends up stretched/cropped.
export interface Emitter {
  type: 'smoke' | 'steam' | 'flicker';
  xPercent: number;
  yPercent: number;
}

export interface Ambiance {
  id: string;
  name: string;
  cardText: string;
  caption: string;
  particleType: ParticleType;
  windDirection?: WindDirection; // rain only; defaults to 'front'
  hasLightning: boolean;
  skyColors: [string, string, string];
  images: AmbianceImages;
  sounds: AmbianceSounds;
  emitters?: Emitter[];
}
