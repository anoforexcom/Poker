import React from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SimulationProvider } from '../contexts/SimulationContext';
import { GameProvider } from '../contexts/GameContext';
import { LiveWorldProvider } from '../contexts/LiveWorldContext';

const AdminLayout: React.FC = () => {
    const { user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="h-screen w-full bg-[#0a0f1a] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <span className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Verifying Admin Access...</p>
                </div>
            </div>
        );
    }

    if (!user || !user.isAdmin) {
        return <Navigate to="/" replace />;
    }

    const navItems = [
        { name: 'Dashboard', path: '/admin', icon: 'dashboard' },
        { name: 'Users', path: '/admin/users', icon: 'people' },
        { name: 'Financials', path: '/admin/finances', icon: 'account_balance' },
        { name: 'Games & Tourneys', path: '/admin/games', icon: 'casino' },
        { name: 'Bot Control', path: '/admin/simulation', icon: 'smart_toy' },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <GameProvider>
            <LiveWorldProvider>
                <SimulationProvider>
                    <div className="flex h-screen bg-[#0a0f1a] text-slate-100 font-sans overflow-hidden">
                        {/* Admin Sidebar */}
                        <aside className="w-64 bg-surface border-r border-border-dark flex flex-col h-screen shrink-0">
                            <div className="p-6">
                                <div className="flex items-center gap-3">
                                    <img src="/logo.png" className="size-10 rounded-xl object-cover" alt="Logo" />
                                    <div>
                                        <h1 className="text-lg font-bold text-white leading-none">ADMIN</h1>
                                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">BestPoker.Cash</p>
                                    </div>
                                </div>
                            </div>

                            <nav className="flex-1 px-4 space-y-2 mt-4">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${isActive(item.path)
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-xl">{item.icon}</span>
                                        {item.name}
                                    </Link>
                                ))}
                            </nav>

                            <div className="p-4 border-t border-border-dark">
                                <Link to="/play" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                                    <span className="material-symbols-outlined text-xl">arrow_back</span>
                                    Back to App
                                </Link>
                            </div>
                        </aside>

                        {/* Main Content */}
                        <main className="flex-1 overflow-auto custom-scrollbar bg-background/50">
                            <header className="h-16 border-b border-border-dark px-8 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md bg-background/80">
                                <h2 className="text-xl font-bold text-white">
                                    {navItems.find(i => isActive(i.path))?.name || 'Admin Panel'}
                                </h2>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-white">{user.name}</p>
                                        <p className="text-[10px] text-poker-green font-black uppercase tracking-widest">System Manager</p>
                                    </div>
                                    <img src={user.avatar} className="size-10 rounded-full border border-primary/50" alt="Admin" />
                                </div>
                            </header>

                            <div className="p-8">
                                <Outlet />
                            </div>
                        </main>
                    </div>
                </SimulationProvider>
            </LiveWorldProvider>
        </GameProvider>
    );
};

export default AdminLayout;
