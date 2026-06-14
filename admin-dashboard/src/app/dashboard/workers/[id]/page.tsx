'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError } from '@mawared/api-client';
import {
  ArrowRight,
  Briefcase,
  Calendar,
  FileText,
  Globe,
  Star,
  User,
} from 'lucide-react';

import { formatDate, formatMoneyMinor } from '@/lib/utils';
import { useAdminWorker } from '@/lib/hooks/use-admin-workers';
import {
  AVAILABILITY_COLORS,
  AVAILABILITY_LABELS,
  PROFESSION_COLORS,
  PROFESSION_LABELS,
} from '@/lib/worker-display';

/**
 * Worker profile page — real backend version.
 *
 * Renders only fields the backend actually has. The original mock UI had
 * a handful of UX-only fields (religion, marital status, height, weight,
 * work history) that aren't in the schema; those are dropped here. If
 * we need them, add them to the Prisma model + Worker DTO first.
 */
export default function WorkerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: worker, isPending, isError, error, refetch } = useAdminWorker(id);

  if (isPending) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-gray-200 border-t-[#2D5BE4] animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-xl mx-auto bg-red-50 border border-red-100 rounded-2xl p-6 mt-12 text-center">
        <p className="text-red-700 font-semibold mb-2">تعذّر تحميل ملف العامل.</p>
        <p className="text-red-600 text-sm mb-4">
          {error instanceof ApiError
            ? `${error.code}: ${error.detail}`
            : error instanceof Error
              ? error.message
              : 'خطأ غير معروف'}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700"
          >
            إعادة المحاولة
          </button>
          <button
            onClick={() => router.push('/dashboard/workers')}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200"
          >
            رجوع
          </button>
        </div>
      </div>
    );
  }

  if (!worker) return null;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <button
        onClick={() => router.push('/dashboard/workers')}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#2D5BE4] mb-4"
      >
        <ArrowRight size={14} />
        رجوع للقائمة
      </button>

      {/* Hero card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
        <div className="flex items-start gap-6 flex-wrap">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#2D5BE4] to-[#6599FE] flex items-center justify-center text-white shrink-0">
            <User size={40} />
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-2xl font-black text-gray-900">
                {worker.nationality?.flagEmoji} {worker.fullNameAr}
              </h1>
              <span
                className={`px-2 py-1 rounded-lg text-xs font-semibold ${AVAILABILITY_COLORS[worker.availability]}`}
              >
                {AVAILABILITY_LABELS[worker.availability]}
              </span>
            </div>
            {worker.fullNameEn && (
              <p className="text-gray-500 text-sm mb-3" dir="ltr">
                {worker.fullNameEn}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <span
                className={`px-3 py-1 rounded-lg text-xs font-medium border ${PROFESSION_COLORS[worker.profession]}`}
              >
                {PROFESSION_LABELS[worker.profession]}
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium bg-yellow-50 text-yellow-700">
                <Star size={12} />
                {Number(worker.rating).toFixed(1)} ({worker.reviewCount} تقييم)
              </span>
            </div>
          </div>
          <div className="text-end">
            <p className="text-xs text-gray-500 mb-0.5">الراتب الشهري</p>
            <p className="text-2xl font-black text-[#2D5BE4]">
              {formatMoneyMinor(worker.monthlySalaryMinor, worker.currency)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Profile facts */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-lg font-bold mb-4">المعلومات الأساسية</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Fact icon={User} label="العمر" value={`${worker.ageYears} سنة`} />
            <Fact
              icon={Briefcase}
              label="الخبرة"
              value={`${worker.experienceYears} سنوات`}
            />
            <Fact icon={Globe} label="الجنسية" value={worker.nationality?.nameAr ?? '—'} />
          </div>

          <h3 className="text-md font-bold mt-6 mb-2">النبذة</h3>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {worker.bioAr || <span className="text-gray-400">لا توجد نبذة</span>}
          </p>
          {worker.bioEn && (
            <p
              className="text-sm text-gray-500 leading-relaxed whitespace-pre-wrap mt-3"
              dir="ltr"
            >
              {worker.bioEn}
            </p>
          )}

          {/* Languages */}
          {worker.languages && worker.languages.length > 0 && (
            <>
              <h3 className="text-md font-bold mt-6 mb-2">اللغات</h3>
              <div className="flex flex-wrap gap-2">
                {worker.languages.map((l, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700"
                  >
                    {l.language.nameAr}
                    <span className="text-[10px] text-blue-500">({l.proficiency})</span>
                  </span>
                ))}
              </div>
            </>
          )}

          {/* Skills */}
          {worker.skills && worker.skills.length > 0 && (
            <>
              <h3 className="text-md font-bold mt-6 mb-2">المهارات</h3>
              <div className="flex flex-wrap gap-2">
                {worker.skills.map((s, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700"
                  >
                    {s.skill.nameAr}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Side meta */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-lg font-bold mb-4">سجل النظام</h2>
          <div className="space-y-3">
            <Fact icon={Calendar} label="رقم العامل" value={worker.id.slice(0, 8)} mono />
          </div>
        </div>
      </div>

      {/* Documents — placeholder; backend has the relation but file URLs need a separate /v1/files/{id}/url lookup */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mt-4">
        <h2 className="text-lg font-bold mb-4">المستندات</h2>
        <div className="text-center text-sm text-gray-400 py-8">
          <FileText className="mx-auto mb-2 text-gray-300" size={32} />
          عرض المستندات يتطلّب جلب الروابط المؤقتة عبر <code>/v1/files</code> — قيد التطوير.
        </div>
      </div>
    </div>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
      <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-[#2D5BE4]">
        <Icon size={16} />
      </div>
      <div>
        <p className="text-[11px] text-gray-500">{label}</p>
        <p className={`text-sm font-semibold ${mono ? 'font-mono text-[#2D5BE4]' : ''}`}>
          {value}
        </p>
      </div>
    </div>
  );
}
