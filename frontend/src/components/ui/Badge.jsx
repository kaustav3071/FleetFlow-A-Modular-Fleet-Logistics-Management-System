const colorMap = {
  green: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
  red: 'bg-red-500/15 text-red-400 ring-1 ring-red-500/30',
  yellow: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30',
  blue: 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30',
  purple: 'bg-purple-500/15 text-purple-400 ring-1 ring-purple-500/30',
  orange: 'bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30',
  gray: 'bg-surface-500/15 text-surface-400 ring-1 ring-surface-500/30',
  cyan: 'bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/30',
};

const sizes = {
  xs: 'px-1.5 py-0.5 text-[10px]',
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
};

export default function Badge({ children, color = 'gray', size = 'sm', dot = false, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full uppercase tracking-wide 
      ${colorMap[color] || colorMap.gray} ${sizes[size]} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full bg-current`} />}
      {children}
    </span>
  );
}
