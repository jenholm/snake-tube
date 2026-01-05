# 🐍 Snake-Tube

A zero-config, premium YouTube aggregator that strictly filters content to your saved channels. Built for **Enholm Heuristics**.

## ✨ Features

- **Zero-Config**: No YouTube API keys or OAuth required.
- **Strict Filtering**: Only shows videos from channels you actually subscribe to.
- **Server-Side Persistence**: Your channel list is saved on the server.
- **Premium UI**: Dark-mode glassmorphism with responsive grid and custom bridge animation.
- **Mark as Watched**: Instantly hide videos you've already seen.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation & Run

1. **Clone and Install**:
   ```bash
   git clone https://github.com/jenholm/snake-tube.git
   cd snake-tube
   npm install
   ```

2. **Start Dev Server**:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3030`.

3. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

## 🔒 Persistence & Storage

- **Channels**: Stored on the server at `data/channels.json`. This is shared across all clients.
- **Watched Videos**: Stored in your browser's `localStorage` (per-user).

## 🛠️ Architecture

- **Framework**: Next.js 14 (App Router)
- **Scraping**: `youtube-sr`
- **Icons**: Lucide React
- **Branding**: Enholm Heuristics Bridge Animation (Canvas)

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.

---
Built by **Andy Antigravity**  
© 2026 **Enholm Heuristics**. All rights reserved.
