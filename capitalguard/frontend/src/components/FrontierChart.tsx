import React from 'react';
import type { LiveState } from '../hooks/useCapitalGuardStream';

interface FrontierChartProps {
  state: LiveState;
}

export const FrontierChart: React.FC<FrontierChartProps> = ({ state }) => {
  return (
    <div className="bg-core-dark rounded-xl border border-outline-variant p-6 w-full shadow-md relative overflow-hidden h-[340px] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-sans text-xl">Capital Frontier</h2>
        <div className="flex bg-surface-container rounded-md p-1">
          {['1D', '1W', '1M', 'YTD', '3Y'].map((tf, i) => (
            <button key={tf} className={`text-[10px] font-mono px-3 py-1 rounded ${i === 3 ? 'bg-primary text-surface-obsidian' : 'text-on-surface-variant'}`}>
              {tf}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 relative w-full h-full">
        <svg viewBox="0 0 680 260" className="w-full h-full" preserveAspectRatio="none">
          {/* Grid lines */}
          <line x1="0" y1="200" x2="680" y2="200" stroke="#353535" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="0" y1="130" x2="680" y2="130" stroke="#353535" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="0" y1="60" x2="680" y2="60" stroke="#353535" strokeWidth="1" strokeDasharray="4 4" />
          
          <line x1="170" y1="0" x2="170" y2="260" stroke="#353535" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="340" y1="0" x2="340" y2="260" stroke="#353535" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="510" y1="0" x2="510" y2="260" stroke="#353535" strokeWidth="1" strokeDasharray="4 4" />
          
          {/* CML Line */}
          <line x1="0" y1="220" x2="680" y2="20" stroke="#698500" strokeWidth="1" strokeDasharray="6 6" />
          
          {/* Dispersion Band */}
          <path d="M 100 240 Q 300 150 600 50 L 600 120 Q 300 200 100 250 Z" fill="rgba(171,214,0,0.05)" />

          {/* Sub-optimal clouds */}
          {Array.from({length: 40}).map((_, i) => (
             <circle key={i} cx={150 + Math.random()*400} cy={100 + Math.random()*120} r="2" fill="#353535" />
          ))}

          {/* Efficient Frontier Curve */}
          <path d="M 100 230 Q 300 80 600 30" fill="none" stroke="#ccff00" strokeWidth="3" />

          {/* Benchmark Node */}
          <circle cx="350" cy="140" r="5" fill="#FF9500" />
          <text x="360" y="145" fill="#FF9500" fontSize="10" fontFamily="monospace">S&P 500</text>

          {/* Legend */}
          <g transform="translate(10, 20)">
            <circle cx="0" cy="0" r="4" fill="#ccff00" />
            <text x="10" y="3" fill="#cdc5bc" fontSize="9" fontFamily="monospace">Active Portfolio</text>
            <circle cx="0" cy="15" r="4" fill="#FF9500" />
            <text x="10" y="18" fill="#cdc5bc" fontSize="9" fontFamily="monospace">S&P 500 Benchmark</text>
            <circle cx="0" cy="30" r="3" fill="#353535" />
            <text x="10" y="33" fill="#cdc5bc" fontSize="9" fontFamily="monospace">Sub-optimal Portfolios</text>
          </g>

          {/* Active Portfolio Node */}
          <circle cx={400 + (state.frontier.volatility - 10) * 40} cy={100 - (state.frontier.expected_return - 7) * 20} r="7" fill="#ccff00" className="animate-pulse transition-all duration-1000" />
          <circle cx={400 + (state.frontier.volatility - 10) * 40} cy={100 - (state.frontier.expected_return - 7) * 20} r="14" fill="rgba(204,255,0,0.2)" className="transition-all duration-1000" />
          
          <g transform="translate(380, 25)">
            <rect width="130" height="30" rx="4" fill="#0b1000" stroke="#698500" />
            <text x="10" y="19" fill="#ccff00" fontSize="10" fontFamily="monospace">Exp 1Y Alpha: +4.2%</text>
          </g>
          
          {/* Axes labels */}
          <text x="10" y="250" fill="#cdc5bc" fontSize="10" fontFamily="monospace">Expected Volatility (σ)</text>
          <text x="650" y="10" fill="#cdc5bc" fontSize="10" fontFamily="monospace" textAnchor="end">E[R]</text>
        </svg>
      </div>
    </div>
  );
};
