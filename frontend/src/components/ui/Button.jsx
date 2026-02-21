import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const variants = {
  primary: 'bg-brand-500 hover:bg-brand-600 text-white shadow-sm shadow-brand-500/20 hover:shadow-md hover:shadow-brand-500/30',
  secondary: 'bg-surface-100 hover:bg-surface-200 text-surface-700 border border-surface-200',
  danger: 'bg-red-500 hover:bg-red-600 text-white shadow-sm shadow-red-500/20',
  success: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-500/20',
  ghost: 'bg-transparent hover:bg-surface-100 text-surface-600',
  outline: 'border border-brand-500 text-brand-600 hover:bg-brand-50',
};

const sizes = {
  xs: 'px-2.5 py-1 text-xs rounded-md',
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-2.5 text-base rounded-xl',
};

const Button = forwardRef(({ variant = 'primary', size = 'md', loading, disabled, icon: Icon, iconRight: IconRight, children, className = '', ...props }, ref) => {
  return (
    <motion.button
      ref={ref}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 
        disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer
        ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : Icon && <Icon className="w-4 h-4" />}
      {children}
      {IconRight && !loading && <IconRight className="w-4 h-4" />}
    </motion.button>
  );
});

Button.displayName = 'Button';
export default Button;
