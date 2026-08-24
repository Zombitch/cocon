import type { Ambiance } from '../types';

export interface Emitters {
  dispose(): void;
}

// Emitter coordinates are percentages of the *foreground image itself*
// (measured against the art), not the viewport. Since the image renders
// with background-size: cover, the viewport-visible portion is scaled and
// cropped depending on the container's aspect ratio — this replicates that
// cover math to place each emitter exactly on the candle flame / cup rim
// no matter how the image ends up stretched.
export function setupEmitters(nodes: HTMLElement[], foregroundUrl: string | undefined, ambiance: Ambiance): Emitters {
  if (nodes.length === 0 || !foregroundUrl) return { dispose() {} };

  let naturalWidth = 0;
  let naturalHeight = 0;

  function reposition(): void {
    if (!naturalWidth || !naturalHeight) return;
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;
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

  window.addEventListener('resize', reposition);

  return {
    dispose() {
      window.removeEventListener('resize', reposition);
    },
  };
}
