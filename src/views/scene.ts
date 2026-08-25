import type { Ambiance } from '../types';
import { ParticleSystem } from '../engine/particles';
import { Condensation } from '../engine/condensation';
import { LightningEngine } from '../engine/lightning';
import { AudioEngine } from '../audio/AudioEngine';
import { setupMenu } from '../ui/menu';
import { setupFullscreen } from '../ui/fullscreen';
import { setupCast } from '../ui/cast';
import { setupSleepTimer } from '../ui/timer';
import { setupClosedEyes } from '../ui/closedEyes';
import { setupEmitters } from '../ui/emitters';
import { layerStyle } from '../utils/layerStyle';

function el<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) throw new Error(`#${id} not found`);
  return found as T;
}

export function renderScene(root: HTMLElement, ambiance: Ambiance): () => void {
  document.title = ambiance.name;

  root.innerHTML = `
    <div id="stage">
      <div id="scene" style="--sky-0:${ambiance.skyColors[0]};--sky-1:${ambiance.skyColors[1]};--sky-2:${ambiance.skyColors[2]}">
        <div id="sky"></div>
        <div id="background" class="bg-layer" style="${ambiance.images.background ? layerStyle(ambiance.skyColors[1], ambiance.images.background) : ''}"></div>
        <canvas id="weather-canvas"></canvas>
        <div id="foreground" class="bg-layer" style="${ambiance.images.foreground ? layerStyle(ambiance.skyColors[1], ambiance.images.foreground) : ''}"></div>
        <div id="lightning-flash"></div>
        <div id="cocoon-vignette"></div>
        ${(ambiance.emitters ?? [])
          .map((e) =>
            e.type === 'flicker'
              ? `<div class="emitter flicker"><span class="glow"></span></div>`
              : `
          <div class="emitter ${e.type}">
            <span class="wisp"></span>
            <span class="wisp"></span>
            <span class="wisp"></span>
          </div>`,
          )
          .join('')}
      </div>

      <div id="intensity-gauge"><div id="intensity-gauge-fill"></div></div>
      <div id="caption">${ambiance.caption}</div>

      <div id="controls">
        <div id="timer-wrapper">
          <span id="timer-remaining" aria-live="polite"></span>
          <button id="timer-button" type="button" aria-haspopup="true" aria-expanded="false" aria-label="Minuterie">⏱</button>
          <div id="timer-dropdown" role="menu">
            <button type="button" role="menuitem" data-minutes="0">Pas de minuterie</button>
            <button type="button" role="menuitem" data-minutes="1">1 min</button>
            <button type="button" role="menuitem" data-minutes="15">15 min</button>
            <button type="button" role="menuitem" data-minutes="30">30 min</button>
            <button type="button" role="menuitem" data-minutes="45">45 min</button>
            <button type="button" role="menuitem" data-minutes="60">60 min</button>
          </div>
        </div>
        <div id="menu-wrapper">
          <button id="menu-button" type="button" aria-haspopup="true" aria-expanded="false" aria-label="Menu">⋮</button>
          <div id="menu-dropdown" role="menu">
            <button id="menu-eyes" type="button" role="menuitem">🌙 Fermer les yeux</button>
            <button id="menu-fullscreen" type="button" role="menuitem">⛶ Plein écran</button>
            <button id="cast-button" type="button">📺 Caster</button>
            <a id="menu-ambiances" href="#/" role="menuitem">🏠 Ambiances</a>
          </div>
        </div>
      </div>

      <div id="start-overlay">
        <h1>${ambiance.name}</h1>
        <p>${ambiance.cardText}</p>
        <button id="start-button" type="button">Entrer dans le cocon</button>
      </div>

      <div id="closed-eyes-overlay">
        <div id="closed-eyes-hint">Touchez l'écran pour rouvrir les yeux</div>
      </div>
    </div>
  `;

  const sceneEl = el<HTMLElement>('scene');

  // #scene is letterboxed to the artwork's own aspect ratio (see
  // style.css's #scene.letterboxed) so the whole composition scales as one
  // coherent unit and is always fully visible, as large as the viewport
  // allows, rather than each layer independently cover/contain-cropping.
  // Until the driving image loads (or if the ambiance has no art at all —
  // snow, desert-wind), #scene just fills the viewport like before.
  const artUrl = ambiance.images.foreground ?? ambiance.images.background;
  if (artUrl) {
    const artImg = new Image();
    artImg.onload = () => {
      if (!artImg.naturalWidth || !artImg.naturalHeight) return;
      sceneEl.style.setProperty('--art-ratio', String(artImg.naturalWidth / artImg.naturalHeight));
      sceneEl.classList.add('letterboxed');
    };
    artImg.src = artUrl;
  }

  const canvas = el<HTMLCanvasElement>('weather-canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  const flashEl = el<HTMLElement>('lightning-flash');
  const vignetteEl = el<HTMLElement>('cocoon-vignette');
  const foregroundEl = el<HTMLElement>('foreground');
  const startOverlay = el<HTMLElement>('start-overlay');
  const startButton = el<HTMLButtonElement>('start-button');
  const timerWrapper = el<HTMLElement>('timer-wrapper');
  const timerButton = el<HTMLButtonElement>('timer-button');
  const timerDropdown = el<HTMLElement>('timer-dropdown');
  const timerRemaining = el<HTMLElement>('timer-remaining');
  const intensityGauge = el<HTMLElement>('intensity-gauge');
  const intensityGaugeFill = el<HTMLElement>('intensity-gauge-fill');
  const closedEyesOverlay = el<HTMLElement>('closed-eyes-overlay');
  const closedEyesHint = el<HTMLElement>('closed-eyes-hint');
  const castButton = el<HTMLButtonElement>('cast-button');
  const menuButton = el<HTMLButtonElement>('menu-button');
  const menuDropdown = el<HTMLElement>('menu-dropdown');
  const menuEyes = el<HTMLButtonElement>('menu-eyes');
  const menuFullscreen = el<HTMLButtonElement>('menu-fullscreen');

  const menu = setupMenu(menuButton, menuDropdown);
  const fullscreen = setupFullscreen(menuFullscreen, menu.close);
  const cast = setupCast(castButton);
  const emitterNodes = Array.from(document.querySelectorAll<HTMLElement>('.emitter'));
  const emitters = setupEmitters(emitterNodes, foregroundEl, ambiance);

  let width = 0;
  let height = 0;
  const particles = new ParticleSystem(ambiance.particleType, ambiance.windDirection);
  const condensation = new Condensation();
  // Camera shake sells a "close strike" viscerally — pure CSS transform on
  // the scene root, no canvas cost. Fires once per strike, right as the
  // bolt appears, independent of the per-frame flash alpha.
  function triggerShake(): void {
    sceneEl.classList.remove('lightning-shake');
    void sceneEl.offsetWidth; // restart the animation even if still running
    sceneEl.classList.add('lightning-shake');
  }

  const lightning = new LightningEngine(
    (distanceFactor, pan) => audio?.playAccent(distanceFactor, pan),
    (alpha) => {
      flashEl.style.opacity = String(alpha);
    },
    triggerShake,
  );

  function resize(): void {
    const rect = sceneEl.getBoundingClientRect();
    width = canvas.width = rect.width;
    height = canvas.height = rect.height;
    particles.resize(width, height);
    condensation.resize(width, height);
    lightning.resize(width, height);
  }
  resize();
  // Driven off #scene's real box via ResizeObserver rather than
  // window.innerWidth behind resize/orientationchange listeners — see
  // ui/emitters.ts for why: window-level events are an indirect, sometimes
  // skipped or stale-at-fire-time proxy for "the container changed size".
  // ResizeObserver reports the settled box directly, for any reason it
  // changed (rotation, resize, zoom, fullscreen).
  const sceneResizeObserver = new ResizeObserver(() => resize());
  sceneResizeObserver.observe(sceneEl);

  // ---- Storm intensity — slide up for wilder, slide down for calmer ----
  // 0.5 is the resting default, chosen so nothing changes from prior tuned
  // behavior until someone actually drags.
  let intensity = 0.5;
  function setIntensity(value: number): void {
    intensity = Math.max(0, Math.min(1, value));
    intensityGaugeFill.style.height = `${intensity * 100}%`;
    audio?.applyIntensity(intensity);
  }

  // ---- Audio (starts only after the user-gesture "enter" click) ----
  let audio: AudioEngine | null = null;

  function startExperience(): void {
    startOverlay.classList.add('hidden');
    vignetteEl.classList.add('breathe-in');
    timerWrapper.style.display = 'inline-block';

    audio = new AudioEngine();
    if (ambiance.sounds.accent) void audio.loadAccent(ambiance.sounds.accent);
    if (ambiance.sounds.loop) void audio.startLoop(ambiance.sounds.loop);
    audio.applyIntensity(intensity);

    if (ambiance.hasLightning) lightning.scheduleNext();
    animationFrameId = requestAnimationFrame(tick);
  }

  startButton.addEventListener('click', () => {
    if (audio && audio.state === 'suspended') audio.resume();
    if (!audio) startExperience();
  });

  // ---- Closed-eyes mode ----
  let animationFrameId: number | null = null;
  let lastTime: number | null = null;

  const closedEyes = setupClosedEyes(
    closedEyesOverlay,
    closedEyesHint,
    menuEyes,
    () => {
      menu.close();
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
    },
    () => {
      lastTime = null;
      animationFrameId = requestAnimationFrame(tick);
    },
  );

  const sleepTimer = setupSleepTimer(timerButton, timerDropdown, timerRemaining, () => location.reload());

  // ---- Animation loop ----
  function tick(timestamp: number): void {
    if (lastTime === null) lastTime = timestamp;
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    ctx!.clearRect(0, 0, width, height);
    ctx!.lineCap = 'round';

    particles.update(ctx!, dt, intensity);
    lightning.update(ctx!, timestamp);
    // Condensation drawn last (nearest the viewer), soft-focus.
    condensation.update(ctx!, dt);

    animationFrameId = requestAnimationFrame(tick);
  }

  // ---- Slide up/down to make the storm wilder/calmer; click storm to
  // strike lightning. Both live here since they share drag/click state
  // that's specific to this one scene's canvas. ----
  const DRAG_PIXELS_FOR_FULL_SWING = 260;
  let dragState: { startY: number; startIntensity: number; moved: number } | null = null;
  let suppressNextClick = false;
  let gaugeHideTimeoutId: ReturnType<typeof setTimeout> | null = null;

  function isInteractiveTarget(target: EventTarget | null): boolean {
    return !!(target as HTMLElement | null)?.closest?.('button, a');
  }

  function onPointerDown(e: PointerEvent): void {
    if (!audio || closedEyes.active) return;
    if (isInteractiveTarget(e.target)) return;
    if (gaugeHideTimeoutId) clearTimeout(gaugeHideTimeoutId);
    dragState = { startY: e.clientY, startIntensity: intensity, moved: 0 };
  }

  function onPointerMove(e: PointerEvent): void {
    if (!dragState) return;
    const deltaY = dragState.startY - e.clientY;
    dragState.moved = Math.max(dragState.moved, Math.abs(deltaY));
    if (dragState.moved > 6) intensityGauge.classList.add('visible');
    setIntensity(dragState.startIntensity + deltaY / DRAG_PIXELS_FOR_FULL_SWING);
  }

  function endDrag(): void {
    if (!dragState) return;
    if (dragState.moved > 6) suppressNextClick = true;
    dragState = null;
    gaugeHideTimeoutId = setTimeout(() => intensityGauge.classList.remove('visible'), 600);
  }

  // Clicking the storm itself calls down a strike, for ambiances that have
  // one. Ignored on buttons/links, right after a drag, right after exiting
  // closed-eyes, and rate-limited against spam-clicking.
  function onClick(e: MouseEvent): void {
    if (suppressNextClick) {
      suppressNextClick = false;
      return;
    }
    if (closedEyes.consumeSuppressedClick()) return;
    if (!audio || !ambiance.hasLightning) return;
    if (isInteractiveTarget(e.target)) return;
    if (lightning.timeSinceLastStrike < 700) return;
    lightning.trigger();
  }

  document.addEventListener('pointerdown', onPointerDown);
  document.addEventListener('pointermove', onPointerMove);
  document.addEventListener('pointerup', endDrag);
  document.addEventListener('pointercancel', endDrag);
  document.addEventListener('click', onClick);

  return function dispose(): void {
    sceneResizeObserver.disconnect();
    document.removeEventListener('pointerdown', onPointerDown);
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', endDrag);
    document.removeEventListener('pointercancel', endDrag);
    document.removeEventListener('click', onClick);
    if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
    if (gaugeHideTimeoutId) clearTimeout(gaugeHideTimeoutId);
    lightning.dispose();
    menu.dispose();
    fullscreen.dispose();
    cast.dispose();
    emitters.dispose();
    closedEyes.dispose();
    sleepTimer.dispose();
  };
}
