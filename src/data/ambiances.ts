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
      loop: ['/audio/rain-car.mp3'],
      accent: ['/audio/boomy-thunder-shock.wav', '/audio/thunder-clap.mp3', '/audio/thunder-strike.mp3', '/audio/thunder-loud.mp3'],
    },
    emitters: [
      { type: 'smoke', xPercent: 71.5, yPercent: 64.2 },
      { type: 'flicker', xPercent: 71.5, yPercent: 63 },
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
      loop: ['/audio/rain-fx-inside-car.wav'],
      accent: ['/audio/boomy-thunder-shock.wav', '/audio/thunder-clap.mp3', '/audio/thunder-strike.mp3', '/audio/thunder-loud.mp3'],
    },
    emitters: [
      { type: 'steam', xPercent: 59.0, yPercent: 79.8 },
      { type: 'smoke', xPercent: 81.5, yPercent: 85 },
      { type: 'flicker', xPercent: 81.3, yPercent: 82.4 },
    ],
  },
  dome: {
    id: 'dome',
    name: 'Sous le dôme',
    cardText: 'Un igloo de verre, bercé par la pluie et les guirlandes.',
    caption: 'La forêt se floute derrière la buée, nous sommes bien au chaud.',
    particleType: 'rain',
    windDirection: 'front',
    hasLightning: true,
    skyColors: ['#28394a', '#152230', '#05070d'],
    images: {
      background: '/images/dome-background.png',
      foreground: '/images/dome-foreground.png',
    },
    sounds: {
      loop: ['/audio/rain-tent.mp3'],
      accent: ['/audio/boomy-thunder-shock.wav', '/audio/thunder-clap.mp3', '/audio/thunder-strike.mp3', '/audio/thunder-loud.mp3'],
    },
    emitters: [
      { type: 'flicker', xPercent: 44, yPercent: 59.1 },
      { type: 'flicker', xPercent: 38, yPercent: 60.1 },
      { type: 'flicker', xPercent: 35.8, yPercent: 70.6 },
      { type: 'flicker', xPercent: 39.8, yPercent: 69.1 },
      { type: 'flicker', xPercent: 51.8, yPercent: 69.1 },
      { type: 'flicker', xPercent: 58, yPercent: 67.7 },
      { type: 'flicker', xPercent: 63, yPercent: 59.3 },
      { type: 'flicker', xPercent: 70, yPercent: 67.7 },
      { type: 'flicker', xPercent: 77, yPercent: 70.7 },
    ],
  },
  mountains: {
    id: 'mountains',
    name: 'En montagne, sous la tente',
    cardText: 'La pluie crépite sur la toile, les sommets se perdent dans la brume.',
    caption: 'Le vent glisse sur la roche, mais ici, tout est calme.',
    particleType: 'rain',
    windDirection: 'front',
    hasLightning: true,
    skyColors: ['#3a4250', '#20262f', '#05070d'],
    images: {
      background: '/images/mountains-tent-background.png',
      foreground: '/images/mountains-tent-foreground.png',
    },
    sounds: {
      loop: ['/audio/wind-blow.mp3', '/audio/rain-tent.mp3'],
      accent: ['/audio/boomy-thunder-shock.wav', '/audio/thunder-clap.mp3', '/audio/thunder-strike.mp3', '/audio/thunder-loud.mp3'],
    },
  },
  christmas: {
    id: 'christmas',
    name: 'Nuit de Noël',
    cardText: 'Un fauteuil douillet, le sapin illuminé, la neige qui tombe dehors.',
    caption: 'Le feu crépite, les guirlandes scintillent, la neige tombe sans bruit.',
    particleType: 'rain',
    hasLightning: true,
    skyColors: ['#3a4a68', '#1c2438', '#05070d'],
    images: {
      background: '/images/christmas-background.png',
      foreground: '/images/christmas-foreground.png',
    },
    sounds: {
      loop: ['/audio/rain-fx-inside-car.wav'],
      accent: ['/audio/boomy-thunder-shock.wav', '/audio/thunder-clap.mp3', '/audio/thunder-strike.mp3', '/audio/thunder-loud.mp3'],
    },
    emitters: [
      { type: 'steam', xPercent: 68.6, yPercent: 75.4 },
      { type: 'flicker', xPercent: 83.2, yPercent: 78 },
      { type: 'flicker', xPercent: 10, yPercent: 9.9 },
      { type: 'flicker', xPercent: 12.8, yPercent: 34.7 },
      // Mantel garland (horizontal strand above the stockings)
      { type: 'flicker', xPercent: 29.9, yPercent: 13.9 },
      { type: 'flicker', xPercent: 39.3, yPercent: 14.4 },
      { type: 'flicker', xPercent: 44.1, yPercent: 11.9 },
      { type: 'flicker', xPercent: 48.8, yPercent: 14.4 },
      // Vertical garland down the window's right frame
      { type: 'flicker', xPercent: 48.0, yPercent: 2.0 },
      { type: 'flicker', xPercent: 50.2, yPercent: 9.4 },
      { type: 'flicker', xPercent: 49.9, yPercent: 26.8 },
      { type: 'flicker', xPercent: 47.2, yPercent: 34.7 },
      { type: 'flicker', xPercent: 46.9, yPercent: 50.6 },
      { type: 'flicker', xPercent: 49.4, yPercent: 59.5 },
      // Pine sprig by the candle, bottom right of the sill
      { type: 'flicker', xPercent: 75.9, yPercent: 72.4 },
      { type: 'flicker', xPercent: 97.7, yPercent: 81.3 },
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
const HOME_IDS = ['car-rain', 'forest-rain', 'dome', 'mountains', 'christmas'];

export function getAmbiance(id: string): Ambiance | null {
  return Object.prototype.hasOwnProperty.call(ambiances, id) ? ambiances[id] : null;
}

export function listHomeAmbiances(): Ambiance[] {
  return HOME_IDS.map((id) => ambiances[id]);
}
