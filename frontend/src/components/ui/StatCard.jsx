import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatNumber } from '../../utils/formatters.js';

export default function StatCard({ title, value, icon: Icon, trend, suffix = '', prefix = '', color = 'brand', index = 0 }) {
  const colors = {
    brand: { bg: 'bg-brand-500/10', icon: 'text-brand-400', ring: 'ring-brand-500/20' },
    emerald: { bg: 'bg-emerald-500/10', icon: 'text-emerald-400', ring: 'ring-emerald-500/20' },
    blue: { bg: 'bg-blue-500/10', icon: 'text-blue-400', ring: 'ring-blue-500/20' },
    red: { bg: 'bg-red-500/10', icon: 'text-red-400', ring: 'ring-red-500/20' },
    purple: { bg: 'bg-purple-500/10', icon: 'text-purple-400', ring: 'ring-purple-500/20' },
    orange: { bg: 'bg-orange-500/10', icon: 'text-orange-400', ring: 'ring-orange-500/20' },
  };

  const c = colors[color] || colors.brand;
  const trendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-red-400' : 'text-surface-500';
  const TrendIcon = trendIcon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="glass-card glass-card-hover p-5 group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${c.bg} ring-1 ${c.ring}`}>
          {Icon && <Icon className={`w-5 h-5 ${c.icon}`} />}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
            <TrendIcon className="w-3.5 h-3.5" />
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <p className="stat-number">
        {prefix}{typeof value === 'number' ? formatNumber(value) : value}{suffix}
      </p>
      <p className="text-xs text-surface-500 mt-1 uppercase tracking-wider">{title}</p>
    </motion.div>
  );
}
