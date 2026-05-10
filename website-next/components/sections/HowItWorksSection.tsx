"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const steps = [
  {
    number: "٠١",
    title: "اختر الخدمة",
    description: "حدد نوع الخدمة المطلوبة — عاملة منزلية، سائق، مربية أطفال، أو رعاية مسنين",
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    number: "٠٢",
    title: "اختر العامل",
    description: "تصفح الملفات الشخصية واختر العامل الأنسب بناءً على الخبرة والتقييمات",
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    number: "٠٣",
    title: "أكمل الطلب",
    description: "أدخل بياناتك، حدد العنوان، واختر الباقة المناسبة لاحتياجاتك",
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    number: "٠٤",
    title: "تابع طلبك",
    description: "تابع حالة طلبك لحظة بلحظة مع إشعارات فورية حتى وصول العامل",
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
];

export default function HowItWorksSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="how-it-works" ref={ref} className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-surface-100 to-white" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/5 rounded-full blur-[150px]" />

      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-sm font-semibold text-accent-600 bg-accent-50 rounded-full px-4 py-1.5 mb-4">
            سهل وبسيط
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-brand-950 mb-4">
            كيف <span className="gradient-text">نعمل؟</span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
            أربع خطوات بسيطة تفصلك عن الحصول على العامل المثالي
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative group"
            >
              {/* Connector Line (hidden on mobile/last item) */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 -left-3 w-6 h-px bg-brand-200 group-hover:bg-brand-400 transition-colors duration-500" />
              )}

              <div className="relative bg-white rounded-3xl p-7 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-brand-500/10 transition-all duration-500 hover:-translate-y-2 h-full">
                {/* Step Number */}
                <div className="flex items-center justify-between mb-5">
                  <span className="text-4xl font-black text-brand-100 group-hover:text-brand-200 transition-colors duration-300">
                    {step.number}
                  </span>
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 group-hover:bg-brand-500 flex items-center justify-center text-brand-600 group-hover:text-white transition-all duration-300 shadow-sm">
                    {step.icon}
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-brand-950 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
