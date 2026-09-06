import React from 'react';
import clsx from 'clsx';

interface ExecutionLogProps {
  logs: Array<{
    time: string;
    inst: string;
    side: string;
    notional: string;
    algo: string;
    price: string;
    latency: string;
    status: string;
    isHedge: boolean;
  }>;
}

export const ExecutionLog: React.FC<ExecutionLogProps> = ({ logs }) => {

  return (
    <div className="w-full bg-core-dark border border-outline-variant rounded-xl overflow-hidden shadow-md">
      {/* Header Strip */}
      <div className="flex justify-between items-center px-4 py-2 bg-surface-container border-b border-outline-variant">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
          <span className="font-mono text-xs text-on-surface-variant uppercase tracking-widest">Live Execution Stream</span>
        </div>
        <div className="flex gap-4 font-mono text-[10px] text-on-surface-variant">
          <span>PACKET LOSS: <span className="text-primary">0.00%</span></span>
          <span>DAILY ORDERS: <span className="text-on-surface">1,402</span></span>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs whitespace-nowrap">
          <thead className="bg-core-dark text-on-surface-variant border-b border-outline-variant">
            <tr>
              <th className="px-4 py-3 font-normal">TIME (UTC)</th>
              <th className="px-4 py-3 font-normal">INSTRUMENT</th>
              <th className="px-4 py-3 font-normal">SIDE</th>
              <th className="px-4 py-3 font-normal">NOTIONAL</th>
              <th className="px-4 py-3 font-normal">ALGO</th>
              <th className="px-4 py-3 font-normal">FILL PX</th>
              <th className="px-4 py-3 font-normal">LATENCY</th>
              <th className="px-4 py-3 font-normal">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => (
              <tr key={i} className="border-b border-surface-container hover:bg-surface-container/50 transition-colors">
                <td className="px-4 py-3 text-on-surface-variant">{log.time}</td>
                <td className="px-4 py-3 text-on-surface">{log.inst}</td>
                <td className="px-4 py-3">
                  <span className={clsx(
                    "px-1.5 py-0.5 rounded uppercase font-bold text-[10px]",
                    log.side === 'BUY' ? "bg-primary-container text-primary" : "bg-error-container text-danger"
                  )}>
                    {log.side}
                  </span>
                </td>
                <td className="px-4 py-3">{log.notional}</td>
                <td className="px-4 py-3 text-on-surface-variant">{log.algo}</td>
                <td className="px-4 py-3">{log.price}</td>
                <td className="px-4 py-3 text-primary">{log.latency}</td>
                <td className="px-4 py-3">
                  <span className="px-1.5 py-0.5 bg-surface-container rounded text-on-surface-variant border border-outline-variant text-[10px]">
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
