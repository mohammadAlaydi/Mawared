'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Eye, EyeOff, Shield, Clock, Users } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    const success = login(username, password);
    if (success) {
      router.push('/dashboard');
    } else {
      setLoading(false);
      setError('بيانات الدخول غير صحيحة');
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
      {/* Brand Side */}
      <div className="lg:w-1/2 bg-gradient-to-br from-[#073D34] via-[#0B5E50] to-[#1A7A69] text-white p-8 lg:p-16 flex flex-col justify-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#C9A84C]/10 rounded-full blur-[120px]" />
        <div className="relative z-10 max-w-md mx-auto lg:mx-0">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-3xl font-black mb-6 border border-white/20">م</div>
          <h1 className="text-3xl lg:text-4xl font-black mb-3">موارد الدولية</h1>
          <p className="text-white/60 text-lg mb-10">لوحة تحكم إدارة العمليات</p>
          <div className="space-y-4">
            {bullets.map((b, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><b.icon size={20} /></div>
                <span className="text-white/80">{b.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Side */}
      <div className="lg:w-1/2 bg-white p-8 lg:p-16 flex items-center justify-center">
        <div className={`w-full max-w-md ${shake ? 'animate-shake' : ''}`}>
          <h2 className="text-2xl font-black text-gray-900 mb-1">مرحباً بعودتك</h2>
          <p className="text-gray-500 mb-8">لوحة تحكم موارد الدولية</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">اسم المستخدم</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="admin" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0B5E50]/30 focus:border-[#0B5E50] transition-all" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">كلمة المرور</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0B5E50]/30 focus:border-[#0B5E50] transition-all pl-12" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#0B5E50] focus:ring-[#0B5E50]" />
              <span className="text-sm text-gray-600">تذكرني</span>
            </label>

            {error && <p className="text-red-600 text-sm font-medium bg-red-50 px-4 py-2 rounded-lg">{error}</p>}

            <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl bg-[#0B5E50] hover:bg-[#073D34] text-white font-bold text-base shadow-lg shadow-[#0B5E50]/25 transition-all disabled:opacity-70 flex items-center justify-center gap-2">
              {loading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري الدخول...</> : 'دخول'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-8">© {new Date().getFullYear()} شركة موارد الدولية للإستقدام</p>
        </div>
      </div>
    </div>
  );
}
