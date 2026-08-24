export function setupFullscreen(button: HTMLButtonElement, closeMenu: () => void): { dispose(): void } {
  if (!document.documentElement.requestFullscreen) {
    button.style.display = 'none';
    return { dispose() {} };
  }

  function onClick(): void {
    closeMenu();
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  function onChange(): void {
    button.textContent = document.fullscreenElement ? '⛶ Quitter le plein écran' : '⛶ Plein écran';
  }

  button.addEventListener('click', onClick);
  document.addEventListener('fullscreenchange', onChange);

  return {
    dispose() {
      button.removeEventListener('click', onClick);
      document.removeEventListener('fullscreenchange', onChange);
    },
  };
}
