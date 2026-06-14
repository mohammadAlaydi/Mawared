"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";

const faqs = [
  {
    question: "ما هي خطوات الاستقدام عبر موارد الدولية؟",
    answer:
      "تبدأ العملية باختيار الخدمة المطلوبة، ثم تصفح الملفات الشخصية للعمالة المتاحة، بعدها أكمل الطلب بإدخال بياناتك وتحديد العنوان، وأخيراً تابع طلبك حتى وصول العامل. كل ذلك يتم عبر التطبيق بخطوات بسيطة.",
  },
  {
    question: "هل العمالة مدربة ومؤهلة؟",
    answer:
      "نعم، جميع العمالة لدينا تخضع لبرنامج تدريب وتأهيل شامل قبل الوصول إليك. يشمل التدريب المهارات المنزلية، التواصل، والسلامة المهنية. كما نجري فحوصات صحية وأمنية شاملة.",
  },
  {
    question: "ما هي سياسة الاستبدال والضمان؟",
    answer:
      "نوفر فترة ضمان تتراوح بين ١٤ إلى ٦٠ يوم حسب الباقة المختارة. خلال فترة الضمان، يمكنك طلب استبدال العامل مجاناً في حال عدم الرضا عن الأداء. نلتزم بتقديم أفضل تجربة ممكنة.",
  },
  {
    question: "كم تستغرق عملية الاستقدام؟",
    answer:
      "تختلف المدة حسب نوع الخدمة والجنسية المطلوبة. بشكل عام، يمكن إتمام عملية الاستقدام خلال ٤٨ ساعة للعمالة المتوفرة محلياً، وتصل إلى ٣٠-٩٠ يوم للاستقدام من الخارج.",
  },
  {
    question: "ما هي الجنسيات المتاحة؟",
    answer:
      "نوفر عمالة من أكثر من ١٥ جنسية مختلفة تشمل الفلبين، إندونيسيا، بنغلاديش، الهند، إثيوبيا، كينيا، أوغندا، وغيرها. يمكنك تحديد الجنسية المفضلة عند تقديم الطلب.",
  },
  {
    question: "هل يمكنني إلغاء الطلب أو تعديله؟",
    answer:
      "نعم، يمكنك تعديل أو إلغاء الطلب في أي وقت قبل بدء إجراءات الاستقدام. تطبق شروط الإلغاء والاسترداد حسب سياسة الشركة الموضحة في الشروط والأحكام.",
  },
];

function FAQItem({
  faq,
  isOpen,
  onClick,
  index,
  inView,
}: {
  faq: (typeof faqs)[0];
  isOpen: boolean;
  onClick: () => void;
  index: number;
  inView: boolean;
}) {
  const panelId = `faq-panel-${index}`;
  const buttonId = `faq-button-${index}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
        isOpen
          ? "bg-brand-50 border-brand-200 shadow-md"
          : "bg-white border-gray-100 hover:border-brand-200 hover:shadow-sm"
      }`}
    >
      <button
        id={buttonId}
        type="button"
        onClick={onClick}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-3 p-4 text-right sm:gap-4 sm:p-5"
      >
        <h3
          className={`flex-1 text-sm font-bold transition-colors sm:text-base ${
            isOpen ? "text-brand-700" : "text-gray-900"
          }`}
        >
          {faq.question}
        </h3>
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
            isOpen
              ? "bg-brand-500 text-white rotate-180"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>
      <motion.div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        initial={false}
        animate={{
          height: isOpen ? "auto" : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <p className="px-4 pb-4 text-sm leading-relaxed text-gray-600 sm:px-5 sm:pb-5">
          {faq.answer}
        </p>
      </motion.div>
    </motion.div>
  );
}

export default function FAQSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" ref={ref} className="relative py-16 sm:py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-surface-100 to-white" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-8 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-14"
        >
          <span className="inline-block text-sm font-semibold text-brand-600 bg-brand-50 rounded-full px-4 py-1.5 mb-4">
            أسئلة شائعة
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-brand-950 mb-4">
            لديك <span className="gradient-text">سؤال؟</span>
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            إليك إجابات أهم الأسئلة التي تهم عملاءنا
          </p>
        </motion.div>

        {/* FAQ List */}
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <FAQItem
              key={faq.question}
              faq={faq}
              isOpen={openIndex === i}
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              index={i}
              inView={isInView}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
