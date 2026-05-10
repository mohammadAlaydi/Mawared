"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";

const testimonials = [
  {
    name: "أم محمد",
    location: "الرياض",
    rating: 5,
    text: "خدمة ممتازة وسريعة! العاملة المنزلية التي حصلنا عليها مدربة ومحترفة. أنصح الجميع بالتعامل مع موارد الدولية.",
    initial: "أ",
  },
  {
    name: "أبو عبدالله",
    location: "جدة",
    rating: 5,
    text: "التطبيق سهل الاستخدام جداً والتجربة كانت سلسة من البداية. فريق العمل متعاون ويتابعون معك خطوة بخطوة.",
    initial: "ع",
  },
  {
    name: "سارة الشمري",
    location: "الدمام",
    rating: 5,
    text: "فريق دعم متعاون جداً! تم التواصل معي بسرعة وحل جميع استفساراتي. العاملة وصلت في الموعد المحدد.",
    initial: "س",
  },
  {
    name: "خالد العتيبي",
    location: "الرياض",
    rating: 5,
    text: "حصلت على سائق خاص ممتاز عبر موارد الدولية. شخص ملتزم ومحترف. شكراً لكم على الخدمة المتميزة.",
    initial: "خ",
  },
  {
    name: "نورة القحطاني",
    location: "المدينة المنورة",
    rating: 5,
    text: "المربية التي أرسلوها لأطفالي رائعة! الأطفال يحبونها والخدمة ممتازة. موارد الدولية الأفضل في السوق.",
    initial: "ن",
  },
  {
    name: "فهد الحربي",
    location: "الخبر",
    rating: 4,
    text: "أسعار منافسة وخدمة احترافية. المربية مؤهلة ومدربة. سأكرر التجربة قريباً وأنصح بها بشدة.",
    initial: "ف",
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= rating ? "text-amber-400" : "text-gray-200"}`}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

export default function TestimonialsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="testimonials" ref={ref} className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-surface-100" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-400/5 rounded-full blur-[150px]" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent-400/5 rounded-full blur-[120px]" />

      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-sm font-semibold text-accent-600 bg-accent-50 rounded-full px-4 py-1.5 mb-4">
            ثقة عملائنا
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-brand-950 mb-4">
            ماذا يقول <span className="gradient-text">عملاؤنا</span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
            آراء حقيقية من عملاء استفادوا من خدمات موارد الدولية
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group"
            >
              <div className="relative bg-white rounded-3xl p-7 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-brand-500/10 transition-all duration-500 hover:-translate-y-1 h-full flex flex-col">
                {/* Quote Icon */}
                <div className="absolute top-5 left-5 text-brand-100 group-hover:text-brand-200 transition-colors">
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                </div>

                {/* Stars */}
                <div className="mb-4">
                  <StarRating rating={testimonial.rating} />
                </div>

                {/* Text */}
                <p className="text-gray-700 leading-relaxed mb-6 flex-1">
                  &ldquo;{testimonial.text}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {testimonial.initial}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-900">
                      {testimonial.name}
                    </p>
                    <p className="text-xs text-gray-500">{testimonial.location}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
