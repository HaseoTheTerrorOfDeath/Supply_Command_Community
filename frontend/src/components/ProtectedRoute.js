import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FFFFFF' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#0055FF] border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-[#64748B] text-sm tracking-[0.2em] uppercase font-['IBM_Plex_Sans']">Loading System...</p>
        </div>
      </div>
    );
  }

  if (!user && !location.state?.user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
