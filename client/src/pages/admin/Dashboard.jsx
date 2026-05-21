import { useEffect, useState } from 'react';
import { useNavigate }         from 'react-router-dom';
import toast                   from 'react-hot-toast';
import { getCoursesApi }       from '../../api/course.api.js';
import { getAllUsersApi }       from '../../api/auth.api.js';
import { getEnrollmentsApi }   from '../../api/enrollment.api.js';
import { getSubmissionsApi }   from '../../api/submission.api.js';
import { formatDate }          from '../../utils/helpers.js';

// Stat card component
const StatCard = ({ label, value, color, icon }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
      </div>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center
        ${color.replace('text-', 'bg-').replace('600', '100')}`}>
        {icon}
      </div>
    </div>
  </div>
);

// Enrollment status badge
const StatusPill = ({ status }) => {
  const config = {
    active:    'bg-green-100 text-green-700',
    pending:   'bg-amber-100 text-amber-700',
    withdrawn: 'bg-gray-100  text-gray-600',
    rejected:  'bg-red-100   text-red-600',
    completed: 'bg-blue-100  text-blue-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
      ${config[status] || config.pending}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [users,       setUsers]       = useState([]);
  const [courses,     setCourses]     = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        // Fetch all in parallel — independent failures handled individually
        const results = await Promise.allSettled([
          getAllUsersApi(),
          getCoursesApi(),
          getEnrollmentsApi(),
          getSubmissionsApi(),
        ]);

        if (results[0].status === 'fulfilled') setUsers(results[0].value.users         || []);
        if (results[1].status === 'fulfilled') setCourses(results[1].value.courses     || []);
        if (results[2].status === 'fulfilled') setEnrollments(results[2].value.enrollments || []);
        if (results[3].status === 'fulfilled') setSubmissions(results[3].value.submissions || []);

        // Warn if any failed without crashing the page
        results.forEach((r, i) => {
          if (r.status === 'rejected') {
            console.warn(`Stat fetch ${i} failed:`, r.reason?.message);
          }
        });
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Derived counts
  const students  = users.filter((u) => u.role === 'student');
  const teachers  = users.filter((u) => u.role === 'teacher');
  const pending   = enrollments.filter((e) => e.status === 'pending');
  const recent    = [...enrollments]
    .sort((a, b) => new Date(b.enrolled_at) - new Date(a.enrolled_at))
    .slice(0, 8);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-gray-400">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10"
              stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          <span className="text-sm">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-950">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">System overview</p>
        </div>
        
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total students"
          value={students.length}
          color="text-green-600"
          icon={
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
          }
        />
        <StatCard
          label="Total teachers"
          value={teachers.length}
          color="text-blue-600"
          icon={
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          }
        />
        <StatCard
          label="Total courses"
          value={courses.length}
          color="text-purple-600"
          icon={
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
          }
        />
        <StatCard
          label="Total submissions"
          value={submissions.length}
          color="text-amber-600"
          icon={
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          }
        />
      </div>

      {/* Pending requests alert */}
      {pending.length > 0 && (
        <div className="mb-6 flex items-center justify-between bg-amber-50
          border border-amber-200 rounded-xl px-5 py-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none"
              stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L3.07 16.5c-.77.833.192 2.5 1.732 2.5z"/>
            </svg>
            <p className="text-sm font-medium text-amber-800">
              {pending.length} pending enrollment request{pending.length > 1 ? 's' : ''} awaiting review
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/enrollments')}
            className="text-sm font-medium text-amber-700 hover:text-amber-900
              underline underline-offset-2 transition-colors shrink-0"
          >
            Review now →
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent enrollments */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-950">Recent enrollments</h2>
            <button
              onClick={() => navigate('/admin/enrollments')}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              View all
            </button>
          </div>
          {recent.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-sm text-gray-400">No enrollments yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recent.map((e) => (
                <div key={e.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-950 truncate">
                      {e.student_name}
                    </p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {e.course_code} — {e.course_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <StatusPill status={e.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All courses */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-950">All courses</h2>
          </div>
          {courses.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-sm text-gray-400">No courses yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
              {courses.map((c) => (
                <div key={c.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-950 truncate">
                      {c.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {c.code}{c.section ? ` • ${c.section}` : ''} • {c.semester}
                    </p>
                  </div>
                  <div className="ml-3 shrink-0">
                    <p className="text-xs text-gray-500 truncate max-w-28 text-right">
                      {c.instructor_name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;