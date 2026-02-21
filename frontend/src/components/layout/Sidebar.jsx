import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Truck, Users, Route, Wrench, Receipt,
  BarChart3, ChevronLeft, ChevronRight, Zap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['manager', 'dispatcher', 'safety_officer', 'analyst'] },
  { path: '/vehicles', label: 'Vehicles', icon: Truck, roles: ['manager', 'dispatcher', 'safety_officer'] },
  { path: '/drivers', label: 'Drivers', icon: Users, roles: ['manager', 'dispatcher', 'safety_officer'] },
  { path: '/trips', label: 'Trips', icon: Route, roles: ['manager', 'dispatcher'] },
  { path: '/maintenance', label: 'Maintenance', icon: Wrench, roles: ['manager', 'safety_officer'] },
  { path: '/expenses', label: 'Expenses', icon: Receipt, roles: ['manager', 'analyst'] },
  { path: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['manager', 'analyst', 'safety_officer'] },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, hasRole } = useAuth();

  const filteredItems = navItems.filter(item =>
    item.roles.some(role => hasRole(role))
  );

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-screen bg-white border-r border-surface-200 z-40 flex flex-col shadow-sm"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-surface-200">
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-md shadow-brand-500/20">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="text-lg font-bold bg-gradient-to-r from-brand-600 to-brand-500 bg-clip-text text-transparent whitespace-nowrap"
            >
              FleetFlow
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
              ${isActive
                ? 'bg-brand-50 text-brand-700 font-medium'
                : 'text-surface-500 hover:text-surface-800 hover:bg-surface-50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-brand-500"
                    transition={{ duration: 0.3 }}
                  />
                )}
                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-brand-600' : ''}`} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div className="px-3 py-3 border-t border-surface-200">
        {!collapsed && user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-3 py-2 rounded-xl bg-surface-50 mb-2"
          >
            <p className="text-sm font-medium text-surface-800 truncate">{user.name}</p>
            <p className="text-xs text-surface-500 capitalize">{user.role?.replace('_', ' ')}</p>
          </motion.div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 p-2 rounded-xl text-surface-400 hover:text-surface-700 hover:bg-surface-100 transition-colors cursor-pointer"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span className="text-xs">Collapse</span>}
        </button>
      </div>
    </motion.aside>
  );
}
