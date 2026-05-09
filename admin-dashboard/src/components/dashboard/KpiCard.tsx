import { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  change: string;
  changeType: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  borderColor: string;
}

export default function KpiCard({ title, value, change, changeType, icon: Icon, iconColor, iconBg, borderColor }: KpiCardProps) {
  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-r-4 ${borderColor} hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon size={20} className={iconColor} />
        </div>
      </div>
      <p className="text-2xl font-black text-gray-900 mb-1">{typeof value === 'number' ? value.toLocaleString('ar-SA') : value}</p>
      <div className="flex items-center gap-1">
        {changeType === 'up' && <TrendingUp size={14} className="text-green-600" />}
        {changeType === 'down' && <TrendingDown size={14} className="text-red-600" />}
        {changeType === 'neutral' && <Minus size={14} className="text-gray-400" />}
        <span className={`text-xs font-medium ${changeType === 'up' ? 'text-green-600' : changeType === 'down' ? 'text-red-600' : 'text-gray-400'}`}>{change}</span>
      </div>
    </div>
  );
}
