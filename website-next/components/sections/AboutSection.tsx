"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";

const values = [
  { label: "موثوقية", icon: "🛡️" },
  { label: "احترافية", icon: "⭐" },
  { label: "شفافية", icon: "💎" },
  { label: "كفاءة", icon: "🎯" },
  { label: "رعاية", icon: "💙" },
  { label: "استقرار", icon: "🏠" },
];

export default function AboutSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="about" ref={ref} className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-brand-950" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-800/40 rounded-full blur-[200px]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent-500/10 rounded-full blur-[150px]" />

      {/* Noise Overlay */}
      <div className="absolute inset-0 noise-overlay" />

      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Image Side */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src="/images/office.png"
                alt="مكتب موارد الدولية"
                width={600}
                height={450}
                className="object-cover w-full h-[400px]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-950/60 via-transparent to-transparent" />
            </div>

            {/* Floating Stats Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.5, type: "spring" }}
              className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-5 shadow-2xl"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/30">
                  <span className="text-2xl font-black text-white">+5</span>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">سنوات خبرة</p>
                  <p className="text-xs text-gray-500">في مجال الاستقدام</p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Text Side */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-8"
          >
            <div>
              <span className="inline-block text-sm font-semibold text-accent-400 bg-accent-500/10 rounded-full px-4 py-1.5 mb-4">
                من نحن
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-5 leading-tight">
                شركة موارد الدولية
                <br />
                <span className="gradient-text-gold">للإستقدام</span>
              </h2>
              <p className="text-gray-300 text-base leading-relaxed">
                شركة موارد الدولية للاستقدام — شريكك الموثوق في استقدام العمالة
                المنزلية المدربة والمؤهلة. نعمل على ربط العائلات السعودية بأفضل
                الكفاءات من مختلف الجنسيات، مع التزامنا بأعلى معايير الجودة
                والشفافية.
              </p>
            </div>

            {/* Values Grid */}
            <div className="grid grid-cols-3 gap-3">
              {values.map((value, i) => (
                <motion.div
                  key={value.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: 0.4 + i * 0.08 }}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center hover:bg-white/10 transition-colors duration-300"
                >
                  <span className="text-2xl block mb-1">{value.icon}</span>
                  <span className="text-xs font-medium text-gray-300">
                    {value.label}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Key Features */}
            <div className="space-y-3">
              {[
                "مرخصون من وزارة الموارد البشرية",
                "ضمان استبدال العمالة خلال الفترة التجريبية",
                "دعم فني على مدار الساعة",
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-300">{feature}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
