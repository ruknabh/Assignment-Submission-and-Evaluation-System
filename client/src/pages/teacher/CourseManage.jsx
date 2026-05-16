import { useEffect, useState }      from 'react';
import { useParams, useNavigate }   from 'react-router-dom';
import toast                        from 'react-hot-toast';
import { getCourseByIdApi, updateCourseApi } from '../../api/course.api.js';
import { getAssignmentsByCourseApi }         from '../../api/assignment.api.js';
import { getEnrollmentsByCourseApi,
         approveEnrollmentApi,
         rejectEnrollmentApi }               from '../../api/enrollment.api.js';
import StatusBadge                           from '../../components/StatusBadge.jsx';
import { formatDate }                        from '../../utils/helpers.js';

const isPastDue = (dueDate) => new Date() > new Date(dueDate);

const CourseManage = () => {
  const { courseId } = useParams();
  const navigate     = useNavigate();

  const [course,      setCourse]      = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [activeTab,   setActiveTab]   = useState('assignments'); // assignments | students | requests

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [courseRes, assignRes, enrollRes] = await Promise.all([
          getCourseByIdApi(courseId),
          getAssignmentsByCourseApi(courseId),
          getEnrollmentsByCourseApi(courseId),
        ]);
        setCourse(courseRes.course);
        setAssignments(assignRes.assignments || []);
        setEnrollments(enrollRes.enrollments || []);
      } catch (err) {
        const msg = err.response?.data?.message || 'Failed to load course';
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseId]);

  const handleApprove = async (enrollmentId) => {
    try {
      await approveEnrollmentApi(enrollmentId);
      toast.success('Enrollment approved');
      setEnrollments((prev) =>
        prev.map((e) => e.id === enrollmentId ? { ...e, status: 'active' } : e)
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    }
  };

  const handleReject = async (enrollmentId) => {
    try {
      await rejectEnrollmentApi(enrollmentId);
      toast.success('Enrollment rejected');
      setEnrollments((prev) =>
        prev.map((e) => e.id === enrollmentId ? { ...e, status: 'rejected' } : e)
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    }
  };

  const pendingEnrollments = enrollments.filter((e) => e.status === 'pending');
  const activeEnrollments  = enrollments.filter((e) => e.status === 'active');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-gray-400">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          <span className="text-sm">Loading course...</span>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-sm text-red-600 font-medium">{error || 'Course not found'}</p>
        <button onClick={() => navigate('/teacher/dashboard')}
          className="mt-3 text-sm text-blue-600 hover:underline">
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Back */}
      <button onClick={() => navigate('/teacher/dashboard')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
        </svg>
        Back to Dashboard
      </button>

      {/* Course header */}
      <div className="bg-blue-600 rounded-xl p-6 mb-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-blue-200 uppercase tracking-wide">
              {course.code}{course.section ? ` • Section ${course.section}` : ''}
            </p>
            <h1 className="text-2xl font-semibold mt-1">{course.name}</h1>
            <p className="text-sm text-blue-200 mt-1">{course.semester}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/teacher/courses/${courseId}/analytics`)}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20
                text-white text-sm font-medium rounded-lg px-3 py-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              Analytics
            </button>
            <button
              onClick={() => navigate(`/teacher/courses/${courseId}/assignments/create`)}
              className="flex items-center gap-1.5 bg-white text-blue-600
                text-sm font-medium rounded-lg px-3 py-2 hover:bg-blue-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
              </svg>
              New Assignment
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/20">
          <div className="text-center">
            <p className="text-xl font-bold">{activeEnrollments.length}</p>
            <p className="text-xs text-blue-200">Students</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">{assignments.length}</p>
            <p className="text-xs text-blue-200">Assignments</p>
          </div>
          {pendingEnrollments.length > 0 && (
            <div className="text-center">
              <p className="text-xl font-bold text-amber-300">{pendingEnrollments.length}</p>
              <p className="text-xs text-blue-200">Pending requests</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
        {[
          { key: 'assignments', label: 'Assignments' },
          { key: 'students',    label: `Students (${activeEnrollments.length})` },
          { key: 'requests',    label: `Requests ${pendingEnrollments.length > 0 ? `(${pendingEnrollments.length})` : ''}` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-gray-950 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'assignments' && (
        <div className="space-y-3">
          {assignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48
              bg-white rounded-xl border border-gray-100 shadow-sm">
              <p className="text-sm font-medium text-gray-500">No assignments yet</p>
              <button
                onClick={() => navigate(`/teacher/courses/${courseId}/assignments/create`)}
                className="mt-3 text-sm text-blue-600 font-medium hover:underline"
              >
                + Create first assignment
              </button>
            </div>
          ) : (
            assignments.map((assignment) => (
              <div key={assignment.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-gray-950 truncate">
                      {assignment.title}
                    </h3>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className={isPastDue(assignment.due_date) ? 'text-red-500 font-medium' : ''}>
                        Due: {formatDate(assignment.due_date)}
                      </span>
                      <span>{assignment.max_marks} marks</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => navigate(
                        `/teacher/courses/${courseId}/assignments/${assignment.id}`
                      )}
                      className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200
                        rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => navigate(
                        `/teacher/assignments/${assignment.id}/submissions`
                      )}
                      className="text-xs text-white bg-blue-600 hover:bg-blue-700
                        rounded-lg px-3 py-1.5 transition-colors"
                    >
                      View submissions
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'students' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {activeEnrollments.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-sm text-gray-400">No students enrolled yet</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3 uppercase tracking-wide">
                    Student
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3 uppercase tracking-wide">
                    Email
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3 uppercase tracking-wide">
                    Enrolled on
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {activeEnrollments.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-green-100 flex items-center
                          justify-center text-green-700 text-xs font-semibold shrink-0">
                          {e.student_name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-950">{e.student_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{e.student_email}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{formatDate(e.enrolled_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="space-y-3">
          {pendingEnrollments.length === 0 ? (
            <div className="flex items-center justify-center h-32
              bg-white rounded-xl border border-gray-100 shadow-sm">
              <p className="text-sm text-gray-400">No pending requests</p>
            </div>
          ) : (
            pendingEnrollments.map((e) => (
              <div key={e.id}
                className="bg-white rounded-xl border border-amber-100 shadow-sm p-5
                  flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center
                    justify-center text-amber-700 text-xs font-semibold">
                    {e.student_name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-950">{e.student_name}</p>
                    <p className="text-xs text-gray-500">{e.student_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReject(e.id)}
                    className="text-xs text-red-600 border border-red-200 rounded-lg
                      px-3 py-1.5 hover:bg-red-50 transition-colors font-medium"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(e.id)}
                    className="text-xs text-white bg-green-600 hover:bg-green-700
                      rounded-lg px-3 py-1.5 transition-colors font-medium"
                  >
                    Approve
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CourseManage;