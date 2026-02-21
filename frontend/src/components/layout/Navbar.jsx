import { useAuth } from '../../context/AuthContext.jsx';
import ProfileDropdown from './ProfileDropdown.jsx';
import NotificationDropdown from './NotificationDropdown.jsx';

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
        {/* Notification bell with dropdown */}
        <NotificationDropdown />

        <div className="w-px h-6 bg-surface-200 mx-1" />

        {/* Profile Dropdown */}
        <ProfileDropdown />
      </div>
    </header>
  );
}
