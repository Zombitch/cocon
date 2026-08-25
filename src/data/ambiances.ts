import type { Ambiance } from '../types';

/**
 * Single source of truth for every cocon ambiance. `sounds`/`images` are
 * optional and deliberately omitted where no asset exists yet — consumers
 * only ever fetch a role that's actually declared here, so an ambiance
 * with none is simply silent/plain, not broken.
 */
export const ambiances: Record<string, Ambiance> = {
  'car-rain': {
    id: 'car-rain',
    name: 'En voiture, sous la pluie',
    cardText: 'Le tambourinement de la pluie sur le toit, à l’abri.',
    caption: 'Restons dans notre cocon, pendant que le temps se déchaîne dehors.',
    particleType: 'rain',
    windDirection: 'front',
    hasLightning: true,
    skyColors: ['#2a3550', '#131a2c', '#05070d'],
    images: {
      background: '/images/car-background.png',
      foreground: '/images/car-foreground.png',
    },
    sounds: {
      loop: '/audio/rain-fx-inside-car.wav',
      accent: '/audio/boomy-thunder-shock.wav',
    },
    emitters: [
      { type: 'smoke', xPercent: 69, yPercent: 61.2 },
      { type: 'flicker', xPercent: 69, yPercent: 61.2 },
    ],
  },
  snow: {
    id: 'snow',
    name: 'Nuit de neige',
    cardText: 'Flocons silencieux, nuit calme et froide.',
    caption: 'Le silence blanc s’installe, pendant que nous restons au chaud.',
    particleType: 'snow',
    hasLightning: true,
    skyColors: ['#3a4a68', '#1c2438', '#05070d'],
    images: {},
    sounds: {},
  },
  'forest-rain': {
    id: 'forest-rain',
    name: 'Pluie en forêt',
    cardText: 'Une pluie douce, filtrée par les arbres.',
    caption: 'La pluie glisse entre les feuilles, la forêt respire.',
    particleType: 'rain',
    windDirection: 'front',
    hasLightning: true,
    skyColors: ['#2a3a2e', '#16241a', '#05070d'],
    images: {
      background: '/images/forest-background.png',
      foreground: '/images/forest-foreground.png',
    },
    sounds: {
      loop: '/audio/rain-fx-inside-car.wav',
      accent: '/audio/boomy-thunder-shock.wav',
    },
    emitters: [
      { type: 'steam', xPercent: 57.0, yPercent: 79.8 },
      { type: 'smoke', xPercent: 78.3, yPercent: 81.4 },
      { type: 'flicker', xPercent: 78.3, yPercent: 80.4 },
    ],
  },
  'desert-wind': {
    id: 'desert-wind',
    name: 'Vent du désert',
    cardText: 'Un vent sec et lointain, sous un ciel nocturne.',
    caption: 'Le vent balaie les dunes, mais ici, rien ne bouge.',
    particleType: 'wind',
    hasLightning: true,
    skyColors: ['#2a3040', '#181c28', '#05070d'],
    images: {},
    sounds: {},
  },
};

// Ids shown as cards on the home screen — everything else stays reachable
// directly via /#/<id> but isn't advertised there.
const HOME_IDS = ['car-rain', 'forest-rain'];

export function getAmbiance(id: string): Ambiance | null {
  return Object.prototype.hasOwnProperty.call(ambiances, id) ? ambiances[id] : null;
}

export function listHomeAmbiances(): Ambiance[] {
  return HOME_IDS.map((id) => ambiances[id]);
}
