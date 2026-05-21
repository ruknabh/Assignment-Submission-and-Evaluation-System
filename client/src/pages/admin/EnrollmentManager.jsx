import { useEffect, useState, useMemo, useRef } from 'react';
import toast                                     from 'react-hot-toast';
import { getAllStudentsApi }                      from '../../api/auth.api.js';
import { getCoursesApi }                         from '../../api/course.api.js';
import {
  getEnrollmentsApi,
  directEnrollApi,
  approveEnrollmentApi,
  rejectEnrollmentApi,
  updateEnrollmentApi,
} from '../../api/enrollment.api.js';
import { formatDate } from '../../utils/helpers.js';

const StatusPill = ({ status }) => {
  const config = {
    active:    'bg-green-100 text-green-700',
    pending:   'bg-amber-100 text-amber-700',
    withdrawn: 'bg-gray-100  text-gray-600',
    rejected:  'bg-red-100   text-red-600',
    completed: 'bg-blue-100  text-blue-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full
      text-xs font-medium ${config[status] || config.pending}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// Fixed SearchableSelect:
// 1. Click-outside closes dropdown
// 2. Options filtered from stable memoized prop — no stale results
const SearchableSelect = ({ options, value, onChange, placeholder, labelKey, valueKey }) => {
  const [query,  setQuery]  = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Stable filter — options prop is memoized in parent so no false cache misses
  const filtered = useMemo(
    () => options.filter((o) =>
      String(o[labelKey] ?? '').toLowerCase().includes(query.toLowerCase())
    ),
    [options, query, labelKey]
  );

  const selected = options.find((o) => o[valueKey] === value);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen((p) => !p)}
        className="w-full flex items-center justify-between border border-gray-200
          rounded-lg px-3 py-2.5 text-sm bg-white text-left
          focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span className={selected ? 'text-gray-950' : 'text-gray-400'}>
          {selected ? selected[labelKey] : placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform shrink-0
            ${isOpen ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200
          rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              autoFocus
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                No results found
              </p>
            ) : (
              filtered.map((option) => (
                <button
                  key={option[valueKey]}
                  type="button"
                  onClick={() => {
                    onChange(option[valueKey]);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                    hover:bg-blue-50 hover:text-blue-700
                    ${option[valueKey] === value
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700'}`}
                >
                  {option[labelKey]}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const EnrollmentManager = () => {
  const [students,    setStudents]    = useState([]);
  const [courses,     setCourses]     = useState([]);
  const [enrollments, setEnrollments] = useState([]);

  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedCourse,  setSelectedCourse]  = useState('');
  const [enrolling,       setEnrolling]        = useState(false);

  const [filterCourse, setFilterCourse] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [studRes, courseRes, enrollRes] = await Promise.all([
          getAllStudentsApi(),
          getCoursesApi(),
          getEnrollmentsApi(),
        ]);
        setStudents(studRes.students         || []);
        setCourses(courseRes.courses         || []);
        setEnrollments(enrollRes.enrollments || []);
      } catch {
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Memoized option arrays — stable references prevent SearchableSelect stale filter
  const studentOptions = useMemo(
    () => students.map((s) => ({
      id:           s.id,
      displayLabel: `${s.full_name} (${s.email})`,
    })),
    [students]
  );

  const courseOptions = useMemo(
    () => courses.map((c) => ({
      id:           c.id,
      displayLabel: `${c.code} — ${c.name} (${c.semester})`,
    })),
    [courses]
  );

  const handleEnroll = async () => {
    if (!selectedStudent) { toast.error('Please select a student'); return; }
    if (!selectedCourse)  { toast.error('Please select a course');  return; }

    const alreadyActive = enrollments.some(
      (e) =>
        e.student_id === selectedStudent &&
        e.course_id  === selectedCourse  &&
        e.status     === 'active'
    );
    if (alreadyActive) {
      toast.error('This student is already enrolled in this course');
      return;
    }

    try {
      setEnrolling(true);
      const res = await directEnrollApi(selectedStudent, selectedCourse);
      toast.success(res.message || 'Student enrolled successfully!');
      const enrollRes = await getEnrollmentsApi();
      setEnrollments(enrollRes.enrollments || []);
      setSelectedStudent('');
      setSelectedCourse('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to enroll student');
    } finally {
      setEnrolling(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveEnrollmentApi(id);
      toast.success('Enrollment approved');
      setEnrollments((prev) =>
        prev.map((e) => e.id === id ? { ...e, status: 'active' } : e)
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectEnrollmentApi(id);
      toast.success('Enrollment rejected');
      setEnrollments((prev) =>
        prev.map((e) => e.id === id ? { ...e, status: 'rejected' } : e)
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    }
  };

  const handleWithdraw = async (id) => {
    try {
      await updateEnrollmentApi(id, 'withdrawn');
      toast.success('Student withdrawn');
      setEnrollments((prev) =>
        prev.map((e) => e.id === id ? { ...e, status: 'withdrawn' } : e)
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to withdraw');
    }
  };

  const handleReEnroll = async (studentId, courseId) => {
    try {
      const res = await directEnrollApi(studentId, courseId);
      toast.success('Student re-enrolled successfully');
      const enrollRes = await getEnrollmentsApi();
      setEnrollments(enrollRes.enrollments || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to re-enroll');
    }
  };

  const filtered = useMemo(() =>
    enrollments.filter((e) => {
      const matchCourse = filterCourse ? e.course_id === filterCourse : true;
      const matchStatus = filterStatus ? e.status   === filterStatus  : true;
      return matchCourse && matchStatus;
    }),
    [enrollments, filterCourse, filterStatus]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-gray-400">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10"
              stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-950">Enrollment Manager</h1>
        <p className="text-sm text-gray-500 mt-1">
          Directly enroll students or manage existing enrollment requests
        </p>
      </div>

      {/* Direct enroll card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-950 mb-1">
          Directly enroll a student
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          Skips the request process — student gains immediate access
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Select student
            </label>
            <SearchableSelect
              options={studentOptions}
              value={selectedStudent}
              onChange={setSelectedStudent}
              placeholder="Search students..."
              labelKey="displayLabel"
              valueKey="id"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Select course
            </label>
            <SearchableSelect
              options={courseOptions}
              value={selectedCourse}
              onChange={setSelectedCourse}
              placeholder="Search courses..."
              labelKey="displayLabel"
              valueKey="id"
            />
          </div>
        </div>

        <button
          onClick={handleEnroll}
          disabled={enrolling || !selectedStudent || !selectedCourse}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700
            disabled:bg-purple-300 disabled:cursor-not-allowed
            text-white text-sm font-medium rounded-lg px-5 py-2.5 transition-colors
            focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        >
          {enrolling ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10"
                  stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Enrolling...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 4v16m8-8H4"/>
              </svg>
              Enroll student
            </>
          )}
        </button>
      </div>

      {/* Enrollments table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between
          gap-3 px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-950">All enrollments</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {filtered.length} of {enrollments.length} shown
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="withdrawn">Withdrawn</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white max-w-48"
            >
              <option value="">All courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>

            {(filterStatus || filterCourse) && (
              <button
                onClick={() => { setFilterStatus(''); setFilterCourse(''); }}
                className="text-xs text-gray-400 hover:text-gray-600
                  border border-gray-200 rounded-lg px-3 py-2 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-sm text-gray-400">
              {enrollments.length === 0
                ? 'No enrollments yet'
                : 'No results match your filters'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Student', 'Course', 'Enrolled on', 'Status', 'Actions'].map((h) => (
                    <th key={h}
                      className="text-left text-xs font-medium text-gray-500
                        px-5 py-3 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50 transition-colors">

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-green-100 flex items-center
                          justify-center text-green-700 text-xs font-semibold shrink-0">
                          {e.student_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-950">
                            {e.student_name}
                          </p>
                          <p className="text-xs text-gray-400">{e.student_email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-gray-950">
                        {e.course_name}
                      </p>
                      <p className="text-xs text-gray-400">{e.course_code}</p>
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(e.enrolled_at)}
                    </td>

                    <td className="px-5 py-4">
                      <StatusPill status={e.status} />
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {e.status === 'pending' && (
                          <>
                            <button onClick={() => handleApprove(e.id)}
                              className="text-xs bg-green-600 hover:bg-green-700
                                text-white rounded-lg px-2.5 py-1.5
                                transition-colors font-medium">
                              Approve
                            </button>
                            <button onClick={() => handleReject(e.id)}
                              className="text-xs border border-red-200 text-red-600
                                hover:bg-red-50 rounded-lg px-2.5 py-1.5
                                transition-colors font-medium">
                              Reject
                            </button>
                          </>
                        )}
                        {e.status === 'active' && (
                          <button onClick={() => handleWithdraw(e.id)}
                            className="text-xs border border-gray-200 text-gray-500
                              hover:bg-gray-50 rounded-lg px-2.5 py-1.5 transition-colors">
                            Withdraw
                          </button>
                        )}
                        {['withdrawn', 'rejected'].includes(e.status) && (
                          <button
                            onClick={() => handleReEnroll(e.student_id, e.course_id)}
                            className="text-xs border border-blue-200 text-blue-600
                              hover:bg-blue-50 rounded-lg px-2.5 py-1.5 transition-colors">
                            Re-enroll
                          </button>
                        )}
                        {e.status === 'completed' && (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnrollmentManager;