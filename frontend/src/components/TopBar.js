import { useAuth } from '../context/AuthContext';
import { LogOut, Bell } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

export default function TopBar() {
  const { user, logout } = useAuth();

  return (
    <header
      data-testid="top-bar"
      className="h-14 border-b border-[#E2E8F0] flex items-center justify-between px-6"
      style={{ background: '#FFFFFF' }}
    >
      <div className="flex items-center gap-2">
        <span className="text-xs tracking-[0.2em] uppercase text-[#94A3B8]" style={{ fontFamily: 'IBM Plex Sans' }}>
          SUPPLY COMMAND // CONTROL CENTER
        </span>
        <span className="w-2 h-2 bg-[#00FF66] rounded-full animate-pulse-orange" />
        <span className="text-xs text-[#16A34A]" style={{ fontFamily: 'JetBrains Mono' }}>ONLINE</span>
      </div>

      <div className="flex items-center gap-4">
        <button data-testid="notifications-btn" className="relative p-2 text-[#64748B] hover:text-[#0F172A] transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#0055FF]" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger data-testid="user-menu-trigger" className="flex items-center gap-2 p-1 hover:bg-[#F8FAFC] transition-colors">
            <Avatar className="w-8 h-8 rounded-none">
              <AvatarImage src={user?.picture} />
              <AvatarFallback className="bg-[#E2E8F0] text-[#0055FF] rounded-none text-xs font-semibold">
                {user?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            {user && (
              <span className="text-sm text-[#64748B] hidden md:inline" style={{ fontFamily: 'IBM Plex Sans' }}>
                {user.name}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#F8FAFC] border-[#E2E8F0] rounded-none min-w-[160px]">
            <DropdownMenuItem
              data-testid="logout-btn"
              onClick={logout}
              className="text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0] cursor-pointer rounded-none"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
