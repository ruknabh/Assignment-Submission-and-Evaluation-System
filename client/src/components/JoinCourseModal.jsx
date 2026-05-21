import { useState }             from 'react';
import toast                    from 'react-hot-toast';
import { searchCourseByCodeApi } from '../api/course.api.js';
import { requestEnrollmentApi }  from '../api/enrollment.api.js';

const JoinCourseModal = ({ onClose }) => {
  const [code,       setCode]       = useState('');
  const [searching,  setSearching]  = useState(false);
  const [found,      setFound]      = useState(null);   // course object if found
  const [notFound,   setNotFound]   = useState(false);
  const [requesting, setRequesting] = useState(false);

  const handleSearch = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) { toast.error('Enter a course code'); return; }

    try {
      setSearching(true);
      setFound(null);
      setNotFound(false);
      const res = await searchCourseByCodeApi(trimmed);
      if (res.courses && res.courses.length > 0) {
        setFound(res.courses[0]);
      } else {
        setNotFound(true);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setNotFound(true);
      } else {
        toast.error('Search failed. Try again.');
      }
    } finally {
      setSearching(false);
    }
  };

  const handleRequest = async () => {
    if (!found) return;
    try {
      setRequesting(true);
      const res = await requestEnrollmentApi(found.id);
      toast.success(res.message || 'Enrollment request sent!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request');
    } finally {
      setRequesting(false);
    }
  };

  // Allow pressing Enter to search
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-950">Join a course</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Enter the course code given by your teacher
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search input */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setFound(null);
              setNotFound(false);
            }}
            onKeyDown={handleKeyDown}
            placeholder="e.g. CS301"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              uppercase placeholder:normal-case"
          />
          <button
            onClick={handleSearch}
            disabled={searching || !code.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300
              text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors
              disabled:cursor-not-allowed shrink-0"
          >
            {searching ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10"
                  stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            ) : 'Search'}
          </button>
        </div>

        {/* Not found state */}
        {notFound && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200
            rounded-lg px-4 py-3 mb-4">
            <svg className="w-4 h-4 text-red-500 shrink-0" fill="none"
              stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p className="text-sm text-red-700">
              No course found with code <strong>{code}</strong>. Check with your teacher.
            </p>
          </div>
        )}

        {/* Course found — show details and confirm */}
        {found && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center
                justify-center shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13
                       C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13
                       C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13
                       C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                  {found.code}
                  {found.section ? ` • Section ${found.section}` : ''}
                </p>
                <p className="text-base font-semibold text-gray-950 mt-0.5">{found.name}</p>
                <p className="text-sm text-gray-500 mt-0.5">{found.semester}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="w-5 h-5 rounded-full bg-blue-200 flex items-center
                    justify-center shrink-0">
                    <span className="text-xs font-semibold text-blue-800">
                      {found.instructor_name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">{found.instructor_name}</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleRequest}
              disabled={requesting}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300
                text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors
                disabled:cursor-not-allowed"
            >
              {requesting ? 'Sending request...' : 'Request to join'}
            </button>
          </div>
        )}

        {/* Cancel */}
        <button
          onClick={onClose}
          className="w-full border border-gray-200 text-gray-600 text-sm font-medium
            rounded-lg px-4 py-2.5 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default JoinCourseModal;