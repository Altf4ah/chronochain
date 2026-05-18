import React from 'react';

const ADJECTIVES = ['ghost','cyber','shadow','neon','void','binary','delta','sigma','omega','quantum'];
const NOUNS      = ['node','chain','crypt','hash','block','forge','zero','pulse','nexus','vault'];

function generateWalletId() {
  const adj  = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const hex  = Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return `${adj}-${noun}-${hex}`;
}

function shortAddress(addr) {
  if (!addr) return '';
  if (addr.length <= 16) return addr;
  return addr.slice(0, 10) + '…' + addr.slice(-6);
}

export default function Wallet({ wallet, onWalletChange, chainLength, wsStatus }) {
  const createWallet = () => {
    const id = generateWalletId();
    onWalletChange(id);
  };

  const destroyWallet = () => {
    onWalletChange(null);
  };

  const statusLabel = {
    connected:    '● CONNECTED',
    disconnected: '● DISCONNECTED',
    connecting:   '◌ CONNECTING…',
  }[wsStatus] || '● UNKNOWN';

  return (
    <>
      {/* Panel Header */}
      <div className="panel-header">
        <div className={`panel-indicator ${wsStatus === 'connected' ? '' : wsStatus === 'connecting' ? 'amber' : ''}`}
          style={wsStatus === 'disconnected' ? { background: 'var(--col-red)', boxShadow: '0 0 6px var(--col-red)', animation: 'none' } : {}}
        />
        <span className="panel-title">Wallet</span>
      </div>

      {/* Panel Content */}
      <div className="wallet-panel">
        {/* Network Status */}
        <div className="wallet-card">
          <div className="wallet-address-label">Network</div>
          <div className={`wallet-status ${wsStatus === 'connected' ? 'connected' : 'disconnected'}`}>
            {statusLabel}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--col-muted)', marginTop: 4 }}>
            ws://localhost:6001
          </div>
        </div>

        {/* Wallet Card */}
        <div className="wallet-card">
          <div className="wallet-address-label">Wallet Address</div>
          {wallet ? (
            <>
              <div className="wallet-address">{wallet}</div>
              <div className="wallet-actions">
                <button className="btn btn-danger" onClick={destroyWallet}>Destroy</button>
                <button className="btn btn-primary" onClick={createWallet}>New</button>
              </div>
            </>
          ) : (
            <>
              <div className="wallet-address empty">No wallet generated</div>
              <div className="wallet-actions">
                <button className="btn btn-primary" onClick={createWallet}>
                  ⬡ Create Wallet
                </button>
              </div>
            </>
          )}
        </div>

        {wallet ? (
          <>
            {/* Chain Stats */}
            <div className="wallet-info-row">
              <div className="label">Blocks Mined</div>
              <div className="value highlight">{chainLength}</div>
            </div>
            <div className="wallet-info-row">
              <div className="label">Short ID</div>
              <div className="value" style={{ color: 'var(--col-cyan)', fontSize: 12 }}>
                {shortAddress(wallet)}
              </div>
            </div>
          </>
        ) : (
          <div className="no-wallet-msg">
            Create a wallet to<br />join the network<br />
            <span style={{ fontSize: 10, opacity: 0.5, letterSpacing: 1 }}>
              ⬡ All messages are immutable
            </span>
          </div>
        )}

        {/* Legend */}
        <div style={{ marginTop: 'auto', padding: '8px 0' }}>
          <div className="peer-header">Protocol Info</div>
          {[
            ['SHA-256', 'Block hashing'],
            ['WebSocket', 'Live sync'],
            ['Immutable', 'Messages locked'],
          ].map(([k, v]) => (
            <div key={k} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '5px 0',
              borderBottom: '1px solid var(--col-dim)',
              fontSize: 10
            }}>
              <span style={{ color: 'var(--col-cyan)' }}>{k}</span>
              <span style={{ color: 'var(--col-muted)' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
