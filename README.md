# ♠️ Poker Pro Platform

![Poker Pro Platform Banner](https://images.unsplash.com/photo-1544256718-3bcf237f3974?auto=format&fit=crop&q=80&w=1200&h=400)

> A high-fidelity, real-time multiplayer poker simulation platform built with React, TypeScript, and Supabase. Features intelligent bot AI, complex tournament structures, and a secure financial economy.

## 🌟 Key Features

### 🏆 Advanced Tournament Engine
- **Real-Time Phases**: Supports `Registering`, `Late Registration`, `Running`, and `Final Table` states.
- **Dynamic Structures**: Configurable blind intervals, starting stacks, and prize pool distributions.
- **Smart Lobby**: Live player tracking, country flags, and countdown timers for upcoming events.

### 🤖 Intelligent Bot AI
- **Adaptive Opponents**: Bots play with varying styles (Aggressive, Conservative, Balanced).
- **Realistic Behavior**: Randomized delays, distinct personalities, and "tilt" simulation.
- **24/7 Activity**: A background simulation engine ensures tables are always active, even in offline/demo modes.

### 💰 Robust Financial System
- **Secure Cashier**: Transaction logging for all Deposits, Withdrawals, and Tournament Buy-ins.
- **Rewards Program**: XP-based progression system with unlockable tiers (Bronze to Elite).
- **Daily Challenges**: Dynamic missions (e.g., "Win a hand with 7-2 offsuit") to earn bonus chips.

### ⚡ Modern Tech Stack
- **Frontend**: React 18, TypeScript, TailwindCSS (Glassmorphism UI).
- **Backend/DB**: Supabase (PostgreSQL) for auth, database, and real-time subscriptions.
- **State Management**: Custom React Context API (`SimulationContext`, `GameContext`, `LiveWorldContext`).
- **Build**: Vite for lightning-fast HMR and production builds.

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- Supabase Account (for backend connectivity)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/poker-pro-platform.git
   cd poker-pro-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run Locally**
   ```bash
   npm run dev
   ```

## 📂 Project Structure

```
src/
├── components/     # Reusable UI components (Cards, Chips, Buttons)
├── contexts/       # Global State (Auth, Game, Simulation)
├── hooks/          # Custom Hooks (usePokerGame, useToast)
├── pages/          # Route Views (Lobby, Table, Dashboard)
├── utils/          # Core Logic (Hand Evaluation, Bot AI)
└── styles/         # Global styles and Tailwind config
```

## 🛠 Recent Updates (Refactor v2.0)
- **Unified Context API**: Streamlined state management for better performance and type safety.
- **Enhanced Bot Engine**: Improved decision-making logic and player simulation.
- **Visual Overhaul**: Polished UI with consistent "Poker Pro" branding and animations.

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
