export interface Cast {
  readonly supported: boolean;
  dispose(): void;
}

/**
 * Uses the standard Presentation API rather than the Google Cast SDK, so
 * casting this page works with any Presentation-capable receiver
 * (Chromecast included) without pulling in an external script.
 */
export function setupCast(button: HTMLButtonElement): Cast {
  let request: PresentationRequest | null = null;
  if (window.PresentationRequest) {
    try {
      request = new window.PresentationRequest([window.location.href]);
      if (navigator.presentation) navigator.presentation.defaultRequest = request;
    } catch {
      request = null;
    }
  }

  function onClick(): void {
    if (!request) return;
    request.start().catch((err: unknown) => console.error('[cocon] Cast failed', err));
  }

  button.addEventListener('click', onClick);

  return {
    supported: request !== null,
    dispose() {
      button.removeEventListener('click', onClick);
    },
  };
}
