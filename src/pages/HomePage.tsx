import React, { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import HeroSection from '@/sections/HeroSection';
import AboutSection from '@/sections/AboutSection';
import ServicesSection from '@/sections/ServicesSection';
import WhyUsSection from '@/sections/WhyUsSection';
import ProductsSection from '@/sections/ProductsSection';
import RDSection from '@/sections/RDSection';
import PartnersSection from '@/sections/PartnersSection';
import NewsSection from '@/sections/NewsSection';
import ContactSection from '@/sections/ContactSection';
import { DataStore } from '@/data/store';

gsap.registerPlugin(ScrollTrigger);

const HomePage: React.FC = () => {
  useEffect(() => {
    // Initialize DataStore
    DataStore.init();

    // Refresh ScrollTrigger on page load
    ScrollTrigger.refresh();

    return () => {
      // Only kill triggers specific to this page (inside <main> element)
      ScrollTrigger.getAll().forEach((trigger) => {
        const triggerElement = trigger.vars.trigger;
        // Only process if trigger is a valid DOM Element (not window/document)
        if (triggerElement && triggerElement instanceof Element) {
          if (triggerElement.closest('main')) {
            trigger.kill();
          }
        }
      });
    };
  }, []);

  return (
    <main className="relative">
      <HeroSection />
      <AboutSection />
      <ServicesSection />
      <WhyUsSection />
      <ProductsSection />
      <RDSection />
      <PartnersSection />
      <NewsSection />
      <ContactSection />
    </main>
  );
};

export default HomePage;
