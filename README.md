# ⛓ ChronoChain

> **Blockchain-based group chat. Every message is a block. Nothing is instant. Nothing is mutable.**

[![CI](https://github.com/Altf4ah/chronochain/actions/workflows/ci.yml/badge.svg)](https://github.com/Altf4ah/chronochain/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

---

## What is ChronoChain?

ChronoChain is a **real-time group chat application where messages only appear after being mined into a blockchain block**. Inspired by how networks like LBRY treat content as on-chain data, ChronoChain applies the same principle to chat — making every message immutable, ordered, and cryptographically verifiable.

No fake message previews. No optimistic UI. Your message disappears into the void until the block is confirmed.

```
User types message
       │
       ▼
POST /message  ──►  Backend mines SHA-256 block
                           │
                           ▼
                   Appended to in-memory chain
                           │
                           ▼
               WebSocket broadcast to ALL peers
                           │
                    ┌──────┴──────┐
                    ▼             ▼
              Your tab       Other tabs
           (msg appears)   (msg appears)
```

---

## Features

- **Blockchain core** — every message is a SHA-256 hashed block linked to the previous one
- **Real-time P2P sync** — WebSocket broadcasts new blocks to all connected clients instantly
- **Immutable chat history** — messages are derived entirely from chain state, never from local state
- **Full chain sync** — new connections receive the entire blockchain on connect
- **Block Explorer** — inspect every block's hash, prevHash, sender, and timestamp
- **Wallet system** — generate a pseudo-anonymous wallet ID to send messages
- **Mining indicator** — UX feedback while the block is being mined
- **Auto-reconnect** — WebSocket client reconnects automatically if the node goes offline
- **Retro-futuristic UI** — dark terminal aesthetic with scanlines, monospace fonts, and glow effects

---

## Tech Stack

| Layer     | Technology              |
|-----------|-------------------------|
| Backend   | Node.js, Express, `ws`  |
| Hashing   | Node.js `crypto` (SHA-256) |
| Transport | WebSocket (same port as HTTP) |
| Frontend  | React 18, Vite          |
| Styling   | Pure CSS (no UI library) |
| Fonts     | Share Tech Mono, Rajdhani (Google Fonts) |
| CI        | GitHub Actions          |

---

## Project Structure

```
chronochain/
├── .github/
│   └── workflows/
│       └── ci.yml              # Backend smoke test + frontend build check
│
├── chronochain-node/           # Backend — blockchain node
│   ├── index.js                # Express server + WebSocket + blockchain logic
│   └── package.json
│
└── chronochain-ui/             # Frontend — React dashboard
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx            # React entry point
        ├── App.jsx             # Root component, WebSocket lifecycle, state
        ├── styles.css          # Full design system (CSS variables, all components)
        └── components/
            ├── Wallet.jsx      # Wallet creation, network status
            ├── Chat.jsx        # Chat UI, message send, derived from chain
            └── BlockExplorer.jsx # Block cards with hash inspection
```

---

## Getting Started

### Prerequisites

- Node.js 18+ (20 recommended)
- npm 9+

### 1. Clone the repo

```bash
git clone https://github.com/Altf4ah/chronochain.git
cd chronochain
```

### 2. Start the blockchain node

```bash
cd chronochain-node
npm install
npm start
```

You should see:
```
[ChronoChain] Genesis block mined: c08e760f2c58cc09…

╔═══════════════════════════════════════╗
║   ChronoChain Node v1.0.0             ║
║   http://localhost:6001               ║
║   WebSocket: ws://localhost:6001      ║
╚═══════════════════════════════════════╝
```

### 3. Start the frontend (new terminal)

```bash
cd chronochain-ui
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

### 4. Simulate multiple users

Open the app in **two separate browser tabs** or windows. Create a different wallet in each. Messages sent from one tab will appear in the other only after the block is mined and broadcast via WebSocket — exactly like a real blockchain network.

---

## API Reference

### `POST /message`

Mine a new block containing a chat message.

**Request body:**
```json
{
  "from": "ghost-node-a1b2c3d4",
  "message": "Hello, chain."
}
```

**Response `201`:**
```json
{
  "success": true,
  "block": {
    "index": 1,
    "timestamp": 1700000012345,
    "data": {
      "from": "ghost-node-a1b2c3d4",
      "message": "Hello, chain."
    },
    "prevHash": "c08e760f2c58cc09...",
    "hash": "3f4a1b9c7d2e8f0a..."
  }
}
```

**Error `400`:**
```json
{ "error": "Message cannot be empty." }
```

---

### `GET /chain`

Returns the full blockchain.

```json
{
  "length": 3,
  "blocks": [ ...all blocks... ]
}
```

---

### WebSocket `ws://localhost:6001`

**On connect — full chain sync:**
```json
{ "type": "CHAIN", "data": [ ...all blocks... ] }
```

**On new block:**
```json
{ "type": "BLOCK", "data": { ...block... } }
```

---

## Block Structure

```json
{
  "index":     1,
  "timestamp": 1700000012345,
  "data": {
    "from":    "ghost-node-a1b2c3d4",
    "message": "Hello, chain."
  },
  "prevHash":  "c08e760f2c58cc09a1b2c3d4e5f6a7b8...",
  "hash":      "3f4a1b9c7d2e8f0a1b2c3d4e5f6a7b8c..."
}
```

Hash is computed as:

```
SHA-256( index + timestamp + JSON(data) + prevHash )
```

---

## How the Message Flow Works

```
1. User types a message and clicks Send (or hits Enter)
2. Frontend sends   POST /message  { from, message }
3. Backend:
   a. Validates input
   b. Gets last block from chain
   c. Computes SHA-256 hash over { index, timestamp, data, prevHash }
   d. Appends new block to in-memory array
   e. Broadcasts { type: "BLOCK", data: block } to ALL WebSocket clients
4. Frontend WebSocket receives BLOCK event
5. React state updates → chat re-renders from blockchain
6. Message is now visible (and immutable)
```

The frontend **never** shows a message based on user input alone. Chat state is always derived from the blockchain. This is enforced in `Chat.jsx` — `blockchain.map(...)` is the only source of rendered messages.

---

## UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│  ⛓ CHRONOCHAIN          Blocks: 12  Messages: 11  ● LIVE   │
├──────────────┬──────────────────────────────┬───────────────┤
│  WALLET      │  BROADCAST CHANNEL           │ BLOCK EXPLORER│
│              │                              │               │
│  ● CONNECTED │  ghost-node: Hello world     │ BLOCK #11     │
│  ws://...    │                         ▶    │ 14:32:01      │
│              │     ◀ You: gm everyone       │ from: ghost…  │
│  Address:    │                              │ hash: 3f4a…   │
│  ghost-node- │  ⛏ Mining block...          │               │
│  a1b2c3d4    │                              │ BLOCK #10     │
│              │  ┌──────────────────────┐    │ ...           │
│  [Destroy]   │  │ type here…      Send │    │               │
│  [New]       │  └──────────────────────┘    │               │
└──────────────┴──────────────────────────────┴───────────────┘
```

---

## Potential Extensions

- **Proof-of-Work** — add a nonce and difficulty target to make mining computationally real
- **Persistence** — swap in-memory array for SQLite or LevelDB so the chain survives restarts
- **Multi-node** — peer discovery and chain sync between multiple independent nodes
- **ECDSA signatures** — sign messages with a real private key so wallets are cryptographically verified
- **Rooms/channels** — multiple independent chains for different chat rooms
- **Web3 wallet** — integrate MetaMask or a similar wallet for real address generation

---

## License

[MIT](./LICENSE) © 2025 [Altf4ah](https://github.com/Altf4ah)
