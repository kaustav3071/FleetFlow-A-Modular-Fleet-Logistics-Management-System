import { Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import ProfileDropdown from './ProfileDropdown.jsx';

export default function Navbar() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-xl border-b border-surface-200 flex items-center justify-between px-6">
      <div>
        <h1 className="text-sm font-medium text-surface-500">
          Welcome back, <span className="text-surface-900 font-semibold">{user?.name?.split(' ')[0]}</span>
        </h1>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Notification bell */}
        <button className="p-2 rounded-xl text-surface-400 hover:text-surface-700 hover:bg-surface-100 transition-all duration-200 cursor-pointer relative group">
          <Bell className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
        </button>

        <div className="w-px h-6 bg-surface-200 mx-1" />

        {/* Profile Dropdown */}
        <ProfileDropdown />
      </div>
    </header>
  );
}
