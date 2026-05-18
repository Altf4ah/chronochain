import React, { useEffect, useRef, useState } from 'react';

const NODE_URL = 'http://localhost:6001';
const MAX_CHARS = 500;

function shortId(id) {
  if (!id || id.length <= 14) return id;
  return id.slice(0, 8) + '…' + id.slice(-4);
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function Chat({ wallet, blockchain, isMining, onMiningChange }) {
  const [input, setInput]   = useState('');
  const [error, setError]   = useState('');
  const messagesEndRef       = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [blockchain, isMining]);

  const handleSend = async () => {
    if (!wallet)          return setError('Create a wallet first.');
    if (!input.trim())    return setError('Cannot send an empty message.');
    if (input.length > MAX_CHARS) return setError(`Max ${MAX_CHARS} characters.`);

    const msg = input.trim();
    setInput('');
    setError('');
    onMiningChange(true);

    try {
      const res = await fetch(`${NODE_URL}/message`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ from: wallet, message: msg }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Failed to send message.');
        onMiningChange(false);
      }
      // Block arrives via WebSocket — mining indicator turns off in App
    } catch {
      setError('Node unreachable. Is the backend running?');
      onMiningChange(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const charLeft = MAX_CHARS - input.length;

  // Derive messages from blockchain
  const messages = blockchain.map((block) => {
    const isGenesis = block.index === 0;
    const isSelf    = block.data.from === wallet;
    return { block, isGenesis, isSelf };
  });

  return (
    <>
      {/* Panel header */}
      <div className="panel-header">
        <div className="panel-indicator cyan" />
        <span className="panel-title">Broadcast Channel</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--col-muted)' }}>
          {blockchain.length} block{blockchain.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <div className="chat-empty-icon">⛓</div>
            <div className="chat-empty-title">Chain Empty</div>
            <div className="chat-empty-sub">Awaiting genesis block…</div>
          </div>
        ) : (
          messages.map(({ block, isGenesis, isSelf }) => {
            if (isGenesis) {
              return (
                <div key={block.index} className="message-row genesis">
                  <div className="message-bubble genesis-bubble">
                    ⬡ GENESIS · Block #{block.index} · {formatTime(block.timestamp)}<br />
                    {block.data.message}
                  </div>
                </div>
              );
            }
            return (
              <div key={block.index} className={`message-row ${isSelf ? 'self' : 'other'}`}>
                <div className="message-meta">
                  <span className={`message-sender ${isSelf ? 'self-label' : ''}`}>
                    {isSelf ? 'You' : shortId(block.data.from)}
                  </span>
                  <span className="message-block-badge">#{block.index}</span>
                  <span style={{ fontSize: 9, color: 'var(--col-dim)' }}>
                    {formatTime(block.timestamp)}
                  </span>
                </div>
                <div className="message-bubble">
                  {block.data.message}
                </div>
              </div>
            );
          })
        )}

        {/* Mining indicator */}
        {isMining && (
          <div className="mining-indicator">
            ⛏ Mining block
            <span className="mining-dots">
              <span>.</span><span>.</span><span>.</span>
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="chat-input-area">
        {error && (
          <div style={{
            fontSize: 11, color: 'var(--col-red)', marginBottom: 6,
            padding: '4px 8px', background: 'rgba(255,68,68,0.08)',
            borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,68,68,0.2)'
          }}>
            ⚠ {error}
          </div>
        )}

        {wallet ? (
          <>
            <div className="chat-input-row">
              <input
                className="chat-input"
                value={input}
                onChange={e => { setInput(e.target.value); setError(''); }}
                onKeyDown={handleKeyDown}
                placeholder="Type a message… (Enter to mine)"
                maxLength={MAX_CHARS}
                disabled={isMining}
              />
              <button
                className="btn-send"
                onClick={handleSend}
                disabled={isMining || !input.trim()}
              >
                {isMining ? '⛏ Mining' : '⬡ Send'}
              </button>
            </div>
            <div className={`char-count ${charLeft < 50 ? 'danger' : charLeft < 150 ? 'warn' : ''}`}>
              {charLeft} chars remaining
            </div>
          </>
        ) : (
          <div className="chat-disabled-msg">
            ⬡ Generate a wallet to broadcast messages
          </div>
        )}
      </div>
    </>
  );
}
