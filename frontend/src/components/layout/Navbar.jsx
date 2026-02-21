import { Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { analyticsAPI } from '../../api/analytics.js';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user } = useAuth();

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
      toast.error('Export failed');
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-surface-900/60 backdrop-blur-xl border-b border-surface-700/50 flex items-center justify-between px-6">
      <div>
        <h1 className="text-sm font-medium text-surface-300">
          Welcome back, <span className="text-white">{user?.name?.split(' ')[0]}</span>
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => handleExport('csv')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-surface-400 hover:text-white hover:bg-surface-700 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          CSV
        </button>
        <button
          onClick={() => handleExport('pdf')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-surface-400 hover:text-white hover:bg-surface-700 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          PDF
        </button>
        <div className="w-px h-6 bg-surface-700 mx-1" />
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-surface-900 text-sm font-bold ml-1 cursor-pointer select-none">
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  );
}
