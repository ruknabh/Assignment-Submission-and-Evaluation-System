import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

// Clean hook — components never import AuthContext directly
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
};

export default useAuth;