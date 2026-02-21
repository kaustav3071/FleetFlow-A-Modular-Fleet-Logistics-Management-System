import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

let toastId = 0;

const icons = {
    success: { Icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-l-emerald-500' },
    error: { Icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-l-red-500' },
    warning: { Icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-l-amber-500' },
    info: { Icon: Info, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-l-blue-500' },
};

function ToastItem({ toast, onRemove }) {
    const [progress, setProgress] = useState(100);
    const duration = toast.duration || 4000;
    const config = icons[toast.type] || icons.info;

    useEffect(() => {
        const start = Date.now();
        const timer = setInterval(() => {
            const elapsed = Date.now() - start;
            const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
            setProgress(remaining);
            if (remaining <= 0) {
                clearInterval(timer);
                onRemove(toast.id);
            }
        }, 30);
        return () => clearInterval(timer);
    }, [toast.id, duration, onRemove]);

    const progressColors = {
        success: 'bg-emerald-500',
        error: 'bg-red-500',
        warning: 'bg-amber-500',
        info: 'bg-blue-500',
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 80, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`pointer-events-auto bg-white rounded-xl shadow-dropdown border border-surface-200 border-l-4 ${config.border}
                  px-4 py-3.5 flex items-start gap-3 min-w-[340px] max-w-[420px] relative overflow-hidden`}
        >
            <div className={`flex-shrink-0 p-1 rounded-lg ${config.bg}`}>
                <config.Icon className={`w-5 h-5 ${config.color}`} />
            </div>
            <div className="flex-1 min-w-0">
                {toast.title && (
                    <p className="text-sm font-semibold text-surface-900">{toast.title}</p>
                )}
                <p className={`text-sm text-surface-600 ${toast.title ? 'mt-0.5' : ''}`}>{toast.message}</p>
            </div>
            <button
                onClick={() => onRemove(toast.id)}
                className="flex-shrink-0 p-1 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors cursor-pointer"
            >
                <X className="w-4 h-4" />
            </button>
            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-surface-100">
                <motion.div
                    className={`h-full ${progressColors[toast.type] || 'bg-blue-500'} rounded-full`}
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: duration / 1000, ease: 'linear' }}
                />
            </div>
        </motion.div>
    );
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback((type, message, options = {}) => {
        const id = ++toastId;
        setToasts((prev) => [...prev.slice(-4), { id, type, message, ...options }]);
        return id;
    }, []);

    const toast = useCallback((message, options) => addToast('info', message, options), [addToast]);
    toast.success = (message, options) => addToast('success', message, options);
    toast.error = (message, options) => addToast('error', message, options);
    toast.warning = (message, options) => addToast('warning', message, options);
    toast.info = (message, options) => addToast('info', message, options);

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {toasts.map((t) => (
                        <ToastItem key={t.id} toast={t} onRemove={removeToast} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
}

// Singleton for use outside React components (like API interceptors)
let globalToast = null;
export function setGlobalToast(toastFn) {
    globalToast = toastFn;
}
export function getGlobalToast() {
    return globalToast;
}
