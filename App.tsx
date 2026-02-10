import React, { useState } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Lobby from './pages/Lobby';
import GameTable from './pages/GameTable';
import Dashboard from './pages/Dashboard';
import Academia from './pages/Academia';
import Community from './pages/Community';
import TournamentLobby from './pages/TournamentLobby';
import Cashier from './pages/Cashier';
import Rewards from './pages/Rewards';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const Sidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
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
    <aside className={`
      fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border-dark flex flex-col h-screen transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none
      md:translate-x-0 md:static md:shrink-0
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg">
            <span className="material-symbols-outlined text-white">style</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white font-display">POKER PRO</h1>
        </div>
        <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => onClose()} // Close on navigate (mobile)
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
            onClick={() => onClose()}
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

      <div className="p-4 border-t border-border-dark mt-auto">
        <Link to="/profile" className="bg-background/50 p-3 rounded-xl flex items-center gap-3 hover:bg-background/80 transition-colors group cursor-pointer">
          <div className="relative">
            <img
              alt="User avatar"
              className="size-10 rounded-full border border-primary/50 group-hover:border-primary transition-colors"
              src={user.avatar}
            />
            <div className="absolute bottom-0 right-0 size-3 bg-poker-green rounded-full border-2 border-surface"></div>
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold truncate text-white">{user.name}</p>
            <p className="text-xs text-gold font-medium">{user.rank}</p>
          </div>
        </Link>
      </div>
    </aside>
  );
};

const Header = ({ onToggle }: { onToggle: () => void }) => {
  const { user } = useGame();
  const { logout } = useAuth();

  return (
    <header className="h-16 border-b border-border-dark bg-surface/50 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <button onClick={onToggle} className="md:hidden text-slate-400 hover:text-white">
          <span className="material-symbols-outlined">menu</span>
        </button>

        <div className="hidden md:flex items-center bg-background rounded-lg px-3 py-1.5 border border-border-dark">
          <span className="text-gold text-xs font-bold mr-2 uppercase">Balance:</span>
          <span className="text-white font-mono text-sm">${user.balance.toLocaleString()}</span>
        </div>
        {/* Mobile Balance specialized view if needed, or just keep Deposit */}
        <Link to="/cashier" className="bg-primary hover:bg-primary/90 text-white text-xs font-bold py-2 px-4 rounded-lg transition-all flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">add_circle</span>
          <span className="hidden md:inline">DEPOSIT</span>
        </Link>
        {/* Mobile Balance display next to deposit */}
        <span className="md:hidden text-white font-mono text-sm font-bold">${user.balance.toLocaleString()}</span>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        <div className="hidden md:flex items-center gap-2 text-slate-400">
          <span className="material-symbols-outlined text-lg">language</span>
          <span className="text-xs font-medium">Global</span>
        </div>
        <div className="hidden md:flex items-center gap-2 text-slate-400">
          <span className="material-symbols-outlined text-lg">schedule</span>
          <span className="text-xs font-medium">UTC</span>
        </div>
        <button className="text-slate-400 hover:text-white" title="Notifications">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button onClick={logout} className="text-slate-400 hover:text-red-400" title="Logout">
          <span className="material-symbols-outlined">logout</span>
        </button>
      </div>
    </header>
  )
};

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  return (
    <GameProvider>
      <LiveWorldProvider>
        <div className="flex h-screen bg-background text-slate-100 font-sans overflow-hidden">
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

          {/* Mobile Overlay */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
              onClick={() => setIsSidebarOpen(false)}
            ></div>
          )}

          <div className="flex-1 flex flex-col min-w-0">
            <Header onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
            <main className="flex-1 overflow-auto custom-scrollbar relative">
              {children}
            </main>
          </div>
        </div>
      </LiveWorldProvider>
    </GameProvider>
  );
};

const AppRoutes = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Loading Poker Pro...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Lobby />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Lobby />} />

      {/* Protected Routes */}
      {isAuthenticated ? (
        <>
          <Route path="/" element={<ProtectedLayout><Lobby /></ProtectedLayout>} />
          <Route path="/table/:id" element={<ProtectedLayout><GameTable /></ProtectedLayout>} />
          <Route path="/tournament/:id" element={<ProtectedLayout><TournamentLobby /></ProtectedLayout>} />
          <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
          <Route path="/academia" element={<ProtectedLayout><Academia /></ProtectedLayout>} />
          <Route path="/community" element={<ProtectedLayout><Community /></ProtectedLayout>} />
          <Route path="/cashier" element={<ProtectedLayout><Cashier /></ProtectedLayout>} />
          <Route path="/rewards" element={<ProtectedLayout><Rewards /></ProtectedLayout>} />
          <Route path="/profile" element={<ProtectedLayout><Profile /></ProtectedLayout>} />
        </>
      ) : (
        <Route path="*" element={<Login />} />
      )}
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </HashRouter>
  );
};

export default App;
