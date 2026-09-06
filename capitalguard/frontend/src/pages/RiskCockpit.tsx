import React from 'react';
import type { LiveState } from '../hooks/useCapitalGuardStream';

interface RiskCockpitProps {
  state: LiveState;
}

export const RiskCockpit: React.FC<RiskCockpitProps> = ({ state }) => {
  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="pt-2 pb-4 px-2">
        <h1 className="font-display text-[48px] leading-tight tracking-[-1px] text-on-surface">
          Risk <span className="text-primary italic font-normal">Cockpit</span>
        </h1>
        <p className="font-sans text-on-surface-variant text-sm tracking-wide max-w-2xl mt-2">
          Deep-dive analytics into portfolio tail risk, factor exposure, and stress conditions.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Component VaR Breakdown */}
        <div className="bg-core-dark rounded-xl border border-outline-variant p-6 shadow-md">
          <h3 className="font-sans text-sm uppercase tracking-widest text-on-surface-variant mb-6">Component VaR (99%)</h3>
          <div className="space-y-4">
            {[
              { asset: 'Equities', key: 'Equity' },
              { asset: 'Fixed Income', key: 'Fixed Income' },
              { asset: 'Corporate Bonds', key: 'Corporate_Bond' },
              { asset: 'Alternatives', key: 'Alternatives' },
            ].map((item) => {
              const val = state.component_var?.[item.key] ? Math.abs(state.component_var[item.key]) / 1e6 : (item.key === 'Equity' ? 8.2 : item.key === 'Fixed Income' ? 3.1 : 4.5);
              const max = 15.0; // Scaled max
              return (
              <div key={item.asset}>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-on-surface">{item.asset}</span>
                  <span className="text-on-surface-variant">${val.toFixed(1)}M</span>
                </div>
                <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500" 
                    style={{ width: `${(val / max) * 100}%` }}
                  />
                </div>
              </div>
              );
            })}
          </div>
        </div>

        {/* Marginal Risk Contributions */}
        <div className="bg-core-dark rounded-xl border border-outline-variant p-6 shadow-md">
          <h3 className="font-sans text-sm uppercase tracking-widest text-on-surface-variant mb-6">Factor Exposures (Beta)</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { factor: 'Market Risk', beta: state.beta },
              { factor: 'Interest Rate', beta: -0.32 },
              { factor: 'Credit Spread', beta: 0.15 },
              { factor: 'Liquidity', beta: -0.08 },
            ].map(f => (
              <div key={f.factor} className="bg-surface-container rounded-lg p-4 border border-outline-variant/50">
                <div className="text-[10px] uppercase font-sans tracking-widest text-on-surface-variant">{f.factor}</div>
                <div className="text-xl font-mono mt-1 text-on-surface">{f.beta > 0 ? '+' : ''}{f.beta.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Monte Carlo Simulated Tail Risk */}
      <div className="bg-core-dark rounded-xl border border-outline-variant p-6 shadow-md">
        <h3 className="font-sans text-sm uppercase tracking-widest text-on-surface-variant mb-4">Expected Shortfall (CVaR) Profile</h3>
        <div className="h-64 flex items-end gap-1 px-4 border-b border-l border-outline-variant pb-1 ml-4 mt-8 relative">
           {/* Mock histogram for CVaR tail */}
           {Array.from({ length: 40 }).map((_, i) => {
             const height = Math.exp(-Math.pow(i - 20, 2) / 40) * 100;
             const isTail = i < 8;
             return (
               <div 
                 key={i} 
                 className={`flex-1 ${isTail ? 'bg-danger' : 'bg-primary/40'} rounded-t-sm transition-all duration-300`}
                 style={{ height: `${height}%` }}
               />
             );
           })}
           <div className="absolute left-8 -bottom-6 text-xs font-mono text-danger">99% Tail</div>
           <div className="absolute left-[50%] -bottom-6 text-xs font-mono text-on-surface-variant">Mean Return</div>
        </div>
      </div>
    </div>
  );
};
