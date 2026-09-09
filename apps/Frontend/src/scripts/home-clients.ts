const MOVE_MS = 700;
const PAUSE_MS = 1000;

function gapOf(el: HTMLElement) {
  const value = Number.parseFloat(getComputedStyle(el).gap);
  return Number.isFinite(value) ? value : 0;
}

function initRow(row: HTMLElement) {
  const track = row.querySelector('.clients-marquee-track');
  const set = row.querySelector('.clients-marquee-set');
  if (!(track instanceof HTMLElement) || !(set instanceof HTMLElement)) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const direction = row.getAttribute('data-direction') === 'right' ? 1 : -1;
  let offset = 0;
  let timer = 0;
  let paused = false;
  let generation = 0;

  const cycleWidth = () => set.scrollWidth + gapOf(track);

  const apply = (animate: boolean) => {
    track.style.transition = animate ? `transform ${MOVE_MS}ms ease-in-out` : 'none';
    track.style.transform = `translateX(${offset}px)`;
  };

  const normalize = () => {
    const width = cycleWidth();
    if (width <= 0) return;
    if (direction < 0 && offset <= -width) {
      offset += width;
      apply(false);
    } else if (direction > 0 && offset >= 0) {
      offset -= width;
      apply(false);
    }
  };

  const stepDistance = () => {
    const cell = set.querySelector('.clients-logo-cell');
    if (!(cell instanceof HTMLElement)) return 0;
    return cell.getBoundingClientRect().width + gapOf(set);
  };

  const stop = () => {
    paused = true;
    window.clearTimeout(timer);
    timer = 0;
    generation += 1;
  };

  const play = () => {
    if (reduce.matches || document.hidden) return;
    window.clearTimeout(timer);
    paused = false;
    generation += 1;
    const token = generation;
    timer = window.setTimeout(function advance() {
      if (paused || token !== generation || reduce.matches || document.hidden) return;
      offset += direction * stepDistance();
      apply(true);
      timer = window.setTimeout(() => {
        if (paused || token !== generation) return;
        normalize();
        timer = window.setTimeout(advance, PAUSE_MS);
      }, MOVE_MS);
    }, PAUSE_MS);
  };

  const reset = () => {
    window.clearTimeout(timer);
    timer = 0;
    generation += 1;
    offset = direction > 0 ? -cycleWidth() : 0;
    apply(false);
  };

  row.addEventListener('mouseenter', stop);
  row.addEventListener('mouseleave', play);
  row.addEventListener('focusin', stop);
  row.addEventListener('focusout', (event) => {
    if (!row.contains(event.relatedTarget as Node)) play();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else play();
  });
  reduce.addEventListener('change', () => {
    reset();
    play();
  });
  window.addEventListener('resize', () => {
    const wasPaused = paused;
    reset();
    if (!wasPaused) play();
  });

  reset();
  play();
}

function initHomeClients() {
  const root = document.querySelector('[data-clients-marquee]');
  if (!(root instanceof HTMLElement)) return;
  root.querySelectorAll('[data-clients-row]').forEach((row) => {
    if (row instanceof HTMLElement) initRow(row);
  });
}

initHomeClients();
