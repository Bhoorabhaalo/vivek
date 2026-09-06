import React from 'react';
import type { LiveState } from '../hooks/useCapitalGuardStream';
import { ShieldAlert, AlertTriangle, Info } from 'lucide-react';

interface AlertFeedProps {
  state: LiveState;
}

export const AlertFeed: React.FC<AlertFeedProps> = ({ state }) => {
  const mockAlerts = [
    {
      id: 1,
      time: '14:25:01 UTC',
      level: 'critical',
      title: 'Tier 3 Liquidity Protocol Triggered',
      desc: 'Daily VaR (99%) breached the $15M threshold with a 12% rate of change in 15 minutes. Engine deployed defensive hedge.',
      icon: ShieldAlert
    },
    {
      id: 2,
      time: '12:10:45 UTC',
      level: 'warning',
      title: 'Asset Drift Warning: US Equities',
      desc: 'Equities allocation reached 44% (Target: 40%). Rebalance solver constraints tightening.',
      icon: AlertTriangle
    },
    {
      id: 3,
      time: '09:05:12 UTC',
      level: 'info',
      title: 'Routine Policy Sync',
      desc: 'Basel III metrics refreshed. Gross leverage at 1.2x. Fully compliant.',
      icon: Info
    }
  ];

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="pt-2 pb-4 px-2">
        <h1 className="font-display text-[48px] leading-tight tracking-[-1px] text-on-surface">
          Alert <span className="text-primary italic font-normal">Feed</span>
        </h1>
        <p className="font-sans text-on-surface-variant text-sm tracking-wide max-w-2xl mt-2">
          Chronological log of engine narratives, policy breaches, and algorithmic mitigations.
        </p>
      </div>

      <div className="space-y-4">
        {state.automated_action && (
          <div className="bg-error-container/20 border border-danger/50 rounded-xl p-5 flex gap-4">
             <div className="mt-1 text-danger animate-pulse"><ShieldAlert size={20} /></div>
             <div>
               <div className="flex items-center gap-3 mb-1">
                 <span className="font-mono text-xs text-danger font-bold uppercase">Critical</span>
                 <span className="font-mono text-[10px] text-on-surface-variant">JUST NOW</span>
               </div>
               <h3 className="font-sans font-bold text-on-surface mb-2">Automated Defensive Hedge Executed</h3>
               <p className="text-sm font-sans text-on-surface-variant leading-relaxed">
                 {state.automated_action.rationale}
               </p>
               <div className="mt-4 flex gap-3">
                 {Object.entries(state.automated_action.metricsSnapshot).map(([k, v]) => (
                   <span key={k} className="px-2 py-1 bg-surface-container rounded text-xs font-mono text-on-surface border border-outline-variant">
                     {k}: <span className="text-primary">{v as string}</span>
                   </span>
                 ))}
               </div>
             </div>
          </div>
        )}

        {mockAlerts.map(alert => {
          const Icon = alert.icon;
          const isCrit = alert.level === 'critical';
          const isWarn = alert.level === 'warning';
          return (
            <div key={alert.id} className="bg-core-dark border border-outline-variant rounded-xl p-5 flex gap-4 shadow-sm hover:border-primary/50 transition-colors">
              <div className={`mt-1 ${isCrit ? 'text-danger' : isWarn ? 'text-warning' : 'text-primary'}`}>
                <Icon size={20} />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className={`font-mono text-xs font-bold uppercase ${isCrit ? 'text-danger' : isWarn ? 'text-warning' : 'text-primary'}`}>
                    {alert.level}
                  </span>
                  <span className="font-mono text-[10px] text-on-surface-variant">{alert.time}</span>
                </div>
                <h3 className="font-sans font-bold text-on-surface mb-1">{alert.title}</h3>
                <p className="text-sm font-sans text-on-surface-variant">{alert.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
