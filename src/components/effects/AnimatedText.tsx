import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface AnimatedTextProps {
  children: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span';
  animation?: 'fadeUp' | 'fadeIn' | 'slideLeft' | 'slideRight' | 'typewriter';
  delay?: number;
  duration?: number;
  stagger?: number;
  splitBy?: 'chars' | 'words' | 'lines';
}

const AnimatedText: React.FC<AnimatedTextProps> = ({
  children,
  className = '',
  as: Component = 'span',
  animation = 'fadeUp',
  delay = 0,
  duration = 0.8,
  stagger = 0.02,
  splitBy = 'chars',
}) => {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const text = container.textContent || '';
    container.innerHTML = '';

    let elements: HTMLSpanElement[] = [];

    if (splitBy === 'chars') {
      elements = text.split('').map((char) => {
        const span = document.createElement('span');
        span.textContent = char === ' ' ? '\u00A0' : char;
        span.style.display = 'inline-block';
        span.style.opacity = '0';
        return span;
      });
    } else if (splitBy === 'words') {
      elements = text.split(' ').map((word) => {
        const span = document.createElement('span');
        span.textContent = word;
        span.style.display = 'inline-block';
        span.style.marginRight = '0.25em';
        span.style.opacity = '0';
        return span;
      });
    } else {
      const span = document.createElement('span');
      span.textContent = text;
      span.style.display = 'inline-block';
      span.style.opacity = '0';
      elements = [span];
    }

    elements.forEach((el) => container.appendChild(el));

    const triggers: ScrollTrigger[] = [];

    switch (animation) {
      case 'fadeUp':
        gsap.fromTo(
          elements,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration,
            stagger,
            delay,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: container,
              start: 'top 85%',
              once: true,
            },
          }
        );
        break;
      case 'fadeIn':
        gsap.fromTo(
          elements,
          { opacity: 0 },
          {
            opacity: 1,
            duration: duration * 0.5,
            stagger,
            delay,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: container,
              start: 'top 85%',
              once: true,
            },
          }
        );
        break;
      case 'slideLeft':
        gsap.fromTo(
          elements,
          { opacity: 0, x: -50 },
          {
            opacity: 1,
            x: 0,
            duration,
            stagger,
            delay,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: container,
              start: 'top 85%',
              once: true,
            },
          }
        );
        break;
      case 'slideRight':
        gsap.fromTo(
          elements,
          { opacity: 0, x: 50 },
          {
            opacity: 1,
            x: 0,
            duration,
            stagger,
            delay,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: container,
              start: 'top 85%',
              once: true,
            },
          }
        );
        break;
      case 'typewriter':
        elements.forEach((el, i) => {
          gsap.fromTo(
            el,
            { opacity: 0 },
            {
              opacity: 1,
              duration: 0.05,
              delay: delay + i * stagger,
              ease: 'none',
              scrollTrigger: {
                trigger: container,
                start: 'top 85%',
                once: true,
              },
            }
          );
        });
        break;
    }

    return () => {
      triggers.forEach((trigger) => trigger.kill());
    };
  }, [children, animation, delay, duration, stagger, splitBy]);

  return React.createElement(Component, {
    ref: containerRef,
    className,
  }, children);
};

export default AnimatedText;
