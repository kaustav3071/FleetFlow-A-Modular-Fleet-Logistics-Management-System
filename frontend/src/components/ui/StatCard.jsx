import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatNumber } from '../../utils/formatters.js';

export default function StatCard({ title, value, icon: Icon, trend, suffix = '', prefix = '', color = 'brand', index = 0 }) {
  const colors = {
    brand: { bg: 'bg-brand-50', icon: 'text-brand-600', ring: 'ring-brand-200', accent: 'border-l-brand-500' },
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', ring: 'ring-emerald-200', accent: 'border-l-emerald-500' },
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', ring: 'ring-blue-200', accent: 'border-l-blue-500' },
    red: { bg: 'bg-red-50', icon: 'text-red-600', ring: 'ring-red-200', accent: 'border-l-red-500' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', ring: 'ring-purple-200', accent: 'border-l-purple-500' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-600', ring: 'ring-orange-200', accent: 'border-l-orange-500' },
    cyan: { bg: 'bg-cyan-50', icon: 'text-cyan-600', ring: 'ring-cyan-200', accent: 'border-l-cyan-500' },
  };

  const c = colors[color] || colors.brand;
  const trendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-red-600' : 'text-surface-400';
  const trendBg = trend > 0 ? 'bg-emerald-50' : trend < 0 ? 'bg-red-50' : 'bg-surface-100';
  const TrendIcon = trendIcon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className={`glass-card glass-card-hover p-5 group border-l-4 ${c.accent}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${c.bg} ring-1 ${c.ring}`}>
          {Icon && <Icon className={`w-5 h-5 ${c.icon}`} />}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trendColor} ${trendBg} px-2 py-0.5 rounded-full`}>
            <TrendIcon className="w-3.5 h-3.5" />
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <p className="stat-number">
        {prefix}{typeof value === 'number' ? formatNumber(value) : value}{suffix}
      </p>
      <p className="text-xs text-surface-500 mt-1 uppercase tracking-wider font-medium">{title}</p>
    </motion.div>
  );
}
