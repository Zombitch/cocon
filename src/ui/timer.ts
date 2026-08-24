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
export function setupSleepTimer(select: HTMLSelectElement, remaining: HTMLElement, onExpire: () => void): SleepTimer {
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let countdownId: ReturnType<typeof setInterval> | null = null;
  let endsAt = 0;

  function tick(): void {
    const rem = endsAt - Date.now();
    remaining.textContent = formatRemaining(rem);
    if (rem <= 0 && countdownId) clearInterval(countdownId);
  }

  function onChange(): void {
    if (timerId) clearTimeout(timerId);
    if (countdownId) clearInterval(countdownId);

    const minutes = parseInt(select.value, 10);
    if (minutes > 0) {
      endsAt = Date.now() + minutes * 60000;
      timerId = setTimeout(onExpire, minutes * 60000);
      remaining.style.display = 'inline';
      tick();
      countdownId = setInterval(tick, 1000);
    } else {
      remaining.style.display = 'none';
    }
  }

  select.addEventListener('change', onChange);

  return {
    dispose() {
      select.removeEventListener('change', onChange);
      if (timerId) clearTimeout(timerId);
      if (countdownId) clearInterval(countdownId);
    },
  };
}
