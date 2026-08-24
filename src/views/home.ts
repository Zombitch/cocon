import { listHomeAmbiances } from '../data/ambiances';

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
            <h2>${a.name}</h2>
            <p>${a.cardText}</p>
          </a>`,
          )
          .join('')}
      </div>
    </div>
  `;
}
