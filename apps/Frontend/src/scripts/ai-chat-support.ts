import { initCoverflowShowcase } from './coverflow-showcase';

function initAiChatSupportReveal() {
  const nodes = document.querySelectorAll('[data-acs-reveal]');
  if (!nodes.length) return;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    },
    { threshold: 0.12 },
  );
  nodes.forEach((node) => observer.observe(node));
}

initAiChatSupportReveal();
initCoverflowShowcase('.acs-showcase-swiper');
