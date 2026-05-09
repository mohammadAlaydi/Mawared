"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";

export default function DownloadCTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="download" ref={ref} className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950" />
      <div className="absolute inset-0 noise-overlay" />

      {/* Decorative Elements */}
      <div className="absolute top-10 right-10 w-72 h-72 bg-brand-500/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-accent-500/15 rounded-full blur-[150px]" />

      {/* Floating Shapes */}
      <div className="absolute top-20 left-[20%] w-4 h-4 rounded-full bg-white/10 animate-float" />
      <div className="absolute bottom-32 right-[25%] w-6 h-6 rounded-lg bg-white/5 rotate-45 animate-float" style={{ animationDelay: "2s" }} />
      <div className="absolute top-1/2 left-[70%] w-3 h-3 rounded-full bg-accent-400/20 animate-float" style={{ animationDelay: "4s" }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-right space-y-6"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
              حمّل التطبيق الآن
              <br />
              <span className="gradient-text-gold">وابدأ رحلتك</span>
            </h2>
            <p className="text-gray-300 text-lg max-w-lg mx-auto lg:mx-0 leading-relaxed">
              اكتشف سهولة الاستقدام الرقمي — اختر عاملتك بنفسك، تابع طلبك
              لحظة بلحظة، واحصل على أفضل خدمة في أسرع وقت.
            </p>

            {/* Download Buttons */}
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <motion.a
                href="#"
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="group flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 hover:border-white/40 text-white px-6 py-3.5 rounded-2xl transition-all duration-300"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                </svg>
                <div className="text-right">
                  <p className="text-[10px] text-gray-300">حمّل من</p>
                  <p className="font-bold text-base -mt-0.5">Google Play</p>
                </div>
              </motion.a>

              <motion.a
                href="#"
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="group flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 hover:border-white/40 text-white px-6 py-3.5 rounded-2xl transition-all duration-300"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z" />
                </svg>
                <div className="text-right">
                  <p className="text-[10px] text-gray-300">حمّل من</p>
                  <p className="font-bold text-base -mt-0.5">App Store</p>
                </div>
              </motion.a>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center gap-6 justify-center lg:justify-start pt-4">
              <div className="flex items-center gap-2 text-gray-300">
                <svg className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span className="text-sm">آمن وموثوق</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span className="text-sm">تقييم 4.9</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <svg className="w-5 h-5 text-brand-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span className="text-sm">+500 تحميل</span>
              </div>
            </div>
          </motion.div>

          {/* Phone Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative flex justify-center"
          >
            <div className="relative w-[280px] h-[560px]">
              {/* Phone Frame */}
              <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900 rounded-[3rem] shadow-2xl shadow-black/50 p-3">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-gray-900 rounded-b-2xl z-10" />
                {/* Screen */}
                <div className="w-full h-full rounded-[2.4rem] overflow-hidden bg-brand-600 relative">
                  <Image
                    src="/images/logo-icon.png"
                    alt="تطبيق موارد الدولية"
                    fill
                    className="object-cover"
                  />
                  {/* Overlay with app branding */}
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-900/80 via-transparent to-brand-800/30 flex flex-col justify-end p-6">
                    <div className="text-center space-y-2">
                      <div className="w-16 h-16 mx-auto rounded-2xl overflow-hidden bg-white/20 backdrop-blur-sm shadow-lg mb-3">
                        <Image
                          src="/images/logo-full.png"
                          alt="موارد"
                          width={64}
                          height={64}
                          className="object-contain"
                        />
                      </div>
                      <p className="text-white font-bold text-lg">موارد الدولية</p>
                      <p className="text-white/70 text-xs">أختر عاملتك بنفسك</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Glow */}
              <div className="absolute -inset-4 bg-brand-500/20 rounded-[4rem] blur-2xl -z-10" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
