// Tints an image layer with the ambiance's mid sky color so it blends into
// the surrounding gradient instead of looking pasted on.
export function layerStyle(midSkyColor: string, url: string): string {
  return `background-image: linear-gradient(${midSkyColor}66, ${midSkyColor}66), url('${url}');`;
}
