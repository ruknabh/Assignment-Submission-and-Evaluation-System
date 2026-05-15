import { BrowserRouter } from 'react-router-dom';
import { Toaster }       from 'react-hot-toast';
import { AuthProvider }  from './context/AuthContext.jsx';
import AppRouter         from './routes/AppRouter.jsx';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Global toast notifications — available everywhere */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: 'Inter, sans-serif',
              fontSize:   '14px',
              fontWeight: '500',
            },
            success: {
              style: { background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0' },
            },
            error: {
              style: { background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' },
            },
          }}
        />
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;