"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const packages = [
  {
    name: "الباقة الأساسية",
    price: "١,٥٠٠",
    period: "شهرياً",
    description: "مثالية للاحتياجات البسيطة",
    features: [
      "عاملة منزلية واحدة",
      "تنظيف عام",
      "دعم عبر الواتساب",
      "ضمان ١٤ يوم",
    ],
    popular: false,
    color: "brand",
  },
  {
    name: "الباقة المميزة",
    price: "٢,٨٠٠",
    period: "شهرياً",
    description: "الأكثر طلباً — توفير شامل",
    features: [
      "عاملة منزلية مدربة",
      "تنظيف + طبخ + كي",
      "دعم فني ٢٤/٧",
      "ضمان ٣٠ يوم",
      "استبدال مجاني",
      "تقارير أداء شهرية",
    ],
    popular: true,
    color: "brand",
  },
  {
    name: "الباقة الذهبية",
    price: "٤,٥٠٠",
    period: "شهرياً",
    description: "الخدمة الأشمل والأفخم",
    features: [
      "عاملة منزلية + سائق",
      "جميع الخدمات المنزلية",
      "مدير حساب شخصي",
      "ضمان ٦٠ يوم",
      "استبدال فوري",
      "أولوية في التخصيص",
      "تقارير أداء أسبوعية",
    ],
    popular: false,
    color: "accent",
  },
];

export default function PricingSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="pricing" ref={ref} className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-white" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-brand-400/5 rounded-full blur-[200px]" />

      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-sm font-semibold text-brand-600 bg-brand-50 rounded-full px-4 py-1.5 mb-4">
            باقات مرنة
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-brand-950 mb-4">
            اختر <span className="gradient-text">الباقة المناسبة</span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
            باقات مصممة لتناسب جميع الاحتياجات والميزانيات
          </p>
        </motion.div>

        {/* Pricing Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-start">
          {packages.map((pkg, i) => (
            <motion.div
              key={pkg.name}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className={`relative group ${pkg.popular ? "md:-mt-4 md:mb-4" : ""}`}
            >
              {/* Popular Badge */}
              {pkg.popular && (
                <div className="absolute -top-4 right-6 bg-gradient-to-l from-brand-500 to-brand-700 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-brand-500/30 z-10">
                  الأكثر طلباً ⭐
                </div>
              )}

              <div
                className={`relative rounded-3xl p-8 border-2 transition-all duration-500 hover:-translate-y-2 ${
                  pkg.popular
                    ? "bg-white border-brand-500/30 shadow-xl shadow-brand-500/10"
                    : "bg-white border-gray-100 shadow-sm hover:shadow-xl hover:shadow-brand-500/10 hover:border-brand-200"
                }`}
              >
                {/* Header */}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-brand-950 mb-1">
                    {pkg.name}
                  </h3>
                  <p className="text-sm text-gray-500">{pkg.description}</p>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-2 mb-8">
                  <span className="text-4xl font-black text-brand-900">
                    {pkg.price}
                  </span>
                  <div className="text-sm text-gray-500">
                    <span>ر.س</span>
                    <span className="mr-1">/ {pkg.period}</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {pkg.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                        pkg.popular
                          ? "bg-brand-100 text-brand-600"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <a
                  href="#download"
                  className={`block w-full py-3.5 rounded-2xl text-center font-bold text-sm transition-all duration-300 ${
                    pkg.popular
                      ? "bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-600/25 hover:shadow-brand-700/30"
                      : "bg-brand-50 hover:bg-brand-100 text-brand-700"
                  }`}
                >
                  اشترك الآن
                </a>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
          className="text-center text-sm text-gray-500 mt-8"
        >
          * جميع الأسعار شاملة ضريبة القيمة المضافة. يمكن تعديل الباقة في أي وقت.
        </motion.p>
      </div>
    </section>
  );
}
