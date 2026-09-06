import React from 'react';
import clsx from 'clsx';

interface KPICardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  delta: string;
  deltaType: 'positive' | 'negative' | 'neutral';
  progress?: number;
}

export const KPICard: React.FC<KPICardProps> = ({ label, value, icon: Icon, delta, deltaType, progress }) => {
  return (
    <div className="bg-core-dark rounded-xl p-5 border border-outline-variant shadow-md relative overflow-hidden flex flex-col justify-between h-32">
      <div className="flex justify-between items-start">
        <span className="font-sans uppercase text-[10px] tracking-widest text-on-surface-variant flex items-center">
          {label}
        </span>
        <div className="flex items-center gap-2">
          <span className={clsx(
            "font-mono text-xs px-2 py-0.5 rounded",
            deltaType === 'positive' ? "text-primary bg-primary-container" :
            deltaType === 'negative' ? "text-danger bg-error-container" :
            "text-on-surface-variant bg-surface-container"
          )}>
            {delta}
          </span>
          <Icon size={16} className="opacity-70 text-on-surface-variant" />
        </div>
      </div>
      
      <div className="mt-4 font-mono text-3xl text-on-surface">
        {value}
      </div>

      {progress !== undefined && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-container">
          <div 
            className={clsx("h-full", deltaType === 'negative' ? "bg-danger" : "bg-primary")} 
            style={{ width: `${progress}%` }} 
          />
        </div>
      )}
    </div>
  );
};
