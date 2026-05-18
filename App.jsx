import React, { useState, useEffect, useRef, useCallback } from 'react';
import Wallet       from './components/Wallet.jsx';
import Chat         from './components/Chat.jsx';
import BlockExplorer from './components/BlockExplorer.jsx';

const WS_URL = 'ws://localhost:6001';

export default function App() {
  const [wallet,     setWallet]    = useState(null);
  const [blockchain, setBlockchain] = useState([]);
  const [wsStatus,   setWsStatus]  = useState('disconnected'); // 'connecting' | 'connected' | 'disconnected'
  const [isMining,   setIsMining]  = useState(false);
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);

  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    setWsStatus('connecting');

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WS] Connected to ChronoChain node');
      setWsStatus('connected');
      clearTimeout(reconnectTimer.current);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === 'CHAIN') {
          // Full chain sync on connect
          setBlockchain(msg.data);
        } else if (msg.type === 'BLOCK') {
          // New block mined — append to chain
          setBlockchain(prev => {
            // Avoid duplicates by index
            if (prev.some(b => b.index === msg.data.index)) return prev;
            return [...prev, msg.data];
          });
          // Stop mining indicator
          setIsMining(false);
        }
      } catch (err) {
        console.error('[WS] Parse error:', err);
      }
    };

    ws.onclose = () => {
      console.warn('[WS] Disconnected. Reconnecting in 3s…');
      setWsStatus('disconnected');
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = (err) => {
      console.error('[WS] Error:', err);
      ws.close();
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return (
    <div className="app-shell">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="header">
        <div className="header-logo">
          <div className="header-logo-icon">⛓</div>
          <div>
            <div className="header-title">ChronoChain</div>
            <div className="header-subtitle">IMMUTABLE GROUP CHAT · SHA-256 VERIFIED</div>
          </div>
        </div>

        <div className="header-stats">
          <div className="stat-pill">
            <span className="stat-label">Chain Height</span>
            <span className="stat-value">{blockchain.length}</span>
          </div>
          <div className="stat-pill">
            <span className="stat-label">Messages</span>
            <span className="stat-value">{Math.max(0, blockchain.length - 1)}</span>
          </div>
          <div className="stat-pill">
            <span className="stat-label">Node</span>
            <div className="ws-status">
              <div className={`ws-dot ${wsStatus}`} />
              <span style={{ fontSize: 11, color: 'var(--col-muted)' }}>
                {wsStatus === 'connected' ? 'LIVE' : wsStatus === 'connecting' ? 'SYNC…' : 'OFFLINE'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Left Panel — Wallet ─────────────────────────────── */}
      <aside className="panel" style={{ gridArea: 'left' }}>
        <Wallet
          wallet={wallet}
          onWalletChange={setWallet}
          chainLength={blockchain.length}
          wsStatus={wsStatus}
        />
      </aside>

      {/* ── Center Panel — Chat ─────────────────────────────── */}
      <main className="panel chat-panel">
        <Chat
          wallet={wallet}
          blockchain={blockchain}
          isMining={isMining}
          onMiningChange={setIsMining}
        />
      </main>

      {/* ── Right Panel — Block Explorer ────────────────────── */}
      <aside className="panel" style={{ gridArea: 'right' }}>
        <BlockExplorer blockchain={blockchain} />
      </aside>
    </div>
  );
}
