import { motion } from 'framer-motion';

export default function Card({ children, hover = false, className = '', ...props }) {
  const Component = hover ? motion.div : 'div';
  const hoverProps = hover
    ? { whileHover: { y: -2, transition: { duration: 0.2 } } }
    : {};

  return (
    <Component
      className={`glass-card ${hover ? 'glass-card-hover' : ''} ${className}`}
      {...hoverProps}
      {...props}
    >
      {children}
    </Component>
  );
}
