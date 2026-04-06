import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FlaskConical, Microscope, FileText, Award, Thermometer, Droplets, Filter, CircleDot } from 'lucide-react';
import { DataStore } from '@/data/store';

gsap.registerPlugin(ScrollTrigger);

const techIcons: Record<string, React.ElementType> = {
  Thermometer,
  Droplets,
  Filter,
  CircleDot,
  FlaskConical,
  Microscope,
};

const RDSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const rdInfo = DataStore.getRDInfo();
  const stats = DataStore.getStats();

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // Title animation
    gsap.fromTo(
      '.rd-title',
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.rd-title',
          start: 'top 85%',
          once: true,
        },
      }
    );

    // Stats animation
    gsap.fromTo(
      '.rd-stat',
      { opacity: 0, scale: 0.8 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.6,
        stagger: 0.1,
        ease: 'back.out(1.7)',
        scrollTrigger: {
          trigger: '.rd-stats',
          start: 'top 80%',
          once: true,
        },
      }
    );

    // Technology cards animation
    gsap.fromTo(
      '.tech-card',
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.tech-grid',
          start: 'top 80%',
          once: true,
        },
      }
    );

    // Patent cards animation
    gsap.fromTo(
      '.patent-card',
      { opacity: 0, x: -30 },
      {
        opacity: 1,
        x: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.patents-list',
          start: 'top 80%',
          once: true,
        },
      }
    );
  }, []);

  return (
    <section
      ref={sectionRef}
      id="rd"
      className="relative py-24 lg:py-32 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-ocean-deep">
        <div className="absolute inset-0 bg-gradient-to-br from-ocean-deep via-ocean-blue/10 to-ocean-deep" />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="rd-title inline-block px-4 py-2 rounded-full bg-white/10 text-ocean-cyan text-sm font-medium mb-4 border border-white/20">
            研发实力
          </span>
          <h2 className="rd-title text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            科技创新 引领未来
          </h2>
          <p className="rd-title text-white/70 max-w-2xl mx-auto">
            拥有强大的研发实力，建有现代化的研发中心，配备先进的研发设备和检测仪器
          </p>
        </div>

        {/* Stats */}
        <div className="rd-stats grid grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {stats.map((stat) => (
            <div
              key={stat.id}
              className="rd-stat relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-ocean-cyan/30 transition-colors group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-ocean-cyan/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
              <div className="relative">
                <div className="text-4xl lg:text-5xl font-bold text-ocean-cyan mb-2">
                  {stat.value}{stat.suffix}
                </div>
                <div className="text-white font-medium mb-1">{stat.name}</div>
                <div className="text-white/50 text-sm">{stat.description}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Technologies */}
        <div className="mb-20">
          <h3 className="text-2xl font-bold text-white mb-8 text-center">核心技术</h3>
          <div className="tech-grid grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {rdInfo.technologies.map((tech) => {
              const IconComponent = techIcons[tech.icon] || FlaskConical;
              return (
                <div
                  key={tech.id}
                  className="tech-card group bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-ocean-cyan/30 transition-all duration-300 hover:-translate-y-2"
                >
                  <div className="w-14 h-14 rounded-xl bg-ocean-cyan/20 flex items-center justify-center mb-4 group-hover:bg-ocean-cyan/30 group-hover:scale-110 transition-all duration-300">
                    <IconComponent className="w-7 h-7 text-ocean-cyan" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2 group-hover:text-ocean-cyan transition-colors">
                    {tech.name}
                  </h4>
                  <p className="text-white/60 text-sm leading-relaxed">
                    {tech.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Patents */}
        <div className="grid lg:grid-cols-2 gap-12">
          <div>
            <h3 className="text-2xl font-bold text-white mb-8">专利技术</h3>
            <div className="patents-list space-y-4">
              {rdInfo.patents.slice(0, 4).map((patent) => (
                <div
                  key={patent.id}
                  className="patent-card group flex items-start gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-ocean-cyan/30 transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-ocean-cyan/20 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-ocean-cyan" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-medium mb-1 group-hover:text-ocean-cyan transition-colors truncate">
                      {patent.name}
                    </h4>
                    <p className="text-white/50 text-sm">{patent.number}</p>
                  </div>
                  <Award className="w-5 h-5 text-ocean-cyan/50 group-hover:text-ocean-cyan transition-colors flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Equipment */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-8">先进设备</h3>
            <div className="relative rounded-2xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=800&q=80"
                alt="实验室设备"
                className="w-full h-[300px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ocean-deep via-ocean-deep/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="grid grid-cols-3 gap-4">
                  {rdInfo.equipment.slice(0, 3).map((eq) => (
                    <div key={eq.id} className="text-center">
                      <div className="w-10 h-10 mx-auto rounded-lg bg-white/10 flex items-center justify-center mb-2">
                        <Microscope className="w-5 h-5 text-ocean-cyan" />
                      </div>
                      <div className="text-white text-xs font-medium truncate">
                        {eq.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RDSection;
