import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ScrollAnimationOptions {
  trigger?: string | Element;
  start?: string;
  end?: string;
  scrub?: boolean | number;
  markers?: boolean;
  toggleActions?: string;
  once?: boolean;
}

export const useScrollAnimation = () => {
  const createFadeUp = (
    element: Element | Element[] | string,
    options: ScrollAnimationOptions = {}
  ) => {
    const {
      start = 'top 85%',
      toggleActions = 'play none none none',
      once = true,
    } = options;

    return gsap.fromTo(
      element,
      {
        opacity: 0,
        y: 50,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: typeof element === 'string' ? element : (Array.isArray(element) ? element[0] : element),
          start,
          toggleActions,
          once,
        },
      }
    );
  };

  const createFadeIn = (
    element: Element | Element[] | string,
    options: ScrollAnimationOptions = {}
  ) => {
    const {
      start = 'top 85%',
      toggleActions = 'play none none none',
      once = true,
    } = options;

    return gsap.fromTo(
      element,
      {
        opacity: 0,
      },
      {
        opacity: 1,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: typeof element === 'string' ? element : (Array.isArray(element) ? element[0] : element),
          start,
          toggleActions,
          once,
        },
      }
    );
  };

  const createSlideInLeft = (
    element: Element | Element[] | string,
    options: ScrollAnimationOptions = {}
  ) => {
    const {
      start = 'top 85%',
      toggleActions = 'play none none none',
      once = true,
    } = options;

    return gsap.fromTo(
      element,
      {
        opacity: 0,
        x: -80,
      },
      {
        opacity: 1,
        x: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: typeof element === 'string' ? element : (Array.isArray(element) ? element[0] : element),
          start,
          toggleActions,
          once,
        },
      }
    );
  };

  const createSlideInRight = (
    element: Element | Element[] | string,
    options: ScrollAnimationOptions = {}
  ) => {
    const {
      start = 'top 85%',
      toggleActions = 'play none none none',
      once = true,
    } = options;

    return gsap.fromTo(
      element,
      {
        opacity: 0,
        x: 80,
      },
      {
        opacity: 1,
        x: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: typeof element === 'string' ? element : (Array.isArray(element) ? element[0] : element),
          start,
          toggleActions,
          once,
        },
      }
    );
  };

  const createScaleIn = (
    element: Element | Element[] | string,
    options: ScrollAnimationOptions = {}
  ) => {
    const {
      start = 'top 85%',
      toggleActions = 'play none none none',
      once = true,
    } = options;

    return gsap.fromTo(
      element,
      {
        opacity: 0,
        scale: 0.8,
      },
      {
        opacity: 1,
        scale: 1,
        duration: 0.6,
        ease: 'back.out(1.7)',
        scrollTrigger: {
          trigger: typeof element === 'string' ? element : (Array.isArray(element) ? element[0] : element),
          start,
          toggleActions,
          once,
        },
      }
    );
  };

  const createStagger = (
    elements: Element[] | string,
    options: ScrollAnimationOptions & { stagger?: number; from?: string | number } = {}
  ) => {
    const {
      start = 'top 85%',
      toggleActions = 'play none none none',
      once = true,
      stagger = 0.1,
      from = 'start',
    } = options;

    return gsap.fromTo(
      elements,
      {
        opacity: 0,
        y: 40,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: {
          each: stagger,
          from: from as any,
        },
        ease: 'power3.out',
        scrollTrigger: {
          trigger: typeof elements === 'string' ? elements : elements[0],
          start,
          toggleActions,
          once,
        },
      }
    );
  };

  const createParallax = (
    element: Element | string,
    options: ScrollAnimationOptions & { speed?: number } = {}
  ) => {
    const {
      start = 'top bottom',
      end = 'bottom top',
      speed = 0.5,
    } = options;

    return gsap.to(element, {
      yPercent: speed * 100,
      ease: 'none',
      scrollTrigger: {
        trigger: typeof element === 'string' ? element : element,
        start,
        end,
        scrub: true,
      },
    });
  };

  const createCountUp = (
    element: Element | string,
    targetValue: number,
    options: ScrollAnimationOptions & { duration?: number; suffix?: string } = {}
  ) => {
    const {
      start = 'top 85%',
      duration = 2,
      suffix = '',
    } = options;

    const obj = { value: 0 };
    const el = typeof element === 'string' ? document.querySelector(element) : element;

    return gsap.to(obj, {
      value: targetValue,
      duration,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: el,
        start,
        once: true,
      },
      onUpdate: () => {
        if (el) {
          el.textContent = Math.floor(obj.value) + suffix;
        }
      },
    });
  };

  return {
    createFadeUp,
    createFadeIn,
    createSlideInLeft,
    createSlideInRight,
    createScaleIn,
    createStagger,
    createParallax,
    createCountUp,
  };
};

export const useScrollTrigger = () => {
  const refresh = () => {
    ScrollTrigger.refresh();
  };

  const killAll = () => {
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
  };

  return {
    refresh,
    killAll,
  };
};

export default useScrollAnimation;
