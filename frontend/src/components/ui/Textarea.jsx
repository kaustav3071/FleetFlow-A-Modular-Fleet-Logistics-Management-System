import { forwardRef } from 'react';
import { motion } from 'framer-motion';

const Textarea = forwardRef(({ label, error, className = '', ...props }, ref) => {
  return (
    <div className="space-y-1.5">
      {label && <label className="label">{label}</label>}
      <textarea
        ref={ref}
        className={`input-base w-full min-h-[100px] resize-y ${error ? 'border-red-400 focus:ring-red-500/20' : ''} ${className}`}
        {...props}
      />
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-500 font-medium"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';
export default Textarea;
