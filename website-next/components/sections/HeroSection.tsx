"use client";

import { motion, AnimatePresence, useInView } from "framer-motion";
import { useRef, useEffect, useState, useCallback } from "react";
import Image from "next/image";

const SLIDE_INTERVAL = 5000;

const SLIDES = [
  {
    desktop: "/images/sliders/slider-1.png",
    mobile: "/images/sliders/slider-1-mobile.png",
  },
  {
    desktop: "/images/sliders/slider-2.png",
    mobile: "/images/sliders/slider-2-mobile.png",
  },
  {
    desktop: "/images/sliders/slider-3.png",
    mobile: "/images/sliders/slider-3-mobile.png",
  },
] as const;

export default function HeroSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const [active, setActive] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const goTo = useCallback((index: number) => {
    setActive(((index % SLIDES.length) + SLIDES.length) % SLIDES.length);
  }, []);

  // Auto-rotate, paused on hover/focus.
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActive((current) => (current + 1) % SLIDES.length);
    }, SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [isPaused]);

  return (
    <section
      id="hero"
      ref={ref}
      className="relative flex min-h-screen items-center overflow-hidden pt-24 pb-16"
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-bl from-brand-50 via-surface-100 to-brand-100/30" />

      {/* Floating Decorative Blobs */}
      <div className="absolute top-20 right-10 h-72 w-72 animate-float rounded-full bg-brand-400/10 blur-[100px]" />
      <div
        className="absolute bottom-20 left-10 h-96 w-96 animate-float rounded-full bg-accent-400/10 blur-[120px]"
        style={{ animationDelay: "3s" }}
      />
      <div
        className="absolute top-1/2 left-1/3 h-40 w-40 animate-float rounded-full bg-brand-300/10 blur-[80px]"
        style={{ animationDelay: "1.5s" }}
      />

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(45,91,228,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(45,91,228,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-8 lg:px-12">
        <div className="flex flex-col items-center gap-8 text-center md:gap-10">
          {/* Slim brand headline (no duplication with the banner copy) */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex max-w-2xl flex-col items-center gap-4"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200/50 bg-brand-100/60 px-5 py-2 backdrop-blur-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              <span className="text-sm font-medium text-brand-800">
                منصة استقدام رقمية موثوقة
              </span>
            </span>
            <h1 className="text-2xl font-black leading-tight text-brand-950 sm:text-3xl md:text-4xl">
              أختر عاملتك <span className="gradient-text">بنفسك</span>
            </h1>
          </motion.div>

          {/* Carousel — the banner is the visual centerpiece */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
            className="w-full"
          >
            <div
              className="group relative w-full overflow-hidden rounded-2xl bg-brand-100/40 shadow-2xl shadow-brand-500/20 ring-1 ring-brand-200/40"
              role="region"
              aria-roledescription="carousel"
              aria-label="عروض مورد"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              onFocus={() => setIsPaused(true)}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                  setIsPaused(false);
                }
              }}
            >
              {/* Aspect ratio reserves space → no layout shift.
                  Capped portrait on mobile so hero content fits the viewport,
                  landscape from md up. */}
              <div className="relative aspect-[3/4] w-full sm:aspect-[16/10] md:aspect-[1903/958]">
                <AnimatePresence mode="wait">
                  {SLIDES.map((slide, index) =>
                    index === active ? (
                      <motion.div
                        key={slide.desktop}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.7, ease: "easeInOut" }}
                        className="absolute inset-0"
                      >
                        {/* Mobile banner (<sm) */}
                        <Image
                          src={slide.mobile}
                          alt={`عرض مورد رقم ${index + 1}`}
                          fill
                          priority={index === 0}
                          sizes="100vw"
                          className="object-cover object-center sm:hidden"
                        />
                        {/* Desktop / tablet banner (>=sm) */}
                        <Image
                          src={slide.desktop}
                          alt={`عرض مورد رقم ${index + 1}`}
                          fill
                          priority={index === 0}
                          sizes="(max-width: 1152px) 100vw, 1152px"
                          className="hidden object-cover object-center sm:block"
                        />
                      </motion.div>
                    ) : null
                  )}
                </AnimatePresence>
              </div>

              {/* Dots */}
              <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2.5 rounded-full bg-brand-950/25 px-3 py-2 backdrop-blur-sm sm:bottom-4 md:bottom-5">
                {SLIDES.map((slide, index) => {
                  const isActive = index === active;
                  return (
                    <button
                      key={slide.desktop}
                      type="button"
                      onClick={() => goTo(index)}
                      aria-label={`الانتقال إلى الشريحة ${index + 1}`}
                      aria-current={isActive ? "true" : undefined}
                      className="flex h-6 min-h-0 w-6 items-center justify-center"
                    >
                      <span
                        className={`block rounded-full transition-all duration-300 ${
                          isActive
                            ? "h-2 w-6 bg-white"
                            : "h-2 w-2 bg-white/50 hover:bg-white/80"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* App-download CTAs (below the banner) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.35, ease: "easeOut" }}
            className="flex w-full flex-col items-center gap-4 sm:w-auto sm:flex-row sm:justify-center"
          >
            <motion.a
              href="#download"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="group relative inline-flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-brand-600 px-7 py-4 text-base font-bold text-white shadow-xl shadow-brand-600/30 transition-all duration-300 hover:bg-brand-700 sm:w-auto"
            >
              <span className="absolute inset-0 bg-gradient-to-l from-white/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
              </svg>
              <span>حمّل من Google Play</span>
            </motion.a>

            <motion.a
              href="#services"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-brand-200 bg-white/80 px-7 py-4 text-base font-bold text-brand-800 shadow-lg backdrop-blur-sm transition-all duration-300 hover:bg-white hover:shadow-xl sm:w-auto"
            >
              <span>تعرف على خدماتنا</span>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </motion.a>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.45, ease: "easeOut" }}
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3"
          >
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2 space-x-reverse">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-brand-400 to-brand-600 text-[10px] font-bold text-white"
                  >
                    {["أ", "م", "س", "ع"][i - 1]}
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <span className="font-bold text-brand-800">+500</span>
                <span className="mr-1 text-gray-500">عميل</span>
              </div>
            </div>
            <div className="h-8 w-px bg-gray-300" />
            <div className="flex items-center gap-1">
              <span className="text-lg text-accent-400">★</span>
              <span className="text-sm font-bold text-brand-800">4.9</span>
              <span className="text-sm text-gray-500">تقييم</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 md:block"
      >
        <div className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-brand-300 p-1.5">
          <div className="h-3 w-1.5 animate-bounce rounded-full bg-brand-500" />
        </div>
      </motion.div>
    </section>
  );
}
