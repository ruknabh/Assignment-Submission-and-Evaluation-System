import { Outlet }    from 'react-router-dom';
import Navbar        from '../components/Navbar.jsx';
import SidebarLink   from '../components/SidebarLink.jsx';
import { DashboardIcon, EnrollmentIcon } from '../components/Icons.jsx';
import useAuth           from '../hooks/useAuth.js';
import { getInitials }   from '../utils/helpers.js';

const AdminLayout = () => {
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col shrink-0">

        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-3 mb-3">
            Navigation
          </p>
          <SidebarLink
            to="/admin/dashboard"
            icon={<DashboardIcon />}
            label="Dashboard"
          />
          <SidebarLink
            to="/admin/enrollments"
            icon={<EnrollmentIcon />}
            label="Enrollments"
          />
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center
              justify-center text-white text-xs font-semibold shrink-0">
              {getInitials(user?.full_name)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-950 truncate">{user?.full_name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;