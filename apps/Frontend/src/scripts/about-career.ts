import Swiper from 'swiper';
import { Autoplay, EffectCube } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-cube';

function initAboutCareerSlider() {
  const el = document.querySelector<HTMLElement>('[data-about-career-swiper]');
  if (!el || el.classList.contains('swiper-initialized')) return;

  el.addEventListener('dragstart', (event) => {
    event.preventDefault();
  });

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  new Swiper(el, {
    modules: [Autoplay, EffectCube],
    effect: 'cube',
    grabCursor: true,
    // Cube faces sit in 3D, so a mouse drag on the photo hits the frame, not the slide.
    touchEventsTarget: 'container',
    speed: 700,
    loop: true,
    cubeEffect: {
      shadow: false,
      slideShadows: false,
      shadowOffset: 0,
      shadowScale: 0.94,
    },
    autoplay: reduce.matches
      ? false
      : {
          delay: 3000,
          disableOnInteraction: false,
        },
  });
}

initAboutCareerSlider();
