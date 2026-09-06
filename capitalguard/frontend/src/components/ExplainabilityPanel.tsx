import React, { useState } from 'react';
import { Bot, ChevronDown, ChevronUp } from 'lucide-react';

interface ExplainabilityPanelProps {
  rationale: string;
  metricsSnapshot: Record<string, string | number>;
}

export const ExplainabilityPanel: React.FC<ExplainabilityPanelProps> = ({ rationale, metricsSnapshot }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-surface-container-low border border-primary/20 rounded-lg overflow-hidden mt-3">
      <div 
        className="flex justify-between items-start p-3 cursor-pointer hover:bg-surface-container transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-primary">
            <Bot size={16} />
          </div>
          <div>
            <div className="font-sans text-xs text-on-surface leading-relaxed">
              {rationale}
            </div>
            <div className="mt-1 font-sans text-[9px] uppercase tracking-widest text-primary opacity-80">
              AI-generated commentary, not financial advice
            </div>
          </div>
        </div>
        <button className="text-on-surface-variant hover:text-on-surface p-1">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-outline-variant/30 bg-core-dark">
          <div className="font-mono text-[10px] text-on-surface-variant mb-2 mt-2 uppercase tracking-widest">
            Grounding Metrics Snapshot
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(metricsSnapshot).map(([k, v]) => (
              <div key={k} className="bg-surface-container p-2 rounded">
                <div className="text-[9px] text-on-surface-variant uppercase">{k}</div>
                <div className="font-mono text-xs text-on-surface mt-0.5">{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
