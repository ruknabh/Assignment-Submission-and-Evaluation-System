import { useEffect } from 'react';
import { useForm }   from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z }         from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import toast         from 'react-hot-toast';
import useAuth       from '../../hooks/useAuth.js';
import { loginApi }  from '../../api/auth.api.js';

// Zod schema — mirrors backend loginSchema
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
});

const Login = () => {
  const navigate = useNavigate();
  const { user, saveAuth, getDashboardPath } = useAuth();

  // Already logged in → go to dashboard
  useEffect(() => {
    if (user) {
      navigate(getDashboardPath(user.role), { replace: true });
    }
  }, [user, navigate, getDashboardPath]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data) => {
    try {
      const res = await loginApi(data);
      saveAuth(res.token, res.user);
      toast.success(`Welcome back, ${res.user.full_name.split(' ')[0]}!`);
      navigate(getDashboardPath(res.user.role), { replace: true });
    } catch (err) {
      const message = err.response?.data?.message || 'Something went wrong. Try again.';
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-gray-950">Sign in to ASES</h1>
          <p className="text-sm text-gray-600 mt-1">Academic Submission & Evaluation System</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                className={`w-full border rounded-lg px-3 py-2.5 text-sm text-gray-950 placeholder-gray-400
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  transition-colors bg-white
                  ${errors.email ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                className={`w-full border rounded-lg px-3 py-2.5 text-sm text-gray-950 placeholder-gray-400
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  transition-colors bg-white
                  ${errors.password ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
              />
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                text-white text-sm font-medium rounded-lg px-4 py-2.5
                transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign in'}
            </button>

          </form>
        </div>

        {/* Register link */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 font-medium hover:underline">
            Create one
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Login;