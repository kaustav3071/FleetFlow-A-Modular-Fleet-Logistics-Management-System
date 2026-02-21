import { Download, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { analyticsAPI } from '../../api/analytics.js';
import { useToast } from '../ui/Toast.jsx';
import ProfileDropdown from './ProfileDropdown.jsx';

export default function Navbar() {
  const { user } = useAuth();
  const toast = useToast();

  const handleExport = async (format) => {
    try {
      const response = await analyticsAPI.exportReport('trips', format);
      const blob = new Blob([response.data], {
        type: format === 'pdf' ? 'application/pdf' : 'text/csv',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fleet-report.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch {
      toast.error('Export failed. Please try again.');
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-xl border-b border-surface-200 flex items-center justify-between px-6">
      <div>
        <h1 className="text-sm font-medium text-surface-500">
          Welcome back, <span className="text-surface-900 font-semibold">{user?.name?.split(' ')[0]}</span>
        </h1>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => handleExport('csv')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-surface-500 hover:text-surface-800 hover:bg-surface-100 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          CSV
        </button>
        <button
          onClick={() => handleExport('pdf')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-surface-500 hover:text-surface-800 hover:bg-surface-100 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          PDF
        </button>

        <div className="w-px h-6 bg-surface-200 mx-1" />

        {/* Notification bell placeholder */}
        <button className="p-2 rounded-xl text-surface-400 hover:text-surface-700 hover:bg-surface-100 transition-colors cursor-pointer relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full" />
        </button>

        <div className="w-px h-6 bg-surface-200 mx-1" />

        {/* Profile Dropdown */}
        <ProfileDropdown />
      </div>
    </header>
  );
}
