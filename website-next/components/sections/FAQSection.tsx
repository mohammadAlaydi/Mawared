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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <button
        onClick={onClick}
        className={`w-full text-right rounded-2xl border transition-all duration-300 ${
          isOpen
            ? "bg-brand-50 border-brand-200 shadow-md"
            : "bg-white border-gray-100 hover:border-brand-200 hover:shadow-sm"
        }`}
      >
        <div className="flex items-center justify-between p-5 gap-4">
          <h3
            className={`font-bold text-base transition-colors ${
              isOpen ? "text-brand-700" : "text-gray-900"
            }`}
          >
            {faq.question}
          </h3>
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
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
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
        <motion.div
          initial={false}
          animate={{
            height: isOpen ? "auto" : 0,
            opacity: isOpen ? 1 : 0,
          }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <p className="px-5 pb-5 text-sm text-gray-600 leading-relaxed">
            {faq.answer}
          </p>
        </motion.div>
      </button>
    </motion.div>
  );
}

export default function FAQSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" ref={ref} className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-surface-100 to-white" />

      <div className="relative max-w-3xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="inline-block text-sm font-semibold text-brand-600 bg-brand-50 rounded-full px-4 py-1.5 mb-4">
            أسئلة شائعة
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-brand-950 mb-4">
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
              key={i}
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
