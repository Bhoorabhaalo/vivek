import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface ShellProps {
  children: React.ReactNode;
  connected: boolean;
  onLogout: () => void;
  role: string | null;
}

export const Shell: React.FC<ShellProps> = ({ children, connected, onLogout, role }) => {
  return (
    <div className="min-h-screen bg-surface-obsidian text-on-surface font-sans selection:bg-primary selection:text-surface-obsidian">
      {/* Background ambient glow */}
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      
      {/* Latency Chip */}
      <div className="px-6 py-4">
        <div className="flex items-center gap-2 bg-surface-container rounded-full px-3 py-1.5 w-max">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-primary animate-pulse shadow-[0_0_8px_#abd600]' : 'bg-danger'}`}></div>
          <span className="font-mono text-xs text-on-surface-variant uppercase tracking-wider">
            {connected ? 'Engine: 42ms' : 'Engine: OFFLINE'}
          </span>
        </div>
      </div>
      
      <Sidebar onLogout={onLogout} role={role} />
      <Header />
      
      {/* Main Content Area */}
      <main className="pl-64 pt-20 min-h-screen relative z-0">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
