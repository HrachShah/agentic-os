import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

const WS_URL = import.meta.env.DEV
  ? 'ws://localhost:3000'
  : `ws://${window.location.host}`;

export function useWebSocket() {
  const { setConnected, setWs, setSkills, setSessions, setActivity, setFiles, setSystemInfo, setWorkspace, addActivity, updateMetrics } = useStore();
  const reconnectTimer = useRef<number>();
  const wsRef = useRef<WebSocket | null>(null);

  function connect() {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
    setWs(ws);

    ws.onopen = () => {
      setConnected(true);
      console.log('[WS] Connected');
      clearTimeout(reconnectTimer.current);
    };

    ws.onclose = () => {
      setConnected(false);
      setWs(null);
      console.log('[WS] Disconnected, reconnecting in 2s...');
      reconnectTimer.current = window.setTimeout(connect, 2000);
    };

    ws.onerror = () => ws.close();

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        handleMessage(msg);
      } catch (err: unknown) {
        console.error('[WS] Failed to parse message:', err);
      }
    };
  }

  function handleMessage(msg: { type: string; data: unknown }) {
    switch (msg.type) {
      case 'init': {
        const d = msg.data as {
          skills?: unknown[]; sessions?: unknown[]; history?: unknown[];
          systemInfo?: unknown; workspace?: string; files?: unknown[];
        };
        if (d.skills) setSkills(d.skills as never);
        if (d.sessions) setSessions(d.sessions as never);
        if (d.history) setActivity(d.history as never);
        if (d.systemInfo) setSystemInfo(d.systemInfo as never);
        if (d.workspace) setWorkspace(d.workspace);
        break;
      }
      case 'activity':
        addActivity(msg.data as never);
        break;
      case 'sessions_update':
        setSessions(msg.data as never);
        break;
      case 'file_change':
        // Trigger file tree refresh
        wsRef.current?.send(JSON.stringify({ type: 'get_files' }));
        break;
      case 'files':
        setFiles(msg.data as never);
        break;
      case 'system_metrics': {
        const m = msg.data as { freeMem: number; totalMem: number };
        updateMetrics(m.freeMem, m.totalMem);
        break;
      }
    }
  }

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, []);
}
