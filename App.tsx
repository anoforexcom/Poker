import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import Lobby from './pages/Lobby';
import GameTable from './pages/GameTable';
import Dashboard from './pages/Dashboard';
import Academia from './pages/Academia';
import Community from './pages/Community';
import TournamentLobby from './pages/TournamentLobby';
import Cashier from './pages/Cashier';
import Rewards from './pages/Rewards';
import Profile from './pages/Profile';
import SimulationDashboard from './pages/SimulationDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import LandingPage from './pages/LandingPage';
import FAQPage from './pages/FAQPage';
import TestimonialsPage from './pages/TestimonialsPage';
import LegalPage from './pages/LegalPage';
import FeaturesPage from './pages/FeaturesPage';
import { PublicLayout } from './layouts/PublicLayout';
import { GameProvider, useGame } from './contexts/GameContext';
import { LiveWorldProvider } from './contexts/LiveWorldContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { SimulationProvider } from './contexts/SimulationContext';
import { ActiveGamesSwitcher } from './components/ActiveGamesSwitcher';

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const Sidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const location = useLocation();
  const { user } = useAuth();
  const isActive = (path: string) => location.pathname === path;

  console.log('[SIDEBAR] Rendering, user:', user);

  // Safety check - don't render if user not loaded
  if (!user) {
    console.log('[SIDEBAR] No user, returning null');
    return null;
  }

  const navItems = [
    { name: 'Play', path: '/play', icon: 'casino' },
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
          <h1 className="text-xl font-bold tracking-tight text-white font-display">BESTPOKER.CASH</h1>
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
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${isActive(item.path)
              ? 'bg-primary/10 text-primary'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <span className="material-symbols-outlined text-xl">{item.icon}</span>
            {item.name}
          </Link>
        ))}

        {/* Active Games Switcher in Sidebar */}
        <div className="mt-8 pt-6 border-t border-white/5">
          <ActiveGamesSwitcher />
        </div>
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
  const { user } = useAuth();
  const { logout } = useAuth();
  const location = useLocation();

  console.log('[HEADER] Rendering, user:', user);

  // Safety check - don't render if user not loaded
  if (!user) {
    console.log('[HEADER] No user, returning null');
    return null;
  }

  // Don't show header on public pages if we are not in protected layout (though this component is only used in protected layout now)
  return (
    <header className="h-16 border-b border-border-dark bg-surface/50 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <button onClick={onToggle} className="md:hidden text-slate-400 hover:text-white">
          <span className="material-symbols-outlined">menu</span>
        </button>

        <div className="hidden md:flex items-center bg-[#1a2333] rounded-xl px-3 py-1.5 border border-white/5 shadow-inner">
          <span className="text-gold text-[10px] font-black mr-2 uppercase tracking-widest opacity-70">Balance:</span>
          <span className="text-white font-mono text-sm">${user.balance.toLocaleString()}</span>
        </div>
        {/* Mobile Balance display next to deposit */}
        <div className="md:hidden flex flex-col justify-center">
          <span className="text-white font-mono text-xs font-black shadow-sm">${user.balance.toLocaleString()}</span>
          <span className="text-[7px] text-emerald-400 font-bold uppercase tracking-tighter -mt-0.5">Available</span>
        </div>

        <Link to="/cashier" className="bg-primary hover:brightness-110 text-white text-[10px] font-black py-2 px-3 md:px-5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined text-sm">add_circle</span>
          <span className="hidden md:inline">DEPOSIT</span>
        </Link>
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
  const { user, isLoading } = useAuth();
  const location = useLocation();

  console.log('[PROTECTED_LAYOUT] Rendering, isLoading:', isLoading, 'user:', user);

  // Show loading state while user is being initialized
  if (isLoading || !user) {
    console.log('[PROTECTED_LAYOUT] Showing loading state');
    return (
      <div className="h-screen w-full bg-[#0a0f1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Loading...</p>
        </div>
      </div>
    );
  }

  // Hide nav for both game tables and tournament lobbies to maximize space
  const isGameView = location.pathname.startsWith('/table/') || location.pathname.startsWith('/tournament/');

  return (
    <GameProvider>
      <LiveWorldProvider>
        <SimulationProvider>
          <ChatProvider>
            <div className="flex h-screen bg-[#0a0f1a] text-slate-100 font-sans overflow-hidden">
              {!isGameView && <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />}

              {/* Mobile Overlay */}
              {isSidebarOpen && !isGameView && (
                <div
                  className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-md transition-opacity duration-300"
                  onClick={() => setIsSidebarOpen(false)}
                ></div>
              )}

              <div className="flex-1 flex flex-col min-w-0">
                {!isGameView && <Header onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />}
                <main className={`flex-1 overflow-auto custom-scrollbar relative ${isGameView ? 'h-full' : 'p-0'}`}>
                  {children}
                </main>
              </div>
            </div>
          </ChatProvider>
        </SimulationProvider>
      </LiveWorldProvider>
    </GameProvider>
  );
};

const AppRoutes = () => {
  const { isAuthenticated, isLoading } = useAuth();

  console.log('[APP_ROUTES] isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);

  if (isLoading) {
    console.log('[APP_ROUTES] Showing global loading state');
    return (
      <div className="h-screen w-full bg-[#101922] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Loading BestPoker.Cash...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/testimonials" element={<TestimonialsPage />} />
        <Route path="/terms" element={<LegalPage />} />
        <Route path="/privacy" element={<LegalPage />} />

        {/* Auth Routes - Now inside PublicLayout */}
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/play" />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/play" />} />
      </Route>

      {/* Protected Routes */}
      {isAuthenticated ? (
        <>
          <Route path="/play" element={<ProtectedLayout><Lobby /></ProtectedLayout>} />
          <Route path="/table/:id" element={<ProtectedLayout><GameTable /></ProtectedLayout>} />
          <Route path="/tournament/:id" element={<ProtectedLayout><TournamentLobby /></ProtectedLayout>} />
          <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
          <Route path="/academia" element={<ProtectedLayout><Academia /></ProtectedLayout>} />
          <Route path="/community" element={<ProtectedLayout><Community /></ProtectedLayout>} />
          <Route path="/cashier" element={<ProtectedLayout><Cashier /></ProtectedLayout>} />
          <Route path="/rewards" element={<ProtectedLayout><Rewards /></ProtectedLayout>} />
          <Route path="/profile" element={<ProtectedLayout><Profile /></ProtectedLayout>} />
          <Route path="/simulation" element={<ProtectedLayout><SimulationDashboard /></ProtectedLayout>} />
        </>
      ) : (
        // Redirect any other protected route access attempt to login
        <Route path="/play" element={<Navigate to="/login" />} />
      )}

      {/* Catch all - 404 - Redirect to Home */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

import { NotificationProvider } from './contexts/NotificationContext';

const App: React.FC = () => {
  return (
    <HashRouter>
      <ScrollToTop />
      <NotificationProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </NotificationProvider>
    </HashRouter>
  );
};

export default App;
