# ♠️ Poker Pro Platform

![Poker Pro Platform Banner](https://images.unsplash.com/photo-1544256718-3bcf237f3974?auto=format&fit=crop&q=80&w=1200&h=400)

> A high-fidelity, real-time multiplayer poker simulation platform built with React, TypeScript, and Firebase. Features intelligent bot AI and a stateless poker engine running on Cloud Functions.

## 🌟 Key Features

### 🏆 Advanced Poker Engine
- **Stateless Architecture**: Game logic runs in Firebase Cloud Functions, persisting state to Firestore.
- **Real-Time Synchronisation**: Frontend state is kept in sync via Firestore snapshots.
- **Cash Game Focus**: Optimized for high-stakes cash game action.

### 🤖 Intelligent Bot AI
- **Adaptive Opponents**: Bots play with varying styles (Aggressive, Conservative, Balanced).
- **Realistic Behavior**: Randomized delays and phase-aware decision making.
- **Scalable**: Powered by backend logic to handle multiple bots seamlessly.

### 💰 Secure Infrastructure
- **Firebase Auth**: Secure user authentication and profile management.
- **Firestore Persistence**: All game data and user balances stored securely in NoSQL.
- **Cloud Functions**: Protected game logic that prevents client-side cheating.

### ⚡ Technical Stack
- **Frontend**: React 18, TypeScript, TailwindCSS, Vite.
- **Backend**: Firebase Cloud Functions (Node.js).
- **Database**: Firebase Firestore.
- **Auth**: Firebase Authentication.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Firebase CLI (`npm install -g firebase-tools`)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/anoforexcom/Poker.git
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd functions
   npm install
   cd ..
   ```

3. **Configure Environment**
   Create a `.env` file (not tracked by git):
   ```env
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   ```

4. **Run Locally**
   ```bash
   npm run dev
   ```

## 📂 Project Structure

```
├── components/     # Reusable UI components
├── contexts/       # Global State (Auth, Game, LiveWorld)
├── functions/      # Firebase Cloud Functions (Poker Engine)
├── hooks/          # Custom Hooks (usePokerGame)
├── pages/          # Route Views (Lobby, Table, Dashboard)
└── utils/          # Shared Utilities (Firebase Config)
```

## 📄 License
MIT License
