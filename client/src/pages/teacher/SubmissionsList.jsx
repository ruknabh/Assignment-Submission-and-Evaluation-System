import { useEffect, useState }      from 'react';
import { useParams, useNavigate }   from 'react-router-dom';
import toast                        from 'react-hot-toast';
import { getAssignmentByIdApi }     from '../../api/assignment.api.js';
import { getSubmissionsByAssignmentApi } from '../../api/submission.api.js';
import { getEvaluationsByAssignmentApi } from '../../api/evaluation.api.js';
import StatusBadge                  from '../../components/StatusBadge.jsx';
import PlagiarismBadge              from '../../components/PlagiarismBadge.jsx';
import { formatDate, formatFileSize } from '../../utils/helpers.js';

const SubmissionsList = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();

  const [assignment,   setAssignment]   = useState(null);
  const [submissions,  setSubmissions]  = useState([]);
  const [evaluations,  setEvaluations]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

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
        setSubmissions(subRes.submissions   || []);
        setEvaluations(evalRes.evaluations  || []);
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

  // Map evaluation by submission_id for O(1) lookup
  const evalMap = evaluations.reduce((acc, e) => {
    acc[e.submission_id] = e;
    return acc;
  }, {});

  const handleDownload = (submissionId) => {
    const token = localStorage.getItem('ases_token');
    const url   = `${import.meta.env.VITE_API_URL}/submissions/${submissionId}/file`;
    // Open in new tab with token — backend serves the file
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const link = document.createElement('a');
        link.href  = URL.createObjectURL(blob);
        link.download = '';
        link.click();
        URL.revokeObjectURL(link.href);
      })
      .catch(() => toast.error('Failed to download file'));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-gray-400">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
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
        <p className="text-sm text-red-600 font-medium">{error || 'Assignment not found'}</p>
        <button onClick={() => navigate(-1)}
          className="mt-3 text-sm text-blue-600 hover:underline">← Go back</button>
      </div>
    );
  }

  return (
    <div>
      {/* Back */}
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
        </svg>
        Back to Course
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-950">{assignment.title}</h1>
            <p className="text-sm text-gray-500 mt-1">{assignment.course_name}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-950">{submissions.length} submissions</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Due: {formatDate(assignment.due_date)}
            </p>
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
            <p className="text-lg font-bold text-green-600">
              {evaluations.length}
            </p>
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

                    {/* Student */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-green-100 flex items-center
                          justify-center text-green-700 text-xs font-semibold shrink-0">
                          {sub.student_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-950">{sub.student_name}</p>
                          <p className="text-xs text-gray-400">{sub.student_email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Submitted at */}
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-700">{formatDate(sub.submitted_at)}</p>
                      {sub.is_late && (
                        <StatusBadge status="late" />
                      )}
                    </td>

                    {/* File size */}
                    <td className="px-5 py-4 text-sm text-gray-500">
                      {formatFileSize(sub.file_size_kb)}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <StatusBadge status={sub.status} />
                    </td>

                    {/* Grade */}
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

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDownload(sub.id)}
                          className="text-xs text-gray-500 border border-gray-200
                            rounded-lg px-2.5 py-1.5 hover:bg-gray-50 transition-colors
                            flex items-center gap-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                          </svg>
                          File
                        </button>
                        <button
                          onClick={() => navigate(`/teacher/submissions/${sub.id}/evaluate`)}
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
    </div>
  );
};

export default SubmissionsList;