import Swiper from 'swiper';
import { Autoplay, EffectCoverflow } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-coverflow';

function initCreditLifeReveal() {
  const nodes = document.querySelectorAll('[data-cl-reveal]');
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

function initCreditLifeShowcase() {
  const el = document.querySelector<HTMLElement>('.cl-showcase-swiper');
  if (!el || el.classList.contains('swiper-initialized')) return;

  new Swiper(el, {
    modules: [Autoplay, EffectCoverflow],
    effect: 'coverflow',
    grabCursor: true,
    centeredSlides: true,
    slidesPerView: 'auto',
    watchSlidesProgress: true,
    loopAdditionalSlides: 3,
    initialSlide: 1,
    autoplay: {
      delay: 3000,
      disableOnInteraction: false,
    },
    coverflowEffect: {
      rotate: 0,
      stretch: 0,
      depth: 300,
      modifier: 1.5,
      slideShadows: true,
    },
  });
}

initCreditLifeReveal();
initCreditLifeShowcase();
