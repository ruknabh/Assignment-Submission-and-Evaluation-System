import { useEffect, useState }    from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast                      from 'react-hot-toast';
import { getCourseByIdApi }       from '../../api/course.api.js';
import { getAssignmentsByCourseApi } from '../../api/assignment.api.js';
import { getSubmissionsByAssignmentApi } from '../../api/submission.api.js';
import { getEvaluationsByAssignmentApi } from '../../api/evaluation.api.js';

// Simple bar — no external library
const Bar = ({ label, value, max, color }) => (
  <div className="flex items-center gap-3">
    <span className="text-xs text-gray-500 w-4 shrink-0">{label}</span>
    <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: max > 0 ? `${(value / max) * 100}%` : '0%' }}
      />
    </div>
    <span className="text-xs font-medium text-gray-700 w-4 text-right">{value}</span>
  </div>
);

const Analytics = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course,      setCourse]      = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [data,        setData]        = useState([]); // per-assignment analytics
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [courseRes, assignRes] = await Promise.all([
          getCourseByIdApi(courseId),
          getAssignmentsByCourseApi(courseId),
        ]);
        setCourse(courseRes.course);
        const assigns = assignRes.assignments || [];
        setAssignments(assigns);

        // Fetch submissions + evaluations for each assignment
        const perAssignment = await Promise.all(
          assigns.map(async (a) => {
            const [subRes, evalRes] = await Promise.all([
              getSubmissionsByAssignmentApi(a.id),
              getEvaluationsByAssignmentApi(a.id),
            ]);
            const subs  = subRes.submissions  || [];
            const evals = evalRes.evaluations || [];

            // Grade distribution
            const dist = { A: 0, B: 0, C: 0, D: 0, F: 0 };
            evals.forEach((e) => { if (dist[e.letter_grade] !== undefined) dist[e.letter_grade]++; });

            // Average marks
            const avg = evals.length > 0
              ? (evals.reduce((s, e) => s + e.marks_obtained, 0) / evals.length).toFixed(1)
              : null;

            // Late count
            const lateCount = subs.filter((s) => s.is_late).length;

            return {
              assignment: a,
              totalSubs:  subs.length,
              graded:     evals.length,
              lateCount,
              dist,
              avg,
            };
          })
        );
        setData(perAssignment);
      } catch (err) {
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [courseId]);

  // Overall stats
  const totalSubs   = data.reduce((s, d) => s + d.totalSubs, 0);
  const totalGraded = data.reduce((s, d) => s + d.graded, 0);
  const totalLate   = data.reduce((s, d) => s + d.lateCount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-gray-400">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          <span className="text-sm">Loading analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => navigate(`/teacher/courses/${courseId}`)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
        </svg>
        Back to Course
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-950">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">{course?.name}</p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total submissions', value: totalSubs,   color: 'text-blue-600',  bg: 'bg-blue-50'  },
          { label: 'Graded',            value: totalGraded, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Late submissions',  value: totalLate,   color: 'text-red-600',   bg: 'bg-red-50'   },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.bg} rounded-xl p-5 border border-gray-100`}>
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Per-assignment breakdown */}
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-40
          bg-white rounded-xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-400">No assignments to analyze yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map(({ assignment, totalSubs, graded, lateCount, dist, avg }) => {
            const maxDist = Math.max(...Object.values(dist), 1);
            return (
              <div key={assignment.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-gray-950">{assignment.title}</h3>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                      <span>{totalSubs} submissions</span>
                      <span>{graded} graded</span>
                      {lateCount > 0 && (
                        <span className="text-red-500">{lateCount} late</span>
                      )}
                    </div>
                  </div>
                  {avg !== null && (
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-950">{avg}</p>
                      <p className="text-xs text-gray-400">avg marks</p>
                    </div>
                  )}
                </div>

                {/* Grade distribution bars */}
                {graded > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-500 mb-2">Grade distribution</p>
                    <Bar label="A" value={dist.A} max={maxDist} color="bg-green-500" />
                    <Bar label="B" value={dist.B} max={maxDist} color="bg-blue-500"  />
                    <Bar label="C" value={dist.C} max={maxDist} color="bg-amber-400" />
                    <Bar label="D" value={dist.D} max={maxDist} color="bg-orange-400"/>
                    <Bar label="F" value={dist.F} max={maxDist} color="bg-red-500"   />
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">No grades yet</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Analytics;