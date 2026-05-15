import { createContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios.js';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true); // true on first load — checking localStorage

  // On app start, restore user from localStorage if token exists
  // This keeps user logged in after page refresh
  useEffect(() => {
    const stored = localStorage.getItem('ases_user');
    const token  = localStorage.getItem('ases_token');

    if (stored && token) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        // Corrupted data — clear and start fresh
        localStorage.removeItem('ases_user');
        localStorage.removeItem('ases_token');
      }
    }
    setLoading(false);
  }, []);

  // Called after successful login or register
  const saveAuth = useCallback((token, userData) => {
    localStorage.setItem('ases_token', token);
    localStorage.setItem('ases_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  // Logout — clear everything
  const logout = useCallback(() => {
    localStorage.removeItem('ases_token');
    localStorage.removeItem('ases_user');
    setUser(null);
  }, []);

  // Refresh user data from server — called after profile changes
  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      const updated = res.data.user;
      localStorage.setItem('ases_user', JSON.stringify(updated));
      setUser(updated);
    } catch {
      // Token invalid — log out
      logout();
    }
  }, [logout]);

  // Role helpers — used in ProtectedRoute and layouts
  const isStudent = user?.role === 'student';
  const isTeacher = user?.role === 'teacher';
  const isAdmin   = user?.role === 'admin';

  // Dashboard route per role — used after login redirect
  const getDashboardPath = useCallback((role) => {
    if (role === 'teacher') return '/teacher/dashboard';
    if (role === 'admin')   return '/admin/dashboard';
    return '/student/dashboard';
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        saveAuth,
        logout,
        refreshUser,
        isStudent,
        isTeacher,
        isAdmin,
        getDashboardPath,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};