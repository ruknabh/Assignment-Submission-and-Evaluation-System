import { useEffect, useState } from 'react';
import { useNavigate }         from 'react-router-dom';
import { useForm }             from 'react-hook-form';
import { zodResolver }         from '@hookform/resolvers/zod';
import { z }                   from 'zod';
import toast                   from 'react-hot-toast';
import { getCoursesApi, createCourseApi } from '../../api/course.api.js';
import useAuth from '../../hooks/useAuth.js';

// Inline create course schema
const courseSchema = z.object({
  code:     z.string().min(2, 'Required').max(20).trim().toUpperCase(),
  name:     z.string().min(3, 'Required').max(150).trim(),
  semester: z.string().min(2, 'Required').max(20).trim(),
  section:  z.string().max(10).trim().optional(),
});

// Modal component
const CreateCourseModal = ({ onClose, onCreated }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(courseSchema),
  });

  const onSubmit = async (data) => {
    try {
      const res = await createCourseApi(data);
      toast.success('Course created successfully!');
      onCreated(res.course);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create course');
    }
  };

  const inputClass = (hasError) =>
    `w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none
    focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white
    ${hasError ? 'border-red-400 bg-red-50' : 'border-gray-200'}`;

  return (
    // Backdrop
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-950">Create new course</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Course code</label>
            <input {...register('code')} placeholder="e.g. CS301" className={inputClass(errors.code)} />
            {errors.code && <p className="mt-1 text-xs text-red-600">{errors.code.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Course name</label>
            <input {...register('name')} placeholder="e.g. Data Structures" className={inputClass(errors.name)} />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Semester</label>
              <input {...register('semester')} placeholder="e.g. Fall 2025" className={inputClass(errors.semester)} />
              {errors.semester && <p className="mt-1 text-xs text-red-600">{errors.semester.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Section <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input {...register('section')} placeholder="e.g. A" className={inputClass(errors.section)} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium
                rounded-lg px-4 py-2.5 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300
                text-white text-sm font-medium rounded-lg px-4 py-2.5
                transition-colors disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Course card
const CourseCard = ({ course, onClick }) => (
  <button
    onClick={onClick}
    className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-left
      hover:shadow-md hover:border-blue-100 transition-all duration-200 w-full"
  >
    <div className="h-2 w-full bg-blue-600 rounded-full mb-4 opacity-80" />
    <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">
      {course.code}{course.section ? ` • Section ${course.section}` : ''}
    </p>
    <h3 className="text-base font-semibold text-gray-950 mt-1 truncate">{course.name}</h3>
    <p className="text-sm text-gray-500 mt-0.5">{course.semester}</p>
    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
      <span className="text-xs text-gray-400">Click to manage</span>
      <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  </button>
);

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [courses,     setCourses]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [showModal,   setShowModal]   = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getCoursesApi();
        setCourses(res.courses || []);
      } catch (err) {
        const msg = err.response?.data?.message || 'Failed to load courses';
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleCourseCreated = (newCourse) => {
    setCourses((prev) => [newCourse, ...prev]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-gray-400">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          <span className="text-sm">Loading your courses...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {showModal && (
        <CreateCourseModal
          onClose={() => setShowModal(false)}
          onCreated={handleCourseCreated}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-950">
            Welcome, {user?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage your courses and assignments</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700
            text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
          </svg>
          New Course
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Courses grid */}
      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64
          bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-700">No courses yet</p>
          <p className="text-xs text-gray-400 mt-1 mb-4">Create your first course to get started</p>
          <button
            onClick={() => setShowModal(true)}
            className="text-sm text-blue-600 font-medium hover:underline"
          >
            + Create a course
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onClick={() => navigate(`/teacher/courses/${course.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;