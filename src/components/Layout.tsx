import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Heart, Radio, Truck, Hospital, User } from 'lucide-react';
import ChatWidget from './ChatWidget';

const roles = [
  { path: '/user', label: 'Patient / Family', icon: User, accent: '#10b981' },
  { path: '/operator', label: 'Operator', icon: Radio, accent: '#3b82f6' },
  { path: '/field', label: 'Field Unit', icon: Truck, accent: '#f59e0b' },
  { path: '/hospital', label: 'Hospital', icon: Hospital, accent: '#8b5cf6' },
];

export default function Layout() {
  const location = useLocation();
  const currentRole = roles.find(r => r.path === location.pathname);

  return (
    <div className="min-h-screen" style={{ background: 'var(--heart-bg)' }}>
      {/* Top Navigation — Clean Light */}
      <nav
        className="sticky top-0 z-50"
        style={{
          background: 'var(--heart-surface)',
          borderBottom: '1px solid var(--heart-border-light)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
        }}
      >
        <div className="mx-auto max-w-[1600px] px-5">
          <div className="flex h-14 items-center justify-between">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl shadow-sm"
                style={{ background: 'linear-gradient(135deg, #e74c5a, #d4404f)' }}
              >
                <Heart className="h-5 w-5 text-white" fill="currentColor" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-bold tracking-wide" style={{ color: 'var(--heart-text)' }}>
                  HEART
                </span>
                <span className="text-[10px] hidden sm:block" style={{ color: 'var(--heart-text-muted)' }}>
                  Care Decision Engine
                </span>
              </div>
            </div>

            {/* Role Tabs */}
            <div
              className="flex items-center gap-1 rounded-xl p-1"
              style={{ background: 'var(--heart-bg)' }}
            >
              {roles.map(role => {
                const Icon = role.icon;
                const isActive = location.pathname === role.path;
                return (
                  <NavLink
                    key={role.path}
                    to={role.path}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200"
                    style={{
                      background: isActive ? 'var(--heart-surface)' : 'transparent',
                      color: isActive ? role.accent : 'var(--heart-text-secondary)',
                      boxShadow: isActive ? 'var(--heart-shadow)' : 'none',
                    }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{role.label}</span>
                  </NavLink>
                );
              })}
            </div>

            {/* Status */}
            <div className="hidden md:flex items-center gap-2 text-xs" style={{ color: 'var(--heart-text-muted)' }}>
              <div className="status-dot status-dot-green" />
              <span>System Active</span>
              {currentRole && (
                <span
                  className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                  style={{ background: currentRole.accent + '15', color: currentRole.accent }}
                >
                  {currentRole.label}
                </span>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-[1600px]">
        <Outlet />
      </main>
      {/* AI Chat Widget (global) */}
      <ChatWidget />
    </div>
  );
}
