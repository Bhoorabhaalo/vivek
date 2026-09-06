import React from 'react';
import { KPICard } from '../components/KPICard';
import { PolicyPanel } from '../components/PolicyPanel';
import { FrontierChart } from '../components/FrontierChart';
import { ExecutionLog } from '../components/ExecutionLog';
import { ExplainabilityPanel } from '../components/ExplainabilityPanel';
import { Briefcase, Activity, TrendingUp, DollarSign, ShieldAlert, BarChart2 } from 'lucide-react';
import type { LiveState } from '../hooks/useCapitalGuardStream';

interface OverviewProps {
  state: LiveState;
}

export const Overview: React.FC<OverviewProps> = ({ state }) => {
  const formatCurrency = (val: number) => {
    if (Math.abs(val) >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (Math.abs(val) >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
    return `$${val.toLocaleString()}`;
  };

  return (
    <div className="flex flex-col gap-6 pb-12 relative">
      {/* Ambient Glows for Hero */}
      <div className="absolute top-0 left-[20%] w-[40%] h-32 rounded-full bg-primary/10 blur-[80px] pointer-events-none" />
      <div className="absolute top-10 right-[30%] w-[30%] h-32 rounded-full bg-primary/5 blur-[100px] pointer-events-none" />
      
      {/* Hero Section */}
      <div className="pt-2 pb-4 px-2 relative z-10 flex flex-col gap-2">
        <h1 className="font-display text-[72px] leading-[1.08] tracking-[-1px]">
          <span className="text-on-surface">Intelligent Liquidity </span>
          <span className="text-primary italic font-normal">&amp; Algorithmic Hedging</span>
        </h1>
        <p className="font-sans text-on-surface-variant text-sm tracking-wide max-w-2xl">
          Adaptive risk modeling and deterministic control executed at sub-second latency.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4 relative z-10">
        <KPICard 
          label="Total Managed Capital" 
          value={formatCurrency(state.aum)} 
          icon={Briefcase} 
          delta="+1.2%" 
          deltaType="positive" 
        />
        <KPICard 
          label="Daily VaR (99%)" 
          value={formatCurrency(state.var_99)} 
          icon={Activity} 
          delta={state.demo_state === 'calm' ? "Watch" : "Alert"} 
          deltaType={state.demo_state === 'calm' ? "neutral" : "negative"}
          progress={state.demo_state === 'calm' ? 80 : 95}
        />
        <KPICard 
          label="Sharpe Ratio" 
          value={state.sharpe.toFixed(2)} 
          icon={TrendingUp} 
          delta="+0.1" 
          deltaType="positive"
        />
        <KPICard
          label="RAROC"
          value={state.raroc.toFixed(2) + '×'}
          icon={BarChart2}
          delta={state.raroc >= 1 ? 'Above Hurdle' : 'Below Hurdle'}
          deltaType={state.raroc >= 1 ? 'positive' : 'negative'}
        />
        <KPICard 
          label="Capital Utilization" 
          value={`${state.utilization.toFixed(1)}%`} 
          icon={DollarSign} 
          delta="-2.1%" 
          deltaType="neutral" 
          progress={state.utilization}
        />
        <KPICard 
          label="Portfolio Beta" 
          value={state.beta.toFixed(2)} 
          icon={ShieldAlert} 
          delta="Target: 0.8" 
          deltaType="neutral" 
        />
      </div>

      {/* Main Two-Column Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Left Column: 5-col */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          <PolicyPanel state={state} />
          
          {state.automated_action ? (
            <div className="mt-4">
              <h3 className="font-sans text-sm uppercase tracking-widest text-on-surface-variant mb-4">Recent Automated Action</h3>
              <ExplainabilityPanel 
                rationale={state.automated_action.rationale}
                metricsSnapshot={state.automated_action.metricsSnapshot}
              />
            </div>
          ) : (
            <div className="mt-4 border border-outline-variant/30 rounded-xl p-4 text-center text-on-surface-variant font-sans text-xs">
              No automated actions in the current session.
            </div>
          )}
        </div>

        {/* Right Column: 7-col */}
        <div className="xl:col-span-7 flex flex-col gap-8">
          <FrontierChart state={state} />
          <ExecutionLog logs={state.logs} />
        </div>
      </div>
    </div>
  );
};
