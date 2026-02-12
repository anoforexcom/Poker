import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveWorld } from '../contexts/LiveWorldContext';
import { useSimulation } from '../contexts/SimulationContext';

type LobbyTab = 'tournaments' | 'cash' | 'sitgo' | 'spingo';
type ViewMode = 'list' | 'grid';

const Lobby: React.FC = () => {
  const { onlinePlayers, activeTables, tournaments: liveWorldTournaments } = useLiveWorld();
  const { tournaments: simulatedTournaments } = useSimulation();
  const [activeTab, setActiveTab] = useState<LobbyTab>('tournaments');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [speedFilter, setSpeedFilter] = useState<string[]>([]);
  const navigate = useNavigate();

  // Use simulated tournaments if available, otherwise use LiveWorld tournaments
  const tournaments = simulatedTournaments.length > 0 ? simulatedTournaments : liveWorldTournaments;

  // Safety check: ensure tournaments is always an array AND transform SimulatedTournament to match Tournament interface
  const safeTournaments = Array.isArray(tournaments) ? tournaments.map(t => {
    // If this is a SimulatedTournament (players is an array), transform it
    if (Array.isArray((t as any).players)) {
      const simTournament = t as any; // SimulatedTournament
      return {
        id: simTournament.id,
        name: simTournament.name,
        type: simTournament.type || 'tournament',
        gameType: simTournament.gameType || 'NL Hold\'em',
        buyIn: simTournament.buyIn,
        prizePool: simTournament.prizePool,
        players: simTournament.players.length, // Convert array to count
        maxPlayers: simTournament.maxPlayers,
        status: simTournament.status === 'registering' ? 'Registering' :
          simTournament.status === 'running' ? 'Running' : 'Finished',
        startTime: 'Now',
        progress: simTournament.currentRound || 0,
      };
    }
    // Otherwise it's already a Tournament from LiveWorld
    return { ...t, type: (t as any).type || 'tournament' };
  }) : [];

  const filteredTournaments = safeTournaments.filter(t => {
    // Type filter based on tab
    const tabToType: Record<string, string> = {
      'tournaments': 'tournament',
      'cash': 'cash',
      'sitgo': 'sitgo',
      'spingo': 'spingo'
    };
    if (t.type !== tabToType[activeTab]) return false;

    // Safety check for tournament object
    if (!t || !t.name || typeof t.buyIn !== 'number') return false;

    // Buy-in filter
    if (filter !== 'ALL') {
      if (filter === 'MICRO' && t.buyIn >= 5) return false;
      if (filter === 'LOW' && (t.buyIn < 5 || t.buyIn >= 20)) return false;
      if (filter === 'MID' && (t.buyIn < 20 || t.buyIn >= 100)) return false;
      if (filter === 'HIGH' && t.buyIn < 100) return false;
    }

    // Search filter
    if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Speed filter
    if (speedFilter.length > 0) {
      const isTurbo = t.name.toLowerCase().includes('turbo');
      const isDeep = t.name.toLowerCase().includes('deep');
      const isRegular = !isTurbo && !isDeep;

      if (speedFilter.includes('turbo') && !isTurbo) return false;
      if (speedFilter.includes('regular') && !isRegular) return false;
      if (speedFilter.includes('deep') && !isDeep) return false;
    }

    return true;
  });

  const getFilterCount = (f: string) => {
    const tabToType: Record<string, string> = {
      'tournaments': 'tournament',
      'cash': 'cash',
      'sitgo': 'sitgo',
      'spingo': 'spingo'
    };
    const currentTabType = tabToType[activeTab];
    const tournamentsInTab = safeTournaments.filter(t => t.type === currentTabType);

    if (f === 'ALL') return tournamentsInTab.length;
    if (f === 'MICRO') return tournamentsInTab.filter(t => t && t.buyIn < 5).length;
    if (f === 'LOW') return tournamentsInTab.filter(t => t && t.buyIn >= 5 && t.buyIn < 20).length;
    if (f === 'MID') return tournamentsInTab.filter(t => t && t.buyIn >= 20 && t.buyIn < 100).length;
    if (f === 'HIGH') return tournamentsInTab.filter(t => t && t.buyIn >= 100).length;
    return 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Registering': return 'text-poker-green';
      case 'Late Reg': return 'text-yellow-500';
      case 'Running': return 'text-blue-400';
      case 'Final Table': return 'text-red-500 animate-pulse';
      case 'Finished': return 'text-slate-500';
      default: return 'text-white';
    }
  };

  const toggleSpeedFilter = (speed: string) => {
    setSpeedFilter(prev =>
      prev.includes(speed) ? prev.filter(s => s !== speed) : [...prev, speed]
    );
  };

  // Loading state while contexts initialize
  if (!tournaments && !liveWorldTournaments) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading lobby...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-border-dark bg-surface/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight font-display">Lobby</h2>
              <p className="text-slate-400 text-sm mt-1">Join thousands of players worldwide</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="bg-poker-green/10 text-poker-green text-[10px] font-bold px-3 py-1.5 rounded border border-poker-green/20 flex items-center gap-2">
                <span className="size-2 bg-poker-green rounded-full animate-pulse"></span>
                {safeTournaments.length.toLocaleString()} <span className="hidden sm:inline">TOURNAMENTS</span>
              </div>
              <div className="bg-primary/10 text-primary text-[10px] font-bold px-3 py-1.5 rounded border border-primary/20 flex items-center gap-2">
                <span className="size-2 bg-primary rounded-full animate-pulse"></span>
                {onlinePlayers.toLocaleString()} <span className="hidden sm:inline">PLAYERS</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { id: 'tournaments', label: 'Tournaments', icon: 'emoji_events' },
              { id: 'cash', label: 'Cash Games', icon: 'attach_money' },
              { id: 'sitgo', label: 'Sit & Go', icon: 'group' },
              { id: 'spingo', label: 'Spin & Go', icon: 'casino' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as LobbyTab)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${activeTab === tab.id
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'bg-surface/50 text-slate-400 hover:text-white hover:bg-surface'
                  }`}
              >
                <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Filters & Controls */}
        <div className="p-4 md:p-6 border-b border-border-dark bg-surface/10">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Buy-in Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {['ALL', 'MICRO', 'LOW', 'MID', 'HIGH'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap ${filter === f
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-surface text-slate-400 hover:text-white'
                    }`}
                >
                  {f} <span className="text-[10px] opacity-70">({getFilterCount(f)})</span>
                </button>
              ))}
            </div>

            {/* Speed Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {['turbo', 'regular', 'deep'].map(speed => (
                <button
                  key={speed}
                  onClick={() => toggleSpeedFilter(speed)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all capitalize whitespace-nowrap ${speedFilter.includes(speed)
                    ? 'bg-gold text-background shadow-lg'
                    : 'bg-surface text-slate-400 hover:text-white'
                    }`}
                >
                  {speed}
                </button>
              ))}
            </div>

            {/* Search & View Toggle */}
            <div className="flex gap-2 lg:ml-auto">
              <div className="relative flex-1 lg:flex-none">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-lg">search</span>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-surface border border-border-dark text-xs rounded-lg pl-9 pr-4 py-2 w-full lg:w-48 focus:ring-primary outline-none placeholder:text-slate-600 text-white"
                  placeholder="Search tournaments..."
                />
              </div>

              <div className="flex bg-surface rounded-lg border border-border-dark">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 rounded-l-lg transition-all ${viewMode === 'list' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'
                    }`}
                >
                  <span className="material-symbols-outlined text-lg">view_list</span>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 rounded-r-lg transition-all ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'
                    }`}
                >
                  <span className="material-symbols-outlined text-lg">grid_view</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Lists for all tabs */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
          {viewMode === 'list' ? (
            // List View
            <div className="space-y-3">
              {filteredTournaments.length === 0 && (
                <div className="text-center py-20 bg-surface/10 rounded-2xl border border-dashed border-border-dark">
                  <span className="material-symbols-outlined text-5xl text-slate-700 mb-2">info</span>
                  <p className="text-slate-500 italic">No games found in this category</p>
                </div>
              )}
              {filteredTournaments.map(t => (
                <div
                  key={t.id}
                  className="bg-surface/30 rounded-xl border border-border-dark p-4 hover:bg-surface/50 transition-all cursor-pointer group"
                  onClick={() => navigate(t.type === 'cash' || t.type === 'sitgo' || t.type === 'spingo' ? `/table/${t.id}` : `/tournament/${t.id}`)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`size-2 rounded-full ${t.status === 'Running' ? 'bg-blue-500' : 'bg-slate-600'}`}></span>
                        <h3 className="text-sm font-bold text-white truncate">{t.name}</h3>
                        <span className={`text-[10px] font-black uppercase tracking-wider ${getStatusColor(t.status)}`}>
                          {t.status}
                        </span>
                        {t.type === 'spingo' && <span className="text-[10px] bg-gold/20 text-gold px-1.5 py-0.5 rounded font-black">SPIN</span>}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">attach_money</span>
                          {t.type === 'cash' ? `Blinds ${t.buyIn}/${t.buyIn * 2}` : `$${t.buyIn.toFixed(2)}`}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">group</span>
                          {t.players}/{t.maxPlayers}
                        </span>
                        {t.type !== 'cash' && (
                          <span className="flex items-center gap-1 text-gold">
                            <span className="material-symbols-outlined text-sm">emoji_events</span>
                            ${t.prizePool.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <button className={`px-6 py-2 rounded-lg font-black text-xs transition-all shadow-lg hover:brightness-110 whitespace-nowrap ${t.status === 'Registering' || t.status === 'Late Reg'
                      ? 'bg-poker-green text-white shadow-poker-green/20'
                      : t.status === 'Running'
                        ? 'bg-blue-600 text-white shadow-blue-600/20'
                        : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      }`}>
                      {t.type === 'cash' ? 'JOIN' : t.status === 'Running' || t.status === 'Final Table' ? 'OBSERVE' : t.status === 'Finished' ? 'ENDED' : 'REGISTER'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Grid View
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTournaments.map(t => (
                <div
                  key={t.id}
                  className="bg-surface/30 rounded-xl border border-border-dark overflow-hidden hover:bg-surface/50 transition-all cursor-pointer group"
                  onClick={() => navigate(t.type === 'cash' || t.type === 'sitgo' || t.type === 'spingo' ? `/table/${t.id}` : `/tournament/${t.id}`)}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <span className={`size-2 rounded-full mt-1 ${t.status === 'Running' ? 'bg-blue-500' : 'bg-slate-600'}`}></span>
                      <span className={`text-[9px] font-black uppercase tracking-wider ${getStatusColor(t.status)}`}>
                        {t.status}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white mb-3 line-clamp-2 min-h-[2.5rem]">{t.name}</h3>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">{t.type === 'cash' ? 'Blinds' : 'Buy-in'}</span>
                        <span className="text-white font-bold">{t.type === 'cash' ? `${t.buyIn}/${t.buyIn * 2}` : `$${t.buyIn.toFixed(2)}`}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Players</span>
                        <span className="text-white font-mono">{t.players}/{t.maxPlayers}</span>
                      </div>
                      {t.type !== 'cash' && (
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Prize Pool</span>
                          <span className="text-gold font-bold">${t.prizePool.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3">
                      <div
                        className={`h-full rounded-full ${t.status === 'Running' ? 'bg-blue-500' : 'bg-poker-green'}`}
                        style={{ width: `${(t.players / t.maxPlayers) * 100}%` }}
                      ></div>
                    </div>

                    <button className={`w-full py-2 rounded-lg font-black text-xs transition-all shadow-lg hover:brightness-110 ${t.status === 'Registering' || t.status === 'Late Reg'
                      ? 'bg-poker-green text-white shadow-poker-green/20'
                      : t.status === 'Running'
                        ? 'bg-blue-600 text-white shadow-blue-600/20'
                        : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      }`}>
                      {t.type === 'cash' ? 'JOIN' : t.status === 'Running' || t.status === 'Final Table' ? 'OBSERVE' : t.status === 'Finished' ? 'ENDED' : 'REGISTER'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar - Hidden on mobile */}
      <aside className="hidden xl:block w-80 border-l border-border-dark bg-surface/10 overflow-y-auto custom-scrollbar">
        <div className="p-6 space-y-6">
          {/* Featured Event */}
          <div>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Featured Event</h3>
            <div className="rounded-xl overflow-hidden relative group cursor-pointer shadow-xl aspect-video border border-border-dark">
              <img src="https://picsum.photos/seed/pokerpromo/400/225" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Featured" />
              <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-80"></div>
              <div className="absolute bottom-4 left-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded">LIVE</span>
                  <p className="text-[10px] font-bold text-gold uppercase">Final Table</p>
                </div>
                <p className="text-sm font-bold text-white">Sunday Million</p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Live Stats</h3>
            <div className="space-y-2">
              <div className="bg-surface/50 rounded-lg p-3 border border-border-dark">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Active Tables</span>
                  <span className="text-lg font-bold text-white">{activeTables.toLocaleString()}</span>
                </div>
              </div>
              <div className="bg-surface/50 rounded-lg p-3 border border-border-dark">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Tournaments Running</span>
                  <span className="text-lg font-bold text-blue-400">
                    {safeTournaments.filter(t => t && t.status === 'Running').length}
                  </span>
                </div>
              </div>
              <div className="bg-surface/50 rounded-lg p-3 border border-border-dark">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Total Prize Pool</span>
                  <span className="text-lg font-bold text-gold">
                    ${safeTournaments.reduce((sum, t) => sum + (t?.prizePool || 0), 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Missions */}
          <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-gold">military_tech</span>
              <p className="text-xs font-bold text-white uppercase tracking-wider">Daily Missions</p>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-slate-400">Play 5 Tournaments</span>
                  <span className="text-white font-mono">1/5</span>
                </div>
                <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                  <div className="h-full bg-gold" style={{ width: '20%' }}></div>
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
