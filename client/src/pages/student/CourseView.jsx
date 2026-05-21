import { useEffect, useState }      from 'react';
import { useParams, useNavigate }   from 'react-router-dom';
import toast                        from 'react-hot-toast';
import { getCourseByIdApi }         from '../../api/course.api.js';
import { getAssignmentsByCourseApi }from '../../api/assignment.api.js';
import { getSubmissionsApi }        from '../../api/submission.api.js';
import { getEvaluationsApi }        from '../../api/evaluation.api.js';
import StatusBadge                  from '../../components/StatusBadge.jsx';
import { formatDate }               from '../../utils/helpers.js';

const isPastDue = (dueDate) => new Date() > new Date(dueDate);

// Inline grade panel — shown when assignment is evaluated/returned
const GradePanel = ({ evaluation, maxMarks, onDownload }) => {
  if (!evaluation) return null;

  const percentage = maxMarks > 0
    ? ((evaluation.marks_obtained / maxMarks) * 100).toFixed(1)
    : 0;

  const gradeColor =
    evaluation.letter_grade === 'A' ? 'text-green-700'  :
    evaluation.letter_grade === 'B' ? 'text-blue-700'   :
    evaluation.letter_grade === 'C' ? 'text-amber-700'  :
    evaluation.letter_grade === 'D' ? 'text-orange-700' :
    'text-red-700';

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 bg-green-50
      rounded-lg p-4 border">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">
          Your Grade
        </p>
        {onDownload && (
          <button
            onClick={(e) => { e.stopPropagation(); onDownload(); }}
            className="flex items-center gap-1 text-xs text-blue-600
              hover:underline font-medium"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            Download submission
          </button>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className={`text-3xl font-bold ${gradeColor}`}>
          {evaluation.marks_obtained}
        </span>
        <span className="text-sm text-gray-500">/ {maxMarks}</span>
        <span className={`text-2xl font-bold ml-2 ${gradeColor}`}>
          {evaluation.letter_grade}
        </span>
        <span className="text-sm text-gray-400 ml-1">({percentage}%)</span>
      </div>

      {evaluation.comment && (
        <div className="mt-3 pt-3 border-t border-green-200">
          <p className="text-xs font-medium text-green-700 mb-1">Teacher's feedback</p>
          <p className="text-sm text-gray-700">{evaluation.comment}</p>
        </div>
      )}
    </div>
  );
};

const AssignmentRow = ({ assignment, submission, evaluation, onSubmitClick }) => {
  const [gradeOpen, setGradeOpen] = useState(false);
  const overdue      = isPastDue(assignment.due_date);
  const hasSubmitted = !!submission;
  const isGraded     = submission?.status === 'evaluated' || submission?.status === 'returned';

  const handleDownload = () => {
    const token = localStorage.getItem('ases_token');
    const url   = `${import.meta.env.VITE_API_URL}/submissions/${submission.id}/file`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const link     = document.createElement('a');
        link.href      = URL.createObjectURL(blob);
        link.download  = submission.file_name || 'submission';
        link.click();
        URL.revokeObjectURL(link.href);
      })
      .catch(() => toast.error('Failed to download file'));
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5
      hover:shadow-md hover:border-blue-100 transition-all duration-200">

      {/* Top row */}
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
        {hasSubmitted && (
          <div className="flex items-center gap-1.5 shrink-0">
            <StatusBadge status={submission.status} />
            {submission.is_late && <StatusBadge status="late" />}
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
        <span className={`flex items-center gap-1 font-medium
          ${overdue ? 'text-red-500' : 'text-gray-500'}`}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 
                 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          Due: {formatDate(assignment.due_date)}
          {overdue && !hasSubmitted && ' · Past due'}
        </span>
        <span>{assignment.max_marks} marks</span>
        <span className="uppercase">
          {Array.isArray(assignment.allowed_file_types)
            ? assignment.allowed_file_types.join(', ')
            : assignment.allowed_file_types}
        </span>
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex items-center gap-2">
        {/* Submit / re-submit button */}
        {(!hasSubmitted || submission.status === 'submitted') && (
          <button
            onClick={() => onSubmitClick(assignment.id)}
            className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700
              rounded-lg px-4 py-2 transition-colors"
          >
            {hasSubmitted ? 'Re-submit' : 'Submit'}
          </button>
        )}

        {/* View grade button */}
        {isGraded && (
          <button
            onClick={() => setGradeOpen((p) => !p)}
            className="text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100
              border border-green-200 rounded-lg px-4 py-2 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0
                   0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0
                   0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            {gradeOpen ? 'Hide grade' : 'View grade'}
          </button>
        )}
      </div>

      {/* Inline grade panel */}
      {isGraded && gradeOpen && (
        <GradePanel
          evaluation={evaluation}
          maxMarks={assignment.max_marks}
          onDownload={submission ? handleDownload : null}
        />
      )}
    </div>
  );
};

const CourseView = () => {
  const { courseId } = useParams();
  const navigate     = useNavigate();

  const [course,      setCourse]      = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [courseRes, assignRes, subRes, evalRes] = await Promise.all([
          getCourseByIdApi(courseId),
          getAssignmentsByCourseApi(courseId),
          getSubmissionsApi(),
          getEvaluationsApi(),
        ]);
        setCourse(courseRes.course);
        setAssignments(assignRes.assignments     || []);
        setSubmissions(subRes.submissions        || []);
        setEvaluations(evalRes.evaluations       || []);
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

  // O(1) lookups by assignment_id
  const submissionMap = submissions.reduce((acc, s) => {
    acc[s.assignment_id] = s;
    return acc;
  }, {});

  // O(1) lookup by submission_id
  const evalBySubmission = evaluations.reduce((acc, e) => {
    acc[e.submission_id] = e;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-gray-400">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10"
              stroke="currentColor" strokeWidth="4" />
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
        <button onClick={() => navigate('/student/dashboard')}
          className="mt-3 text-sm text-blue-600 hover:underline">
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  // getCourseById returns raw field names: code, name — NOT course_code, course_name
  // Handle both shapes defensively
  const courseCode     = course?.code         || course?.course_code     || '';
  const courseName     = course?.name         || course?.course_name     || '';
  const courseSemester = course?.semester     || '';
  const courseSection  = course?.section      || '';
  const instructorName = course?.instructor_name || '';

  return (
    <div>
      {/* Back */}
      <button
        onClick={() => navigate('/student/dashboard')}
        className="flex items-center gap-1.5 text-sm text-gray-500
          hover:text-gray-700 mb-4 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 19l-7-7 7-7" />
        </svg>
        Back to Dashboard
      </button>

      {/* Course header */}
      <div className="bg-blue-600 rounded-xl p-6 mb-6 text-white">
        <p className="text-sm font-medium text-blue-200 uppercase tracking-wide">
          {courseCode}
          {courseSection ? ` · Section ${courseSection}` : ''}
        </p>
        <h1 className="text-2xl font-semibold mt-1">{courseName}</h1>
        <p className="text-sm text-blue-200 mt-1">{courseSemester}</p>

        <div className="flex items-center gap-2 mt-4">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center
            justify-center shrink-0">
            <span className="text-xs font-semibold text-white">
              {instructorName?.charAt(0).toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-blue-100 font-medium">{instructorName}</p>
        </div>
      </div>

      {/* Assignments */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-950">Assignments</h2>
        <span className="text-sm text-gray-400">{assignments.length} total</span>
      </div>

      {assignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48
          bg-white rounded-xl border border-gray-100 shadow-sm">
          <svg className="w-8 h-8 text-gray-300 mb-3" fill="none"
            stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0
                 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <p className="text-sm font-medium text-gray-500">No assignments yet</p>
          <p className="text-xs text-gray-400 mt-1">Check back later</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((assignment) => {
            const submission = submissionMap[assignment.id];
            const evaluation = submission ? evalBySubmission[submission.id] : null;
            return (
              <AssignmentRow
                key={assignment.id}
                assignment={assignment}
                submission={submission}
                evaluation={evaluation}
                onSubmitClick={(id) =>
                  navigate(`/student/assignments/${id}/submit`)
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CourseView;