import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TournamentClock from '../components/TournamentClock';
import { useLiveWorld } from '../contexts/LiveWorldContext';
import { useSimulation } from '../contexts/SimulationContext';
import { useGame } from '../contexts/GameContext';
import { useSmoothedValue } from '../hooks/useSmoothedValue';
import { useNotification } from '../contexts/NotificationContext';

type LobbyTab = 'tournaments' | 'cash' | 'sitgo' | 'spingo';
type ViewMode = 'list' | 'grid';

const Lobby: React.FC = () => {
  const { onlinePlayers, activeTables, smoothedOnlinePlayers, tournaments, registerForTournament } = useLiveWorld();
  const [activeTab, setActiveTab] = useState<LobbyTab>('tournaments');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [speedFilter, setSpeedFilter] = useState<string[]>([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const navigate = useNavigate();
  const { user: gameUser, withdraw, activeGames } = useGame();
  const { showAlert } = useNotification();
  const [isRegistering, setIsRegistering] = useState<string | null>(null);

  // Safety check: ensure tournaments is always an array
  const safeTournaments = Array.isArray(tournaments) ? tournaments : [];

  // No local smoothing needed - using global context for perfect sync
  const headerOnlinePlayers = smoothedOnlinePlayers;
  const headerActiveTables = activeTables;

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
  }).sort((a, b) => {
    // Sort critical statuses to top
    const statusOrder: Record<string, number> = {
      'registering': 0,
      'late_reg': 1,
      'running': 2,
      'final_table': 3,
      'active': 0, // for cash games
      'finished': 9
    };

    const statusA = statusOrder[a.status?.toLowerCase()] ?? 8;
    const statusB = statusOrder[b.status?.toLowerCase()] ?? 8;

    if (statusA !== statusB) return statusA - statusB;

    // Secondary sort by title to keep it stable
    return a.name.localeCompare(b.name);
  });

  const handleJoinGame = async (t: any) => {
    // If it's a finished tournament, we can only observe
    const status = t.status?.toLowerCase();
    if (status === 'finished') return;

    // For Running tournaments, we are observing
    if (status === 'running' || status === 'final_table') {
      navigate(t.type === 'cash' || t.type === 'sitgo' || t.type === 'spingo' ? `/table/${t.id}` : `/tournament/${t.id}`);
      return;
    }

    // Check balance
    if (gameUser.balance < t.buyIn) {
      await showAlert(`Insufficient funds! You need $${t.buyIn.toFixed(2)} to join this game.`, 'error', { title: 'Balance Error' });
      return;
    }

    // Custom confirm modal
    const confirmed = await showAlert(
      `Join ${t.name} for $${t.buyIn.toFixed(2)}?`,
      'info',
      {
        title: 'Confirm Registration',
        confirmText: 'Join Table',
        showCancel: true
      }
    );

    if (confirmed) {
      setIsRegistering(t.id);
      try {
        await withdraw(t.buyIn);
        await registerForTournament(t.id, gameUser.id);

        await showAlert(`Successfully registered for ${t.name}!`, 'success');
        navigate(t.type === 'cash' || t.type === 'sitgo' || t.type === 'spingo' ? `/table/${t.id}` : `/tournament/${t.id}`);
      } catch (err: any) {
        console.error('Registration failed:', err);
        await showAlert(`Registration failed: ${err.message || JSON.stringify(err)}`, 'error');
      } finally {
        setIsRegistering(null);
      }
    }
  };

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

  const getStatusColor = (rawStatus: string) => {
    const status = rawStatus?.toLowerCase();
    switch (status) {
      case 'registering': return 'text-poker-green';
      case 'late_reg': return 'text-yellow-500';
      case 'running': return 'text-blue-400';
      case 'final_table': return 'text-red-500 animate-pulse';
      case 'finished': return 'text-slate-500';
      default: return 'text-white';
    }
  };

  const toggleSpeedFilter = (speed: string) => {
    setSpeedFilter(prev =>
      prev.includes(speed) ? prev.filter(s => s !== speed) : [...prev, speed]
    );
  };

  // Loading state while contexts initialize
  if (tournaments === undefined) {
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
        <div className="p-3 md:p-6 border-b border-border-dark bg-surface/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <h2 className="text-xl md:text-3xl font-black text-white tracking-tighter font-display uppercase italic">Lobby</h2>
              <p className="text-slate-500 text-[9px] md:text-sm font-bold uppercase tracking-widest mt-0.5">Explore active tables</p>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <div className="bg-emerald-500/10 text-emerald-400 text-[9px] font-black px-2 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1.5 shadow-sm">
                <span className="size-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                {filteredTournaments.length} <span className="hidden xs:inline">ACTIVE GAMES</span>
              </div>
              <div className="bg-primary/10 text-primary-light text-[9px] font-black px-2 py-1 rounded-lg border border-primary/20 flex items-center gap-1.5 shadow-sm">
                <span className="size-1.5 bg-primary-light rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
                {headerOnlinePlayers.toLocaleString()} <span className="hidden xs:inline">PLAYERS</span>
              </div>
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="lg:hidden bg-slate-800 text-slate-400 p-2 rounded-lg border border-slate-700 flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">{showMobileFilters ? 'expand_less' : 'filter_list'}</span>
                <span className="text-[10px] font-black uppercase">Filters</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 overflow-x-auto pb-2 scrollbar-hide snap-x -mx-1 px-1">
            {[
              { id: 'tournaments', label: 'Tournaments', icon: 'emoji_events' },
              { id: 'cash', label: 'Cash', icon: 'payments' },
              { id: 'sitgo', label: 'Sit & Go', icon: 'group' },
              { id: 'spingo', label: 'Spin', icon: 'casino' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as LobbyTab)}
                className={`flex items-center gap-1.5 px-3 py-2 md:px-4 md:py-2.5 rounded-xl font-black text-[10px] md:text-xs whitespace-nowrap transition-all border snap-start ${activeTab === tab.id
                  ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                  : 'bg-white/5 border-transparent text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
              >
                <span className="material-symbols-outlined text-sm md:text-base">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filters & Controls */}
        <div className={`p-4 md:p-6 border-b border-border-dark bg-surface/10 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
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
                  className="bg-surface/40 backdrop-blur-sm rounded-xl border border-white/5 p-3 md:p-5 hover:bg-white/5 transition-all cursor-pointer group shadow-lg"
                  onClick={() => handleJoinGame(t)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <TournamentClock
                          startTime={t.scheduledStartTime}
                          lateRegUntil={t.lateRegUntil}
                          status={t.status}
                          size="sm"
                          className="mr-1"
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="text-[11px] xs:text-xs md:text-sm font-black text-white truncate leading-none mb-1">{t.name}</h3>
                          <div className="flex items-center gap-1">
                            <span className={`text-[7px] md:text-[9px] font-black uppercase tracking-widest px-1 py-0.5 rounded bg-black/40 ${getStatusColor(t.status)}`}>
                              {t.status?.replace('_', ' ')}
                            </span>
                            {t.type === 'spingo' && <span className="text-[7px] md:text-[9px] bg-gold/20 text-gold px-1 py-0.5 rounded font-black border border-gold/10">SPIN</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 xs:gap-2 md:gap-4 text-[8px] xs:text-[9px] md:text-xs text-slate-400">
                        <span className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded-md">
                          <span className="material-symbols-outlined text-[10px] md:text-base text-slate-500">payments</span>
                          <span className="font-bold text-slate-300">{t.type === 'cash' ? `${t.buyIn}/${t.buyIn * 2}` : `$${t.buyIn.toFixed(2)}`}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[10px] md:text-base text-slate-500">group</span>
                          <span className="font-mono font-bold leading-none">
                            {t.players}
                            {t.type !== 'tournament' && <span className="text-slate-600">/{t.maxPlayers}</span>}
                            {t.type === 'tournament' && <span className="text-slate-600 text-[8px] ml-1">UNLIMITED</span>}
                          </span>
                        </span>
                        {t.type !== 'cash' && (
                          <span className="flex items-center gap-1 text-gold-light">
                            <span className="material-symbols-outlined text-[10px] md:text-base">emoji_events</span>
                            <span className="font-black">${t.prizePool.toLocaleString()} <span className="text-[8px] animate-pulse">UPDATING</span></span>
                          </span>
                        )}
                      </div>

                      <button
                        className={`mt-3 px-4 py-2 md:px-8 md:py-3 rounded-xl font-black text-[9px] md:text-xs tracking-widest transition-all shadow-xl hover:brightness-110 active:scale-95 whitespace-nowrap uppercase border ${t.status?.toLowerCase() === 'registering' || t.status?.toLowerCase() === 'late_reg'
                          ? 'bg-emerald-600 border-emerald-500 text-white shadow-emerald-900/40'
                          : t.status?.toLowerCase() === 'running' || t.status?.toLowerCase() === 'final_table'
                            ? 'bg-blue-600 border-blue-500 text-white shadow-blue-900/40'
                            : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                          }`}>
                        {t.type === 'cash' || activeGames.some(ag => ag.id === t.id)
                          ? 'ENTER'
                          : (t.status?.toLowerCase() === 'running' || t.status?.toLowerCase() === 'final_table')
                            ? 'OBSERVE'
                            : t.status?.toLowerCase() === 'finished'
                              ? 'FINISHED'
                              : 'REGISTER'}
                      </button>
                    </div>
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
                  onClick={() => handleJoinGame(t)}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <TournamentClock
                        startTime={t.scheduledStartTime}
                        lateRegUntil={t.lateRegUntil}
                        status={t.status}
                        size="md"
                      />
                      <span className={`text-[9px] font-black uppercase tracking-wider ${getStatusColor(t.status)}`}>
                        {t.status?.replace('_', ' ')}
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
                        <span className="text-white font-mono">
                          {t.players}
                          {t.type !== 'tournament' ? `/${t.maxPlayers}` : ' (Unlimited)'}
                        </span>
                      </div>
                      {t.type !== 'cash' && (
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">
                            {t.type === 'sitgo' || t.type === 'spingo' ? 'Top Prizes' : 'Prize Pool'}
                          </span>
                          <span className="text-gold font-bold">${t.prizePool.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3">
                      <div
                        className={`h-full rounded-full ${t.status?.toLowerCase() === 'running' ? 'bg-blue-500' : 'bg-poker-green'}`}
                        style={{ width: t.type === 'tournament' ? '100%' : `${(t.players / t.maxPlayers) * 100}%` }}
                      ></div>
                    </div>

                    <button className={`w-full py-2 rounded-lg font-black text-xs transition-all shadow-lg hover:brightness-110 ${['registering', 'late_reg', 'active'].includes(t.status?.toLowerCase())
                      ? 'bg-poker-green text-white shadow-poker-green/20'
                      : ['running', 'final_table'].includes(t.status?.toLowerCase())
                        ? 'bg-blue-600 text-white shadow-blue-600/20'
                        : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      }`}>
                      {isRegistering === t.id ? (
                        <div className="flex items-center justify-center gap-2 uppercase">
                          <div className="size-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Processing
                        </div>
                      ) : (
                        t.type === 'cash' || activeGames.some(ag => ag.id === t.id)
                          ? 'ENTER'
                          : ['running', 'final_table'].includes(t.status?.toLowerCase())
                            ? 'OBSERVE'
                            : t.status?.toLowerCase() === 'finished'
                              ? 'ENDED'
                              : 'REGISTER'
                      )}
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
          {/* Live Stats */}
          <div>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Live Stats</h3>
            <div className="space-y-2">
              <div className="bg-surface/50 rounded-lg p-3 border border-border-dark">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Online Players</span>
                  <span className="text-lg font-bold text-white">{headerOnlinePlayers.toLocaleString()}</span>
                </div>
              </div>
              <div className="bg-surface/50 rounded-lg p-3 border border-border-dark">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Tournaments Running</span>
                  <span className="text-lg font-bold text-blue-400">
                    {safeTournaments.filter(t => t && t.status?.toLowerCase() === 'running').length}
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
