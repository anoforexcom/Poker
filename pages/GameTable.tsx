import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import { usePokerGame, GameConfig } from '../hooks/usePokerGame';
import { useSimulation } from '../contexts/SimulationContext';
import { useLiveWorld } from '../contexts/LiveWorldContext';
import { useNotification } from '../contexts/NotificationContext';
import { BlindStructureType } from '../utils/blindStructure';
// Single table app — ActiveGamesSwitcher removed
import { OrientationPrompt } from '../components/OrientationPrompt';

import { useChat } from '../contexts/ChatContext';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  props: { children: ReactNode } = { children: null }; // Add member declaration

  static getDerivedStateFromError() { return { hasError: true }; }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("GameTable Crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white p-8 text-center">
          <span className="material-symbols-outlined text-6xl text-red-500 mb-4">error</span>
          <h2 className="text-2xl font-black mb-2">Oops! Something went wrong.</h2>
          <p className="text-slate-400 mb-6">The game table encountered an unexpected error. Don't worry, your chips are safe.</p>
          <button onClick={() => window.location.reload()} className="px-8 py-3 bg-primary rounded-xl font-bold uppercase tracking-widest">Reload Table</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const GameTable: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isObserver = searchParams.get('observe') === 'true';
  const { user, updateBalance, activeGames } = useGame();
  const { tables } = useLiveWorld();
  const { showAlert } = useNotification();

  // Chat Connection
  const { addMessage, getMessages, startBotMessages, stopBotMessages } = useChat();
  // const chatHistory = getMessages(id || 'default'); // Moved to hook usage area or kept here?
  // Actually, I'll keep one. The previous edit added one at top. 
  // I need to see where I added the second one. The lint error said:
  // Cannot redeclare block-scoped variable 'chatHistory' at line 25 and 126.
  // I will remove the one at line 25 (added in my previous edit) if there was already one.
  // Wait, I see "chatHistory" was used in the render loop before I touched it?
  // Let's check view_file again to be sure where they are. 
  // But based on lint error, I introduced a duplicate.
  // I'll assume the one I added at top is the "new" one and there was an existing one.
  // I will just keep the one I added at top and remove the old one if I can find it, 
  // OR remove the one I added if the old one is sufficient.
  // Actually, the old one probably didn't use `useChat`.
  // I'll remove the *first* one I added (lines 20-25) and ensure the logic uses the one I added/found later?
  // No, I added lines 9-22 in the diff.
  // I will remove logic from line 25.

  const chatHistory = getMessages(id || 'default');

  // Find tournament config
  const tournament = tables.find(t => t.id === id);

  // Rigorous rule derivation for each game type
  const gameConfig: GameConfig | undefined = tournament ? {
    mode: (tournament as any).type || 'tournament',

    // Starting Stack Logic
    startingStack: (() => {
      const type = (tournament as any).type;
      if (type === 'cash') return 1000; // 100 Big Blinds for fixed 5/10
      if (type === 'spingo') return 500; // Fast-paced 50 BB
      if (type === 'sitgo') return 1500; // Standard 75 BB
      return 1500; // Tournament default
    })(),

    // Blinds Logic
    smallBlind: (() => {
      const type = (tournament as any).type;
      if (type === 'cash') return 5;
      if (type === 'spingo') return 10;
      return tournament.buyIn / 10;
    })(),

    bigBlind: (() => {
      const type = (tournament as any).type;
      if (type === 'cash') return 10;
      if (type === 'spingo') return 20;
      return tournament.buyIn / 5;
    })(),

    ante: 0,
    maxPlayers: (tournament as any).type === 'spingo' ? 3 : tournament.maxPlayers,

    // Structure Logic (Tempo de aumento de blinds)
    blindStructureType: (() => {
      const type = (tournament as any).type;
      const name = tournament.name.toLowerCase();
      if (type === 'spingo') return 'turbo'; // Spins always turbo
      if (name.includes('turbo')) return 'turbo';
      if (name.includes('deep')) return 'deep';
      return 'regular';
    })() as BlindStructureType,

    isObserver,
    status: tournament.status
  } : undefined;

  const {
    players,
    communityCards,
    pot,
    sidePots,
    phase,
    currentTurn,
    currentBet,
    startNewHand,
    handlePlayerAction,
    winners,
    winningHand,
    blindLevel,
    timeToNextLevel,
    isTournamentMode,
    turnTimeLeft,
    totalTurnTime,
    isEliminated,
    isVictory,
    victoryChips
  } = usePokerGame(gameConfig?.startingStack || 0, updateBalance, gameConfig, id, user.id);

  // Elimination: redirect to dashboard after 3 seconds
  useEffect(() => {
    if (!isEliminated) return;
    const timer = setTimeout(() => {
      navigate('/dashboard');
    }, 3000);
    return () => clearTimeout(timer);
  }, [isEliminated, navigate]);

  const [startsIn, setStartsIn] = useState<string>('');

  useEffect(() => {
    if (!tournament?.scheduledStartTime) {
      setStartsIn('');
      return;
    }

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const targetTime = new Date(tournament.scheduledStartTime).getTime();
      const distance = targetTime - now;

      if (distance < 0) {
        setStartsIn('Starting soon...');
      } else {
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setStartsIn(`${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [tournament?.scheduledStartTime]);

  const { addActiveGame } = useGame();
  const activeUser = players.find(p => p.id === user.id);

  // Multi-game coordination: Add this table to active games on mount
  useEffect(() => {
    if (id) {
      addActiveGame(id);
      // Start bot chatter if in tournament
      if (activeUser && players.length > 1) {
        const bots = players.filter(p => !p.isHuman).map(p => ({
          id: p.id,
          name: p.name,
          personality: 'aggressive' as any // Default or randomize
        }));
        startBotMessages(id, bots);
      }
    }
    return () => {
      if (id) stopBotMessages(id);
    }
  }, [id, players.length]);

  const handleSendMessage = (text: string) => {
    if (!id || !user) return;
    addMessage(id, {
      playerId: user.id,
      playerName: user.name,
      message: text,
      type: 'chat'
    });
  };

  const handleLeaveTable = async () => {
    if (activeUser) {
      if ((tournament as any)?.type === 'cash') {
        updateBalance(activeUser.balance);
      } else if (isTournamentMode && winners.length > 0) {
        if (winners[0].isHuman && winners.length === 1) {
          updateBalance((tournament as any)?.prizePool || 0);
          await showAlert(`Congratulations! You won the tournament and earned ${((tournament as any)?.prizePool || 0).toLocaleString()} chips`, 'success', { title: 'Tournament Victory' });
        }
      }
    }
    navigate('/dashboard');
  };

  // Game state
  const [betValue, setBetValue] = useState(20);

  const [showSettings, setShowSettings] = useState(false);
  const [showLobbyModal, setShowLobbyModal] = useState(false);
  const [activeLobbyTab, setActiveLobbyTab] = useState<'info' | 'players' | 'payouts'>('info');
  const [showOrientationPrompt, setShowOrientationPrompt] = useState(false);
  const [showGameSwitcher, setShowGameSwitcher] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Track unread messages when chat is closed
  useEffect(() => {
    if (!showChat && chatHistory.length > 0) {
      setUnreadMessages(prev => prev + 1);
    }
  }, [chatHistory.length]);

  // Clear unread when chat opens
  useEffect(() => {
    if (showChat) setUnreadMessages(0);
  }, [showChat]);

  // Detect mobile and orientation
  useEffect(() => {
    const checkOrientation = () => {
      const isMobile = window.innerWidth < 768;
      const isPortrait = window.innerHeight > window.innerWidth;
      setShowOrientationPrompt(isMobile && isPortrait);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);


  return (
    <div className="flex flex-col h-screen bg-[#0a0f1a] overflow-hidden select-none">
      <OrientationPrompt />

      {/* Elimination Overlay */}
      {isEliminated && (
        <div className="absolute inset-0 z-[200] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center animate-fade-in">
          <div className="flex flex-col items-center gap-6 text-center px-8">
            <div className="size-24 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center animate-pulse">
              <span className="material-symbols-outlined text-5xl text-red-500">skull</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white">Eliminated!</h2>
            <p className="text-slate-400 text-sm max-w-sm">You've run out of chips. Better luck next time!</p>
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <div className="size-2 bg-slate-500 rounded-full animate-pulse"></div>
              Redirecting to dashboard...
            </div>
          </div>
        </div>
      )}

      {/* Victory Celebration Overlay */}
      {isVictory && (
        <div className="absolute inset-0 z-[200] bg-black/85 backdrop-blur-xl flex flex-col items-center justify-center animate-fade-in overflow-hidden">
          {/* Confetti particles */}
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-sm animate-bounce"
              style={{
                width: `${6 + Math.random() * 10}px`,
                height: `${6 + Math.random() * 10}px`,
                backgroundColor: ['#FFD700', '#FF6B35', '#00D4FF', '#FF3366', '#7B61FF', '#00FF88'][i % 6],
                left: `${Math.random() * 100}%`,
                top: `${-10 + Math.random() * 110}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random() * 3}s`,
                opacity: 0.8,
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            />
          ))}

          <div className="flex flex-col items-center gap-6 text-center px-8 relative z-10">
            {/* Trophy */}
            <div className="relative">
              <div className="size-28 md:size-36 rounded-full bg-gradient-to-b from-amber-400/30 to-amber-600/10 border-2 border-amber-400/60 flex items-center justify-center shadow-[0_0_80px_rgba(245,158,11,0.3)]">
                <span className="material-symbols-outlined text-6xl md:text-7xl text-amber-400" style={{ fontVariationSettings: "'FILL' 1" }}>trophy</span>
              </div>
              <div className="absolute -top-2 -right-2 bg-amber-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-amber-300 shadow-lg">
                #1
              </div>
            </div>

            <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500">
              VICTORY!
            </h2>
            <p className="text-slate-300 text-sm max-w-sm">
              You've eliminated all opponents and conquered the table!
            </p>

            {/* Chips Won */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl px-8 py-4 flex flex-col items-center gap-1">
              <span className="text-[10px] font-black text-amber-500/70 uppercase tracking-widest">Total Chips</span>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400 text-2xl">toll</span>
                <span className="text-3xl font-black text-amber-400 font-mono">{victoryChips.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black px-10 py-4 rounded-2xl shadow-[0_10px_40px_rgba(245,158,11,0.3)] transition-all active:scale-95 flex items-center gap-3 text-lg"
            >
              <span className="material-symbols-outlined">home</span>
              RETURN TO DASHBOARD
            </button>
          </div>
        </div>
      )}

      {/* Table Header Overlay */}
      <div className="absolute top-4 left-4 md:top-6 md:left-8 z-20 pointer-events-none">
        <div className="bg-background/80 backdrop-blur-md p-2 md:p-4 rounded-xl border border-white/5 shadow-2xl">
          <h3 className="text-slate-400 text-[8px] md:text-[10px] font-bold uppercase tracking-widest mb-0.5 md:mb-1">
            {tournament?.name || `Table #${id}`}
          </h3>
          <p className="text-white text-sm md:text-lg font-bold flex items-center gap-2">
            <span className="hidden xs:inline">NL Hold'em</span>
            <span className="text-primary text-xs md:text-sm">
              {isTournamentMode ? `Lvl ${blindLevel}` : `${gameConfig?.smallBlind}/${gameConfig?.bigBlind}`}
            </span>
          </p>
        </div>
      </div>

      <div className="absolute top-4 right-4 md:top-6 md:right-8 z-20 flex gap-2 md:gap-4">
        <button
          onClick={handleLeaveTable}
          className="bg-black/60 hover:bg-red-600/60 size-9 md:size-12 rounded-xl text-white transition-all border border-white/10 flex items-center justify-center shadow-2xl backdrop-blur-md group"
          title="Leave Table"
        >
          <span className="material-symbols-outlined text-lg md:text-2xl group-hover:scale-110 transition-transform">logout</span>
        </button>
      </div>

      {/* Tournament Lobby Modal */}
      {
        showLobbyModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in" onClick={() => setShowLobbyModal(false)}>
            <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl h-[80vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="p-6 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-white">{tournament?.name || 'Tournament Lobby'}</h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">ID: {id?.substring(0, 8)} • {tournament?.gameType || 'NL Hold\'em'}</p>
                  </div>
                  <button onClick={() => setShowLobbyModal(false)} className="text-slate-500 hover:text-white transition p-2">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mt-6">
                  {[
                    { id: 'info', label: 'Information', icon: 'info' },
                    { id: 'players', label: 'Players', icon: 'group' },
                    { id: 'payouts', label: 'Payouts', icon: 'payments' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveLobbyTab(tab.id as any)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeLobbyTab === tab.id
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                      <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {activeLobbyTab === 'info' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Buy-in</p>
                        <p className="text-lg font-black text-white">{tournament?.buyIn.toLocaleString() || '0'} 🪙</p>
                      </div>
                      <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Prize Pool</p>
                        <p className="text-lg font-black text-gold">{tournament?.prizePool.toLocaleString() || '0'} 🪙</p>
                      </div>
                      <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Players</p>
                        <p className="text-lg font-black text-white">{players.length}/{tournament?.maxPlayers || '9'}</p>
                      </div>
                      <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Status</p>
                        <p className="text-lg font-black text-primary uppercase">{phase}</p>
                      </div>
                    </div>

                    <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 space-y-4">
                      <div className="flex justify-between items-center pb-4 border-b border-slate-700/50">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-500 uppercase">Current Level</p>
                          <p className="text-white font-bold">{isTournamentMode ? `Level ${blindLevel}` : 'Play Chips'}</p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-[10px] font-bold text-slate-500 uppercase">Blinds</p>
                          <p className="text-primary font-black">{gameConfig?.smallBlind}/{gameConfig?.bigBlind}</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-500 uppercase">Next Level</p>
                          <p className="text-slate-400 font-bold">{isTournamentMode ? `Level ${blindLevel + 1}` : '-'}</p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-[10px] font-bold text-slate-500 uppercase">Time Remaining</p>
                          <div className="flex items-center gap-2 justify-end">
                            <span className="material-symbols-outlined text-sm text-slate-500">schedule</span>
                            <p className="text-white font-mono font-bold">
                              {isTournamentMode ? (
                                `${Math.floor(timeToNextLevel / 60000).toString().padStart(2, '0')}:${Math.floor((timeToNextLevel % 60000) / 1000).toString().padStart(2, '0')}`
                              ) : '--:--'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeLobbyTab === 'players' && (
                  <div className="space-y-2">
                    <div className="flex justify-between px-4 py-2 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-700/50 mb-2">
                      <span>Player</span>
                      <span>Chips</span>
                    </div>
                    {[...players].sort((a, b) => b.balance - a.balance).map((p, i) => (
                      <div key={p.id} className={`flex justify-between items-center p-4 rounded-xl border ${p.isHuman ? 'bg-primary/10 border-primary/30' : 'bg-slate-800/30 border-slate-700/50'} hover:bg-slate-800/50 transition`}>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-mono text-slate-500 w-4">{i + 1}</span>
                          <div className="size-8 rounded-full bg-slate-700 overflow-hidden">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} alt="" />
                          </div>
                          <span className={`text-sm font-bold ${p.isHuman ? 'text-white' : 'text-slate-300'}`}>{p.name}</span>
                        </div>
                        <span className="text-sm font-black text-white">{p.balance.toLocaleString()} 🪙</span>
                      </div>
                    ))}
                  </div>
                )}

                {activeLobbyTab === 'payouts' && (
                  <div className="space-y-4">
                    <div className="bg-gold/10 border border-gold/20 p-4 rounded-2xl flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-gold">emoji_events</span>
                        <p className="text-sm font-bold text-white">Guaranteed Prize Pool</p>
                      </div>
                      <p className="text-xl font-black text-gold">{tournament?.prizePool.toLocaleString() || '0'} 🪙</p>
                    </div>
                    <div className="space-y-2">
                      {[
                        { rank: 1, percent: 45 },
                        { rank: 2, percent: 25 },
                        { rank: 3, percent: 15 },
                        { rank: 4, percent: 10 },
                        { rank: 5, percent: 5 },
                      ].map((payout) => (
                        <div key={payout.rank} className="flex justify-between items-center p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                          <div className="flex items-center gap-3">
                            <span className={`size-6 rounded-full flex items-center justify-center font-bold text-[10px] ${payout.rank === 1 ? 'bg-gold text-background' : 'bg-slate-700 text-slate-300'}`}>{payout.rank}º</span>
                            <span className="text-sm text-slate-400">Position</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-white">{((tournament?.prizePool || 0) * (payout.percent / 100)).toLocaleString()} 🪙</p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase">{payout.percent}% of total</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-6 bg-slate-900 border-t border-slate-700 flex gap-3">
                <button
                  onClick={handleLeaveTable}
                  className="flex-1 bg-slate-800 hover:bg-red-600/20 hover:text-red-400 text-slate-400 font-bold py-3 rounded-2xl transition-all flex items-center justify-center gap-2 border border-slate-700 group"
                >
                  <span className="material-symbols-outlined text-sm group-hover:animate-pulse">logout</span>
                  Leave Table
                </button>
                <button
                  onClick={() => setShowLobbyModal(false)}
                  className="flex-1 bg-primary hover:brightness-110 text-white font-black py-3 rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">play_arrow</span>
                  Back to Game
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Game Switcher removed — single table app */}

      {/* Settings Modal (Simple) */}
      {
        showSettings && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowSettings(false)}>
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-2xl w-80" onClick={e => e.stopPropagation()}>
              <h3 className="text-white font-bold text-lg mb-4">Settings</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-slate-400 text-sm">
                  <span>Sound Effects</span>
                  <input type="checkbox" defaultChecked className="accent-primary" />
                </div>
                <div className="flex justify-between text-slate-400 text-sm">
                  <span>Music</span>
                  <input type="checkbox" className="accent-primary" />
                </div>
                <div className="flex justify-between text-slate-400 text-sm">
                  <span>Auto Muck</span>
                  <input type="checkbox" defaultChecked className="accent-primary" />
                </div>
              </div>
              <button onClick={() => setShowSettings(false)} className="mt-6 w-full bg-primary hover:bg-blue-600 text-white font-bold py-2 rounded-lg transition">Close</button>
            </div>
          </div>
        )
      }

      {/* The Poker Table Rendering */}
      <div className="flex-1 flex items-center justify-center px-2 py-2 md:p-8 lg:p-12 pt-14 md:pt-24 overflow-visible">
        <div className="poker-table relative w-full h-full max-h-[40vh] md:max-h-[50vh] max-w-3xl aspect-[2/1] md:aspect-[2.2/1] bg-gradient-to-b from-emerald-800 to-emerald-950 border-4 md:border-[12px] border-[#3a2a1a] flex flex-col items-center justify-center shadow-2xl rounded-[50%] ring-2 md:ring-4 ring-[#2a1a0a]/50">

          {/* Table Center: Pot & Cards */}
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-1 md:gap-2">
              <div className="bg-black/40 backdrop-blur-md px-3 py-1 md:px-6 md:py-2 rounded-full border border-white/10 flex flex-col items-center">
                <span className="text-slate-400 text-[8px] md:text-[10px] font-bold uppercase tracking-widest">Total Pot</span>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-gold text-xs md:text-sm">toll</span>
                  <span className="text-base md:text-2xl font-black text-white">{pot.toLocaleString()}</span>
                </div>
              </div>

              {/* Side Pots */}
              {sidePots.length > 0 && (
                <div className="flex gap-2">
                  {sidePots.map((sp, i) => (
                    <div key={i} className="bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/5 flex items-center gap-2">
                      <span className="text-[8px] font-bold text-slate-500 uppercase">Side {i + 1}</span>
                      <span className="text-xs font-black text-slate-300">{sp.amount.toLocaleString()} 🪙</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-0.5 md:gap-3 h-12 md:h-28 items-center">
              {communityCards.map((card, i) => (
                <HeroCard key={i} suit={card.suit} value={card.rank} />
              ))}
              {Array.from({ length: 5 - communityCards.length }).map((_, i) => (
                <div key={`empty-${i}`} className="w-8 h-11 md:w-20 md:h-28 bg-slate-100/10 border border-dashed border-white/20 rounded-md md:rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-white/20 text-[10px] md:text-sm">help</span>
                </div>
              ))}
            </div>

            {winners.length > 0 && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/95 p-8 rounded-2xl z-50 text-center border-4 border-gold shadow-2xl animate-fade-in-up max-w-md">
                <p className="text-gold font-bold text-2xl uppercase tracking-widest mb-3">
                  {winners.length > 1 ? '🤝 Split Pot 🤝' : '🏆 Winner 🏆'}
                </p>
                <div className="mb-2">
                  {winners.map((w, idx) => (
                    <p key={w.id} className="text-white text-3xl font-black">
                      {w.name}{idx < winners.length - 1 ? ' &' : ''}
                    </p>
                  ))}
                </div>
                {winningHand && (
                  <p className="text-primary text-lg font-bold mb-4">{winningHand.name}</p>
                )}
                <div className="flex gap-2 justify-center mb-4">
                  {winners[0].hand.map((card, i) => (
                    <HeroCard key={i} suit={card.suit} value={card.rank} />
                  ))}
                </div>
                <div className="bg-gold/20 border border-gold/50 rounded-lg p-3 mb-6">
                  <p className="text-slate-400 text-sm mb-1">{winners.length > 1 ? 'Total Pot Split' : 'Pot Won'}</p>
                  <p className="text-gold text-3xl font-black">{pot.toLocaleString()} 🪙</p>
                </div>
                <button onClick={startNewHand} className="bg-primary hover:bg-primary-light px-10 py-4 rounded-xl font-black text-white uppercase tracking-wider shadow-lg transform transition hover:scale-105">
                  Next Hand
                </button>
              </div>
            )}


            {/* Human current bet chips on table */}
            {!isObserver && activeUser && activeUser.currentBet > 0 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce-short z-20">
                <ChipStack amount={activeUser.currentBet} />
                <span className="bg-black/90 text-white text-[10px] font-black px-2 py-0.5 rounded mt-2 border border-gold/50 shadow-2xl backdrop-blur-md flex items-center gap-1">
                  <span className="material-symbols-outlined text-gold text-[10px]">toll</span>
                  {activeUser.currentBet.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Debug/Start Button when empty */}
          {players.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-black/40 backdrop-blur-sm rounded-[200px]">
              <div className="bg-slate-900/90 p-8 rounded-3xl border border-white/10 text-center shadow-2xl max-w-sm">
                <div className="size-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-primary text-3xl animate-pulse">play_circle</span>
                </div>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-2">Table is Empty</h3>
                <p className="text-slate-400 text-xs mb-6 leading-relaxed">
                  The bots are ready to play. If the game doesn't start automatically, click below to force initialize the table.
                </p>
                <button
                  onClick={() => handlePlayerAction('start')}
                  className="w-full bg-primary hover:brightness-110 text-white font-black py-4 rounded-xl shadow-xl shadow-primary/20 transition-all uppercase tracking-widest text-sm"
                >
                  Start Table & Call Bots
                </button>
              </div>
            </div>
          )}

          {/* Players Seats */}
          {players.map((player, index) => {
            if (player.id === user.id) return null; // Hero rendered manually or skipped here

            // Correct position mapping
            const otherPlayers = players.filter(p => p.id !== user.id);
            const pIdx = otherPlayers.findIndex(p => p.id === player.id);
            const posMap = ['mid-right', 'top-right', 'top', 'top-left', 'mid-left', 'bottom-left', 'bottom-right'];
            const pos = posMap[pIdx] || 'top';

            return (
              <PlayerSeat
                key={player.id}
                position={pos}
                name={player.name}
                balance={player.balance}
                active={index === currentTurn}
                inactive={player.isFolded || !player.isActive}
                dealer={player.isDealer}
                currentBet={player.currentBet}
                timeLeft={index === currentTurn ? turnTimeLeft : 0}
                totalTime={totalTurnTime}
              />
            );
          })}
        </div>
      </div>




      {/* Chat Icon Button (Bottom Left) */}
      <button
        onClick={() => setShowChat(!showChat)}
        className="fixed bottom-6 left-6 z-[90] bg-slate-900/90 backdrop-blur-xl size-12 rounded-full border border-white/10 shadow-2xl flex items-center justify-center text-white hover:bg-slate-800 transition-all active:scale-90 group"
      >
        <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">{showChat ? 'close' : 'chat'}</span>
        {!showChat && unreadMessages > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 border-2 border-slate-900 animate-bounce">
            {unreadMessages > 9 ? '9+' : unreadMessages}
          </span>
        )}
      </button>

      {/* Chat Panel (Collapsible) */}
      {showChat && (
        <div className="fixed bottom-20 left-6 z-[85] w-72 md:w-80 animate-scale-in origin-bottom-left">
          <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden flex flex-col h-64 shadow-2xl">
            <div className="p-3 border-b border-white/5 flex justify-between items-center bg-white/5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Chat</span>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[8px] font-bold text-emerald-500/80 uppercase">Online</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 text-[10px] md:text-[11px]">
              {chatHistory.slice(-20).map((msg, idx) => {
                const colors = ['text-blue-400', 'text-green-400', 'text-purple-400', 'text-yellow-400', 'text-pink-400', 'text-cyan-400'];
                let hash = 0;
                const senderName = msg.playerName || 'System';
                for (let i = 0; i < senderName.length; i++) hash = senderName.charCodeAt(i) + ((hash << 5) - hash);
                const colorClass = colors[Math.abs(hash) % colors.length];
                return (
                  <p key={idx} className={`${msg.type === 'system' ? 'text-yellow-500 italic' : 'text-slate-300'}`}>
                    <span className={`${colorClass} font-bold mr-1 text-[8px] uppercase`}>{senderName}:</span> {msg.message}
                  </p>
                );
              })}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const input = e.currentTarget.elements.namedItem('message') as HTMLInputElement;
                if (input.value.trim()) { handleSendMessage(input.value); input.value = ''; }
              }}
              className="p-2 border-t border-white/5 bg-black/30"
            >
              <input name="message" type="text" placeholder="Type..." className="w-full bg-slate-800/50 border border-white/5 text-white text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-primary outline-none placeholder:text-slate-600" autoComplete="off" />
            </form>
          </div>
        </div>
      )}

      {/* Bottom Bar: Player Cards + Action Buttons */}
      <footer className="w-full z-[80] bg-gradient-to-t from-[#050a15] via-[#050a15]/95 to-transparent pb-safe">
        {!isObserver && activeUser && (
          <div className="max-w-4xl mx-auto px-2 md:px-4 py-2 md:py-3 flex flex-col items-center gap-2 md:gap-3">

            {/* Turn Timer Bar */}
            {currentTurn >= 0 && players[currentTurn]?.id === user.id && (
              <div className="w-full max-w-md">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 animate-pulse">Your Turn</span>
                  <span className={`text-xs font-black font-mono ${turnTimeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{turnTimeLeft}s</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 linear ${turnTimeLeft <= 5 ? 'bg-red-500' : turnTimeLeft <= 10 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${(turnTimeLeft / totalTurnTime) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 md:gap-4">
              <div className="flex gap-1">
                {activeUser?.hand.map((card, i) => (
                  <HeroCard key={i} suit={card.suit} value={card.rank} rotate={i === 0 ? '-rotate-3' : 'rotate-3'} />
                ))}
              </div>
              <div className="bg-black/60 backdrop-blur-md px-2 py-1 md:px-4 md:py-2 rounded-lg md:rounded-xl border border-white/10">
                <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-slate-500">Chips</span>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-gold text-xs md:text-base">toll</span>
                  <p className="text-sm md:text-lg font-black text-white font-mono">{activeUser?.balance.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons Row */}
            {(!phase || phase === 'showdown') ? (
              <button
                onClick={startNewHand}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-10 py-3 rounded-2xl shadow-lg flex items-center gap-2 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined group-hover:rotate-180 transition-transform">refresh</span>
                NEXT HAND
              </button>
            ) : currentTurn >= 0 && players[currentTurn]?.id === user.id ? (
              <div className="flex flex-col items-center gap-1.5 md:gap-2 w-full max-w-lg">
                {/* Bet controls */}
                <div className="flex items-center gap-1.5 md:gap-2 w-full">
                  <span className="material-symbols-outlined text-primary text-xs md:text-sm">toll</span>
                  <input
                    type="range" min={gameConfig?.bigBlind || 20} max={activeUser?.balance || 1000} step={gameConfig?.smallBlind || 10}
                    value={betValue} onChange={(e) => setBetValue(Number(e.target.value))}
                    className="flex-1 h-1 md:h-1.5 bg-slate-700 rounded-full appearance-none accent-primary cursor-pointer"
                  />
                  <span className="text-white font-black text-xs font-mono min-w-[50px] md:min-w-[60px] text-right">{betValue.toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-4 gap-1 w-full">
                  <button onClick={() => setBetValue(Math.floor(pot / 2))} className="bg-zinc-800 hover:bg-zinc-700 text-[8px] md:text-[9px] font-black py-1 md:py-1.5 rounded-md md:rounded-lg transition uppercase text-slate-300">1/2</button>
                  <button onClick={() => setBetValue(Math.floor(pot * 0.75))} className="bg-zinc-800 hover:bg-zinc-700 text-[8px] md:text-[9px] font-black py-1 md:py-1.5 rounded-md md:rounded-lg transition uppercase text-slate-300">3/4</button>
                  <button onClick={() => setBetValue(pot)} className="bg-zinc-800 hover:bg-zinc-700 text-[8px] md:text-[9px] font-black py-1 md:py-1.5 rounded-md md:rounded-lg transition uppercase text-slate-300">POT</button>
                  <button onClick={() => setBetValue(activeUser?.balance || 0)} className="bg-red-500/20 hover:bg-red-500/30 text-[8px] md:text-[9px] font-black py-1 md:py-1.5 rounded-md md:rounded-lg transition uppercase text-red-400 border border-red-500/20">ALL-IN</button>
                </div>
                <div className="grid grid-cols-3 gap-1.5 md:gap-2 w-full">
                  <button
                    onClick={() => handlePlayerAction('fold')}
                    className="bg-zinc-800 hover:bg-red-600/40 text-white font-black py-2.5 md:py-3 rounded-lg md:rounded-xl shadow-lg uppercase text-[10px] md:text-xs border border-white/5 transition-all active:scale-95"
                  >Fold</button>
                  {currentBet === 0 || (activeUser && activeUser.currentBet === currentBet) ? (
                    <button
                      onClick={() => handlePlayerAction('check')}
                      className="bg-zinc-800 hover:bg-emerald-600/40 text-white font-black py-2.5 md:py-3 rounded-lg md:rounded-xl shadow-lg uppercase text-[10px] md:text-xs border border-white/5 transition-all active:scale-95"
                    >Check</button>
                  ) : (
                    <button
                      onClick={() => handlePlayerAction('call')}
                      className="bg-zinc-800 hover:bg-emerald-600/40 text-white font-black py-2.5 md:py-3 rounded-lg md:rounded-xl shadow-lg text-[10px] md:text-xs border border-white/5 transition-all active:scale-95"
                    >
                      <span className="uppercase text-[8px] md:text-[10px] opacity-70">Call</span>
                      <span className="block text-xs md:text-sm font-black">{activeUser ? (currentBet - activeUser.currentBet).toLocaleString() : 0} 🪙</span>
                    </button>
                  )}
                  <button
                    onClick={() => handlePlayerAction('raise', betValue)}
                    className="bg-primary hover:brightness-125 text-white font-black py-2.5 md:py-3 rounded-lg md:rounded-xl shadow-xl shadow-primary/20 uppercase text-[10px] md:text-xs border border-white/10 transition-all active:scale-95"
                  >Raise</button>
                </div>
              </div>
            ) : (
              <div className="bg-black/50 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 flex items-center gap-3">
                <div className="size-2.5 bg-amber-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-black text-white uppercase tracking-widest opacity-80">
                  {players[currentTurn]?.name || 'Opponent'}'s Turn...
                </span>
              </div>
            )}
          </div>
        )}
      </footer>
    </div >
  );
};

const ChipStack = ({ amount, size = 'md' }: { amount: number, size?: 'sm' | 'md' }) => {
  const getChips = (val: number) => {
    const chips = [];
    let remaining = val;

    // Denominations: 1000, 500, 100, 25, 5, 1
    const denoms = [
      { v: 1000, c: 'bg-purple-600' },
      { v: 500, c: 'bg-orange-500' },
      { v: 100, c: 'bg-slate-900' },
      { v: 25, c: 'bg-green-600' },
      { v: 5, c: 'bg-red-600' },
      { v: 1, c: 'bg-white text-slate-900' }
    ];

    for (const d of denoms) {
      const count = Math.floor(remaining / d.v);
      for (let i = 0; i < Math.min(count, 5); i++) { // Max 5 visual chips per denom
        chips.push(d.c);
      }
      remaining %= d.v;
      if (chips.length >= 8) break; // Max 8 total visual chips
    }
    return chips.reverse();
  };

  const chips = getChips(amount);
  const chipSize = size === 'sm' ? 'size-3' : 'size-4';
  const overlap = size === 'sm' ? '-space-x-1' : '-space-x-1.5';

  return (
    <div className={`flex ${overlap} items-center justify-center`}>
      {chips.map((color, i) => (
        <div
          key={i}
          className={`${chipSize} rounded-full ${color} border border-white/40 shadow-sm flex items-center justify-center`}
          style={{ transform: `translateY(${-i * 1.5}px)`, zIndex: i }}
        >
          <div className="size-full rounded-full border border-black/10"></div>
        </div>
      ))}
    </div>
  );
};

const PlayerSeat = ({ position, name, balance, active, inactive, dealer, currentBet, timeLeft, totalTime }: any) => {
  const positions: any = {
    'top': '-top-6 md:-top-16 left-1/2 -translate-x-1/2',
    'top-left': '-top-2 md:-top-4 left-[5%] md:left-0',
    'top-right': '-top-2 md:-top-4 right-[5%] md:right-0',
    'mid-left': 'top-[40%] -translate-y-1/2 -left-4 md:-left-24',
    'mid-right': 'top-[40%] -translate-y-1/2 -right-4 md:-right-24',
    'bottom-left': '-bottom-2 md:bottom-8 left-[10%] md:left-[5%]',
    'bottom-right': '-bottom-2 md:bottom-8 right-[10%] md:right-[5%]',
  };

  return (
    <div className={`absolute ${positions[position]} flex flex-col items-center gap-0 md:gap-2 z-10 transition-all duration-500 scale-[0.55] sm:scale-[0.7] md:scale-100`}>
      <div className={`relative size-10 md:size-24 rounded-full border-2 md:border-4 ${active ? 'border-amber-400 ring-2 md:ring-8 ring-amber-400/20 scale-110' : 'border-slate-800'} bg-slate-700 overflow-hidden ${inactive ? 'grayscale opacity-50' : ''} transition-all duration-300 shadow-xl`}>
        {active && timeLeft > 0 && (
          <svg className="absolute inset-0 size-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
            <circle
              cx="50" cy="50" r="46"
              fill="none"
              stroke="#fbbf24" // Amber-400 / Gold
              strokeWidth="8"
              strokeDasharray="289"
              strokeDashoffset={289 - (289 * timeLeft) / totalTime}
              className="transition-all duration-[30ms] linear"
            />
          </svg>
        )}
        <img className="w-full h-full object-cover" src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`} alt={name} />
      </div>

      {/* Player Info with Stack */}
      <div className={`bg-background/95 backdrop-blur-sm px-2 py-1 md:px-4 md:py-2 rounded-md md:rounded-lg text-center border ${inactive ? 'border-slate-800' : active ? 'border-primary' : 'border-slate-700'} min-w-[60px] md:min-w-[100px] shadow-lg`}>
        <p className={`text-[9px] md:text-xs font-bold ${inactive ? 'text-slate-600' : 'text-white'} truncate`}>{name}</p>
        <div className="flex items-center justify-center gap-1">
          <span className={`material-symbols-outlined text-[10px] ${inactive ? 'text-slate-600' : 'text-gold'}`}>toll</span>
          <p className={`text-[10px] md:text-sm font-black ${inactive ? 'text-slate-600' : 'text-gold'}`}>{Number(balance).toLocaleString()}</p>
        </div>
      </div>

      {/* Dealer Button */}
      {dealer && (
        <div className="absolute -right-6 top-0 bg-white text-black font-black size-6 rounded-full flex items-center justify-center text-xs border-2 border-gold shadow-lg transition-all animate-in fade-in zoom-in">D</div>
      )}

      {/* Current Bet Chips */}
      {currentBet > 0 && (
        <div className="absolute -bottom-10 md:-bottom-16 flex flex-col items-center animate-bounce-short z-20 scale-75 md:scale-100">
          <ChipStack amount={currentBet} />
          <span className="bg-black/90 text-white text-[10px] font-black px-2 py-0.5 rounded mt-2 border border-gold/50 shadow-2xl backdrop-blur-md flex items-center gap-1">
            <span className="material-symbols-outlined text-gold text-[10px]">toll</span>
            {currentBet.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
};

const HeroCard = ({ suit, value, rotate }: any) => {
  const getSuitColor = (s: string) => {
    switch (s) {
      case 'hearts': return 'text-red-600';
      case 'diamonds': return 'text-red-600';
      case 'clubs': return 'text-gray-900';
      case 'spades': return 'text-gray-900';
      default: return 'text-gray-900';
    }
  };

  const getSuitSymbol = (s: string) => {
    switch (s) {
      case 'hearts': return '♥';
      case 'diamonds': return '♦';
      case 'clubs': return '♣';
      case 'spades': return '♠';
      default: return '?';
    }
  };

  const getMaterialIcon = (s: string) => {
    switch (s) {
      case 'hearts': return 'heart_plus'; // approximate
      case 'diamonds': return 'diamond';
      case 'clubs': return 'local_florist'; // approximate for club
      case 'spades': return 'spades'; // might need custom or different icon
      default: return 'help';
    }
  }

  return (
    <div className={`w-8 h-12 md:w-20 md:h-28 bg-white rounded-md md:rounded-xl border border-primary/80 md:border-2 md:border-primary flex flex-col p-0.5 md:p-2 items-center justify-between shadow-2xl transform transition-transform md:hover:-translate-y-2 cursor-pointer ${rotate} ${getSuitColor(suit)}`}>
      <span className="text-[10px] md:text-2xl font-black self-start leading-none tracking-tighter">{value}{getSuitSymbol(suit)}</span>
      <span className="text-sm md:text-4xl">{getSuitSymbol(suit)}</span>
      <span className="text-[10px] md:text-2xl font-black self-end leading-none tracking-tighter rotate-180">{value}{getSuitSymbol(suit)}</span>
    </div>
  );
};

const GameTableWrapper = () => (
  <ErrorBoundary>
    <GameTable />
  </ErrorBoundary>
);

export default GameTableWrapper;
