"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import Image from "next/image";

function useCounter(target: number, inView: boolean, duration = 2000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, inView, duration]);
  return count;
}

export default function HeroSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <section
      id="hero"
      ref={ref}
      className="relative min-h-screen flex items-center overflow-hidden pt-24 pb-16"
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-bl from-brand-50 via-surface-100 to-brand-100/30" />

      {/* Floating Decorative Blobs */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-brand-400/10 rounded-full blur-[100px] animate-float" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent-400/10 rounded-full blur-[120px] animate-float" style={{ animationDelay: "3s" }} />
      <div className="absolute top-1/2 left-1/3 w-40 h-40 bg-brand-300/10 rounded-full blur-[80px] animate-float" style={{ animationDelay: "1.5s" }} />

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(75,123,229,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(75,123,229,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-8 text-center lg:text-right"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-brand-100/60 backdrop-blur-sm border border-brand-200/50 rounded-full px-5 py-2"
            >
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-brand-800 font-medium">
                منصة استقدام رقمية موثوقة
              </span>
            </motion.div>

            {/* Heading */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight text-brand-950">
                أختر عاملتك
                <br />
                <span className="gradient-text">بنفسك</span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                من التنظيف للضيافة — احجز عاملة منزلية، سائقاً، مربية أطفال أو
                مقدم رعاية من منزلك بضغطة واحدة
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <motion.a
                href="#download"
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="group relative inline-flex items-center gap-3 bg-brand-600 hover:bg-brand-700 text-white px-7 py-4 rounded-2xl text-base font-bold shadow-xl shadow-brand-600/30 transition-all duration-300 overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-l from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                </svg>
                <span>حمّل من Google Play</span>
              </motion.a>

              <motion.a
                href="#services"
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm hover:bg-white text-brand-800 px-7 py-4 rounded-2xl text-base font-bold border border-brand-200 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <span>تعرف على خدماتنا</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </motion.a>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center gap-6 justify-center lg:justify-start pt-2">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2 space-x-reverse">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 border-2 border-white flex items-center justify-center text-white text-[10px] font-bold"
                    >
                      {["أ", "م", "س", "ع"][i - 1]}
                    </div>
                  ))}
                </div>
                <div className="text-sm">
                  <span className="font-bold text-brand-800">+500</span>
                  <span className="text-gray-500 mr-1">عميل</span>
                </div>
              </div>
              <div className="h-8 w-px bg-gray-300" />
              <div className="flex items-center gap-1">
                <span className="text-amber-500 text-lg">★</span>
                <span className="font-bold text-brand-800 text-sm">4.9</span>
                <span className="text-gray-500 text-sm">تقييم</span>
              </div>
            </div>
          </motion.div>

          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative hidden lg:flex justify-center"
          >
            <div className="relative w-full max-w-md">
              {/* Main Image */}
              <div className="relative w-full aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl shadow-brand-500/20">
                <Image
                  src="/images/hero-worker.png"
                  alt="عاملة منزلية محترفة"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 400px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-950/40 via-transparent to-transparent" />
              </div>

              {/* Floating Card - Rating */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.8, type: "spring" }}
                className="absolute -bottom-6 -right-6 glass rounded-2xl p-4 shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">عمالة مؤهلة</p>
                    <p className="text-xs text-gray-500">فحص وتدريب شامل</p>
                  </div>
                </div>
              </motion.div>

              {/* Floating Card - Speed */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 1.0, type: "spring" }}
                className="absolute top-10 -left-6 glass rounded-2xl p-4 shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">خدمة سريعة</p>
                    <p className="text-xs text-gray-500">خلال 48 ساعة</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="w-6 h-10 rounded-full border-2 border-brand-300 flex items-start justify-center p-1.5">
          <div className="w-1.5 h-3 rounded-full bg-brand-500 animate-bounce" />
        </div>
      </motion.div>
    </section>
  );
}
