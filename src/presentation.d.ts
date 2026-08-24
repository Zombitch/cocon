// Presentation API — still experimental, not in TS's built-in DOM lib.
// Minimal shape covering the subset this app actually uses (casting the
// current page to a Presentation-capable receiver, e.g. Chromecast).
interface PresentationConnection {
  readonly state: 'connecting' | 'connected' | 'closed' | 'terminated';
}

interface PresentationRequest {
  start(): Promise<PresentationConnection>;
}

declare const PresentationRequest: {
  prototype: PresentationRequest;
  new (urls: string[]): PresentationRequest;
};

interface Presentation {
  defaultRequest: PresentationRequest | null;
}

interface Navigator {
  readonly presentation?: Presentation;
}

interface Window {
  readonly PresentationRequest?: typeof PresentationRequest;
}
