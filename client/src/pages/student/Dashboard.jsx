import { useEffect, useState }  from 'react';
import { useNavigate }          from 'react-router-dom';
import toast                    from 'react-hot-toast';
import { getCoursesApi }        from '../../api/course.api.js';
import { getEnrollmentsApi }    from '../../api/enrollment.api.js';
import useAuth                  from '../../hooks/useAuth.js';
import { getInitials }          from '../../utils/helpers.js';

// Derive a consistent color from instructor name — avoids all cards looking same
const INSTRUCTOR_COLORS = [
  { bg: 'bg-blue-600',   light: 'bg-blue-100',   text: 'text-blue-800'   },
  { bg: 'bg-green-600',  light: 'bg-green-100',  text: 'text-green-800'  },
  { bg: 'bg-purple-600', light: 'bg-purple-100', text: 'text-purple-800' },
  { bg: 'bg-rose-600',   light: 'bg-rose-100',   text: 'text-rose-800'   },
  { bg: 'bg-amber-600',  light: 'bg-amber-100',  text: 'text-amber-800'  },
  { bg: 'bg-teal-600',   light: 'bg-teal-100',   text: 'text-teal-800'   },
];

const getColorFromName = (name = '') => {
  const index = name.charCodeAt(0) % INSTRUCTOR_COLORS.length;
  return INSTRUCTOR_COLORS[index];
};

// Top accent bar colors per card — cycles through a set
const ACCENT_COLORS = [
  'bg-blue-600',
  'bg-violet-600',
  'bg-green-600',
  'bg-rose-500',
  'bg-amber-500',
  'bg-teal-600',
];

const getAccentColor = (str = '') => {
  const index = str.charCodeAt(0) % ACCENT_COLORS.length;
  return ACCENT_COLORS[index];
};

const CourseCard = ({ course, onClick }) => {
  const color  = getColorFromName(course.instructor_name || '');
  const accent = getAccentColor(course.course_code || course.code || '');

  // Support both field name shapes — getCoursesByStudent returns aliased names
  const code     = course.course_code || course.code    || '';
  const name     = course.course_name || course.name    || '';
  const semester = course.semester    || '';
  const section  = course.section     || '';
  const instructor = course.instructor_name || '';

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-100 shadow-sm text-left w-full
        hover:shadow-md hover:border-blue-100 transition-all duration-200 overflow-hidden
        flex flex-col"
    >
      {/* Accent bar */}
      <div className={`h-2 w-full ${accent}`} />

      {/* Card body */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Course code + section */}
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
          {code}
          {section ? ` · Section ${section}` : ''}
        </p>

        {/* Course name */}
        <h3 className="text-base font-semibold text-gray-950 mt-1 leading-snug line-clamp-2">
          {name}
        </h3>

        {/* Semester */}
        <p className="text-sm text-gray-400 mt-1">{semester}</p>

        {/* Divider */}
        <div className="flex-1" />
        <div className="border-t border-gray-100 mt-4 pt-3 flex items-center gap-2.5">
          {/* Instructor avatar with initials */}
          <div className={`w-7 h-7 rounded-full flex items-center justify-center
            shrink-0 ${color.bg}`}>
            <span className="text-xs font-semibold text-white">
              {getInitials(instructor)}
            </span>
          </div>
          <p className="text-xs text-gray-600 truncate font-medium">{instructor}</p>
        </div>
      </div>
    </button>
  );
};

const PendingCard = ({ enrollment }) => (
  <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden
    opacity-80 flex flex-col">
    <div className="h-2 w-full bg-amber-400" />
    <div className="p-5 flex-1 flex flex-col">
      <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">
        {enrollment.course_code} · Pending
      </p>
      <h3 className="text-base font-semibold text-gray-950 mt-1 leading-snug line-clamp-2">
        {enrollment.course_name}
      </h3>
      <p className="text-sm text-gray-400 mt-1">{enrollment.semester}</p>
      <div className="flex-1" />
      <div className="border-t border-gray-100 mt-4 pt-3 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span className="text-xs text-amber-600 font-medium">
          Waiting for teacher approval
        </span>
      </div>
    </div>
  </div>
);

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [courses,     setCourses]     = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [courseRes, enrollRes] = await Promise.all([
          getCoursesApi(),
          getEnrollmentsApi(),
        ]);
        setCourses(courseRes.courses         || []);
        setEnrollments(enrollRes.enrollments || []);
      } catch (err) {
        const msg = err.response?.data?.message || 'Failed to load courses';
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const pendingEnrollments = enrollments.filter((e) => e.status === 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-gray-400">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10"
              stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span className="text-sm">Loading your courses...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-sm text-red-600 font-medium">{error}</p>
          <button onClick={() => window.location.reload()}
            className="mt-3 text-sm text-blue-600 hover:underline">
            Try again
          </button>
        </div>
      </div>
    );
  }

  const hasContent = courses.length > 0 || pendingEnrollments.length > 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-950">
          Welcome back, {user?.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {courses.length > 0
            ? `You are enrolled in ${courses.length} course${courses.length > 1 ? 's' : ''}`
            : 'Your enrolled courses will appear here'}
        </p>
      </div>

      {hasContent ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onClick={() => navigate(`/student/courses/${course.id}`)}
            />
          ))}
          {pendingEnrollments.map((e) => (
            <PendingCard key={e.id} enrollment={e} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-72
          bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center
            justify-center mb-4">
            <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor"
              viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13
                   C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13
                   C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13
                   C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-base font-semibold text-gray-700">No courses yet</p>
          <p className="text-sm text-gray-400 mt-1 text-center max-w-xs">
            Use the <strong className="text-blue-600">+</strong> button in the top bar
            to join a course, or ask your teacher to enroll you.
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;