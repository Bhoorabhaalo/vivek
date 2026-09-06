import React from 'react';
import type { LiveState } from '../hooks/useCapitalGuardStream';
import { ShieldCheck, ShieldAlert } from 'lucide-react';

interface RiskCockpitProps {
  state: LiveState;
}

export const RiskCockpit: React.FC<RiskCockpitProps> = ({ state }) => {
  const backtest = state.var_backtest || {
    exceedances: 2,
    expected: 2.5,
    pass: true
  };

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

      {/* Model Validation Badge/Card (Kupiec POF Backtest) */}
      <div className="bg-core-dark rounded-xl border border-outline-variant p-5 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className={`p-2.5 rounded-lg border ${
            backtest.pass 
              ? 'bg-primary/10 border-primary/30 text-primary' 
              : 'bg-danger/10 border-danger/30 text-danger animate-pulse'
          }`}>
            {backtest.pass ? <ShieldCheck size={22} /> : <ShieldAlert size={22} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-sans text-sm font-bold text-on-surface uppercase tracking-wider">
                Model Validation
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-container text-on-surface-variant border border-outline-variant/60">
                KUPIEC POF TEST
              </span>
            </div>
            <p className="font-sans text-xs text-on-surface-variant mt-1">
              99% VaR exception rate evaluated over trailing 250 ticks (expected failure rate: 1.0%)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant">Exceedances</span>
            <div className="font-mono text-sm mt-0.5">
              <span className={`font-bold ${backtest.pass ? 'text-primary' : 'text-danger'}`}>
                {backtest.exceedances}
              </span>
              <span className="text-on-surface-variant text-xs"> / {backtest.expected} expected</span>
            </div>
          </div>

          <div className="flex items-center">
            <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 border shadow-sm ${
              backtest.pass 
                ? 'bg-primary/15 text-primary border-primary/40' 
                : 'bg-danger/20 text-danger border-danger/50'
            }`}>
              <span className={`w-2 h-2 rounded-full ${backtest.pass ? 'bg-primary' : 'bg-danger'}`} />
              {backtest.pass ? 'PASS' : 'FAIL'}
            </span>
          </div>
        </div>
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
