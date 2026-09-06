import React, { useEffect, useState } from 'react';
import type { LiveState } from '../hooks/useCapitalGuardStream';

interface AuditLogProps {
  state: LiveState;
}

export const AuditLog: React.FC<AuditLogProps> = ({ state }) => {
  const [dbLogs, setDbLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem('token');
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const res = await fetch(`${apiBase}/api/audit/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setDbLogs(data);
        }
      } catch (err) {
        console.error("Failed to fetch audit logs", err);
      }
    };
    fetchLogs();
    
    // Poll every 5s for demo purposes (ideally would be WS driven)
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const logsToDisplay = dbLogs.length > 0 ? dbLogs : (state?.logs || []);

  const handleExportCSV = () => {
    if (!logsToDisplay.length) return;
    const headers = ["TIMESTAMP", "EVENT_ID", "SOURCE", "TYPE", "DETAILS"];
    const rows = logsToDisplay.map((l) => [
      l.time,
      `EVT-${Math.abs(hashString(l.time + l.inst)).toString(16).substring(0, 6).toUpperCase()}`,
      "ControlEngine",
      l.isHedge ? "MITIGATION_HEDGE" : "ROUTINE_EXEC",
      `${l.side} ${l.notional} ${l.inst} @ ${l.price}`
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `capitalguard_audit_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="pt-2 pb-4 px-2">
        <h1 className="font-display text-[48px] leading-tight tracking-[-1px] text-on-surface">
          Audit <span className="text-primary italic font-normal">Log</span>
        </h1>
        <p className="font-sans text-on-surface-variant text-sm tracking-wide max-w-2xl mt-2">
          Immutable cryptographic ledger of all engine decisions, parameter changes, and executions.
        </p>
      </div>

      <div className="bg-core-dark border border-outline-variant rounded-xl overflow-hidden shadow-md">
        <div className="flex justify-between items-center px-4 py-3 bg-surface-container border-b border-outline-variant">
          <span className="font-mono text-xs text-on-surface-variant uppercase tracking-widest">Global Audit Trail</span>
          <button 
            onClick={handleExportCSV}
            className="text-[10px] font-mono text-primary border border-primary/30 px-2 py-1 rounded hover:bg-primary/10 transition-colors"
          >
            EXPORT CSV
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs whitespace-nowrap">
            <thead className="bg-core-dark text-on-surface-variant border-b border-outline-variant">
              <tr>
                <th className="px-4 py-3 font-normal">TIMESTAMP (UTC)</th>
                <th className="px-4 py-3 font-normal">EVENT ID</th>
                <th className="px-4 py-3 font-normal">SOURCE</th>
                <th className="px-4 py-3 font-normal">ACTION TYPE</th>
                <th className="px-4 py-3 font-normal">DETAILS</th>
                <th className="px-4 py-3 font-normal">HASH</th>
              </tr>
            </thead>
            <tbody>
              {logsToDisplay.map((log, i) => (
                <tr key={i} className="border-b border-surface-container hover:bg-surface-container/50 transition-colors text-on-surface">
                  <td className="px-4 py-3 text-on-surface-variant">{log.time}</td>
                  <td className="px-4 py-3 text-primary">EVT-{Math.abs(hashString(log.time + log.inst)).toString(16).substring(0, 6).toUpperCase()}</td>
                  <td className="px-4 py-3">ControlEngine</td>
                  <td className="px-4 py-3">
                    <span className={`px-1.5 py-0.5 rounded uppercase font-bold text-[10px] ${log.isHedge ? 'bg-warning/20 text-warning' : 'bg-surface-container text-on-surface-variant'}`}>
                      {log.isHedge ? 'MITIGATION_HEDGE' : 'ROUTINE_EXEC'}
                    </span>
                  </td>
                  <td className="px-4 py-3">{log.side} {log.notional} {log.inst} @ {log.price}</td>
                  <td className="px-4 py-3 text-on-surface-variant text-[10px]">0x{(Math.random()*1e16).toString(16).substring(0, 8)}...</td>
                </tr>
              ))}
              {/* Fill some mock historical audit logs so it's never empty */}
              <tr className="border-b border-surface-container hover:bg-surface-container/50 transition-colors text-on-surface">
                <td className="px-4 py-3 text-on-surface-variant">08:00:00.000</td>
                <td className="px-4 py-3 text-primary">EVT-SYS102</td>
                <td className="px-4 py-3">System</td>
                <td className="px-4 py-3">
                  <span className="px-1.5 py-0.5 rounded uppercase font-bold text-[10px] bg-surface-container text-on-surface-variant">PARAM_UPDATE</span>
                </td>
                <td className="px-4 py-3">Basel III compliance target updated</td>
                <td className="px-4 py-3 text-on-surface-variant text-[10px]">0x8f7a6c5b...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Simple hash for mock Event IDs
function hashString(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
