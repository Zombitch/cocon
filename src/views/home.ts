import { listHomeAmbiances } from '../data/ambiances';
import { layerStyle } from '../utils/layerStyle';
import type { Ambiance } from '../types';

function previewStyle(a: Ambiance): string {
  return `background: radial-gradient(ellipse at 50% 0%, ${a.skyColors[0]} 0%, ${a.skyColors[1]} 45%, ${a.skyColors[2]} 100%);`;
}

export function renderHome(root: HTMLElement): void {
  const ambiances = listHomeAmbiances();

  root.innerHTML = `
    <div id="page">
      <h1>Choisis une ambiance, entre dans ton cocon.</h1>
      <div id="cards">
        ${ambiances
          .map(
            (a) => `
          <a class="card" href="#/${a.id}">
            <div class="card-preview" style="${previewStyle(a)}">
              ${a.images.background ? `<div class="card-preview-layer" style="${layerStyle(a.skyColors[1], a.images.background)}"></div>` : ''}
              ${a.images.foreground ? `<div class="card-preview-layer" style="${layerStyle(a.skyColors[1], a.images.foreground)}"></div>` : ''}
            </div>
            <div class="card-body">
              <h2>${a.name}</h2>
              <p>${a.cardText}</p>
            </div>
          </a>`,
          )
          .join('')}
      </div>
    </div>
  `;
}
