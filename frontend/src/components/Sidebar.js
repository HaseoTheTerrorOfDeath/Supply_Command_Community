import { NavLink } from 'react-router-dom';
import { Factory, LayoutDashboard, Cog, Package, Warehouse, Truck, Search, Brain, Bot, Building2, PanelLeftClose, PanelLeft } from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/production', icon: Cog, label: 'Production' },
  { to: '/inventory', icon: Package, label: 'Inventory' },
  { to: '/warehouse', icon: Warehouse, label: 'Warehouse' },
  { to: '/supply-chain', icon: Truck, label: 'Supply Chain' },
  { to: '/traceability', icon: Search, label: 'Traceability' },
];

export default function Sidebar({ collapsed, onToggle }) {
  return (
    <aside
      data-testid="sidebar"
      className="fixed left-0 top-0 h-screen border-r border-[#E2E8F0] flex flex-col z-50"
      style={{
        width: collapsed ? '64px' : '240px',
        background: '#FFFFFF',
        transition: 'width 150ms ease-in-out',
      }}
    >
      {/* Logo */}
      <div className="h-14 flex items-center border-b border-[#E2E8F0] px-4">
        <div className="w-8 h-8 bg-[#0055FF] flex items-center justify-center flex-shrink-0">
          <Factory className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="ml-3 flex flex-col">
            <span className="text-lg font-black uppercase tracking-tighter whitespace-nowrap text-[#0F172A]" style={{ fontFamily: 'Barlow Condensed' }}>
              SUPPLY CMD
            </span>
            <span className="text-[8px] tracking-[0.15em] uppercase text-[#0055FF] font-semibold -mt-1" style={{ fontFamily: 'IBM Plex Sans' }}>COMMUNITY</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {!collapsed && (
          <p className="px-4 mb-2 text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]" style={{ fontFamily: 'IBM Plex Sans' }}>
            MODULES
          </p>
        )}
        <ul className="space-y-0.5 px-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                data-testid={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 text-sm transition-colors duration-150 ${
                    isActive
                      ? 'bg-[#0055FF]/10 text-[#0055FF] border-l-2 border-[#0055FF]'
                      : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] border-l-2 border-transparent'
                  }`
                }
                style={{ fontFamily: 'IBM Plex Sans' }}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="truncate">{label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-[#E2E8F0] p-2">
        <button
          data-testid="sidebar-toggle"
          onClick={onToggle}
          className="w-full flex items-center justify-center p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors duration-150"
        >
          {collapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  );
}
