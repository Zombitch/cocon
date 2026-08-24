export type ParticleType = 'rain' | 'snow' | 'wind';

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
  hasLightning: boolean;
  skyColors: [string, string, string];
  images: AmbianceImages;
  sounds: AmbianceSounds;
  emitters?: Emitter[];
}
