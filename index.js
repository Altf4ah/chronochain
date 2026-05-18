const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ─── Blockchain Core ────────────────────────────────────────────────────────

const blockchain = [];

function hashBlock(index, timestamp, data, prevHash) {
  const payload = `${index}${timestamp}${JSON.stringify(data)}${prevHash}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

function createGenesisBlock() {
  const index     = 0;
  const timestamp = 1700000000000; // fixed genesis timestamp
  const data      = {
    from: 'GENESIS',
    message: 'ChronoChain network initialized. All messages are immutable and publicly verifiable.'
  };
  const prevHash = '0000000000000000000000000000000000000000000000000000000000000000';
  const hash     = hashBlock(index, timestamp, data, prevHash);
  return { index, timestamp, data, prevHash, hash };
}

function mineBlock(from, message) {
  const prev      = blockchain[blockchain.length - 1];
  const index     = blockchain.length;
  const timestamp = Date.now();
  const data      = { from, message };
  const prevHash  = prev.hash;
  const hash      = hashBlock(index, timestamp, data, prevHash);
  return { index, timestamp, data, prevHash, hash };
}

// Boot with genesis block
blockchain.push(createGenesisBlock());
console.log('[ChronoChain] Genesis block mined:', blockchain[0].hash.slice(0, 16) + '…');

// ─── HTTP + WebSocket Server ─────────────────────────────────────────────────

const server = http.createServer(app);
const wss    = new WebSocket.Server({ server });

function broadcast(payload) {
  const raw = JSON.stringify(payload);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(raw);
    }
  });
}

wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress;
  console.log(`[WS] New peer connected: ${ip}`);

  // Sync full chain to new peer
  ws.send(JSON.stringify({ type: 'CHAIN', data: blockchain }));

  ws.on('close', () => {
    console.log(`[WS] Peer disconnected: ${ip}`);
  });

  ws.on('error', (err) => {
    console.error(`[WS] Error from ${ip}:`, err.message);
  });
});

// ─── REST Endpoints ──────────────────────────────────────────────────────────

// POST /message — mine a new block
app.post('/message', (req, res) => {
  const { from, message } = req.body;

  if (!from || typeof from !== 'string' || from.trim() === '') {
    return res.status(400).json({ error: 'Invalid wallet ID.' });
  }
  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }
  if (message.length > 500) {
    return res.status(400).json({ error: 'Message exceeds 500 character limit.' });
  }

  const block = mineBlock(from.trim(), message.trim());
  blockchain.push(block);

  console.log(`[BLOCK #${block.index}] mined by ${block.data.from.slice(0, 20)}… hash: ${block.hash.slice(0, 16)}…`);

  // Broadcast to all WS peers
  broadcast({ type: 'BLOCK', data: block });

  res.status(201).json({ success: true, block });
});

// GET /chain — full chain dump
app.get('/chain', (req, res) => {
  res.json({
    length: blockchain.length,
    blocks: blockchain
  });
});

// ─── Boot ────────────────────────────────────────────────────────────────────

const PORT = 6001;
server.listen(PORT, () => {
  console.log(`\n╔═══════════════════════════════════════╗`);
  console.log(`║   ChronoChain Node v1.0.0             ║`);
  console.log(`║   http://localhost:${PORT}              ║`);
  console.log(`║   WebSocket: ws://localhost:${PORT}    ║`);
  console.log(`╚═══════════════════════════════════════╝\n`);
});
