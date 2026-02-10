import React, { useState } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Lobby from './pages/Lobby';
import GameTable from './pages/GameTable';
import Dashboard from './pages/Dashboard';
import Academia from './pages/Academia';
import Community from './pages/Community';
import Cashier from './pages/Cashier';
import { GameProvider, useGame } from './contexts/GameContext';
import { LiveWorldProvider } from './contexts/LiveWorldContext';

const Sidebar = () => {
  const location = useLocation();
  const { user } = useGame();
  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { name: 'Play', path: '/', icon: 'casino' },
    { name: 'Learn', path: '/academia', icon: 'menu_book' },
    { name: 'Community', path: '/community', icon: 'groups' },
    { name: 'Analytics', path: '/dashboard', icon: 'grid_view' },
  ];

  const managementItems = [
    { name: 'Cashier', path: '/cashier', icon: 'account_balance_wallet' },
    { name: 'Rewards', path: '/rewards', icon: 'military_tech' },
  ];

  return (
    <aside className="w-64 bg-surface border-r border-border-dark flex flex-col shrink-0 h-screen">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-primary p-2 rounded-lg">
          <span className="material-symbols-outlined text-white">style</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white font-display">POKER PRO</h1>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${isActive(item.path)
              ? 'bg-primary/10 text-primary'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            {item.name}
          </Link>
        ))}

        <div className="pt-4 pb-2">
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Management</p>
        </div>

        {managementItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${isActive(item.path)
              ? 'bg-primary/10 text-primary'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-border-dark">
        <div className="bg-background/50 p-3 rounded-xl flex items-center gap-3">
          <div className="relative">
            <img
              alt="User avatar"
              className="size-10 rounded-full border border-primary/50"
              src={user.avatar}
            />
            <div className="absolute bottom-0 right-0 size-3 bg-poker-green rounded-full border-2 border-surface"></div>
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold truncate text-white">{user.name}</p>
            <p className="text-xs text-gold font-medium">{user.rank}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

const Header = () => {
  const { user } = useGame();
  return (
    <header className="h-16 border-b border-border-dark bg-surface/50 flex items-center justify-between px-8">
      <div className="flex items-center gap-4">
        <div className="flex items-center bg-background rounded-lg px-3 py-1.5 border border-border-dark">
          <span className="text-gold text-xs font-bold mr-2 uppercase">Balance:</span>
          <span className="text-white font-mono text-sm">${user.balance.toLocaleString()}</span>
        </div>
        <Link to="/cashier" className="bg-primary hover:bg-primary/90 text-white text-xs font-bold py-2 px-4 rounded-lg transition-all flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">add_circle</span>
          DEPOSIT
        </Link>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-slate-400">
          <span className="material-symbols-outlined text-lg">language</span>
          <span className="text-xs font-medium">Global 01</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <span className="material-symbols-outlined text-lg">schedule</span>
          <span className="text-xs font-medium">14:25 UTC</span>
        </div>
        <button className="text-slate-400 hover:text-white">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button className="text-slate-400 hover:text-white">
          <span className="material-symbols-outlined">settings</span>
        </button>
      </div>
    </header>
  )
};

const AppContent = () => {
  return (
    <HashRouter>
      <div className="flex h-screen bg-background text-slate-100 font-sans overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 overflow-auto custom-scrollbar">
            <Routes>
              <Route path="/" element={<Lobby />} />
              <Route path="/table/:id" element={<GameTable />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/academia" element={<Academia />} />
              <Route path="/community" element={<Community />} />
              <Route path="/cashier" element={<Cashier />} />
            </Routes>
          </main>
        </div>
      </div>
    </HashRouter>
  )
}

const App: React.FC = () => {
  return (
    <GameProvider>
      <LiveWorldProvider>
        <AppContent />
      </LiveWorldProvider>
    </GameProvider>
  );
};

export default App;
