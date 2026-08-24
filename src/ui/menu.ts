export interface Menu {
  close(): void;
  dispose(): void;
}

export function setupMenu(button: HTMLButtonElement, dropdown: HTMLElement): Menu {
  function close(): void {
    dropdown.classList.remove('open');
    button.setAttribute('aria-expanded', 'false');
  }

  function onButtonClick(event: MouseEvent): void {
    event.stopPropagation();
    const open = dropdown.classList.toggle('open');
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function onDocumentClick(event: MouseEvent): void {
    if (!dropdown.contains(event.target as Node) && event.target !== button) close();
  }

  button.addEventListener('click', onButtonClick);
  document.addEventListener('click', onDocumentClick);

  return {
    close,
    dispose() {
      button.removeEventListener('click', onButtonClick);
      document.removeEventListener('click', onDocumentClick);
    },
  };
}
