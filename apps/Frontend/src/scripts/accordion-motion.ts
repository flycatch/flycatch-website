const ACCORDION = '.ads-accordion, .ai-accordion, .mad-accordion, .faq-item';
const DURATION = 450;
const EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';
const TRANSITION = [
  'height',
  'padding-top',
  'padding-bottom',
  'margin-top',
  'margin-bottom',
]
  .map((property) => `${property} ${DURATION}ms ${EASING}`)
  .join(', ');

type Box = {
  content: number;
  paddingTop: string;
  paddingBottom: string;
  marginTop: string;
  marginBottom: string;
};

type InlineBox = {
  height: string;
  paddingTop: string;
  paddingBottom: string;
  marginTop: string;
  marginBottom: string;
  overflow: string;
  transition: string;
};

const ZERO: Box = {
  content: 0,
  paddingTop: '0px',
  paddingBottom: '0px',
  marginTop: '0px',
  marginBottom: '0px',
};

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function panelOf(details: HTMLDetailsElement) {
  const panel = [...details.children].find((el) => el.tagName !== 'SUMMARY');
  return panel instanceof HTMLElement && !panel.hidden ? panel : null;
}

function inlineBox(panel: HTMLElement): InlineBox {
  return {
    height: panel.style.height,
    paddingTop: panel.style.paddingTop,
    paddingBottom: panel.style.paddingBottom,
    marginTop: panel.style.marginTop,
    marginBottom: panel.style.marginBottom,
    overflow: panel.style.overflow,
    transition: panel.style.transition,
  };
}

function restoreInline(panel: HTMLElement, box: InlineBox) {
  panel.style.height = box.height;
  panel.style.paddingTop = box.paddingTop;
  panel.style.paddingBottom = box.paddingBottom;
  panel.style.marginTop = box.marginTop;
  panel.style.marginBottom = box.marginBottom;
  panel.style.overflow = box.overflow;
  panel.style.transition = box.transition;
}

function clearInline(panel: HTMLElement) {
  panel.style.height = '';
  panel.style.paddingTop = '';
  panel.style.paddingBottom = '';
  panel.style.marginTop = '';
  panel.style.marginBottom = '';
  panel.style.overflow = '';
  panel.style.transition = '';
}

function readBox(panel: HTMLElement): Box {
  const styles = getComputedStyle(panel);
  const paddingTop = parseFloat(styles.paddingTop) || 0;
  const paddingBottom = parseFloat(styles.paddingBottom) || 0;
  const border =
    (parseFloat(styles.borderTopWidth) || 0) + (parseFloat(styles.borderBottomWidth) || 0);
  const content = Math.max(0, panel.getBoundingClientRect().height - paddingTop - paddingBottom - border);
  return {
    content,
    paddingTop: styles.paddingTop,
    paddingBottom: styles.paddingBottom,
    marginTop: styles.marginTop,
    marginBottom: styles.marginBottom,
  };
}

function naturalBox(details: HTMLDetailsElement, panel: HTMLElement): Box {
  const wasOpen = details.open;
  const saved = inlineBox(panel);
  details.open = true;
  panel.style.transition = 'none';
  panel.style.height = 'auto';
  panel.style.paddingTop = '';
  panel.style.paddingBottom = '';
  panel.style.marginTop = '';
  panel.style.marginBottom = '';
  panel.style.overflow = 'hidden';
  const styles = getComputedStyle(panel);
  const paddingTop = parseFloat(styles.paddingTop) || 0;
  const paddingBottom = parseFloat(styles.paddingBottom) || 0;
  const box: Box = {
    content: Math.max(0, panel.scrollHeight - paddingTop - paddingBottom),
    paddingTop: styles.paddingTop,
    paddingBottom: styles.paddingBottom,
    marginTop: styles.marginTop,
    marginBottom: styles.marginBottom,
  };
  restoreInline(panel, saved);
  if (!wasOpen) details.open = false;
  return box;
}

function applyBox(panel: HTMLElement, box: Box, transition: string) {
  panel.style.overflow = 'hidden';
  panel.style.transition = transition;
  panel.style.height = `${box.content}px`;
  panel.style.paddingTop = box.paddingTop;
  panel.style.paddingBottom = box.paddingBottom;
  panel.style.marginTop = box.marginTop;
  panel.style.marginBottom = box.marginBottom;
}

function play(panel: HTMLElement, from: Box, to: Box) {
  applyBox(panel, from, 'none');
  panel.getBoundingClientRect();
  applyBox(panel, to, TRANSITION);
  return new Promise<void>((resolve) => {
    let timer = 0;
    const done = () => {
      window.clearTimeout(timer);
      panel.removeEventListener('transitionend', onEnd);
      resolve();
    };
    const onEnd = (event: TransitionEvent) => {
      if (event.target === panel && event.propertyName === 'height') done();
    };
    timer = window.setTimeout(done, DURATION + 60);
    panel.addEventListener('transitionend', onEnd);
  });
}

function initAccordionMotion() {
  document.querySelectorAll(ACCORDION).forEach((node) => {
    if (!(node instanceof HTMLDetailsElement) || node.dataset.accordionMotion === 'true') return;
    const summary = node.querySelector(':scope > summary');
    const panel = panelOf(node);
    if (!(summary instanceof HTMLElement) || !panel) return;
    node.dataset.accordionMotion = 'true';
    node.dataset.accordionPhase = node.open ? 'open' : 'closed';

    let token = 0;

    summary.addEventListener('click', (event) => {
      if (reducedMotion()) return;
      event.preventDefault();
      const phase = node.dataset.accordionPhase ?? (node.open ? 'open' : 'closed');
      const opening = phase === 'closed' || phase === 'closing';
      const run = ++token;

      if (opening) {
        const from = phase === 'closing' ? readBox(panel) : ZERO;
        const to = naturalBox(node, panel);
        node.open = true;
        node.classList.remove('is-closing');
        node.dataset.accordionPhase = 'opening';
        void play(panel, from, to).then(() => {
          if (run !== token) return;
          clearInline(panel);
          node.dataset.accordionPhase = 'open';
        });
        return;
      }

      const from = readBox(panel);
      node.classList.add('is-closing');
      node.dataset.accordionPhase = 'closing';
      void play(panel, from, ZERO).then(() => {
        if (run !== token) return;
        node.open = false;
        node.classList.remove('is-closing');
        clearInline(panel);
        node.dataset.accordionPhase = 'closed';
      });
    });
  });
}

initAccordionMotion();
