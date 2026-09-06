import React, { useState } from 'react';
import type { LiveState } from '../hooks/useCapitalGuardStream';
import { Play, TrendingDown, Activity, AlertOctagon, Sliders } from 'lucide-react';

interface ScenarioLabProps {
  state: LiveState;
  sendPayload: (payload: any) => void;
}

interface SliderFieldProps {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  unit: string;
  onChange: (v: number) => void;
  colorClass: string;
}

const SliderField: React.FC<SliderFieldProps> = ({
  id, label, min, max, step, value, unit, onChange, colorClass,
}) => (
  <div>
    <div className="flex justify-between items-baseline mb-1.5">
      <label htmlFor={id} className="text-xs font-sans uppercase tracking-widest text-on-surface-variant">
        {label}
      </label>
      <span className={`font-mono text-sm font-bold ${colorClass}`}>
        {value > 0 ? '+' : ''}{value}{unit}
      </span>
    </div>
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary bg-surface-container-highest"
    />
    <div className="flex justify-between text-[10px] font-mono text-on-surface-variant mt-1">
      <span>{min}{unit}</span>
      <span>0{unit}</span>
      <span>+{max}{unit}</span>
    </div>
  </div>
);

export const ScenarioLab: React.FC<ScenarioLabProps> = ({ state, sendPayload }) => {
  const [equityPct, setEquityPct] = useState<number>(-10);
  const [rateBps, setRateBps] = useState<number>(100);
  const [creditBps, setCreditBps] = useState<number>(150);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleCustomSubmit = () => {
    setIsSubmitting(true);
    sendPayload({
      command: 'run_scenario',
      scenario_id: 'custom',
      params: {
        equity_pct: equityPct,
        rate_bps: rateBps,
        credit_bps: creditBps,
      },
    });
    setTimeout(() => setIsSubmitting(false), 1500);
  };

  const customResult = state.scenario_result?.id === 'custom' ? state.scenario_result : null;

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

      {/* Canned scenario cards */}
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

      {/* ── Custom Shock Form ── */}
      <div className="bg-core-dark rounded-xl border border-outline-variant p-6 shadow-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-surface-container p-2 rounded-lg text-primary">
            <Sliders size={20} />
          </div>
          <div>
            <h3 className="font-sans font-bold text-lg text-on-surface">Custom Shock</h3>
            <p className="text-xs font-sans text-on-surface-variant mt-0.5">
              Compose a bespoke multi-factor shock across equity, rates, and credit.
            </p>
          </div>
          <span className="ml-auto px-2 py-0.5 bg-primary/10 text-primary border border-primary/30 rounded text-[10px] font-mono uppercase tracking-wider">
            Synthetic
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <SliderField
            id="equity-shock"
            label="Equity Shock"
            min={-50}
            max={20}
            step={1}
            value={equityPct}
            unit="%"
            onChange={setEquityPct}
            colorClass={equityPct < 0 ? 'text-danger' : 'text-primary'}
          />
          <SliderField
            id="rate-shock"
            label="Rate Shock"
            min={-200}
            max={500}
            step={25}
            value={rateBps}
            unit=" bps"
            onChange={setRateBps}
            colorClass={rateBps > 0 ? 'text-warning' : 'text-primary'}
          />
          <SliderField
            id="credit-shock"
            label="Credit Spread Shock"
            min={0}
            max={1000}
            step={25}
            value={creditBps}
            unit=" bps"
            onChange={setCreditBps}
            colorClass={creditBps > 0 ? 'text-danger' : 'text-primary'}
          />
        </div>

        {/* Result strip — visible after a custom run */}
        {customResult && (
          <div className="bg-surface-container-highest rounded-lg px-5 py-4 mb-5 flex flex-wrap gap-6 items-center">
            <div className="text-[10px] uppercase font-mono tracking-widest text-on-surface-variant">Live Result</div>
            <div className="flex gap-6">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant">Peak VaR (99%)</div>
                <div className="font-mono text-sm text-danger font-bold mt-0.5">{customResult.impactVaR}</div>
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant">Portfolio Δ</div>
                <div className="font-mono text-sm text-danger font-bold mt-0.5">{customResult.impactDrawdown}</div>
              </div>
            </div>
          </div>
        )}

        <button
          id="run-custom-shock"
          onClick={handleCustomSubmit}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed text-primary border border-primary/30 transition-all py-3 rounded-full font-sans font-bold uppercase tracking-widest text-xs"
        >
          {isSubmitting ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play size={14} />
              Run Custom Shock
            </>
          )}
        </button>
      </div>
    </div>
  );
};

