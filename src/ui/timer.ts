export interface SleepTimer {
  dispose(): void;
}

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// No web API can put a phone to sleep — Wake Lock only does the opposite.
// The honest equivalent is to stop everything and reload, same as a fresh
// visit; the device can then dim/lock on its own once nothing is playing.
export function setupSleepTimer(
  button: HTMLButtonElement,
  dropdown: HTMLElement,
  remaining: HTMLElement,
  onExpire: () => void,
): SleepTimer {
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let countdownId: ReturnType<typeof setInterval> | null = null;
  let endsAt = 0;

  function tick(): void {
    const rem = endsAt - Date.now();
    remaining.textContent = formatRemaining(rem);
    if (rem <= 0 && countdownId) clearInterval(countdownId);
  }

  function close(): void {
    dropdown.classList.remove('open');
    button.setAttribute('aria-expanded', 'false');
  }

  function selectMinutes(minutes: number): void {
    if (timerId) clearTimeout(timerId);
    if (countdownId) clearInterval(countdownId);

    for (const child of Array.from(dropdown.children)) {
      child.classList.toggle('selected', Number((child as HTMLElement).dataset.minutes) === minutes);
    }

    if (minutes > 0) {
      endsAt = Date.now() + minutes * 60000;
      timerId = setTimeout(onExpire, minutes * 60000);
      remaining.style.display = 'inline';
      tick();
      countdownId = setInterval(tick, 1000);
    } else {
      remaining.style.display = 'none';
    }
    close();
  }

  function onButtonClick(event: MouseEvent): void {
    event.stopPropagation();
    const open = dropdown.classList.toggle('open');
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function onDropdownClick(event: MouseEvent): void {
    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-minutes]');
    if (!target) return;
    selectMinutes(Number(target.dataset.minutes));
  }

  function onDocumentClick(event: MouseEvent): void {
    if (!dropdown.contains(event.target as Node) && event.target !== button) close();
  }

  button.addEventListener('click', onButtonClick);
  dropdown.addEventListener('click', onDropdownClick);
  document.addEventListener('click', onDocumentClick);

  return {
    dispose() {
      button.removeEventListener('click', onButtonClick);
      dropdown.removeEventListener('click', onDropdownClick);
      document.removeEventListener('click', onDocumentClick);
      if (timerId) clearTimeout(timerId);
      if (countdownId) clearInterval(countdownId);
    },
  };
}
