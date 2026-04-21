import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';

export default function AuthCallback() {
  const hasProcessed = useRef(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = window.location.hash;
    const match = hash.match(/session_id=([^&]+)/);
    if (!match) {
      navigate('/login');
      return;
    }

    const sessionId = match[1];

    (async () => {
      try {
        const res = await fetch(`${API}/auth/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ session_id: sessionId }),
        });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          navigate('/dashboard', { state: { user: userData }, replace: true });
        } else {
          navigate('/login');
        }
      } catch {
        navigate('/login');
      }
    })();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#FFFFFF' }}>
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#0055FF] border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-[#64748B] text-sm tracking-[0.2em] uppercase font-['IBM_Plex_Sans']">Authenticating...</p>
      </div>
    </div>
  );
}
