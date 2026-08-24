# AGENTS.md — Immersive Cocoons

## Project overview

Immersive web application generating relaxing real-time environments
("cocoons"): rain, window drops, lightning, thunder, wind, fire,
smoke, particles and spatialized ambient sound.

**Stack**: TypeScript (strict) + HTML Canvas 2D + Web Audio API + Vite.
No runtime dependencies — everything is procedural, no looping videos.

## Commands

- `npm install`: installation
- `npm run dev`: dev server (--host enabled, testable on mobile via local IP)
- `npm run build`: type-check (tsc) then production build
- `npm run preview`: preview the build

## Architecture

    src/
    ├── main.ts                  # entry point, audio gate (user gesture required)
    ├── core/
    │   ├── Engine.ts            # rAF loop, delta time (50ms cap), resize/DPR
    │   ├── Scheduler.ts         # timed random events (after/afterRandom/everyRandom)
    │   ├── Noise.ts             # Noise1D (smooth noise), rand, pick, clamp
    │   └── DeviceProfile.ts     # device capabilities: isMobile, dpr (cap 2), maxParticles
    ├── director/
    │   └── WeatherDirector.ts   # orchestrates weather phases (calm→downpour→storm→easing),
    │                            # continuous rainLevel/windLevel levels, triggers lightning
    ├── audio/
    │   └── AudioManager.ts      # sound loops (addLoop/setLoopVolume) and spatialized one-shots (play)
    ├── effects/
    │   ├── Rain.ts              # rain particles driven by intensity + wind
    │   └── Lightning.ts         # branching fractal lightning + full-screen flash
    └── scenes/
        ├── Scene.ts             # common interface: update(dt), render(ctx), resize(w,h)
        └── CabinScene.ts        # 🌲 cabin: composes background + effects + window frame + fireplace glow

### Key principles

1. **A cocoon = a Scene composing Effects.** Effects are independent,
   reusable bricks (the car scene will reuse Rain/Lightning).
2. **Single source of truth for ambiance**: the WeatherDirector. The scene
   reads director.rainLevel / windLevel and syncs effects AND audio volumes.
3. **The scheduler runs inside the render loop** (no setTimeout) — see main.ts.
4. **Audio tied to visuals**: any visual intensity change must be reflected
   in the corresponding sound loop volume.

## Development rules

### TypeScript
- `strict: true` mandatory — no `any` unless documented justification.
- Prefer `interface` for public contracts (Scene, Effect, DeviceProfile).
- Use `import type` for type-only imports.

### Canvas & performance
- **Always work with delta time (`dt`)**, never fixed frame steps.
- Cap DPR at 2 (`Math.min(devicePixelRatio, 2)`).
- Particle density adapted to device via `DeviceProfile.maxParticles`
  (mobile ≈ 250, desktop ≈ 600). Never exceed this budget.
- Pool/recycle particles instead of creating/destroying objects.
- Pre-render static elements into offscreen canvases if draw cost
  becomes significant.
- Batch ctx state changes (`save()`/`restore()`, avoid changing
  strokeStyle/globalAlpha more than necessary).
- All animations must stay smooth at 60 fps desktop / 30 fps mobile minimum.

### Audio
- The AudioContext can only start after a user gesture → the
  "Enter the cocoon" screen is mandatory, do not remove it.
- Use `linearRampToValueAtTime` for volume transitions (never abrupt cuts).
- Clean up Web Audio nodes after playback (`onended` → disconnect).

### Responsive & multi-device
- Relative coordinates (%) or recomputed on `resize` — never hard-coded
  pixels for scene layout.
- Handle both `resize` AND orientation changes.
- Touch interactions equivalent to mouse interactions.
- The project must work on: desktop, tablet, smartphone, and be castable
  (TV mode: auto-hidden UI after inactivity — upcoming).

### Randomness & living sessions
- Every session must be slightly different: use `Scheduler`,
  `Noise1D` and `rand()` — never fixed values for ambiance timings.
- Variations must be **continuous and smoothed** (interpolation toward a
  target), never sudden jumps.
- Narrative coherence: thunder AFTER lightning (0.8–5 s delay based on
  simulated distance), volume inversely proportional to distance.

### Files & organization
- One module = one responsibility. No catch-all files.
- Name files in PascalCase for classes, camelCase for helpers.
- Comment the *why*, not the *what*.
- Audio assets go in `public/audio/` (CC0 only, e.g. Pixabay).
  Canonical names: rain.mp3, wind.mp3, thunder.mp3, fire-crackle.mp3,
  wood-crack.mp3. The app must work even without audio files present.

