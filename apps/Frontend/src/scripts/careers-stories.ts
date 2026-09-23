import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

const el = document.querySelector<HTMLElement>('[data-employee-stories]');
if (el && !el.classList.contains('swiper-initialized')) {
  const indicators = [...el.querySelectorAll<HTMLButtonElement>('[data-story-index]')];
  const swiper = new Swiper(el, {
    modules: [Navigation],
    slidesPerView: 1,
    spaceBetween: 24,
    grabCursor: true,
    navigation: {
      prevEl: el.querySelector('.careers-story-prev'),
      nextEl: el.querySelector('.careers-story-next'),
    },
  });

  const sync = () => {
    indicators.forEach((indicator, index) => {
      indicator.classList.toggle('is-active', index === swiper.activeIndex);
    });
  };

  indicators.forEach((indicator) => {
    indicator.addEventListener('click', () => {
      const index = Number(indicator.dataset.storyIndex);
      if (!Number.isNaN(index)) swiper.slideTo(index);
    });
  });

  swiper.on('slideChange', sync);
  sync();
}
