import React, { useState } from 'react';
import type { LiveState } from '../hooks/useCapitalGuardStream';

interface PolicyPanelProps {
  state: LiveState;
}

export const PolicyPanel: React.FC<PolicyPanelProps> = ({ state }) => {
  const [driftEnabled, setDriftEnabled] = useState(true);
  const [slippage, setSlippage] = useState(15);

  return (
    <div className="flex flex-col gap-6">
      {/* Auto-Drift Engaged Pill */}
      <div className="flex items-center gap-2 w-max bg-primary-container border border-primary/30 px-3 py-1 rounded-full mb-[-12px] z-10 relative left-4">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#abd600]"></div>
        <span className="font-sans text-[10px] uppercase tracking-widest text-primary font-bold">Auto-Drift Engaged</span>
      </div>
      <div className="flex items-center gap-3 bg-surface-container rounded-xl p-4 pt-6 border border-outline-variant">
        <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
          <input 
            type="checkbox" 
            name="toggle" 
            id="toggle" 
            checked={driftEnabled}
            onChange={() => setDriftEnabled(!driftEnabled)}
            className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-surface-obsidian border-4 appearance-none cursor-pointer border-surface-container-highest checked:border-primary checked:bg-primary transition-colors"
          />
          <label htmlFor="toggle" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${driftEnabled ? 'bg-primary-container' : 'bg-surface-container-highest'}`}></label>
        </div>
        <div>
          <h3 className="font-sans font-bold text-sm">Continuous Drift Hedging</h3>
          <p className="font-sans text-xs text-on-surface-variant">Tier 3 Auto-Acting is ready</p>
        </div>
      </div>

      {/* Slippage Tolerance Slider */}
      <div className="bg-core-dark rounded-xl p-5 border border-outline-variant shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-sans text-sm uppercase tracking-widest text-on-surface-variant">Slippage Tolerance</h3>
          <span className="font-mono text-primary">{slippage} bps</span>
        </div>
        <input 
          type="range" 
          min="1" 
          max="50" 
          value={slippage}
          onChange={(e) => setSlippage(parseInt(e.target.value))}
          className="w-full h-1 bg-surface-container rounded-lg appearance-none cursor-pointer accent-background-lime"
        />
      </div>

      {/* Drawdown Zone Bar */}
      <div className="bg-core-dark rounded-xl p-5 border border-outline-variant shadow-md">
        <h3 className="font-sans text-sm uppercase tracking-widest text-on-surface-variant mb-4">Drawdown Zone</h3>
        <div className="w-full h-3 flex rounded-full overflow-hidden relative">
          {/* Current Position Marker */}
          <div className="absolute top-0 bottom-0 w-1 bg-background-lime shadow-[0_0_5px_#ccff00] z-10 transition-all" style={{ left: `${Math.abs(state.drawdown) * 10}%` }}></div>
          
          <div className="bg-primary flex-[0.7] relative">
             <div className="absolute top-0 bottom-0 right-0 w-px bg-surface-obsidian"></div>
          </div>
          <div className="bg-warning flex-[0.2] relative">
            <div className="absolute top-0 bottom-0 right-0 w-px bg-surface-obsidian"></div>
          </div>
          <div className="bg-danger flex-[0.1]"></div>
        </div>
        <div className="mt-2 flex justify-between text-[10px] font-mono text-on-surface-variant relative">
          <span>Safe (-0%)</span>
          <span className="absolute -ml-4 text-background-lime font-bold transition-all" style={{ left: `${Math.abs(state.drawdown) * 10}%` }}>{state.drawdown.toFixed(1)}%</span>
          <span>Warn (-5%)</span>
          <span>Halt (-10%)</span>
        </div>
      </div>

      {/* Asset Drift List */}
      <div className="bg-core-dark rounded-xl p-5 border border-outline-variant shadow-md">
        <h3 className="font-sans text-sm uppercase tracking-widest text-on-surface-variant mb-4">Asset Drift</h3>
        <div className="space-y-4">
          {Object.entries(state.drift).map(([id, asset]) => (
            <div key={id}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-sans text-xs">{id}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-on-surface-variant">T:{asset.target.toFixed(1)}% A:{asset.actual.toFixed(1)}%</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                    asset.status === 'Over' ? 'bg-error-container text-danger' :
                    asset.status === 'Under' ? 'bg-primary-container text-primary' :
                    'bg-surface-container text-on-surface-variant'
                  }`}>{asset.status}</span>
                </div>
              </div>
              <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-on-surface-variant" style={{ width: `${(asset.actual/100)*100}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rebalance CTA */}
      <button className="w-full bg-background-lime text-surface-obsidian hover:scale-[1.02] active:scale-[0.98] transition-all py-3 rounded-full font-sans font-bold uppercase tracking-widest text-xs shadow-[0_0_15px_rgba(171,214,0,0.2)]">
        Stage Algorithmic Rebalance
      </button>

      {/* Basel III Compliance */}
      <div className="flex flex-col gap-3 p-4 bg-core-dark border border-outline-variant rounded-xl">
        <div className="flex items-center justify-between">
          <span className="font-sans text-xs uppercase tracking-widest text-on-surface-variant">Basel III Profile</span>
          <span className="bg-primary-container text-primary px-2 py-1 rounded text-[10px] font-mono border border-primary/20">COMPLIANT</span>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-outline-variant">
          <div>
            <div className="text-[10px] font-sans uppercase tracking-widest text-on-surface-variant">Gross Leverage</div>
            <div className="font-mono text-sm text-on-surface mt-1">{state.leverage.gross.toFixed(1)}x <span className="text-[10px] text-on-surface-variant ml-1">/ 2.5x</span></div>
          </div>
          <div>
            <div className="text-[10px] font-sans uppercase tracking-widest text-on-surface-variant">Liq. Cov. (LCR)</div>
            <div className="font-mono text-sm text-on-surface mt-1">{state.leverage.lcr.toFixed(0)}% <span className="text-[10px] text-on-surface-variant ml-1">&gt; 100%</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};
