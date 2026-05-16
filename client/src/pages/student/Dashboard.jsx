import { useEffect, useState } from 'react';
import { useNavigate }         from 'react-router-dom';
import toast                   from 'react-hot-toast';
import { getCoursesApi }       from '../../api/course.api.js';
import { getEnrollmentsApi }   from '../../api/enrollment.api.js';
import useAuth                 from '../../hooks/useAuth.js';
import { formatDate }          from '../../utils/helpers.js';

// Course card component
const CourseCard = ({ course, onClick }) => (
  <button
    onClick={onClick}
    className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-left
      hover:shadow-md hover:border-blue-100 transition-all duration-200 w-full"
  >
    {/* Color bar at top — like Google Classroom */}
    <div className="h-2 w-full bg-blue-600 rounded-full mb-4 opacity-80" />

    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">
          {course.course_code}
          {course.section ? ` • Section ${course.section}` : ''}
        </p>
        <h3 className="text-base font-semibold text-gray-950 mt-1 truncate">
          {course.course_name}
        </h3>
        <p className="text-sm text-gray-500 mt-0.5">{course.semester}</p>
      </div>
    </div>

    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
        <span className="text-xs font-semibold text-blue-700">
          {course.instructor_name?.charAt(0).toUpperCase()}
        </span>
      </div>
      <p className="text-xs text-gray-500 truncate">{course.instructor_name}</p>
    </div>
  </button>
);

// Pending enrollment card — student waiting for approval
const PendingCard = ({ enrollment }) => (
  <div className="bg-white rounded-xl border border-amber-100 shadow-sm p-5 opacity-75">
    <div className="h-2 w-full bg-amber-400 rounded-full mb-4 opacity-80" />
    <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">
      {enrollment.course_code} • Pending Approval
    </p>
    <h3 className="text-base font-semibold text-gray-950 mt-1">{enrollment.course_name}</h3>
    <p className="text-sm text-gray-500 mt-0.5">{enrollment.semester}</p>
    <div className="mt-4 pt-4 border-t border-gray-100">
      <span className="text-xs text-amber-600 font-medium">
        ⏳ Waiting for teacher approval
      </span>
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
        // Fetch active courses and all enrollments (to show pending ones)
        const [courseRes, enrollRes] = await Promise.all([
          getCoursesApi(),
          getEnrollmentsApi(),
        ]);
        setCourses(courseRes.courses     || []);
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

  // Separate pending from active
  const pendingEnrollments = enrollments.filter((e) => e.status === 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-gray-400">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
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
          <button
            onClick={() => window.location.reload()}
            className="mt-3 text-sm text-blue-600 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-950">
          Welcome back, {user?.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Here are your enrolled courses
        </p>
      </div>

      {/* Active courses */}
      {courses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onClick={() => navigate(`/student/courses/${course.id}`)}
            />
          ))}

          {/* Pending enrollments shown in same grid but styled differently */}
          {pendingEnrollments.map((e) => (
            <PendingCard key={e.id} enrollment={e} />
          ))}
        </div>
      ) : (
        // Empty state
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-700">No courses yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Ask your teacher or admin to enroll you in a course
          </p>

          {/* Show pending enrollments if any */}
          {pendingEnrollments.length > 0 && (
            <div className="mt-4 text-center">
              <p className="text-xs text-amber-600 font-medium">
                You have {pendingEnrollments.length} pending enrollment request
                {pendingEnrollments.length > 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;