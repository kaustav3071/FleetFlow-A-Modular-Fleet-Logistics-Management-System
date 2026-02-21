import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings, LogOut, ChevronDown, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function ProfileDropdown() {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const handleOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/auth');
    };

    const roleBadge = {
        manager: { label: 'Manager', color: 'bg-brand-100 text-brand-700' },
        dispatcher: { label: 'Dispatcher', color: 'bg-blue-100 text-blue-700' },
        safety_officer: { label: 'Safety Officer', color: 'bg-amber-100 text-amber-700' },
        analyst: { label: 'Analyst', color: 'bg-purple-100 text-purple-700' },
    };

    const badge = roleBadge[user?.role] || roleBadge.manager;

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-surface-100 transition-colors cursor-pointer"
            >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-surface-800 leading-none">{user?.name?.split(' ')[0]}</p>
                    <p className="text-xs text-surface-500 mt-0.5 capitalize">{user?.role?.replace('_', ' ')}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-surface-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-dropdown border border-surface-200 overflow-hidden z-50"
                    >
                        {/* User Info Header */}
                        <div className="px-4 py-4 bg-surface-50 border-b border-surface-200">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-base font-bold shadow-sm">
                                    {user?.name?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-surface-900 truncate">{user?.name}</p>
                                    <p className="text-xs text-surface-500 truncate">{user?.email}</p>
                                </div>
                            </div>
                            <div className="mt-2.5">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                                    <Shield className="w-3 h-3" />
                                    {badge.label}
                                </span>
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-1.5">
                            <button
                                onClick={() => { setOpen(false); navigate('/profile'); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 transition-all duration-200 cursor-pointer group"
                            >
                                <User className="w-4 h-4 text-surface-400 transition-colors group-hover:text-brand-500" />
                                Edit Profile
                            </button>
                            <button
                                onClick={() => { setOpen(false); navigate('/profile'); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 transition-all duration-200 cursor-pointer group"
                            >
                                <Settings className="w-4 h-4 text-surface-400 transition-all duration-200 group-hover:text-brand-500 group-hover:rotate-90" />
                                Account Settings
                            </button>
                        </div>

                        {/* Logout */}
                        <div className="border-t border-surface-200 py-1.5">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            >
                                <LogOut className="w-4 h-4" />
                                Sign Out
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
