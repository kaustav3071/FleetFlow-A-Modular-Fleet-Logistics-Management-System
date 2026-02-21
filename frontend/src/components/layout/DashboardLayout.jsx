import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Navbar from './Navbar.jsx';

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-surface-900">
      <Sidebar />
      <div className="ml-[260px] transition-all duration-300">
        <Navbar />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
