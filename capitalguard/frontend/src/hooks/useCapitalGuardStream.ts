import { useState, useEffect, useRef } from 'react';

export interface LiveState {
  aum: number;
  var_99: number;
  sharpe: number;
  utilization: number;
  beta: number;
  drawdown: number;
  drift: {
    [key: string]: { target: number; actual: number; status: string };
  };
  leverage: { gross: number; lcr: number };
  frontier: { expected_return: number; volatility: number };
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
  automated_action: {
    rationale: string;
    metricsSnapshot: Record<string, string>;
  } | null;
  demo_state: string;
  scenario_result: {
    id: string;
    impactVaR: string;
    impactDrawdown: string;
  } | null;
  component_var: Record<string, number>;
}

export const useCapitalGuardStream = (token: string | null) => {
  const [state, setState] = useState<LiveState | null>(null);
  const [connected, setConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!token) return;
    ws.current = new WebSocket(`ws://localhost:8000/ws/stream?token=${token}`);

    ws.current.onopen = () => setConnected(true);
    ws.current.onclose = () => setConnected(false);
    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setState(data);
      } catch (e) {
        console.error('Failed to parse WS message', e);
      }
    };

    return () => {
      ws.current?.close();
    };
  }, [token]);

  const sendCommand = (cmd: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ command: cmd }));
    }
  };

  const sendPayload = (payload: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(payload));
    }
  };

  return { state, connected, sendCommand, sendPayload };
};
