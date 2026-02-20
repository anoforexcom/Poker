import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveWorld } from '../contexts/LiveWorldContext';
import { useGame } from '../contexts/GameContext';
import { useNotification } from '../contexts/NotificationContext';

type ViewMode = 'list' | 'grid';

const Lobby: React.FC = () => {
  const { onlinePlayers, activeTables, tables } = useLiveWorld();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { user: gameUser, withdraw, activeGames } = useGame();
  const { showAlert } = useNotification();

  const filteredTables = tables.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleJoinGame = async (t: any) => {
    // Navigate to the table
    navigate(`/table/${t.id}`);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-3 md:p-6 border-b border-border-dark bg-surface/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <h2 className="text-xl md:text-3xl font-black text-white tracking-tighter font-display uppercase italic text-primary">Play Chips Lobby</h2>
              <p className="text-slate-500 text-[9px] md:text-sm font-bold uppercase tracking-widest mt-0.5">High Stakes Action</p>
            </div>
            {/* Counters removed to simplify UI as requested */}
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 md:p-6 border-b border-border-dark bg-surface/10">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-lg">search</span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-surface border border-border-dark text-xs rounded-lg pl-9 pr-4 py-2 w-full max-w-xs focus:ring-primary outline-none placeholder:text-slate-600 text-white"
                placeholder="Find a table..."
              />
            </div>

            <div className="flex bg-surface rounded-lg border border-border-dark ml-auto">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded-l-lg transition-all ${viewMode === 'list' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <span className="material-symbols-outlined text-lg">view_list</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded-r-lg transition-all ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <span className="material-symbols-outlined text-lg">grid_view</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tables List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
          <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
            {filteredTables.map(t => (
              <div
                key={t.id}
                className={`bg-surface/40 backdrop-blur-sm rounded-xl border border-white/5 p-4 md:p-6 hover:bg-white/5 transition-all cursor-pointer group shadow-lg ${viewMode === 'grid' ? 'flex flex-col justify-between' : ''}`}
                onClick={() => handleJoinGame(t)}
              >
                <div className={viewMode === 'list' ? "flex flex-col sm:flex-row sm:items-center justify-between gap-4" : "space-y-4"}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/30 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined">payments</span>
                      </div>
                      <div>
                        <h3 className="text-sm md:text-lg font-black text-white leading-tight uppercase italic">{t.name}</h3>
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">{t.stakes} NL Hold'em</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md">
                        <span className="material-symbols-outlined text-sm text-slate-500">group</span>
                        <span className="font-mono font-bold leading-none text-white">{t.players}/{t.maxPlayers}</span>
                      </span>
                      <span className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md">
                        <span className="material-symbols-outlined text-sm text-gold">toll</span>
                        <span className="font-bold text-white">Min. Buy-in: {t.buyIn.toLocaleString()}</span>
                      </span>
                    </div>
                  </div>

                  <button className="px-6 py-3 bg-primary text-white rounded-xl font-black text-xs tracking-widest uppercase shadow-xl shadow-primary/20 group-hover:bg-primary-light transition-all active:scale-95 whitespace-nowrap border border-white/10">
                    Join Table
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="hidden xl:block w-80 border-l border-border-dark bg-surface/10 overflow-y-auto custom-scrollbar">
        <div className="p-6 space-y-6">
          <div className="bg-surface/50 rounded-xl p-5 border border-border-dark">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-400 mb-1">Your Chips</p>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-gold text-lg">toll</span>
                  <p className="text-2xl font-black text-white">{gameUser.chips.toLocaleString()}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-border-dark">
                <p className="text-[10px] text-slate-500 uppercase font-black mb-2">Active Players</p>
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <img key={i} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i * 123}`} className="size-8 rounded-full border-2 border-background" alt="Player" />
                  ))}
                  <div className="size-8 rounded-full border-2 border-background bg-surface flex items-center justify-center text-[10px] font-bold text-slate-400">+...</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Lobby;
