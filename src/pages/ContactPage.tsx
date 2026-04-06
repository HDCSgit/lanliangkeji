import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle } from 'lucide-react';
import { DataStore } from '@/data/store';

gsap.registerPlugin(ScrollTrigger);

const ContactPage: React.FC = () => {
  const pageRef = useRef<HTMLDivElement>(null);
  const contact = DataStore.getSiteConfig().contact;
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;

    gsap.fromTo(
      '.page-header',
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.page-header',
          start: 'top 85%',
          once: true,
        },
      }
    );

    gsap.fromTo(
      '.contact-section',
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.contact-section',
          start: 'top 80%',
          once: true,
        },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        name: '',
        phone: '',
        email: '',
        company: '',
        subject: '',
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
    <div ref={pageRef} className="min-h-screen pt-20">
      {/* Page Header */}
      <section className="relative py-20 lg:py-32 bg-ocean-deep overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="page-header inline-block px-4 py-2 rounded-full bg-white/10 text-ocean-cyan text-sm font-medium mb-4 border border-white/20">
            联系我们
          </span>
          <h1 className="page-header text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            期待与您合作
          </h1>
          <p className="page-header text-white/70 text-lg max-w-2xl mx-auto">
            如有任何问题或合作意向，请随时与我们联系，我们将竭诚为您服务
          </p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Left - Contact Info */}
            <div className="contact-section space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-ocean-deep mb-4">联系方式</h2>
                <p className="text-gray-600">
                  您可以通过以下方式与我们取得联系，我们的专业团队将竭诚为您服务
                </p>
              </div>

              <div className="space-y-4">
                {contactInfo.map((info, index) => {
                  const IconComponent = info.icon;
                  const content = (
                    <div className="flex items-start gap-4 p-6 bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
                      <div className="w-14 h-14 rounded-xl bg-ocean-blue/10 flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-6 h-6 text-ocean-blue" />
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
              </div>

              {/* Map */}
              <div className="rounded-2xl overflow-hidden shadow-card h-80 bg-gray-100 relative">
                <img
                  src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80"
                  alt="地图"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-ocean-deep/20 flex items-center justify-center">
                  <div className="bg-white rounded-xl p-4 shadow-lg text-center">
                    <MapPin className="w-8 h-8 text-ocean-blue mx-auto mb-2" />
                    <p className="text-ocean-deep font-medium">{contact.address}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right - Contact Form */}
            <div className="contact-section">
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
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('subject')}
                        onBlur={() => setFocusedField(null)}
                        required
                        className={`w-full px-4 py-4 bg-gray-50 rounded-xl border-2 transition-all duration-300 outline-none ${
                          focusedField === 'subject'
                            ? 'border-ocean-blue bg-white'
                            : 'border-transparent hover:border-gray-200'
                        }`}
                        placeholder="咨询主题 *"
                      />
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
    </div>
  );
};

export default ContactPage;
