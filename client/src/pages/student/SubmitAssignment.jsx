import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getAssignmentByIdApi }  from '../../api/assignment.api.js';
import { submitAssignmentApi }   from '../../api/submission.api.js';
import { getEvaluationsApi }     from '../../api/evaluation.api.js';
import FileUploader              from '../../components/FileUploader.jsx';
import StatusBadge               from '../../components/StatusBadge.jsx';
import { formatDate }            from '../../utils/helpers.js';

const isPastDue = (dueDate) => new Date() > new Date(dueDate);

const SubmitAssignment = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();

  const [assignment,   setAssignment]   = useState(null);
  const [submission,   setSubmission]   = useState(null);
  const [evaluation,   setEvaluation]   = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch assignment details
        const assignRes = await getAssignmentByIdApi(assignmentId);
        setAssignment(assignRes.assignment);

        // Fetch student's evaluations to find if this assignment was graded
        const evalRes = await getEvaluationsApi();
        const evals   = evalRes.evaluations || [];

        // Find evaluation for this assignment
        const relatedEval = evals.find(
          (e) => e.assignment_id === assignmentId
        );
        if (relatedEval) {
          setEvaluation(relatedEval);
          setSubmission({ status: relatedEval.submission_status, is_late: false });
        }

      } catch (err) {
        const msg = err.response?.data?.message || 'Failed to load assignment';
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [assignmentId]);

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      setSubmitting(true);
      const res = await submitAssignmentApi(assignmentId, formData);
      toast.success(res.message || 'Submitted successfully!');
      setSubmission(res.submission);
      setSelectedFile(null);
    } catch (err) {
      const msg = err.response?.data?.message || 'Submission failed. Try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-gray-400">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span className="text-sm">Loading assignment...</span>
        </div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-sm text-red-600 font-medium">{error || 'Assignment not found'}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-3 text-sm text-blue-600 hover:underline"
        >
          ← Go back
        </button>
      </div>
    );
  }

  const overdue          = isPastDue(assignment.due_date);
  const alreadyEvaluated = submission?.status === 'evaluated' || submission?.status === 'returned';
  const allowedTypes     = Array.isArray(assignment.allowed_file_types)
    ? assignment.allowed_file_types
    : [];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Course
      </button>

      {/* Assignment details card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-950">{assignment.title}</h1>
            <p className="text-sm text-gray-500 mt-1">{assignment.course_name}</p>
          </div>
          {submission && <StatusBadge status={submission.status} />}
        </div>

        {assignment.description && (
          <p className="text-sm text-gray-600 mt-4 leading-relaxed">{assignment.description}</p>
        )}

        {/* Assignment meta */}
        <div className="mt-5 grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Due date</p>
            <p className={`text-sm font-semibold mt-1 ${overdue ? 'text-red-600' : 'text-gray-950'}`}>
              {formatDate(assignment.due_date)}
              {overdue && ' (Past due)'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Max marks</p>
            <p className="text-sm font-semibold text-gray-950 mt-1">{assignment.max_marks}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Allowed types</p>
            <p className="text-sm font-semibold text-gray-950 mt-1 uppercase">
              {allowedTypes.join(', ')}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Max file size</p>
            <p className="text-sm font-semibold text-gray-950 mt-1">
              {assignment.max_file_size_mb} MB
            </p>
          </div>
        </div>
      </div>

      {/* Grade card — shown after evaluation */}
      {evaluation && alreadyEvaluated && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-green-800">Your Grade</h2>
            <StatusBadge status={submission.status} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-green-700">
              {evaluation.marks_obtained}
            </span>
            <span className="text-lg text-green-600">/ {assignment.max_marks}</span>
            <span className="ml-2 text-2xl font-bold text-green-700">
              {evaluation.letter_grade}
            </span>
          </div>
          {evaluation.comment && (
            <div className="mt-4 pt-4 border-t border-green-200">
              <p className="text-xs font-medium text-green-700 uppercase tracking-wide mb-1">
                Teacher's feedback
              </p>
              <p className="text-sm text-green-800">{evaluation.comment}</p>
            </div>
          )}
        </div>
      )}

      {/* Submission section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-950 mb-1">
          {submission ? 'Re-submit Assignment' : 'Submit Assignment'}
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          {alreadyEvaluated
            ? 'This submission has been evaluated and cannot be changed.'
            : submission
              ? 'You can re-submit before your work is evaluated.'
              : 'Upload your file below.'}
        </p>

        {/* Late submission warning */}
        {overdue && !alreadyEvaluated && (
          <div className="mb-4 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L3.07 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-sm text-amber-700 font-medium">
              The deadline has passed. Your submission will be marked as late.
            </p>
          </div>
        )}

        {/* File uploader or locked state */}
        {alreadyEvaluated ? (
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50">
            <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-sm text-gray-400">Submission locked after evaluation</p>
          </div>
        ) : (
          <>
            <FileUploader
              allowedTypes={allowedTypes}
              maxSizeMb={assignment.max_file_size_mb}
              onFileSelect={setSelectedFile}
              selectedFile={selectedFile}
            />

            <button
              onClick={handleSubmit}
              disabled={!selectedFile || submitting}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300
                text-white text-sm font-medium rounded-lg px-4 py-2.5
                transition-colors disabled:cursor-not-allowed
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Uploading...
                </span>
              ) : submission ? 'Re-submit Assignment' : 'Submit Assignment'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default SubmitAssignment;