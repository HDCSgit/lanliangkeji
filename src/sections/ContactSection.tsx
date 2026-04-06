import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle } from 'lucide-react';
import { DataStore } from '@/data/store';

gsap.registerPlugin(ScrollTrigger);

const ContactSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const contact = DataStore.getSiteConfig().contact;
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // Title animation
    gsap.fromTo(
      '.contact-title',
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.contact-title',
          start: 'top 85%',
          once: true,
        },
      }
    );

    // Info cards animation
    gsap.fromTo(
      '.contact-info-card',
      { opacity: 0, x: -30 },
      {
        opacity: 1,
        x: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.contact-info',
          start: 'top 80%',
          once: true,
        },
      }
    );

    // Form animation
    gsap.fromTo(
      '.contact-form',
      { opacity: 0, x: 30 },
      {
        opacity: 1,
        x: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.contact-form',
          start: 'top 80%',
          once: true,
        },
      }
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);

    // Reset after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        name: '',
        phone: '',
        email: '',
        company: '',
        message: '',
      });
    }, 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: '公司地址',
      content: contact.address,
    },
    {
      icon: Phone,
      title: '联系电话',
      content: contact.phone,
      href: `tel:${contact.phone}`,
    },
    {
      icon: Mail,
      title: '电子邮箱',
      content: contact.email,
      href: `mailto:${contact.email}`,
    },
    {
      icon: Clock,
      title: '工作时间',
      content: contact.workHours,
    },
  ];

  return (
    <section
      ref={sectionRef}
      id="contact"
      className="relative py-24 lg:py-32 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white to-ocean-foam" />

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-ocean-blue/5 to-transparent pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="contact-title inline-block px-4 py-2 rounded-full bg-ocean-blue/10 text-ocean-blue text-sm font-medium mb-4">
            联系我们
          </span>
          <h2 className="contact-title text-3xl sm:text-4xl lg:text-5xl font-bold text-ocean-deep mb-4">
            期待与您合作
          </h2>
          <p className="contact-title text-gray-600 max-w-2xl mx-auto">
            如有任何问题或合作意向，请随时与我们联系，我们将竭诚为您服务
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Left - Contact Info */}
          <div className="contact-info space-y-6">
            {contactInfo.map((info, index) => {
              const IconComponent = info.icon;
              const content = (
                <div className="contact-info-card group flex items-start gap-4 p-6 bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
                  <div className="w-14 h-14 rounded-xl bg-ocean-blue/10 flex items-center justify-center flex-shrink-0 group-hover:bg-ocean-blue group-hover:scale-110 transition-all duration-300">
                    <IconComponent className="w-6 h-6 text-ocean-blue group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <h4 className="text-sm text-gray-500 mb-1">{info.title}</h4>
                    <p className="text-ocean-deep font-medium">{info.content}</p>
                  </div>
                </div>
              );

              return info.href ? (
                <a key={index} href={info.href} className="block">
                  {content}
                </a>
              ) : (
                <div key={index}>{content}</div>
              );
            })}

            {/* Map Placeholder */}
            <div className="contact-info-card rounded-2xl overflow-hidden shadow-card h-64 bg-gray-100 relative">
              <img
                src={`https://api.mapbox.com/styles/v1/mapbox/light-v10/static/pin-s+165DFF(${contact.mapLng},${contact.mapLat})/${contact.mapLng},${contact.mapLat},13,0/600x400?access_token=pk.placeholder`}
                alt="地图"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to a static map image
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80';
                }}
              />
              <div className="absolute inset-0 bg-ocean-deep/20 flex items-center justify-center">
                <div className="bg-white rounded-xl p-4 shadow-lg">
                  <MapPin className="w-6 h-6 text-ocean-blue mx-auto mb-2" />
                  <p className="text-sm text-ocean-deep font-medium text-center">
                    点击查看详细地图
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Contact Form */}
          <div className="contact-form">
            <div className="bg-white rounded-3xl shadow-card p-8 lg:p-10">
              <h3 className="text-2xl font-bold text-ocean-deep mb-2">在线咨询</h3>
              <p className="text-gray-600 mb-8">
                填写以下表单，我们将尽快与您联系
              </p>

              {isSubmitted ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                  </div>
                  <h4 className="text-xl font-bold text-ocean-deep mb-2">
                    提交成功！
                  </h4>
                  <p className="text-gray-600">
                    感谢您的留言，我们将尽快与您联系
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="relative">
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('name')}
                        onBlur={() => setFocusedField(null)}
                        required
                        className={`w-full px-4 py-4 bg-gray-50 rounded-xl border-2 transition-all duration-300 outline-none ${
                          focusedField === 'name'
                            ? 'border-ocean-blue bg-white'
                            : 'border-transparent hover:border-gray-200'
                        }`}
                        placeholder="您的姓名 *"
                      />
                    </div>
                    <div className="relative">
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('phone')}
                        onBlur={() => setFocusedField(null)}
                        required
                        className={`w-full px-4 py-4 bg-gray-50 rounded-xl border-2 transition-all duration-300 outline-none ${
                          focusedField === 'phone'
                            ? 'border-ocean-blue bg-white'
                            : 'border-transparent hover:border-gray-200'
                        }`}
                        placeholder="联系电话 *"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        className={`w-full px-4 py-4 bg-gray-50 rounded-xl border-2 transition-all duration-300 outline-none ${
                          focusedField === 'email'
                            ? 'border-ocean-blue bg-white'
                            : 'border-transparent hover:border-gray-200'
                        }`}
                        placeholder="电子邮箱"
                      />
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('company')}
                        onBlur={() => setFocusedField(null)}
                        className={`w-full px-4 py-4 bg-gray-50 rounded-xl border-2 transition-all duration-300 outline-none ${
                          focusedField === 'company'
                            ? 'border-ocean-blue bg-white'
                            : 'border-transparent hover:border-gray-200'
                        }`}
                        placeholder="公司名称"
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('message')}
                      onBlur={() => setFocusedField(null)}
                      required
                      rows={5}
                      className={`w-full px-4 py-4 bg-gray-50 rounded-xl border-2 transition-all duration-300 outline-none resize-none ${
                        focusedField === 'message'
                          ? 'border-ocean-blue bg-white'
                          : 'border-transparent hover:border-gray-200'
                      }`}
                      placeholder="请详细描述您的需求或问题 *"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-ocean-blue to-ocean-cyan text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-ocean-blue/30 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        提交中...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        提交咨询
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
