import React from 'react';
import { AlertOctagon } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="fixed top-0 left-64 right-0 h-20 bg-core-dark/80 backdrop-blur-md border-b border-outline-variant z-10 flex items-center justify-between px-8">
      {/* Cluster Status Readouts */}
      <div className="flex h-full items-center">
        <div className="flex flex-col justify-center pr-6 h-full border-r border-outline-variant mr-6">
          <span className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest">Cluster: NY4-Alpha</span>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
            <span className="font-mono text-xs text-primary">Online</span>
          </div>
        </div>
        <div className="flex flex-col justify-center pr-6 h-full border-r border-outline-variant">
          <span className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest">Total AUM</span>
          <span className="font-mono text-xl text-on-surface">$1.24B</span>
        </div>
        <div className="flex flex-col justify-center px-6 h-full border-r border-outline-variant">
          <span className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest">Daily VaR (99%)</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-mono text-xl text-on-surface">-$18.4M</span>
            <span className="px-1.5 py-0.5 rounded border border-primary text-primary text-[10px] font-mono">1.48%</span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-6">
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('reset-demo'))}
          className="text-xs font-sans uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors"
        >
          Reset Demo
        </button>
        <button className="flex items-center gap-2 bg-error-container hover:bg-danger text-on-surface px-4 py-2 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 border border-danger">
          <AlertOctagon size={16} />
          <span className="font-sans uppercase tracking-widest text-xs font-bold">Halt Execution</span>
        </button>
        <div className="w-px h-8 bg-outline-variant"></div>
        <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center font-mono text-xs text-on-surface border border-outline-variant">
          JS
        </div>
      </div>
    </header>
  );
};
