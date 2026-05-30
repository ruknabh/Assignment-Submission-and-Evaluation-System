import { useNavigate } from 'react-router-dom';
import useAuth         from '../hooks/useAuth.js';

const NotFound = () => {
  const navigate = useNavigate();
  const { user, getDashboardPath } = useAuth();

  const handleGoHome = () => {
    if (user) {
      navigate(getDashboardPath(user.role), { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">

        {/* Large 404 */}
        <div className="mb-6">
          <p className="text-8xl font-bold text-blue-600 leading-none">404</p>
          <div className="h-1 w-16 bg-blue-600 rounded-full mx-auto mt-3" />
        </div>

        <h1 className="text-2xl font-semibold text-gray-950 mb-2">
          Page not found
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          The page you're looking for doesn't exist or you don't have
          permission to access it.
        </p>

        <button
          onClick={handleGoHome}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700
            text-white text-sm font-medium rounded-lg px-6 py-2.5 transition-colors
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0
                 00-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          </svg>
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};

export default NotFound;