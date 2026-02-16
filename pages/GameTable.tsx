import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import { usePokerGame, GameConfig } from '../hooks/usePokerGame';
import { useSimulation } from '../contexts/SimulationContext';
import { useLiveWorld } from '../contexts/LiveWorldContext';
import { useNotification } from '../contexts/NotificationContext';
import { BlindStructureType } from '../utils/blindStructure';
import { ActiveGamesSwitcher } from '../components/ActiveGamesSwitcher';
import { OrientationPrompt } from '../components/OrientationPrompt';

import { useChat } from '../contexts/ChatContext';

const GameTable: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isObserver = searchParams.get('observe') === 'true';
  const { user, updateBalance, activeGames } = useGame();
  const { tournaments } = useLiveWorld();
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
  const tournament = tournaments.find(t => t.id === id);

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
    totalTurnTime
  } = usePokerGame(gameConfig?.startingStack || 0, updateBalance, gameConfig, id, user.id);

  const { addActiveGame } = useGame();

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

  const activeUser = players.find(p => p.id === user.id);

  const handleLeaveTable = async () => {
    if (activeUser) {
      if (tournament?.type === 'cash') {
        updateBalance(activeUser.balance);
      } else if (isTournamentMode && winners.length > 0) {
        if (winners[0].isHuman && winners.length === 1) {
          updateBalance(tournament.prizePool);
          await showAlert(`Congratulations! You won the tournament and earned $${tournament.prizePool.toLocaleString()}`, 'success', { title: 'Tournament Victory' });
        }
      }
    }
    navigate('/dashboard');
  };

  // Restored Game Logic
  const [betValue, setBetValue] = useState(20);

  // Start game loop
  // Game Loop is now driven by Backend Realtime updates. 
  // startNewHand is only called explicitly (e.g. via "Next Hand" button after showdown).

  // Legacy chat state removed in favor of ChatContext
  const [showSettings, setShowSettings] = useState(false);
  const [showLobbyModal, setShowLobbyModal] = useState(false);
  const [activeLobbyTab, setActiveLobbyTab] = useState<'info' | 'players' | 'payouts'>('info');
  const [showOrientationPrompt, setShowOrientationPrompt] = useState(false);
  const [showGameSwitcher, setShowGameSwitcher] = useState(false);

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

      {/* Table Header Overlay */}
      <div className="absolute top-4 left-4 md:top-6 md:left-8 z-20 pointer-events-none">
        <div className="bg-background/80 backdrop-blur-md p-2 md:p-4 rounded-xl border border-white/5 shadow-2xl">
          <h3 className="text-slate-400 text-[8px] md:text-[10px] font-bold uppercase tracking-widest mb-0.5 md:mb-1">
            {tournament?.name || `Table #${id}`}
          </h3>
          <p className="text-white text-sm md:text-lg font-bold flex items-center gap-2">
            <span className="hidden xs:inline">NL Hold'em</span>
            <span className="text-primary text-xs md:text-sm">
              {isTournamentMode ? `Lvl ${blindLevel}` : `$${gameConfig?.smallBlind}/$${gameConfig?.bigBlind}`}
            </span>
          </p>
        </div>
      </div>

      <div className="absolute top-4 right-4 md:top-6 md:right-8 z-20 flex gap-2 md:gap-4">
        <button
          onClick={() => setShowGameSwitcher(!showGameSwitcher)}
          className="bg-black/60 hover:bg-black/80 size-9 md:size-12 rounded-xl text-white transition-all border border-white/10 flex items-center justify-center shadow-2xl backdrop-blur-md group relative"
          title="Alternar Mesas"
        >
          <span className="material-symbols-outlined text-lg md:text-2xl group-hover:rotate-12 transition-transform">layers</span>
          <span className="absolute -top-1 -right-1 bg-primary text-[8px] font-black px-1.5 py-0.5 rounded-full border border-white/20 animate-pulse">
            {activeGames.length}
          </span>
        </button>
        <button
          onClick={() => setShowLobbyModal(true)}
          className="bg-primary/20 hover:bg-primary/30 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all border border-primary/30 flex items-center gap-1.5 md:gap-2 text-white shadow-xl backdrop-blur-md group"
        >
          <span className="material-symbols-outlined text-sm md:text-base group-hover:rotate-180 transition-transform duration-500">grid_view</span>
          <span className="hidden xs:inline">LOBBY</span>
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
                        <p className="text-lg font-black text-white">${tournament?.buyIn.toLocaleString() || '0'}</p>
                      </div>
                      <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Prize Pool</p>
                        <p className="text-lg font-black text-gold">${tournament?.prizePool.toLocaleString() || '0'}</p>
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
                          <p className="text-white font-bold">{isTournamentMode ? `Level ${blindLevel}` : 'Cash Game'}</p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-[10px] font-bold text-slate-500 uppercase">Blinds</p>
                          <p className="text-primary font-black">${gameConfig?.smallBlind}/${gameConfig?.bigBlind}</p>
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
                          <span className={`text-sm font-bold ${p.isHuman ? 'text-white' : 'text-slate-300'}`}>{p.name} {p.isHuman && '(You)'}</span>
                        </div>
                        <span className="text-sm font-black text-white">${p.balance.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}

                {activeLobbyTab === 'payouts' && (
                  <div className="space-y-4">
                    <div className="bg-gold/10 border border-gold/20 p-4 rounded-2xl flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-gold">emoji_events</span>
                        <p className="text-sm font-bold text-white">Prêmio Total Garantido</p>
                      </div>
                      <p className="text-xl font-black text-gold">${tournament?.prizePool.toLocaleString() || '0'}</p>
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
                            <p className="text-sm font-black text-white">${((tournament?.prizePool || 0) * (payout.percent / 100)).toLocaleString()}</p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase">{payout.percent}% do total</p>
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

      {/* Active Games Switcher Overlay */}
      {
        showGameSwitcher && (
          <div className="absolute top-16 right-4 md:top-20 md:right-8 z-50 w-64 md:w-72 animate-scale-in origin-top-right">
            <div className="bg-[#0f172a]/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Tables</span>
                <button onClick={() => setShowGameSwitcher(false)} className="text-slate-500 hover:text-white transition">
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>
              <div className="p-2">
                <ActiveGamesSwitcher />
              </div>
              <div className="p-3 bg-black/20 text-center">
                <button
                  onClick={() => navigate('/play')}
                  className="text-[9px] font-black text-primary hover:text-white transition uppercase tracking-widest"
                >
                  + Open New Table
                </button>
              </div>
            </div>
          </div>
        )
      }

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
      <div className="flex-1 flex items-center justify-center p-6 md:p-16 lg:p-24 overflow-visible landscape:py-2">
        <div className="poker-table relative w-full h-full max-h-[75vh] md:max-h-[65vh] max-w-5xl aspect-[2/1] bg-emerald-900 border-2 md:border-[16px] border-[#3a2a1a] flex flex-col items-center justify-center shadow-2xl rounded-[60px] md:rounded-[200px]">

          {/* Table Center: Pot & Cards */}
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <div className="bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 flex flex-col items-center">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Total Pot</span>
                <span className="text-2xl font-black text-white">${pot.toLocaleString()}</span>
              </div>

              {/* Side Pots */}
              {sidePots.length > 0 && (
                <div className="flex gap-2">
                  {sidePots.map((sp, i) => (
                    <div key={i} className="bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/5 flex items-center gap-2">
                      <span className="text-[8px] font-bold text-slate-500 uppercase">Side {i + 1}</span>
                      <span className="text-xs font-black text-slate-300">${sp.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-1 md:gap-3 h-16 md:h-28 items-center">
              {communityCards.map((card, i) => (
                <HeroCard key={i} suit={card.suit} value={card.rank} />
              ))}
              {Array.from({ length: 5 - communityCards.length }).map((_, i) => (
                <div key={`empty-${i}`} className="w-10 h-14 md:w-20 md:h-28 bg-slate-100/10 border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-white/20 text-sm">help</span>
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
                  <p className="text-gold text-3xl font-black">${pot.toLocaleString()}</p>
                </div>
                <button onClick={startNewHand} className="bg-primary hover:bg-primary-light px-10 py-4 rounded-xl font-black text-white uppercase tracking-wider shadow-lg transform transition hover:scale-105">
                  Next Hand
                </button>
              </div>
            )}

            {/* Waiting for Players Overlay */}
            {players.length < 2 && !winners.length && (
              <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/20 rounded-[200px]">
                <div className="bg-slate-900/90 backdrop-blur-md p-8 rounded-3xl border border-white/10 text-center animate-pulse shadow-2xl">
                  <div className="size-16 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4"></div>
                  <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Waiting for Players</h3>
                  <p className="text-slate-400 text-xs mt-2 max-w-[200px] leading-relaxed">
                    Opponents are joining the tournament. <br /> <span className="text-gold font-bold">The game will start automatically soon.</span>
                  </p>
                </div>
              </div>
            )}

            {/* Human current bet chips on table */}
            {!isObserver && activeUser && activeUser.currentBet > 0 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce-short z-20">
                <ChipStack amount={activeUser.currentBet} />
                <span className="bg-black/90 text-white text-[10px] font-black px-2 py-0.5 rounded mt-2 border border-gold/50 shadow-2xl backdrop-blur-md">
                  ${activeUser.currentBet.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Players Seats */}
          {players.map((player, index) => {
            if (player.isHuman) return null; // Render user separately (bottom center)

            // Adjust position mapping for observers (who don't have a human player at index 0)
            const seatIndex = isObserver ? index : index - 1;
            const posMap = ['mid-right', 'top-right', 'top', 'top-left', 'mid-left', 'bottom-left', 'bottom-right'];
            const pos = posMap[seatIndex] || 'top';

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

      {/* Action Footer - Optimized for Mobile & Repositioned to Right */}
      <footer className="p-4 md:p-8 flex flex-col md:flex-row items-center md:items-end justify-between gap-4 bg-gradient-to-t from-background via-background/80 to-transparent z-20 pb-safe w-full">
        {/* Chat - Hidden on mobile to save space, but accessible via settings */}
        <div className="hidden lg:block w-72">
          <div className="bg-background/80 backdrop-blur-lg border border-slate-700 rounded-xl overflow-hidden flex flex-col h-32 md:h-48 shadow-lg">
            <div className="p-2 border-b border-slate-700 flex justify-between cursor-pointer hover:bg-white/5 transition" onClick={() => setShowSettings(true)}>
              <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase">Table Chat</span>
              <span className="material-symbols-outlined text-slate-500 text-xs hover:text-white transition">settings</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 text-[10px] md:text-[11px] scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              {chatHistory.slice(-10).map((msg, idx) => {
                // Deterministic color for player names
                const colors = ['text-blue-400', 'text-green-400', 'text-purple-400', 'text-yellow-400', 'text-pink-400', 'text-cyan-400'];
                let hash = 0;
                for (let i = 0; i < msg.sender.length; i++) hash = msg.sender.charCodeAt(i) + ((hash << 5) - hash);
                const colorClass = colors[Math.abs(hash) % colors.length];

                return (
                  <p key={idx} className={`${msg.type === 'system' ? 'text-yellow-500 italic' : 'text-slate-300'}`}>
                    <span className={`${colorClass} font-bold mr-1 text-[8px] uppercase tracking-tighter`}>{msg.sender}:</span> {msg.text}
                  </p>
                );
              })}
            </div>
            {/* Chat Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const input = e.currentTarget.elements.namedItem('message') as HTMLInputElement;
                if (input.value.trim()) {
                  handleSendMessage(input.value);
                  input.value = '';
                }
              }}
              className="p-1 border-t border-slate-700 bg-slate-800/50"
            >
              <input
                name="message"
                type="text"
                placeholder="Type a message..."
                className="w-full bg-transparent border-none text-white text-[10px] focus:ring-0 placeholder:text-slate-600 px-2 py-1"
                autoComplete="off"
              />
            </form>
          </div>
        </div>

        {/* Center: Player Cards & Balance (Moved slightly left of buttons) */}
        {!isObserver && activeUser && (
          <div className="flex items-center gap-6 md:ml-auto">
            <div className="flex flex-col items-center gap-2">
              {/* Player Balance and Turn Indicator */}
              <div className={`relative bg-primary/10 border-2 ${currentTurn === 0 ? 'border-amber-400 animate-pulse ring-4 ring-amber-400/10' : 'border-primary'} backdrop-blur-md px-6 py-2 rounded-2xl flex flex-col items-center shadow-lg shadow-primary/20 min-w-[120px]`}>
                <span className="text-[8px] font-black uppercase tracking-widest text-primary/70">{currentTurn === 0 ? 'YOUR TURN' : 'ACTING...'}</span>
                <span className="text-xl font-black text-white font-mono">${activeUser?.balance.toLocaleString()}</span>
              </div>

              {/* Player Cards */}
              <div className="flex gap-2">
                {activeUser?.hand.map((card, i) => (
                  <HeroCard key={i} suit={card.suit} value={card.rank} rotate={i === 0 ? '-rotate-6' : 'rotate-6'} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Right: User Actions */}
        {!isObserver && activeUser && (
          <div className="w-full md:w-80 space-y-3 bg-black/40 backdrop-blur-md p-4 rounded-3xl border border-white/10 shadow-2xl">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                <div className="flex-1 flex items-center bg-zinc-900 rounded-xl px-3 border border-primary/20">
                  <span className="text-primary mr-1 text-sm">$</span>
                  <input
                    type="number"
                    value={betValue}
                    onChange={(e) => setBetValue(Math.min(activeUser?.balance || 0, Math.max(0, Number(e.target.value))))}
                    className="bg-transparent border-none text-white text-sm font-black w-full focus:ring-0 py-2"
                  />
                </div>
              </div>
              <input
                type="range" min="20" max={activeUser?.balance || 100} value={betValue}
                onChange={(e) => setBetValue(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-full appearance-none accent-primary cursor-pointer"
              />
              <div className="grid grid-cols-4 gap-1.5">
                <button onClick={() => setBetValue(Math.floor(pot / 2))} className="bg-zinc-800 hover:bg-zinc-700 text-[9px] font-black py-1.5 rounded-lg transition uppercase">1/2</button>
                <button onClick={() => setBetValue(Math.floor(pot * 0.75))} className="bg-zinc-800 hover:bg-zinc-700 text-[9px] font-black py-1.5 rounded-lg transition uppercase">3/4</button>
                <button onClick={() => setBetValue(pot)} className="bg-zinc-800 hover:bg-zinc-700 text-[9px] font-black py-1.5 rounded-lg transition uppercase">POT</button>
                <button onClick={() => setBetValue(activeUser?.balance || 0)} className="bg-primary/20 hover:bg-primary/40 text-[9px] font-black py-1.5 rounded-lg transition uppercase text-primary border border-primary/20 text-white">ALL-IN</button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <button
                disabled={currentTurn !== 0}
                onClick={() => handlePlayerAction('fold')}
                className="disabled:opacity-20 disabled:grayscale transition-all bg-zinc-800 hover:bg-red-600/50 text-white font-black py-4 rounded-2xl shadow-lg uppercase text-xs border border-white/5"
              >
                Fold
              </button>
              {currentBet === 0 || (activeUser && activeUser.currentBet === currentBet) ? (
                <button
                  disabled={currentTurn !== 0}
                  onClick={() => handlePlayerAction('check')}
                  className="disabled:opacity-20 disabled:grayscale transition-all bg-zinc-800 hover:bg-emerald-600/50 text-white font-black py-4 rounded-2xl shadow-lg uppercase text-xs border border-white/5"
                >
                  Check
                </button>
              ) : (
                <button
                  disabled={currentTurn !== 0}
                  onClick={() => handlePlayerAction('call')}
                  className="disabled:opacity-20 disabled:grayscale transition-all bg-zinc-800 hover:bg-emerald-600/50 text-white font-black py-4 rounded-2xl shadow-lg text-xs border border-white/5"
                >
                  <div className="flex flex-col items-center">
                    <span className="uppercase text-[10px] opacity-70">Call</span>
                    <span className="text-sm font-black mt-0.5">${activeUser ? currentBet - activeUser.currentBet : 0}</span>
                  </div>
                </button>
              )}
              <button
                disabled={currentTurn !== 0}
                onClick={() => handlePlayerAction('raise', betValue)}
                className="disabled:opacity-20 disabled:grayscale transition-all bg-primary hover:brightness-125 text-white font-black py-4 rounded-2xl shadow-xl shadow-primary/20 uppercase text-xs border border-white/10"
              >
                Raise
              </button>
            </div>
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
    'top': '-top-8 md:-top-20 left-1/2 -translate-x-1/2',
    'top-left': 'top-2 md:top-8 left-[4%] md:left-[10%]',
    'top-right': 'top-2 md:top-8 right-[4%] md:right-[10%]',
    'mid-left': 'top-1/2 -translate-y-1/2 -left-10 md:-left-24',
    'mid-right': 'top-1/2 -translate-y-1/2 -right-10 md:-right-24',
    'bottom-left': 'bottom-4 md:bottom-16 left-[4%] md:left-[10%]',
    'bottom-right': 'bottom-4 md:bottom-16 right-[4%] md:right-[10%]',
  };

  return (
    <div className={`absolute ${positions[position]} flex flex-col items-center gap-0.5 md:gap-2 z-10 transition-all duration-500 scale-[0.45] xs:scale-[0.6] sm:scale-[0.8] md:scale-100`}>
      <div className={`relative size-14 md:size-24 rounded-full border-2 md:border-4 ${active ? 'border-amber-400 ring-2 md:ring-8 ring-amber-400/20 scale-110' : 'border-slate-800'} bg-slate-700 overflow-hidden ${inactive ? 'grayscale opacity-50' : ''} transition-all duration-300 shadow-xl`}>
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
      <div className={`bg-background/95 backdrop-blur-sm px-4 py-2 rounded-lg text-center border-2 ${inactive ? 'border-slate-800' : active ? 'border-primary' : 'border-slate-700'} min-w-[100px] shadow-lg`}>
        <p className={`text-xs font-bold ${inactive ? 'text-slate-600' : 'text-white'} truncate mb-1`}>{name}</p>

        {/* Chip Stack Display */}
        <div className="flex items-center justify-center gap-2 mb-1">
          <ChipStack amount={Number(balance)} size="sm" />
          <p className={`text-sm font-black ${inactive ? 'text-slate-600' : 'text-gold'}`}>${Number(balance).toLocaleString()}</p>
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
          <span className="bg-black/90 text-white text-[10px] font-black px-2 py-0.5 rounded mt-2 border border-gold/50 shadow-2xl backdrop-blur-md">
            ${currentBet.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
};

const HeroCard = ({ suit, value, rotate }: any) => {
  const getSuitColor = (s: string) => {
    switch (s) {
      case 'hearts': return 'text-red-500';
      case 'diamonds': return 'text-blue-500';
      case 'clubs': return 'text-green-500';
      case 'spades': return 'text-slate-900';
      default: return 'text-slate-900';
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
    <div className={`w-12 h-18 md:w-20 md:h-28 bg-white rounded-lg md:rounded-xl border-2 border-primary flex flex-col p-1 md:p-2 items-center justify-between shadow-2xl transform transition-transform md:hover:-translate-y-2 cursor-pointer ${rotate} ${getSuitColor(suit)}`}>
      <span className="text-base md:text-2xl font-black self-start leading-none tracking-tighter">{value}{getSuitSymbol(suit)}</span>
      <span className="text-xl md:text-4xl">{getSuitSymbol(suit)}</span>
      <span className="text-base md:text-2xl font-black self-end leading-none tracking-tighter rotate-180">{value}{getSuitSymbol(suit)}</span>
    </div>
  );
};

export default GameTable;
