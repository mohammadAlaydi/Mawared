"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success" }
  | { status: "error"; message: string };

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

const SERVICE_TYPES = [
  "عاملة منزلية",
  "سائق خاص",
  "مربية أطفال",
  "رعاية مسنين",
  "أخرى",
] as const;

// E.164 normalizer: strip spaces/dashes/parens, ensure leading +.
// Backend regex: /^\+[1-9][0-9]{6,14}$/
function normalizePhoneToE164(raw: string): string {
  const cleaned = raw.replace(/[\s\-()]/g, "");
  if (!cleaned) return "";
  // If user typed without +, assume Saudi local prefix.
  if (!cleaned.startsWith("+")) {
    // Saudi mobile starting with 0 → +966...
    if (cleaned.startsWith("0")) return `+966${cleaned.slice(1)}`;
    return `+${cleaned}`;
  }
  return cleaned;
}

function isValidE164(value: string): boolean {
  return /^\+[1-9][0-9]{6,14}$/.test(value);
}

export default function ContactSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [message, setMessage] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>({
    status: "idle",
  });
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear any pending success-banner timer on unmount to avoid setting state
  // on an unmounted component.
  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  const resetForm = () => {
    setFullName("");
    setPhone("");
    setEmail("");
    setServiceType("");
    setMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitState.status === "submitting") return;

    // ---- Client-side validation ----
    const trimmedName = fullName.trim();
    if (trimmedName.length < 2 || trimmedName.length > 120) {
      setSubmitState({
        status: "error",
        message: "الرجاء إدخال اسم صحيح (2–120 حرفاً).",
      });
      return;
    }

    const phoneE164 = normalizePhoneToE164(phone);
    if (!isValidE164(phoneE164)) {
      setSubmitState({
        status: "error",
        message: "رقم الجوال غير صحيح. مثال: +966512345678",
      });
      return;
    }

    const trimmedEmail = email.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setSubmitState({
        status: "error",
        message: "البريد الإلكتروني غير صحيح.",
      });
      return;
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage.length < 2 || trimmedMessage.length > 2000) {
      setSubmitState({
        status: "error",
        message: "الرجاء كتابة رسالة (2–2000 حرف).",
      });
      return;
    }

    if (!API_BASE_URL) {
      // No backend configured — fail loudly in dev rather than silently drop the lead.
      // eslint-disable-next-line no-console
      console.error(
        "[contact-form] NEXT_PUBLIC_API_BASE_URL is not set; cannot submit lead.",
      );
      setSubmitState({
        status: "error",
        message: "تعذّر إرسال الرسالة. الرجاء المحاولة لاحقاً.",
      });
      return;
    }

    // Service type isn't a schema field — fold it into the message so it isn't lost.
    const finalMessage = serviceType
      ? `نوع الخدمة: ${serviceType}\n\n${trimmedMessage}`
      : trimmedMessage;

    const payload: Record<string, string> = {
      fullName: trimmedName,
      phone: phoneE164,
      message: finalMessage,
      source: "website-contact-form",
    };
    if (trimmedEmail) payload.email = trimmedEmail;

    setSubmitState({ status: "submitting" });

    try {
      const idempotencyKey =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const res = await fetch(`${API_BASE_URL}/v1/leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSubmitState({ status: "success" });
        resetForm();
        // Reset the success banner after a few seconds so the form is usable again.
        if (successTimerRef.current) clearTimeout(successTimerRef.current);
        successTimerRef.current = setTimeout(
          () => setSubmitState({ status: "idle" }),
          5000,
        );
        return;
      }

      // Specific handling for the throttle (5/IP/10min).
      if (res.status === 429) {
        setSubmitState({
          status: "error",
          message:
            "لقد أرسلت طلبات كثيرة. الرجاء المحاولة بعد قليل.",
        });
        return;
      }

      // Try to surface the backend's RFC 7807 problem+json message.
      let serverMessage = "";
      try {
        const data: unknown = await res.json();
        if (data && typeof data === "object" && "detail" in data) {
          const detail = (data as { detail?: unknown }).detail;
          if (typeof detail === "string") serverMessage = detail;
        }
      } catch {
        // ignore JSON parse errors
      }

      setSubmitState({
        status: "error",
        message:
          serverMessage ||
          "حدث خطأ أثناء إرسال الرسالة. الرجاء المحاولة لاحقاً.",
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[contact-form] submit failed", err);
      setSubmitState({
        status: "error",
        message: "تعذّر الاتصال بالخادم. الرجاء التحقق من اتصالك بالإنترنت.",
      });
    }
  };

  const isSubmitting = submitState.status === "submitting";

  return (
    <section id="contact-form" ref={ref} className="relative py-16 sm:py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-white" />
      <div className="pointer-events-none absolute top-0 left-0 w-80 h-80 max-w-[80vw] bg-brand-300/5 rounded-full blur-[150px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Info Side */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div>
              <span className="inline-block text-sm font-semibold text-brand-600 bg-brand-50 rounded-full px-4 py-1.5 mb-4">
                تواصل معنا
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-brand-950 mb-4">
                نسعد <span className="gradient-text">بخدمتك</span>
              </h2>
              <p className="text-gray-600 leading-relaxed">
                لا تتردد في التواصل معنا لأي استفسار أو طلب. فريقنا جاهز
                لمساعدتك على مدار الساعة.
              </p>
            </div>

            {/* Contact Cards */}
            <div className="space-y-4">
              {[
                {
                  icon: (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  ),
                  title: "اتصل بنا",
                  value: "+966 11 234 5678",
                  href: "tel:+966112345678",
                },
                {
                  icon: (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  ),
                  title: "البريد الإلكتروني",
                  value: "info@mawared.sa",
                  href: "mailto:info@mawared.sa",
                },
                {
                  icon: (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  ),
                  title: "ساعات العمل",
                  value: "الأحد - الخميس | ٨ ص - ٥ م",
                  href: null,
                },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: 20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-surface-50 border border-gray-100 hover:border-brand-200 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">{item.title}</p>
                    {item.href ? (
                      <a href={item.href} className="font-semibold text-gray-900 hover:text-brand-600 transition-colors" dir={item.title === "اتصل بنا" ? "ltr" : undefined}>
                        {item.value}
                      </a>
                    ) : (
                      <p className="font-semibold text-gray-900">{item.value}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Form Side */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <form
              onSubmit={handleSubmit}
              noValidate
              className="bg-surface-50 rounded-3xl p-5 sm:p-8 border border-gray-100 shadow-sm space-y-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 mb-2">
                    الاسم الكامل
                  </label>
                  <input
                    id="contact-name"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    placeholder="أدخل اسمك"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={isSubmitting}
                    minLength={2}
                    maxLength={120}
                    className="w-full min-h-[44px] px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all disabled:opacity-60"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="contact-phone" className="block text-sm font-medium text-gray-700 mb-2">
                    رقم الجوال
                  </label>
                  <input
                    id="contact-phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+966512345678"
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full min-h-[44px] px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-left disabled:opacity-60"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-2">
                  البريد الإلكتروني
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="example@email.com"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full min-h-[44px] px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-left disabled:opacity-60"
                />
              </div>

              <div>
                <label htmlFor="contact-service" className="block text-sm font-medium text-gray-700 mb-2">
                  نوع الخدمة
                </label>
                <select
                  id="contact-service"
                  name="serviceType"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full min-h-[44px] px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all disabled:opacity-60"
                >
                  <option value="">اختر الخدمة</option>
                  {SERVICE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 mb-2">
                  رسالتك
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={4}
                  placeholder="اكتب استفسارك هنا..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={isSubmitting}
                  minLength={2}
                  maxLength={2000}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all resize-none disabled:opacity-60"
                  required
                />
              </div>

              {submitState.status === "error" && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {submitState.message}
                </div>
              )}

              {submitState.status === "success" && (
                <div
                  role="status"
                  className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-600"
                >
                  ✓ تم استلام رسالتك بنجاح. سنتواصل معك قريباً.
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                className="w-full py-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-base shadow-lg shadow-brand-600/25 hover:shadow-brand-700/30 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {isSubmitting ? "جارٍ الإرسال..." : "أرسل الرسالة"}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
