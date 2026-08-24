export interface ClosedEyes {
  readonly active: boolean;
  /** True once, right after the tap that exits closed-eyes mode — lets the
   * scene's own storm-click handler ignore that same tap instead of
   * calling down a stray lightning strike the instant eyes re-open. */
  consumeSuppressedClick(): boolean;
  dispose(): void;
}

/**
 * Hides all visuals behind an opaque overlay. Audio keeps playing
 * untouched — the point is "eyes closed, still listening" — so callers
 * only get told to pause/resume rendering, never audio.
 */
export function setupClosedEyes(
  overlay: HTMLElement,
  hint: HTMLElement,
  trigger: HTMLButtonElement,
  onEnter: () => void,
  onExit: () => void,
): ClosedEyes {
  let active = false;
  let suppressNextClick = false;

  function enter(): void {
    active = true;
    overlay.classList.add('active');
    hint.classList.remove('faded');
    // Force reflow so the class removal above commits before re-adding it,
    // otherwise the fade-out transition wouldn't replay on a second entry.
    void hint.offsetWidth;
    hint.classList.add('faded');
    onEnter();
  }

  function exit(): void {
    active = false;
    overlay.classList.remove('active');
    onExit();
  }

  function onTriggerClick(): void {
    enter();
  }

  function onOverlayClick(): void {
    exit();
    // Marks the click "handled" so the same tap doesn't bubble up and get
    // treated as a storm click, which would call down a stray lightning
    // strike the instant eyes re-open.
    suppressNextClick = true;
  }

  trigger.addEventListener('click', onTriggerClick);
  overlay.addEventListener('click', onOverlayClick);

  return {
    get active() {
      return active;
    },
    consumeSuppressedClick() {
      if (!suppressNextClick) return false;
      suppressNextClick = false;
      return true;
    },
    dispose() {
      trigger.removeEventListener('click', onTriggerClick);
      overlay.removeEventListener('click', onOverlayClick);
    },
  };
}
