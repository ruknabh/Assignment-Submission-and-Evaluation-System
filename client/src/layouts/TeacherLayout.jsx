import { Outlet } from 'react-router-dom';
import Navbar      from '../components/Navbar.jsx';
import SidebarLink from '../components/SidebarLink.jsx';
import {
  DashboardIcon,
  SubmissionsIcon,
  AnalyticsIcon,
} from '../components/Icons.jsx';
import useAuth         from '../hooks/useAuth.js';
import { getInitials } from '../utils/helpers.js';

const TeacherLayout = () => {
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">

        <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-200">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-950 leading-tight">ASES</p>
            <p className="text-xs text-gray-400 leading-tight">Teacher Portal</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-3 mb-2">
            Menu
          </p>
          <SidebarLink to="/teacher/dashboard"   icon={<DashboardIcon />}   label="Dashboard" />
          <SidebarLink to="/teacher/submissions" icon={<SubmissionsIcon />} label="Submissions" />
          <SidebarLink to="/teacher/analytics"   icon={<AnalyticsIcon />}   label="Analytics" />
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
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

export default TeacherLayout;