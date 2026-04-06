import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FlaskConical, Fish, Apple, Ship, ArrowRight } from 'lucide-react';
import { DataStore } from '@/data/store';

gsap.registerPlugin(ScrollTrigger);

const iconMap: Record<string, React.ElementType> = {
  FlaskConical,
  Fish,
  Apple,
  Ship,
};

const ServicesSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const services = DataStore.getServices().filter((s) => s.isActive).sort((a, b) => a.order - b.order);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // Title animation
    gsap.fromTo(
      '.services-title',
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.services-title',
          start: 'top 85%',
          once: true,
        },
      }
    );

    // Cards animation with 3D flip effect
    gsap.fromTo(
      '.service-card',
      { opacity: 0, rotateX: 45, y: 60 },
      {
        opacity: 1,
        rotateX: 0,
        y: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.services-grid',
          start: 'top 80%',
          once: true,
        },
      }
    );

    // Icon pop animation
    gsap.fromTo(
      '.service-icon',
      { opacity: 0, scale: 0 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.5,
        stagger: 0.1,
        delay: 0.4,
        ease: 'back.out(1.7)',
        scrollTrigger: {
          trigger: '.services-grid',
          start: 'top 80%',
          once: true,
        },
      }
    );
  }, []);

  return (
    <section
      ref={sectionRef}
      id="services"
      className="relative py-24 lg:py-32 overflow-hidden bg-gradient-to-b from-white to-ocean-foam"
    >
      {/* Background Decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-72 h-72 bg-ocean-blue/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-ocean-cyan/5 rounded-full blur-3xl" />
      </div>

      {/* Wave Pattern */}
      <div className="absolute top-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
          preserveAspectRatio="none"
        >
          <path
            d="M0 50C240 100 480 0 720 50C960 100 1200 0 1440 50V100H0V50Z"
            fill="rgba(22, 93, 255, 0.03)"
          />
        </svg>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="services-title inline-block px-4 py-2 rounded-full bg-ocean-blue/10 text-ocean-blue text-sm font-medium mb-4">
            核心业务
          </span>
          <h2 className="services-title text-3xl sm:text-4xl lg:text-5xl font-bold text-ocean-deep mb-4">
            四大核心业务板块
          </h2>
          <p className="services-title text-gray-600 max-w-2xl mx-auto">
            覆盖海洋生物科技全产业链，为客户提供一站式解决方案
          </p>
        </div>

        {/* Services Grid */}
        <div
          className="services-grid grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          style={{ perspective: '1000px' }}
        >
          {services.map((service) => {
            const IconComponent = iconMap[service.icon] || FlaskConical;
            return (
              <div
                key={service.id}
                className="service-card group relative bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-500 hover:-translate-y-2 overflow-hidden"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Hover Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-ocean-blue/5 to-ocean-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Icon */}
                <div className="service-icon relative w-16 h-16 rounded-2xl bg-gradient-to-br from-ocean-blue to-ocean-cyan flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                  <IconComponent className="w-8 h-8 text-white" />
                </div>

                {/* Content */}
                <div className="relative">
                  <h3 className="text-xl font-bold text-ocean-deep mb-3 group-hover:text-ocean-blue transition-colors">
                    {service.name}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    {service.description}
                  </p>

                  {/* Features */}
                  <ul className="space-y-2 mb-6">
                    {service.features.slice(0, 3).map((feature, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 text-sm text-gray-500"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-ocean-cyan" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* Link */}
                  <Link
                    to="/products"
                    className="inline-flex items-center gap-2 text-ocean-blue font-medium text-sm group/link"
                  >
                    了解详情
                    <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </div>

                {/* Corner Decoration */}
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-ocean-blue/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-6">
            需要定制化解决方案？我们的专业团队随时为您服务
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-ocean-blue to-ocean-cyan text-white rounded-full font-semibold hover:shadow-lg hover:shadow-ocean-blue/30 transition-all duration-300 hover:-translate-y-1"
          >
            获取定制方案
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
