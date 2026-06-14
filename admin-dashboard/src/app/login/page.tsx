'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ApiError } from '@mawared/api-client';
import { useAuth } from '@/lib/auth';
import { Eye, EyeOff, Shield, Clock, Users } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const {
    ready,
    isAuthenticated,
    login,
    loginError,
    loginPending,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [requiresTotp, setRequiresTotp] = useState(false);
  const [shake, setShake] = useState(false);

  // If we land here already authenticated (e.g. browser back), bounce to dashboard.
  useEffect(() => {
    if (ready && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [ready, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginPending) return;

    try {
      await login({
        email,
        password,
        totp: requiresTotp ? totp : undefined,
      });
      router.replace('/dashboard');
    } catch (err) {
      // If the backend says TOTP is required, expose the TOTP input
      // and don't shake — the credentials were fine, just need MFA.
      if (err instanceof ApiError && err.code === 'AUTH_2FA_REQUIRED') {
        setRequiresTotp(true);
        return;
      }
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  const bullets = [
    { icon: Shield, text: 'إدارة كاملة للطلبات والعمالة' },
    { icon: Clock, text: 'متابعة لحظية لحالة الطلبات' },
    { icon: Users, text: 'إدارة العملاء والمدفوعات' },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Brand Side — full editorial panel on lg+, condensed banner on mobile */}
      <div className="lg:w-1/2 bg-gradient-to-br from-[#0F234C] via-[#2D5BE4] to-[#6599FE] text-white px-6 py-8 sm:p-8 lg:p-16 flex flex-col justify-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-96 h-96 max-w-full bg-[#ECA423]/10 rounded-full blur-[120px]" />
        <div className="relative z-10 w-full max-w-md mx-auto lg:mx-0">
          <Image
            src="/brand/logo-wide-white.svg"
            alt="موارد الدولية"
            width={200}
            height={48}
            priority
            className="h-9 sm:h-10 lg:h-12 w-auto mb-6"
          />
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-2 sm:mb-3">موارد الدولية</h1>
          <p className="text-white/60 text-base sm:text-lg mb-0 lg:mb-10">لوحة تحكم إدارة العمليات</p>
          {/* Feature bullets are editorial detail — keep them off small screens */}
          <div className="hidden lg:block space-y-4">
            {bullets.map((b) => (
              <div key={b.text} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0"><b.icon size={20} /></div>
                <span className="text-white/80">{b.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Side */}
      <div className="lg:w-1/2 bg-white px-6 py-10 sm:p-8 lg:p-16 flex items-center justify-center">
        <div className={`w-full max-w-md ${shake ? 'animate-shake' : ''}`}>
          <Image
            src="/brand/logo-wide.svg"
            alt="موارد الدولية"
            width={200}
            height={48}
            priority
            className="h-9 sm:h-10 w-auto mb-8"
          />
          <h2 className="text-2xl font-black text-gray-900 mb-1">مرحباً بعودتك</h2>
          <p className="text-gray-500 mb-8">لوحة تحكم موارد الدولية</p>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                البريد الإلكتروني
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@mawared.sa"
                dir="ltr"
                disabled={loginPending}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#2D5BE4]/30 focus:border-[#2D5BE4] transition-all text-left disabled:opacity-60"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loginPending}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#2D5BE4]/30 focus:border-[#2D5BE4] transition-all pe-12 disabled:opacity-60"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {requiresTotp && (
              <div>
                <label htmlFor="totp" className="block text-sm font-semibold text-gray-700 mb-2">
                  رمز التحقق الثنائي (TOTP)
                </label>
                <input
                  id="totp"
                  name="totp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  autoComplete="one-time-code"
                  value={totp}
                  onChange={(e) => setTotp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  dir="ltr"
                  disabled={loginPending}
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#2D5BE4]/30 focus:border-[#2D5BE4] transition-all text-left tracking-widest text-lg disabled:opacity-60"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  افتح تطبيق المصادقة وأدخل الرمز المكوّن من 6 أرقام.
                </p>
              </div>
            )}

            {loginError && (
              <p
                role="alert"
                className="text-red-700 text-sm font-medium bg-red-50 border border-red-100 px-4 py-2 rounded-lg"
              >
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={loginPending}
              aria-busy={loginPending}
              className="w-full py-3.5 rounded-xl bg-[#2D5BE4] hover:bg-[#0F234C] text-white font-bold text-base shadow-lg shadow-[#2D5BE4]/25 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loginPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  جاري الدخول...
                </>
              ) : (
                'دخول'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-8">
            © {new Date().getFullYear()} شركة موارد الدولية للإستقدام
          </p>
        </div>
      </div>
    </div>
  );
}