## Frontend best practices

### HTML & semantics
- Use semantic elements (`main`, `header`, `button`, `nav`) even in a
  canvas-heavy app; the UI shell (menu, gate screen) must be real DOM,
  not drawn on canvas.
- Always provide a `<noscript>` fallback message.
- Set `lang` attribute correctly (e.g. `lang="fr"`) for accessibility
  and SEO.

### CSS
- Prefer CSS custom properties (`--color-accent`) over magic values for
  theming (dark/light TV mode).
- Use modern layout tools (flexbox/grid), avoid absolute positioning
  except for overlays.
- Respect safe areas on notched devices:
  `env(safe-area-inset-top)` etc.
- Avoid heavy CSS animations running alongside the canvas loop;
  prefer `transform`/`opacity` (GPU-composited properties).

### JavaScript / runtime behavior
- Never block the main thread: no synchronous loops > a few ms,
  no large JSON.parse on hot paths.
- Debounce/throttle expensive handlers (resize already handled by Engine).
- Use passive event listeners where applicable
  (`{ passive: true }` for touch/wheel when not calling preventDefault).
- Guard against double initialization (StrictMode-like re-runs,
  HMR during dev): make module init idempotent.

### Performance budget
- Target metrics: First Contentful Paint < 1.5 s, Time to Interactive
  < 2 s on mid-range mobile.
- Keep the JS bundle small (< 100 KB gzipped); no runtime dependencies
  unless absolutely justified.
- Lazy-load non-critical assets (audio files load on demand after the
  gate click, not at page load).
- Monitor with Chrome DevTools Performance tab; check for long tasks
  (> 50 ms) caused by effect updates.

### Memory management
- Revoke object URLs and disconnect Web Audio nodes when done.
- Remove event listeners in `dispose()` methods; use `AbortController`
  signals for bulk listener cleanup when convenient.
- Watch for closures capturing large buffers (offscreen canvases);
  null out references when a scene is disposed.

### Error handling & resilience
- Wrap third-party-sensitive calls (AudioContext, fullscreen API,
  media playback) in try/catch with graceful degradation.
- The app must remain usable if audio fails entirely (visual-only mode).
- Log actionable errors with context (`[Lightning] failed to generate bolt`),
  never silent empty catches except documented autoplay cases.

### Security basics
- No inline scripts; Vite handles CSP-friendly output by default.
- Sanitize anything that could end up in innerHTML (currently nothing does —
  keep it that way; use textContent).
- Serve over HTTPS in production (required anyway for some APIs like
  fullscreen on mobile).

### Tooling & code quality
- ESLint + Prettier recommended once the team grows; keep formatting
  consistent from day one.
- Enable `noUncheckedIndexedAccess` in tsconfig for extra safety.
- Prefer small pure functions testable without a DOM (Noise, Scheduler,
  WeatherDirector logic) — they are unit-testable as-is.

### Accessibility (a11y)
- Respect `prefers-reduced-motion`: reduce particle counts, disable
  lightning flashes or soften them.
- Provide keyboard access to all UI controls (gate button, future menu),
  visible focus rings.
- Announce state changes (phase transitions, cocoon switch) via
  `aria-live="polite"` regions when UI exists.
- Ensure color contrast ≥ 4.5:1 for text over animated backgrounds.

### Progressive enhancement mindset
- Core experience = visuals on canvas (works everywhere).
- Enhancements layer on top: audio (needs gesture), fullscreen,
  Cast, haptics — each optional and feature-detected
  (`'audioContext' in window`, `document.fullscreenEnabled`).

## Roadmap (suggested order)

- [x] Engine + loop + audio gate + responsive
- [x] Rain + WeatherDirector + lightning + delayed thunder
- [ ] WindowDrops: drops running down glass with lens effect (offscreen canvas)
- [ ] Full Fire: flames, embers, sparks, smoke
- [ ] Car scene: windshield, wipers, headlights
- [ ] Dedicated fireplace scene
- [ ] Multi-cocoon menu + transitions
- [ ] TV mode (auto-hidden UI, Cast)
- [ ] User settings (intensity, volume, fullscreen)

## Known pitfalls

- `everyRandom` fixes its bounds on first call: to make event frequency
  follow the current phase, re-schedule manually (see
  WeatherDirector.lightningTimer for the pattern to follow).
- `createMediaElementSource` can only be called once per audio element —
  never recreate a source on an existing element.
