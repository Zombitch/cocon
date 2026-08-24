import { getAmbiance } from './data/ambiances';
import { renderHome } from './views/home';
import { renderScene } from './views/scene';

type Dispose = () => void;

export function startRouter(root: HTMLElement): void {
  let dispose: Dispose | null = null;

  function render(): void {
    if (dispose) {
      dispose();
      dispose = null;
    }

    const id = location.hash.replace(/^#\/?/, '');
    if (!id) {
      renderHome(root);
      return;
    }

    const ambiance = getAmbiance(id);
    if (!ambiance) {
      renderHome(root);
      return;
    }

    dispose = renderScene(root, ambiance);
  }

  window.addEventListener('hashchange', render);
  render();
}
