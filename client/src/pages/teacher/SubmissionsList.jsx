import { useEffect, useState }          from 'react';
import { useParams, useNavigate }       from 'react-router-dom';
import toast                            from 'react-hot-toast';
import { getAssignmentByIdApi }         from '../../api/assignment.api.js';
import { getSubmissionsByAssignmentApi, checkPlagiarismApi } from '../../api/submission.api.js';
import { getEvaluationsByAssignmentApi }from '../../api/evaluation.api.js';
import StatusBadge                      from '../../components/StatusBadge.jsx';
import PlagiarismBadge                  from '../../components/PlagiarismBadge.jsx';
import { formatDate, formatFileSize }   from '../../utils/helpers.js';

// Plagiarism results panel — shown below table after check runs
const PlagiarismPanel = ({ results, onClose }) => {
  if (!results || results.length === 0) return null;

  const checked = results.filter((r) => !r.skipped);
  const skipped = results.filter((r) =>  r.skipped);

  return (
    <div className="mt-4 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h3 className="text-base font-semibold text-gray-950">
            Plagiarism Check Results
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {checked.length} checked · {skipped.length} skipped (binary files)
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {checked.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-gray-500">
            No text-based files found. Plagiarism check only works for text files
            (py, java, txt, js, etc.)
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {checked
            .sort((a, b) => b.highestSimilarity - a.highestSimilarity)
            .map((result) => (
              <div key={result.submissionId} className="px-5 py-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-950">
                    Submission {result.submissionId.slice(0, 8)}...
                  </p>
                  <PlagiarismBadge score={result.highestSimilarity} />
                </div>

                {result.comparisons.length > 0 && result.highestSimilarity > 0 && (
                  <div className="mt-2 space-y-1">
                    {result.comparisons
                      .filter((c) => c.score > 0)
                      .slice(0, 3)
                      .map((c) => (
                        <div key={c.againstSubmissionId}
                          className="flex items-center justify-between text-xs text-gray-500">
                          <span>
                            vs {c.againstSubmissionId.slice(0, 8)}...
                          </span>
                          <span className={`font-medium ${
                            c.score > 60 ? 'text-red-600' :
                            c.score > 30 ? 'text-amber-600' :
                            'text-green-600'
                          }`}>
                            {c.score}% similar
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

const SubmissionsList = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();

  const [assignment,       setAssignment]       = useState(null);
  const [submissions,      setSubmissions]      = useState([]);
  const [evaluations,      setEvaluations]      = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState(null);
  const [checkingPlagiarism, setCheckingPlagiarism] = useState(false);
  const [plagiarismResults,  setPlagiarismResults]  = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [assignRes, subRes, evalRes] = await Promise.all([
          getAssignmentByIdApi(assignmentId),
          getSubmissionsByAssignmentApi(assignmentId),
          getEvaluationsByAssignmentApi(assignmentId),
        ]);
        setAssignment(assignRes.assignment);
        setSubmissions(subRes.submissions  || []);
        setEvaluations(evalRes.evaluations || []);
      } catch (err) {
        const msg = err.response?.data?.message || 'Failed to load submissions';
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [assignmentId]);

  const evalMap = evaluations.reduce((acc, e) => {
    acc[e.submission_id] = e;
    return acc;
  }, {});

  const handleDownload = (submissionId, fileName) => {
    const token = localStorage.getItem('ases_token');
    const url   = `${import.meta.env.VITE_API_URL}/submissions/${submissionId}/file`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const link    = document.createElement('a');
        link.href     = URL.createObjectURL(blob);
        link.download = fileName || 'submission';
        link.click();
        URL.revokeObjectURL(link.href);
      })
      .catch(() => toast.error('Failed to download file'));
  };

  const handleCheckPlagiarism = async () => {
    if (submissions.length < 2) {
      toast.error('Need at least 2 submissions to check plagiarism');
      return;
    }
    try {
      setCheckingPlagiarism(true);
      setPlagiarismResults(null);
      const res = await checkPlagiarismApi(assignmentId);
      if (res.results.length === 0) {
        toast('No text files found to compare', { icon: 'ℹ️' });
      } else {
        toast.success(`Plagiarism check complete — ${res.total_checked} files compared`);
        setPlagiarismResults(res.results);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Plagiarism check failed');
    } finally {
      setCheckingPlagiarism(false);
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
          <span className="text-sm">Loading submissions...</span>
        </div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-sm text-red-600 font-medium">
          {error || 'Assignment not found'}
        </p>
        <button onClick={() => navigate(-1)}
          className="mt-3 text-sm text-blue-600 hover:underline">
          ← Go back
        </button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500
          hover:text-gray-700 mb-4 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 19l-7-7 7-7"/>
        </svg>
        Back to Course
      </button>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-950">{assignment.title}</h1>
            <p className="text-sm text-gray-500 mt-1">{assignment.course_name}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Plagiarism check button */}
            <button
              onClick={handleCheckPlagiarism}
              disabled={checkingPlagiarism || submissions.length < 2}
              title={submissions.length < 2
                ? 'Need at least 2 submissions'
                : 'Check for plagiarism (text files only)'}
              className="flex items-center gap-1.5 border border-amber-200 text-amber-700
                hover:bg-amber-50 disabled:opacity-40 disabled:cursor-not-allowed
                text-xs font-medium rounded-lg px-3 py-2 transition-colors"
            >
              {checkingPlagiarism ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10"
                      stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Checking...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0
                         00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2
                         2 0 012 2m-6 9l2 2 4-4"/>
                  </svg>
                  Check Plagiarism
                </>
              )}
            </button>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-950">
                {submissions.length} submissions
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Due: {formatDate(assignment.due_date)}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
          <div>
            <p className="text-lg font-bold text-gray-950">{submissions.length}</p>
            <p className="text-xs text-gray-400">Total</p>
          </div>
          <div>
            <p className="text-lg font-bold text-amber-600">
              {submissions.filter((s) => s.is_late).length}
            </p>
            <p className="text-xs text-gray-400">Late</p>
          </div>
          <div>
            <p className="text-lg font-bold text-green-600">{evaluations.length}</p>
            <p className="text-xs text-gray-400">Graded</p>
          </div>
          <div>
            <p className="text-lg font-bold text-blue-600">
              {submissions.length - evaluations.length}
            </p>
            <p className="text-xs text-gray-400">Pending review</p>
          </div>
        </div>
      </div>

      {/* Submissions table */}
      {submissions.length === 0 ? (
        <div className="flex items-center justify-center h-40
          bg-white rounded-xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-400">No submissions yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Student', 'Submitted', 'Size', 'Status', 'Grade', 'Actions'].map((h) => (
                  <th key={h}
                    className="text-left text-xs font-medium text-gray-500
                      px-5 py-3 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {submissions.map((sub) => {
                const evaluation = evalMap[sub.id];
                return (
                  <tr key={sub.id} className="hover:bg-gray-50 transition-colors">

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-green-100 flex items-center
                          justify-center text-green-700 text-xs font-semibold shrink-0">
                          {sub.student_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-950">
                            {sub.student_name}
                          </p>
                          <p className="text-xs text-gray-400">{sub.student_email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-700">
                        {formatDate(sub.submitted_at)}
                      </p>
                      {sub.is_late && <StatusBadge status="late" />}
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-500">
                      {formatFileSize(sub.file_size_kb)}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={sub.status} />
                    </td>

                    <td className="px-5 py-4">
                      {evaluation ? (
                        <div>
                          <p className="text-sm font-semibold text-gray-950">
                            {evaluation.marks_obtained}
                            <span className="text-gray-400 font-normal">
                              /{assignment.max_marks}
                            </span>
                            <span className="ml-1.5 text-blue-600 font-bold">
                              {evaluation.letter_grade}
                            </span>
                          </p>
                          <PlagiarismBadge score={evaluation.plagiarism_score} />
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Not graded</span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDownload(sub.id, sub.file_name)}
                          className="text-xs text-gray-500 border border-gray-200
                            rounded-lg px-2.5 py-1.5 hover:bg-gray-50 transition-colors
                            flex items-center gap-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none"
                            stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                          </svg>
                          File
                        </button>
                        <button
                          onClick={() =>
                            navigate(`/teacher/submissions/${sub.id}/evaluate`)
                          }
                          className={`text-xs rounded-lg px-2.5 py-1.5 transition-colors
                            ${evaluation
                              ? 'border border-blue-200 text-blue-600 hover:bg-blue-50'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                        >
                          {evaluation ? 'Update grade' : 'Grade'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Plagiarism results panel — shown after check runs */}
      {plagiarismResults && (
        <PlagiarismPanel
          results={plagiarismResults}
          onClose={() => setPlagiarismResults(null)}
        />
      )}
    </div>
  );
};

export default SubmissionsList;