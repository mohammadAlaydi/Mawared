"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";

const services = [
  {
    title: "الاستلام الفوري",
    description: "احصل على العاملة المنزلية فوراً بدون انتظار — جاهزة للعمل من أول يوم بإجراءات سريعة وموثقة",
    image: "/images/services/service-instant.png",
    accent: "text-brand-500",
    badge: "bg-brand-50 text-brand-600",
  },
  {
    title: "الاستقدام بالتوسط",
    description: "نتولّى استقدام العاملة من الخارج نيابة عنك مع متابعة كاملة لكل خطوة حتى وصولها إليك",
    image: "/images/services/service-mediation.png",
    accent: "text-accent-400",
    badge: "bg-accent-50 text-accent-400",
  },
  {
    title: "العاملة المقيمة",
    description: "عاملة منزلية مقيمة بعقد طويل الأمد لرعاية منزلك وأسرتك باحترافية وراحة بال دائمة",
    image: "/images/services/service-resident.png",
    accent: "text-brand-500",
    badge: "bg-brand-50 text-brand-600",
  },
  {
    title: "الزيارة بالساعة",
    description: "خدمة مرنة بالساعة تناسب احتياجاتك المؤقتة — اطلب العاملة وقتما تشاء وادفع حسب الساعات",
    image: "/images/services/service-hourly.png",
    accent: "text-green-500",
    badge: "bg-green-500/10 text-green-500",
  },
];

export default function ServicesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="services" ref={ref} className="relative py-16 sm:py-20 lg:py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-white" />
      <div className="absolute top-0 right-0 w-64 sm:w-80 h-64 sm:h-80 bg-brand-400/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-64 sm:w-80 h-64 sm:h-80 bg-accent-400/5 rounded-full blur-[120px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <span className="inline-block text-sm font-semibold text-brand-600 bg-brand-50 rounded-full px-4 py-1.5 mb-4">
            ماذا نقدم
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-brand-950 mb-4">
            خدماتنا <span className="gradient-text">المتميزة</span>
          </h2>
          <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            نقدم مجموعة شاملة من خدمات الاستقدام المنزلية بأعلى معايير الجودة والاحترافية
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 sm:gap-6">
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.12 }}
            >
              <article className="group relative h-full flex flex-col bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-brand-500/10 transition-all duration-500 hover:-translate-y-1.5">
                {/* Portrait Image */}
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover object-top group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                  />
                  {/* Gradient veil for legibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-950/70 via-brand-950/10 to-transparent" />
                  {/* Brand accent bar on hover */}
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-brand-gradient scale-x-0 group-hover:scale-x-100 origin-right transition-transform duration-500" />
                  {/* Title overlaid on image */}
                  <h3 className="absolute bottom-4 right-4 left-4 text-lg sm:text-xl font-bold text-white drop-shadow-md">
                    {service.title}
                  </h3>
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 p-5 sm:p-6">
                  <p className="text-gray-600 text-sm leading-relaxed mb-5 flex-1">
                    {service.description}
                  </p>
                  <a
                    href="#download"
                    className={`inline-flex items-center gap-2 text-sm font-semibold ${service.accent} group-hover:gap-3 transition-all duration-300`}
                  >
                    <span>اطلب الآن</span>
                    {/* RTL: chevron points right (back/forward in RTL flow) */}
                    <svg className="rtl:-scale-x-100" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </a>
                </div>
              </article>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
