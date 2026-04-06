import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { DataStore } from '@/data/store';
import type { Banner } from '@/types';

gsap.registerPlugin(ScrollTrigger);

const HeroSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const slidesRef = useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [banners, setBanners] = useState<Banner[]>([]);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Load banners from DataStore
    const loadedBanners = DataStore.getBanners().filter((b) => b.isActive).sort((a, b) => a.order - b.order);
    setBanners(loadedBanners);
  }, []);

  useEffect(() => {
    if (banners.length === 0) return;

    // Auto-play slides
    autoPlayRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 6000);

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [banners.length]);

  useEffect(() => {
    if (!slidesRef.current || banners.length === 0) return;

    // Animate slide transition
    gsap.to(slidesRef.current.children, {
      x: `${-currentSlide * 100}%`,
      duration: 0.8,
      ease: 'power3.inOut',
    });
  }, [currentSlide, banners.length]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // Animate content on load
    const tl = gsap.timeline({ delay: 0.5 });

    tl.fromTo(
      '.hero-title',
      { opacity: 0, y: 60 },
      { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }
    )
      .fromTo(
        '.hero-subtitle',
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
        '-=0.6'
      )
      .fromTo(
        '.hero-description',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
        '-=0.5'
      )
      .fromTo(
        '.hero-buttons',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' },
        '-=0.4'
      )
      .fromTo(
        '.hero-stats',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.1 },
        '-=0.3'
      );

    return () => {
      tl.kill();
    };
  }, [banners]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    // Reset auto-play timer
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % banners.length);
      }, 6000);
    }
  };

  const nextSlide = () => {
    goToSlide((currentSlide + 1) % banners.length);
  };

  const prevSlide = () => {
    goToSlide((currentSlide - 1 + banners.length) % banners.length);
  };

  if (banners.length === 0) {
    return null;
  }

  const stats = DataStore.getStats();

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background Slides */}
      <div className="absolute inset-0">
        <div ref={slidesRef} className="flex h-full">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="min-w-full h-full relative"
            >
              <img
                src={banner.image}
                alt={banner.title}
                className="w-full h-full object-cover"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-ocean-deep/90 via-ocean-deep/70 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-ocean-deep/60 via-transparent to-ocean-deep/30" />
            </div>
          ))}
        </div>
      </div>

      {/* Particle Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/10 animate-float"
            style={{
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${Math.random() * 3 + 4}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-white">
            <div className="hero-subtitle inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
              <span className="w-2 h-2 rounded-full bg-ocean-cyan animate-pulse" />
              <span className="text-sm font-medium">{banners[currentSlide]?.subtitle}</span>
            </div>

            <h1 className="hero-title text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              {banners[currentSlide]?.title}
            </h1>

            <p className="hero-description text-lg text-white/80 mb-8 max-w-xl leading-relaxed">
              {banners[currentSlide]?.description}
            </p>

            <div className="hero-buttons flex flex-wrap gap-4">
              <Link
                to={banners[currentSlide]?.link || '/about'}
                className="group inline-flex items-center gap-2 px-8 py-4 bg-white text-ocean-deep rounded-full font-semibold hover:bg-ocean-cyan hover:text-white transition-all duration-300"
              >
                {banners[currentSlide]?.buttonText || '了解更多'}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-8 py-4 bg-transparent text-white rounded-full font-semibold border-2 border-white/30 hover:bg-white/10 hover:border-white/50 transition-all duration-300"
              >
                联系我们
              </Link>
            </div>
          </div>

          {/* Right Content - Stats */}
          <div className="hidden lg:grid grid-cols-2 gap-6">
            {stats.slice(0, 4).map((stat, index) => (
              <div
                key={stat.id}
                className="hero-stats glass rounded-2xl p-6 text-white"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-4xl font-bold text-ocean-cyan mb-2">
                  {stat.value}{stat.suffix}
                </div>
                <div className="text-sm text-white/70">{stat.name}</div>
                <div className="text-xs text-white/50 mt-1">{stat.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Slide Navigation */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4">
        <button
          onClick={prevSlide}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'w-8 bg-ocean-cyan'
                  : 'w-2 bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>

        <button
          onClick={nextSlide}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 right-8 z-20 hidden lg:block">
        <div className="flex flex-col items-center gap-2 text-white/50">
          <span className="text-xs writing-mode-vertical rotate-180" style={{ writingMode: 'vertical-rl' }}>
            向下滚动
          </span>
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-white/60 rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
