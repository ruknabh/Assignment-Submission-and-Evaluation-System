import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getCourseByIdApi }        from '../../api/course.api.js';
import { getAssignmentsByCourseApi } from '../../api/assignment.api.js';
import { getSubmissionsApi }       from '../../api/submission.api.js';
import StatusBadge                 from '../../components/StatusBadge.jsx';
import { formatDate }              from '../../utils/helpers.js';

// Check if assignment is past due
const isPastDue = (dueDate) => new Date() > new Date(dueDate);

const AssignmentCard = ({ assignment, submission, onClick }) => {
  const overdue    = isPastDue(assignment.due_date);
  const hasSubmitted = !!submission;

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-left w-full
        hover:shadow-md hover:border-blue-100 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-gray-950 truncate">
            {assignment.title}
          </h3>
          {assignment.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {assignment.description}
            </p>
          )}
        </div>

        {/* Submission status badge */}
        {hasSubmitted && (
          <div className="shrink-0">
            <StatusBadge status={submission.status} />
            {submission.is_late && (
              <span className="ml-1">
                <StatusBadge status="late" />
              </span>
            )}
          </div>
        )}
      </div>

      {/* Meta row */}
      <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
        <span className={`flex items-center gap-1 font-medium ${overdue ? 'text-red-500' : 'text-gray-500'}`}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {overdue ? 'Due: ' : 'Due: '}{formatDate(assignment.due_date)}
          {overdue && !hasSubmitted && ' (Past due)'}
        </span>

        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          {assignment.max_marks} marks
        </span>

        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          {Array.isArray(assignment.allowed_file_types)
            ? assignment.allowed_file_types.join(', ')
            : assignment.allowed_file_types}
        </span>
      </div>

      {/* Action hint */}
      <div className="mt-3 text-xs font-medium text-blue-600">
        {!hasSubmitted && !overdue && 'Click to submit →'}
        {!hasSubmitted && overdue  && 'Click to submit (late) →'}
        {hasSubmitted && submission.status === 'submitted'  && 'Click to re-submit →'}
        {hasSubmitted && submission.status === 'evaluated'  && 'Click to view evaluation →'}
        {hasSubmitted && submission.status === 'returned'   && 'Click to view grade →'}
      </div>
    </button>
  );
};

const CourseView = () => {
  const { courseId } = useParams();
  const navigate     = useNavigate();

  const [course,      setCourse]      = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [courseRes, assignRes, subRes] = await Promise.all([
          getCourseByIdApi(courseId),
          getAssignmentsByCourseApi(courseId),
          getSubmissionsApi(),
        ]);

        setCourse(courseRes.course);
        setAssignments(assignRes.assignments || []);
        setSubmissions(subRes.submissions    || []);
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

  // Map submissionId by assignment — O(1) lookup
  const submissionMap = submissions.reduce((acc, sub) => {
    acc[sub.assignment_id] = sub;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-gray-400">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span className="text-sm">Loading course...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-sm text-red-600 font-medium">{error}</p>
        <button
          onClick={() => navigate('/student/dashboard')}
          className="mt-3 text-sm text-blue-600 hover:underline"
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <button
        onClick={() => navigate('/student/dashboard')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Dashboard
      </button>

      {/* Course header */}
      <div className="bg-blue-600 rounded-xl p-6 mb-6 text-white">
        <p className="text-sm font-medium text-blue-200 uppercase tracking-wide">
          {course?.course_code}
          {course?.section ? ` • Section ${course.section}` : ''}
        </p>
        <h1 className="text-2xl font-semibold mt-1">{course?.course_name}</h1>
        <p className="text-sm text-blue-200 mt-1">{course?.semester}</p>
        <div className="flex items-center gap-2 mt-3">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-xs font-semibold text-white">
              {course?.instructor_name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-blue-100">{course?.instructor_name}</p>
        </div>
      </div>

      {/* Assignments section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-950">Assignments</h2>
        <span className="text-sm text-gray-400">{assignments.length} total</span>
      </div>

      {assignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 bg-white rounded-xl border border-gray-100 shadow-sm">
          <svg className="w-8 h-8 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm font-medium text-gray-500">No assignments yet</p>
          <p className="text-xs text-gray-400 mt-1">Check back later</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              submission={submissionMap[assignment.id]}
              onClick={() => navigate(`/student/assignments/${assignment.id}/submit`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseView;