import React, { useState } from 'react';

function truncHash(hash, len = 12) {
  if (!hash) return '—';
  return hash.slice(0, len) + '…' + hash.slice(-6);
}

function formatTs(ts) {
  return new Date(ts).toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  });
}

function BlockCard({ block }) {
  const [expanded, setExpanded] = useState(false);
  const isGenesis = block.index === 0;

  return (
    <div className="block-card">
      <div className="block-card-header">
        <span className="block-index">BLOCK #{block.index}</span>
        {isGenesis && <span className="block-genesis-tag">GENESIS</span>}
        <span className="block-timestamp">{formatTs(block.timestamp)}</span>
      </div>

      <div className="block-card-body">
        {/* From */}
        <div className="block-field">
          <span className="block-field-label">From</span>
          <span className="block-from">
            {isGenesis ? 'SYSTEM' : truncHash(block.data.from, 14)}
          </span>
        </div>

        {/* Message */}
        <div className="block-field">
          <span className="block-field-label">Message</span>
          <span className="block-msg-text">
            {block.data.message.length > 60 && !expanded
              ? block.data.message.slice(0, 60) + '…'
              : block.data.message}
          </span>
        </div>

        {/* Hash - always show */}
        <div className="block-field">
          <span className="block-field-label">Hash</span>
          <span className="block-field-value hash-value">
            {expanded ? block.hash : truncHash(block.hash, 16)}
          </span>
        </div>

        {/* Expanded details */}
        {expanded && (
          <>
            <div className="block-field">
              <span className="block-field-label">Prev Hash</span>
              <span className="block-field-value hash-value prev">
                {block.prevHash}
              </span>
            </div>
            <div className="block-field">
              <span className="block-field-label">Timestamp (unix)</span>
              <span className="block-field-value" style={{ color: 'var(--col-muted)' }}>
                {block.timestamp}
              </span>
            </div>
            <div className="block-field">
              <span className="block-field-label">Full Address</span>
              <span className="block-field-value" style={{ color: 'var(--col-cyan)', fontSize: 9 }}>
                {block.data.from}
              </span>
            </div>
          </>
        )}
      </div>

      <button className="block-expand-btn" onClick={() => setExpanded(e => !e)}>
        {expanded ? '▲ collapse' : '▼ show hashes'}
      </button>
    </div>
  );
}

export default function BlockExplorer({ blockchain }) {
  // Show newest first
  const sorted = [...blockchain].reverse();

  return (
    <>
      <div className="panel-header">
        <div className="panel-indicator amber" />
        <span className="panel-title">Block Explorer</span>
        <span className="block-count-badge">{blockchain.length} blocks</span>
      </div>

      <div className="explorer-panel">
        {sorted.length === 0 ? (
          <div className="empty-explorer">
            No blocks yet.<br />Mine a message to create the first block.
          </div>
        ) : (
          sorted.map(block => (
            <BlockCard key={block.index} block={block} />
          ))
        )}
      </div>
    </>
  );
}
