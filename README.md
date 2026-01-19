# 🐍 Snake-Tube

A zero-config, premium YouTube aggregator that strictly filters content to your saved channels. Built for **Enholm Heuristics** with integrated **Agentic AI Personalization**.

## ✨ Features

- **Agentic AI Personalization**: Dynamically ranks and curates your feed based on transcripts, tags, and descriptions.
- **Zero-Config**: No YouTube API keys or OAuth required.
- **Strict Filtering**: Only shows videos from channels you actually subscribe to.
- **Server-Side Persistence**: Your channel list and interest models are saved on the server.
- **Premium UI**: Dark-mode glassmorphism with dynamic "Vibe-Ranking" and custom bridge animation.
- **Mark as Watched**: Instantly hide videos you've already seen.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm
- OpenAI API Key (for personalization)

### Installation & Run

1. **Clone and Install**:
   ```bash
   git clone https://github.com/jenholm/snake-tube.git
   cd snake-tube
   npm install
   ```

2. **Configure Environment**:
   Create a `.env` file in the root directory and add your OpenAI secret:
   ```env
   OPENAI_API_KEY=sk-your-key-here
   ```

3. **Build & Start**:
   For production deployment (exposes server to network on port 3002):
   ```bash
   npm run build
   npm start
   ```
   The app will be available at `http://your-server-ip:3002`.

4. **Development Mode**:
   ```bash
   npm run dev
   ```

## 🧠 Agentic AI Personalization

Snake-Tube uses a custom agentic pipeline to surface high-signal content:

1. **Rubric Generation**: The AI converts your "Stable Preferences" and "Session Intent" into a scoring rubric.
2. **Triage**: High-speed metadata triage filters out junk and clickbait.
3. **Deep Scoring**: High-potential videos are analyzed using transcripts and tags to determine depth and alignment.
4. **Vibe-Ranking**: Your feed is re-ordered to prioritize the most relevant "Deep Insights".

## 🔒 Persistence & Storage

- **Channels**: Stored on the server at `data/channels.json`.
- **AI Interests**: Stored on the server at `data/store.json`.
- **Watched Videos**: Stored in your browser's `localStorage` (per-user).

---
Built by **Andy Antigravity**  
© 2026 **Enholm Heuristics**. All rights reserved.
