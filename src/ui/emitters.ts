import type { Ambiance } from '../types';

export interface Emitters {
  dispose(): void;
}

// Emitter coordinates are percentages of the *foreground image itself*
// (measured against the art), not the viewport. Since the image renders
// with background-size: cover, the visible portion is scaled and cropped
// depending on the container's aspect ratio — this replicates that cover
// math to place each emitter exactly on the candle flame / cup rim no
// matter how the image ends up stretched.
//
// Positioning is driven off the foreground element's *actual* rendered
// box (via ResizeObserver + getBoundingClientRect), not window.innerWidth/
// innerHeight behind a resize/orientationchange listener. window-level
// events are an indirect proxy for "the container changed size" — they can
// be skipped by some mobile browsers on rotation, and even when they do
// fire, window.innerWidth/innerHeight can still reflect the pre-rotation
// layout for a frame while the address bar animates. ResizeObserver
// reports the box the browser actually settled on, for any reason it
// changed (rotation, resize, zoom, fullscreen), so there's no stale read
// and no missed event to fall back to.
export function setupEmitters(nodes: HTMLElement[], foregroundEl: HTMLElement, foregroundUrl: string | undefined, ambiance: Ambiance): Emitters {
  if (nodes.length === 0 || !foregroundUrl) return { dispose() {} };

  let naturalWidth = 0;
  let naturalHeight = 0;

  function reposition(): void {
    if (!naturalWidth || !naturalHeight) return;
    const rect = foregroundEl.getBoundingClientRect();
    const containerWidth = rect.width;
    const containerHeight = rect.height;
    if (!containerWidth || !containerHeight) return;
    const scale = Math.max(containerWidth / naturalWidth, containerHeight / naturalHeight);
    const displayedWidth = naturalWidth * scale;
    const displayedHeight = naturalHeight * scale;
    const offsetX = (containerWidth - displayedWidth) / 2;
    const offsetY = (containerHeight - displayedHeight) / 2;

    nodes.forEach((node, i) => {
      const emitter = ambiance.emitters?.[i];
      if (!emitter) return;
      node.style.left = `${offsetX + (emitter.xPercent / 100) * displayedWidth}px`;
      node.style.top = `${offsetY + (emitter.yPercent / 100) * displayedHeight}px`;
    });
  }

  const img = new Image();
  img.onload = () => {
    naturalWidth = img.naturalWidth;
    naturalHeight = img.naturalHeight;
    reposition();
  };
  img.src = foregroundUrl;

  const observer = new ResizeObserver(() => reposition());
  observer.observe(foregroundEl);

  return {
    dispose() {
      observer.disconnect();
    },
  };
}
