import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle } from 'lucide-react';
import { DataStore, defaultSiteConfig } from '@/data/store';
import type { SiteConfig } from '@/types';

const ContactSection: React.FC = () => {
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(defaultSiteConfig);
  const contact = siteConfig.contact;

  useEffect(() => {
    const loadConfig = async () => {
      const config = await DataStore.getSiteConfig();
      setSiteConfig(config);
    };
    loadConfig();
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await DataStore.submitContact(formData);
      setIsSubmitted(true);
    } catch (error) {
      console.error('提交失败:', error);
    } finally {
      setIsSubmitting(false);
    }
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
    <section className="py-24 lg:py-32 bg-gradient-to-b from-ocean-foam to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-ocean-blue/10 text-ocean-blue text-sm font-medium mb-4">
            联系我们
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-ocean-deep mb-4">
            期待与您的合作
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            无论您有任何问题或合作意向，我们都将竭诚为您服务
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left - Contact Info */}
          <div className="space-y-6">
            {contactInfo.map((info, index) => {
              const content = (
                <div className="flex items-start gap-4 p-6 bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-ocean-blue/10 flex items-center justify-center shrink-0">
                    <info.icon className="w-6 h-6 text-ocean-blue" />
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

            {/* Map - 使用本地静态图片替代 Mapbox API */}
            <div className="rounded-2xl overflow-hidden shadow-card h-64 bg-gray-100 relative">
              <img
                src="/images/contact/map-fallback.jpg"
                alt="公司位置地图"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-ocean-deep/20 flex items-center justify-center">
                <div className="bg-white rounded-xl p-4 shadow-lg">
                  <MapPin className="w-6 h-6 text-ocean-blue mx-auto mb-2" />
                  <p className="text-sm text-ocean-deep font-medium text-center">
                    {contact.address}
                  </p>
                  <p className="text-xs text-gray-500 text-center mt-1">
                    点击查看详细地图
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Contact Form */}
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
                <h4 className="text-xl font-bold text-ocean-deep mb-2">提交成功</h4>
                <p className="text-gray-600">我们已收到您的留言，将尽快与您联系</p>
                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    setFormData({ name: '', phone: '', email: '', company: '', message: '' });
                  }}
                  className="mt-6 px-6 py-3 bg-ocean-blue text-white rounded-xl hover:bg-ocean-deep transition-colors"
                >
                  继续留言
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      姓名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-ocean-blue focus:outline-none"
                      placeholder="请输入您的姓名"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      电话 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-ocean-blue focus:outline-none"
                      placeholder="请输入您的电话"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      邮箱
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-ocean-blue focus:outline-none"
                      placeholder="请输入您的邮箱"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      公司
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-ocean-blue focus:outline-none"
                      placeholder="请输入您的公司名称"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    留言内容 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-ocean-blue focus:outline-none resize-none"
                    placeholder="请输入您想咨询的内容"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-gradient-to-r from-ocean-blue to-ocean-cyan text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  {isSubmitting ? '提交中...' : '提交留言'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
