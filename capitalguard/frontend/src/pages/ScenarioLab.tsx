import React from 'react';
import type { LiveState } from '../hooks/useCapitalGuardStream';
import { Play, TrendingDown, Activity, AlertOctagon } from 'lucide-react';

interface ScenarioLabProps {
  state: LiveState;
  sendPayload: (payload: any) => void;
}

export const ScenarioLab: React.FC<ScenarioLabProps> = ({ state, sendPayload }) => {
  const scenarios = [
    {
      id: '2008_crash',
      name: '2008 Financial Crisis Replay',
      type: 'Historical',
      severity: 'Extreme',
      icon: TrendingDown,
      desc: 'Simulates the exact market volatility and correlation breakdown observed between Sept-Nov 2008.',
      impactVaR: '-$45.2M',
      impactDrawdown: '-15.4%'
    },
    {
      id: 'covid_shock',
      name: 'COVID-19 Liquidity Shock',
      type: 'Historical',
      severity: 'High',
      icon: Activity,
      desc: 'Simulates the March 2020 liquidity vacuum and rapid asset correlation approach to 1.0.',
      impactVaR: '-$32.1M',
      impactDrawdown: '-8.9%'
    },
    {
      id: 'inflation_spike',
      name: 'Unanchored Inflation Spike',
      type: 'Synthetic',
      severity: 'High',
      icon: AlertOctagon,
      desc: 'Simulates a sudden 300bps shift in the yield curve combined with an equity selloff.',
      impactVaR: '-$28.5M',
      impactDrawdown: '-6.2%'
    }
  ];

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="pt-2 pb-4 px-2">
        <h1 className="font-display text-[48px] leading-tight tracking-[-1px] text-on-surface">
          Scenario <span className="text-primary italic font-normal">Lab</span>
        </h1>
        <p className="font-sans text-on-surface-variant text-sm tracking-wide max-w-2xl mt-2">
          Subject the current portfolio to historical and synthetic market shocks to evaluate resilience.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {scenarios.map(sc => {
          const Icon = sc.icon;
          return (
            <div key={sc.id} className="bg-core-dark rounded-xl border border-outline-variant p-6 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-surface-container p-2 rounded-lg text-on-surface-variant">
                    <Icon size={20} />
                  </div>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 bg-surface-container rounded text-[10px] font-mono text-on-surface-variant uppercase">{sc.type}</span>
                    <span className="px-2 py-0.5 bg-error-container text-danger rounded text-[10px] font-mono uppercase font-bold">{sc.severity}</span>
                  </div>
                </div>
                <h3 className="font-sans font-bold text-lg text-on-surface mb-2">{sc.name}</h3>
                <p className="text-xs font-sans text-on-surface-variant leading-relaxed mb-6">{sc.desc}</p>
                
                <div className="bg-surface-container-highest rounded-lg p-4 mb-6">
                  <div className="text-[10px] uppercase font-mono tracking-widest text-on-surface-variant mb-3">Projected Impact</div>
                  <div className="flex justify-between text-sm font-mono text-on-surface mb-2">
                    <span>Peak VaR (99%)</span>
                    <span className="text-danger">
                      {state.scenario_result?.id === sc.id ? state.scenario_result.impactVaR : sc.impactVaR}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-mono text-on-surface">
                    <span>Max Drawdown</span>
                    <span className="text-danger">
                      {state.scenario_result?.id === sc.id ? state.scenario_result.impactDrawdown : sc.impactDrawdown}
                    </span>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => sendPayload({ command: 'run_scenario', scenario_id: sc.id })}
                className="w-full flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 transition-colors py-3 rounded-full font-sans font-bold uppercase tracking-widest text-xs"
              >
                <Play size={14} />
                Run Simulation
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
