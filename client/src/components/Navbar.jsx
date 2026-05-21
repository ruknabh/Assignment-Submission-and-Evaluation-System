import { useState, useRef, useEffect } from 'react';
import { useNavigate }                 from 'react-router-dom';
import toast                           from 'react-hot-toast';
import useAuth                         from '../hooks/useAuth.js';
import { getInitials, capitalize }     from '../utils/helpers.js';
import JoinCourseModal                 from './JoinCourseModal.jsx';

const roleBadgeClass = {
  student: 'bg-green-100  text-green-700',
  teacher: 'bg-blue-100   text-blue-700',
  admin:   'bg-purple-100 text-purple-700',
};

const avatarBg = {
  student: 'bg-green-600',
  teacher: 'bg-blue-600',
  admin:   'bg-purple-600',
};

const Navbar = () => {
  const { user, logout }    = useAuth();
  const navigate            = useNavigate();
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [joinOpen,  setJoinOpen]  = useState(false);
  const menuRef = useRef(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login', { replace: true });
  };

  if (!user) return null;

  return (
    <>
      <header className="h-16 bg-white border-b border-gray-200 flex items-center
        justify-between px-5 sticky top-0 z-10 shrink-0">

        {/* Left — Logo + App name */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13
                   C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13
                   C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13
                   C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-gray-950 leading-none">ASES</p>
            <p className="text-xs text-gray-400 leading-none mt-0.5">
              {capitalize(user.role)} Portal
            </p>
          </div>
        </div>

        {/* Right — actions */}
        <div className="flex items-center gap-2">

          {/* Plus icon — join course (student only) */}
          {user.role === 'student' && (
            <button
              onClick={() => setJoinOpen(true)}
              title="Join a course"
              className="w-9 h-9 flex items-center justify-center rounded-lg
                text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}

          {/* Profile dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((p) => !p)}
              className="flex items-center gap-2.5 hover:bg-gray-50 rounded-lg
                px-2.5 py-1.5 transition-colors"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center
                text-white text-xs font-semibold shrink-0 ${avatarBg[user.role]}`}>
                {getInitials(user.full_name)}
              </div>
              <div className="text-left hidden sm:block leading-tight">
                <p className="text-sm font-medium text-gray-950 leading-none">
                  {user.full_name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 leading-none">{user.email}</p>
              </div>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform hidden sm:block
                  ${menuOpen ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl
                shadow-lg border border-gray-100 py-1 z-20">

                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-950">{user.full_name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
                  <span className={`inline-block mt-1.5 text-xs font-medium
                    px-2 py-0.5 rounded-full ${roleBadgeClass[user.role]}`}>
                    {capitalize(user.role)}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm
                    text-red-600 hover:bg-red-50 transition-colors text-left"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7
                         a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Join course modal — only renders when open */}
      {joinOpen && (
        <JoinCourseModal onClose={() => setJoinOpen(false)} />
      )}
    </>
  );
};

export default Navbar;