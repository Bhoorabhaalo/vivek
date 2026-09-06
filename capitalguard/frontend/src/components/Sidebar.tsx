import React from 'react';
import { Activity, Briefcase, ShieldAlert, Sliders, FileText } from 'lucide-react';
import clsx from 'clsx';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  onLogout: () => void;
  role: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ onLogout, role }) => {
  const location = useLocation();
  const activePath = location.pathname;
  
  const navItems = [
    { label: 'Overview', icon: Briefcase, path: '/' },
    { label: 'Risk Cockpit', icon: Activity, path: '/risk' },
    { label: 'Alert Feed', icon: ShieldAlert, path: '/alerts' },
    { label: 'Scenario Lab', icon: Sliders, path: '/scenarios' },
    { label: 'Audit Log', icon: FileText, path: '/audit' },
  ];

  return (
    <div className="fixed left-0 top-0 bottom-0 w-64 bg-core-dark border-r border-outline-variant flex flex-col z-20">
      {/* Logo Area */}
      <div className="h-20 flex items-center px-6 border-b border-outline-variant">
        <h1 className="font-display text-2xl text-on-surface tracking-tight">
          Capital<span className="text-primary italic">Guard</span>
        </h1>
      </div>

      {/* Latency Chip */}
      <div className="px-6 py-4">
        <div className="flex items-center gap-2 bg-surface-container rounded-full px-3 py-1.5 w-max">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#abd600]"></div>
          <span className="font-mono text-xs text-on-surface-variant uppercase tracking-wider">Engine: 42ms</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePath === item.path;
          return (
            <Link
              to={item.path}
              key={item.label}
              className={clsx(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-sans uppercase tracking-wider transition-colors",
                isActive 
                  ? "bg-primary-container text-primary border-l-2 border-primary" 
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-outline-variant text-xs font-mono text-on-surface-variant flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="uppercase tracking-widest text-[10px] text-primary">Autonomy Level</span>
          <span>TIER 4: BOUNDED</span>
          <span className="mt-2 text-[10px] opacity-50">v1.0.0-rc.1</span>
        </div>
        <div className="flex flex-col gap-1 border-t border-outline-variant/50 pt-4">
          <span className="uppercase tracking-widest text-[10px] text-primary">Active Role</span>
          <span className="text-on-surface font-bold">{role || 'UNKNOWN'}</span>
          <button 
            onClick={onLogout}
            className="mt-2 text-[10px] text-danger border border-danger/30 px-2 py-1 rounded hover:bg-danger/10 transition-colors w-max"
          >
            TERMINATE SESSION
          </button>
        </div>
      </div>
    </div>
  );
};
