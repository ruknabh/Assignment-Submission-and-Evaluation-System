import { useEffect, useState }          from 'react';
import { useParams, useNavigate }       from 'react-router-dom';
import toast                            from 'react-hot-toast';
import { getSubmissionByIdApi }         from '../../api/submission.api.js';
import {
  createEvaluationApi,
  updateEvaluationApi,
  returnEvaluationApi,
  getEvaluationsByAssignmentApi,        // ← static import, was dynamic before
} from '../../api/evaluation.api.js';
import GradeForm       from '../../components/GradeForm.jsx';
import StatusBadge     from '../../components/StatusBadge.jsx';
import PlagiarismBadge from '../../components/PlagiarismBadge.jsx';
import { formatDate, formatFileSize }   from '../../utils/helpers.js';

const EvaluationView = () => {
  const { submissionId } = useParams();
  const navigate = useNavigate();

  const [submission, setSubmission] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [returning,  setReturning]  = useState(false);
  const [error,      setError]      = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getSubmissionByIdApi(submissionId);
        setSubmission(res.submission);

        // If already evaluated/returned, fetch the existing evaluation
        if (['evaluated', 'returned'].includes(res.submission.status)) {
          const evalRes = await getEvaluationsByAssignmentApi(
            res.submission.assignment_id
          );
          const found = (evalRes.evaluations || []).find(
            (e) => e.submission_id === submissionId
          );
          if (found) setEvaluation(found);
        }
      } catch (err) {
        const msg = err.response?.data?.message || 'Failed to load submission';
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [submissionId]);

  const handleDownload = () => {
    const token = localStorage.getItem('ases_token');
    const url   = `${import.meta.env.VITE_API_URL}/submissions/${submissionId}/file`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const link    = document.createElement('a');
        link.href     = URL.createObjectURL(blob);
        link.download = submission?.file_name || 'submission';
        link.click();
        URL.revokeObjectURL(link.href);
      })
      .catch(() => toast.error('Failed to download file'));
  };

  const handleGrade = async (data) => {
    try {
      if (evaluation) {
        const res = await updateEvaluationApi(evaluation.id, data);
        setEvaluation(res.evaluation);
        toast.success('Evaluation updated!');
      } else {
        const res = await createEvaluationApi(submissionId, data);
        setEvaluation(res.evaluation);
        setSubmission((prev) => ({ ...prev, status: 'evaluated' }));
        toast.success('Submission graded successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save evaluation');
      throw err;
    }
  };

  const handleReturn = async () => {
    try {
      setReturning(true);
      await returnEvaluationApi(evaluation.id);
      setSubmission((prev) => ({ ...prev, status: 'returned' }));
      toast.success('Submission returned to student!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to return submission');
    } finally {
      setReturning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-gray-400">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10"
              stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          <span className="text-sm">Loading submission...</span>
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-sm text-red-600 font-medium">
          {error || 'Submission not found'}
        </p>
        <button onClick={() => navigate(-1)}
          className="mt-3 text-sm text-blue-600 hover:underline">
          ← Go back
        </button>
      </div>
    );
  }

  const isReturned = submission.status === 'returned';

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500
          hover:text-gray-700 mb-4 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 19l-7-7 7-7"/>
        </svg>
        Back to Submissions
      </button>

      {/* Page title */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-950">
            {submission.assignment_title}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{submission.course_name}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={submission.status} />
          {submission.is_late && <StatusBadge status="late" />}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">

        {/* Left col — submission details + evaluation result */}
        <div className="col-span-2 space-y-5">

          {/* Submission detail card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              Submission details
            </h2>

            {/* Student */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center
                justify-center text-green-700 text-sm font-semibold shrink-0">
                {submission.student_name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-950">
                  {submission.student_name}
                </p>
                <p className="text-xs text-gray-400">{submission.student_email}</p>
              </div>
            </div>

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                  Submitted
                </p>
                <p className="text-sm font-medium text-gray-950 mt-1">
                  {formatDate(submission.submitted_at)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                  File size
                </p>
                <p className="text-sm font-medium text-gray-950 mt-1">
                  {formatFileSize(submission.file_size_kb)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                  Max marks
                </p>
                <p className="text-sm font-medium text-gray-950 mt-1">
                  {submission.max_marks}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                  Due date
                </p>
                <p className="text-sm font-medium text-gray-950 mt-1">
                  {formatDate(submission.due_date)}
                </p>
              </div>
            </div>

            {/* Download */}
            <button
              onClick={handleDownload}
              className="mt-4 w-full flex items-center justify-center gap-2
                border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium
                text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              Download {submission.file_name}
            </button>
          </div>

          {/* Current evaluation card */}
          {evaluation && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-green-800">
                  Current evaluation
                </h2>
                <PlagiarismBadge score={evaluation.plagiarism_score} />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-green-700">
                  {evaluation.marks_obtained}
                </span>
                <span className="text-base text-green-600">
                  / {submission.max_marks}
                </span>
                <span className="ml-2 text-2xl font-bold text-green-700">
                  {evaluation.letter_grade}
                </span>
              </div>

              {evaluation.comment && (
                <p className="mt-3 text-sm text-green-800 border-t
                  border-green-200 pt-3">
                  {evaluation.comment}
                </p>
              )}

              {/* Return button */}
              {!isReturned ? (
                <button
                  onClick={handleReturn}
                  disabled={returning}
                  className="mt-4 w-full border border-green-300 text-green-700
                    text-sm font-medium rounded-lg px-4 py-2 hover:bg-green-100
                    transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {returning ? 'Returning...' : '✓ Return to student'}
                </button>
              ) : (
                <p className="mt-3 text-xs text-green-600 font-medium text-center">
                  ✓ Returned to student
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right col — grade form */}
        <div className="col-span-1">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm
            p-5 sticky top-6">
            <h2 className="text-sm font-semibold text-gray-950 mb-4">
              {evaluation ? 'Update grade' : 'Grade submission'}
            </h2>
            <GradeForm
              maxMarks={submission.max_marks}
              defaultValues={evaluation || {}}
              onSubmit={handleGrade}
              isUpdate={!!evaluation}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluationView;