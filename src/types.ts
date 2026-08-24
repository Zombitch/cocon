export type ParticleType = 'rain' | 'snow' | 'wind';

export interface AmbianceSounds {
  loop?: string;
  accent?: string;
}

export interface AmbianceImages {
  background?: string;
  foreground?: string;
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
}
