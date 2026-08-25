import type { Ambiance } from '../types';

export interface Emitters {
  dispose(): void;
}

// Emitter coordinates are percentages of the *foreground image itself*
// (measured against the art). #scene is letterboxed to the art's own
// aspect ratio (see renderScene / style.css's #scene.letterboxed), so
// #foreground's rendered box is always exactly proportioned to the image —
// no cover/contain scale-and-offset math needed, a plain percentage of the
// container's real size lands exactly on the candle flame / cup rim.
//
// Driven by ResizeObserver + getBoundingClientRect on the actual element
// rather than window.innerWidth/innerHeight behind a resize listener:
// window-level events are an indirect proxy for "the container changed
// size" — easy to miss on rotation, and can still read stale dimensions
// for a frame while the browser chrome animates. ResizeObserver reports
// the box the browser actually settled on, for any reason it changed.
export function setupEmitters(nodes: HTMLElement[], foregroundEl: HTMLElement, ambiance: Ambiance): Emitters {
  if (nodes.length === 0) return { dispose() {} };

  function reposition(): void {
    const rect = foregroundEl.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    nodes.forEach((node, i) => {
      const emitter = ambiance.emitters?.[i];
      if (!emitter) return;
      node.style.left = `${(emitter.xPercent / 100) * rect.width}px`;
      node.style.top = `${(emitter.yPercent / 100) * rect.height}px`;
    });
  }

  reposition();
  const observer = new ResizeObserver(() => reposition());
  observer.observe(foregroundEl);

  return {
    dispose() {
      observer.disconnect();
    },
  };
}
