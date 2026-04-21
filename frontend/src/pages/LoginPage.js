import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Factory, ShieldCheck, Cpu, BarChart3 } from 'lucide-react';

export default function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  const handleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#FFFFFF' }} data-testid="login-page">
      {/* Left panel - Hero */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center"
        style={{
          backgroundImage: `url(https://static.prod-images.emergentagent.com/jobs/0e688f2e-274a-4c30-96eb-cad6852c383e/images/74d720b7b52c6df63a15b3f798a251c32465d25538fe2ae2557c5c866e77c0f0.png)`,
          backgroundSize: 'cover', backgroundPosition: 'center'
        }}>
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 p-12 max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-[#0055FF] flex items-center justify-center">
              <Factory className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter text-white" style={{ fontFamily: 'Barlow Condensed' }}>
                SUPPLY COMMAND
              </h1>
              <span className="text-[10px] tracking-[0.15em] uppercase text-[#0055FF] font-semibold" style={{ fontFamily: 'IBM Plex Sans' }}>COMMUNITY EDITION</span>
            </div>
          </div>
          <p className="text-white/70 text-lg leading-relaxed mb-10" style={{ fontFamily: 'IBM Plex Sans' }}>
            Unified Manufacturing Execution, Warehouse Management, and Enterprise Resource Planning platform.
          </p>
          <div className="space-y-4">
            {[
              { icon: Cpu, label: 'MES + ERP Integration' },
              { icon: ShieldCheck, label: 'Full Traceability & Compliance' },
              { icon: BarChart3, label: 'AI-Powered Demand Forecasting' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 border border-white/20 flex items-center justify-center bg-white/10">
                  <Icon className="w-4 h-4 text-[#0055FF]" />
                </div>
                <span className="text-sm text-white/70 tracking-wide" style={{ fontFamily: 'IBM Plex Sans' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - Login */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-[#0055FF] flex items-center justify-center">
              <Factory className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tighter" style={{ fontFamily: 'Barlow Condensed' }}>
              SUPPLY COMMAND
            </h1>
          </div>

          <div className="mb-8">
            <p className="text-xs tracking-[0.2em] uppercase text-[#64748B] mb-2" style={{ fontFamily: 'IBM Plex Sans' }}>
              ACCESS TERMINAL
            </p>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>
              SYSTEM LOGIN
            </h2>
          </div>

          <div className="border border-[#E2E8F0] bg-[#F8FAFC] p-8">
            <p className="text-sm text-[#64748B] mb-6" style={{ fontFamily: 'IBM Plex Sans' }}>
              Authenticate with your organization's Google account to access the manufacturing control system.
            </p>
            <Button
              data-testid="google-login-btn"
              onClick={handleLogin}
              className="w-full h-12 bg-[#0055FF] hover:bg-[#3377FF] text-white font-semibold text-sm tracking-wider uppercase rounded-none transition-colors duration-150"
              style={{ fontFamily: 'IBM Plex Sans' }}
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Sign in with Google
            </Button>
          </div>

          <div className="mt-6 border-t border-[#E2E8F0] pt-4">
            <p className="text-xs text-[#94A3B8] text-center" style={{ fontFamily: 'IBM Plex Sans' }}>
              SUPPLY COMMAND COMMUNITY v2.0 // Manufacturing Platform
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
