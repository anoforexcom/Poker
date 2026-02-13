import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import { usePokerGame, GameConfig } from '../hooks/usePokerGame';
import { useSimulation } from '../contexts/SimulationContext';
import { useLiveWorld } from '../contexts/LiveWorldContext';
import { useNotification } from '../contexts/NotificationContext';
import { BlindStructureType } from '../utils/blindStructure';

const GameTable: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isObserver = searchParams.get('observe') === 'true';
  const { user, updateBalance } = useGame();
  const { tournaments } = useLiveWorld();
  const { showAlert } = useNotification();

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

    isObserver
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
  } = usePokerGame(gameConfig?.startingStack || 0, updateBalance, gameConfig);

  const { addActiveGame } = useGame();

  // Multi-game coordination: Add this table to active games on mount
  useEffect(() => {
    if (id) addActiveGame(id);
  }, [id]);

  const activeUser = players.find(p => p.isHuman);

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
    navigate('/');
  };

  // Restored Game Logic
  const [betValue, setBetValue] = useState(20);

  // Start game loop
  React.useEffect(() => {
    if (players.length > 0 && players.every(p => p.hand.length === 0)) startNewHand();
  }, [players]);

  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ sender: string, text: string, type?: 'system' | 'user' }[]>([
    { sender: 'System', text: `Welcome to Table #${id}!`, type: 'system' }
  ]);
  const [showSettings, setShowSettings] = useState(false);
  const [showLobbyModal, setShowLobbyModal] = useState(false);
  const [activeLobbyTab, setActiveLobbyTab] = useState<'info' | 'players' | 'payouts'>('info');
  const [showOrientationPrompt, setShowOrientationPrompt] = useState(false);

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

  // Autonomous Bot Chat
  useEffect(() => {
    if (players.length <= 1) return;

    const botMessages = [
      "Nice hand!",
      "I think you're bluffing...",
      "Too expensive for me.",
      "Lucky river!",
      "I have a good feeling about this one.",
      "Tough choice...",
      "Let's see those cards.",
      "Wow, big bet!",
      "Folded. Next one will be mine.",
      "Good game everyone."
    ];

    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance every 10 seconds
        const bots = players.filter(p => !p.isHuman && !p.isFolded);
        if (bots.length > 0) {
          const randomBot = bots[Math.floor(Math.random() * bots.length)];
          const randomMsg = botMessages[Math.floor(Math.random() * botMessages.length)];
          setChatHistory(prev => [...prev.slice(-49), { sender: randomBot.name, text: randomMsg }]);
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [players]);

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    setChatHistory(prev => [...prev, { sender: 'You', text: chatMessage, type: 'user' }]);
    setChatMessage('');

    // Simulate bot response occasionally
    if (Math.random() > 0.7) {
      setTimeout(() => {
        const botNames = players.filter(p => !p.isHuman).map(p => p.name);
        if (botNames.length === 0) return;
        const randomBot = botNames[Math.floor(Math.random() * botNames.length)];
        const responses = ['Nice move!', 'I fold.', 'Thinking...', 'Unlucky!', 'Next time.'];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        setChatHistory(prev => [...prev, { sender: randomBot, text: randomResponse }]);
      }, 1000 + Math.random() * 2000);
    }
  };

  if (!tournament) {
    return (
      <div className="h-screen w-full bg-[#0a0f1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Entering Table...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full bg-slate-900 overflow-hidden">
      {/* Landscape Orientation Prompt for Mobile */}
      {showOrientationPrompt && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="bg-slate-800 p-8 rounded-2xl border border-primary shadow-2xl max-w-sm mx-4 text-center">
            <span className="material-symbols-outlined text-primary text-6xl mb-4 inline-block animate-bounce">screen_rotation</span>
            <h3 className="text-white font-bold text-xl mb-2">Melhor Experiência</h3>
            <p className="text-slate-400 text-sm mb-4">Para jogar, vire seu dispositivo para o modo paisagem (horizontal)</p>
            <button
              onClick={() => setShowOrientationPrompt(false)}
              className="text-primary text-sm font-bold hover:underline"
            >
              Continuar mesmo assim
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
              {isTournamentMode ? `Lvl ${blindLevel}` : `$${gameConfig?.smallBlind}/$${gameConfig?.bigBlind}`}
            </span>
          </p>
        </div>
      </div>

      <div className="absolute top-4 right-4 md:top-6 md:right-8 z-20 flex gap-2 md:gap-4">
        <button
          onClick={() => setShowLobbyModal(true)}
          className="bg-primary/20 hover:bg-primary/30 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all border border-primary/30 flex items-center gap-1.5 md:gap-2 text-white shadow-xl backdrop-blur-md group"
        >
          <span className="material-symbols-outlined text-sm md:text-base group-hover:rotate-180 transition-transform duration-500">grid_view</span>
          <span className="hidden xs:inline">LOBBY</span>
        </button>
      </div>

      {/* Tournament Lobby Modal */}
      {showLobbyModal && (
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
                  { id: 'info', label: 'Informações', icon: 'info' },
                  { id: 'players', label: 'Jogadores', icon: 'group' },
                  { id: 'payouts', label: 'Premiação', icon: 'payments' }
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
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Jogadores</p>
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
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Nível Atual</p>
                        <p className="text-white font-bold">{isTournamentMode ? `Level ${blindLevel}` : 'Cash Game'}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Blinds</p>
                        <p className="text-primary font-black">${gameConfig?.smallBlind}/${gameConfig?.bigBlind}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Próximo Nível</p>
                        <p className="text-slate-400 font-bold">{isTournamentMode ? `Level ${blindLevel + 1}` : '-'}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Tempo Restante</p>
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
                    <span>Jogador</span>
                    <span>Chips</span>
                  </div>
                  {[...players].sort((a, b) => b.balance - a.balance).map((p, i) => (
                    <div key={p.id} className={`flex justify-between items-center p-4 rounded-xl border ${p.isHuman ? 'bg-primary/10 border-primary/30' : 'bg-slate-800/30 border-slate-700/50'} hover:bg-slate-800/50 transition`}>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-slate-500 w-4">{i + 1}</span>
                        <div className="size-8 rounded-full bg-slate-700 overflow-hidden">
                          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} alt="" />
                        </div>
                        <span className={`text-sm font-bold ${p.isHuman ? 'text-white' : 'text-slate-300'}`}>{p.name} {p.isHuman && '(Você)'}</span>
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
                          <span className="text-sm text-slate-400">Posição</span>
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
                Sair da Mesa
              </button>
              <button
                onClick={() => setShowLobbyModal(false)}
                className="flex-1 bg-primary hover:brightness-110 text-white font-black py-3 rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">play_arrow</span>
                Voltar ao Jogo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal (Simple) */}
      {showSettings && (
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
      )}

      {/* The Poker Table Rendering */}
      <div className="flex-1 flex items-center justify-center p-2 md:p-12">
        <div className="poker-table relative w-full h-full max-h-[45vh] md:max-h-none md:max-w-5xl md:aspect-[2/1] bg-emerald-900 border-4 md:border-[16px] border-[#3a2a1a] flex flex-col items-center justify-center shadow-2xl rounded-[2rem] md:rounded-none">

          {/* Table Center: Pot & Cards */}
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <div className="bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 flex flex-col items-center">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Pote Total</span>
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

            <div className="flex gap-2 md:gap-3 h-20 md:h-28 items-center">
              {communityCards.map((card, i) => (
                <HeroCard key={i} suit={card.suit} value={card.rank} />
              ))}
              {Array.from({ length: 5 - communityCards.length }).map((_, i) => (
                <div key={`empty-${i}`} className="w-14 h-20 md:w-20 md:h-28 bg-slate-100/10 border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-white/20">help</span>
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
                balance={`$${player.balance}`}
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

      {/* Action Footer - Optimized for Mobile */}
      <footer className="p-3 md:p-8 flex flex-col md:grid md:grid-cols-12 items-center md:items-end gap-3 md:gap-8 bg-gradient-to-t from-background to-transparent z-20 pb-safe">
        {/* Chat - Hidden on mobile to save space, but accessible via settings */}
        <div className="hidden lg:block md:col-span-3 w-full">
          <div className="bg-background/80 backdrop-blur-lg border border-slate-700 rounded-xl overflow-hidden flex flex-col h-28 md:h-40 shadow-lg">
            <div className="p-2 border-b border-slate-700 flex justify-between cursor-pointer hover:bg-white/5 transition" onClick={() => setShowSettings(true)}>
              <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase">Chat da Mesa</span>
              <span className="material-symbols-outlined text-slate-500 text-xs hover:text-white transition">settings</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 text-[10px] md:text-[11px] scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              {chatHistory.slice(-5).map((msg, idx) => (
                <p key={idx} className={`${msg.type === 'system' ? 'text-yellow-500 italic' : msg.sender === 'You' ? 'text-primary font-bold' : 'text-slate-300'}`}>
                  <span className="opacity-50 mr-1 text-[8px]">{msg.sender}:</span> {msg.text}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Player Cards with Avatar - Hide if observing */}
        {!isObserver && (
          <div className="flex items-center gap-4 md:gap-6">
            {/* User Avatar */}
            <div className="flex flex-col items-center gap-1 md:gap-2 scale-90 md:scale-100">
              <div className={`relative size-14 md:size-20 rounded-full border-2 md:border-4 ${currentTurn === 0 ? 'border-amber-400 ring-2 md:ring-8 ring-amber-400/20' : 'border-primary'} bg-slate-700 overflow-hidden shadow-2xl transition-all duration-300`}>
                {currentTurn === 0 && (
                  <svg className="absolute inset-0 size-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                    <circle
                      cx="50" cy="50" r="46"
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="8"
                      strokeDasharray="289"
                      strokeDashoffset={289 - (289 * turnTimeLeft) / totalTurnTime}
                      className="transition-all duration-[30ms] linear"
                    />
                  </svg>
                )}
                <img
                  className="w-full h-full object-cover"
                  src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
                  alt={user?.name || 'You'}
                />
              </div>
              <div className="bg-background/90 backdrop-blur-sm px-3 py-1 rounded-lg border border-primary/30 shadow-xl">
                <p className="text-[10px] md:text-xs font-black text-white tracking-widest uppercase">{user?.name || 'You'}</p>
              </div>
            </div>

            {/* Player Cards */}
            <div className="flex gap-2 md:gap-4">
              {activeUser?.hand.map((card, i) => (
                <HeroCard key={i} suit={card.suit} value={card.rank} rotate={i === 0 ? '-rotate-6' : 'rotate-6'} />
              ))}
              {(!activeUser?.hand.length) && <div className="text-slate-500 font-bold text-xs">Waiting...</div>}
            </div>
          </div>
        )}

        {/* Player Balance and Turn Indicator - Hide if observing */}
        {!isObserver && activeUser && (
          <div className={`relative bg-primary/10 border-2 ${currentTurn === 0 ? 'border-amber-400 animate-pulse ring-4 ring-amber-400/10' : 'border-primary'} backdrop-blur-md px-4 md:px-10 py-1.5 md:py-3 rounded-2xl flex flex-col items-center shadow-lg shadow-primary/20`}>
            <span className="text-[7px] md:text-[10px] font-black uppercase tracking-widest text-primary/70">{currentTurn === 0 ? 'SUA VEZ' : `VEZ DE ${players[currentTurn]?.name}`}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm md:text-2xl font-black text-white font-mono">${activeUser?.balance.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* User Actions - Only show if not observing */}
        {!isObserver && activeUser && (
          <div className="w-full md:col-span-3 space-y-2 md:space-y-4">
            <div className="bg-background/80 backdrop-blur-md p-3 md:p-4 rounded-xl border border-slate-700 space-y-2 md:space-y-4">
              <div className="flex justify-between items-center text-[9px] md:text-[10px] font-bold text-slate-400">
                <span className="hidden xs:inline">MIN: $20</span>
                <span className="text-primary text-xs md:text-sm font-mono ml-auto mr-auto sm:ml-0 sm:mr-0">${betValue}</span>
                <span className="hidden xs:inline">MAX: ${(activeUser?.balance || 0).toLocaleString()}</span>
              </div>
              <input
                type="range" min="20" max={activeUser?.balance || 100} value={betValue}
                onChange={(e) => setBetValue(Number(e.target.value))}
                className="w-full h-1 bg-slate-700 rounded-full appearance-none accent-primary cursor-pointer"
              />
              <div className="grid grid-cols-4 gap-1 md:gap-2">
                <button onClick={() => setBetValue(Math.floor(pot / 2))} className="bg-slate-800 hover:bg-slate-700 text-[8px] md:text-[10px] font-bold py-1 md:py-1.5 rounded transition">1/2</button>
                <button onClick={() => setBetValue(Math.floor(pot * 0.75))} className="bg-slate-800 hover:bg-slate-700 text-[8px] md:text-[10px] font-bold py-1 md:py-1.5 rounded transition">3/4</button>
                <button onClick={() => setBetValue(pot)} className="bg-slate-800 hover:bg-slate-700 text-[8px] md:text-[10px] font-bold py-1 md:py-1.5 rounded transition">POT</button>
                <button onClick={() => setBetValue(activeUser?.balance || 0)} className="bg-slate-800 hover:bg-slate-700 text-[8px] md:text-[10px] font-bold py-1 md:py-1.5 rounded transition">ALL-IN</button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              <button
                disabled={currentTurn !== 0}
                onClick={() => handlePlayerAction('fold')}
                className="disabled:opacity-50 disabled:cursor-not-allowed bg-slate-800 hover:bg-red-600 text-white font-black py-2 md:py-4 rounded-lg md:rounded-xl shadow-lg uppercase text-[10px] md:text-sm transition-colors"
              >
                Fold
              </button>
              {currentBet === 0 || (activeUser && activeUser.currentBet === currentBet) ? (
                <button
                  disabled={currentTurn !== 0}
                  onClick={() => handlePlayerAction('check')}
                  className="disabled:opacity-50 disabled:cursor-not-allowed bg-slate-800 hover:bg-green-600 text-white font-black py-2 md:py-4 rounded-lg md:rounded-xl shadow-lg uppercase text-[10px] md:text-sm border-b-2 md:border-b-4 border-slate-900 transition-colors"
                >
                  Check
                </button>
              ) : (
                <button
                  disabled={currentTurn !== 0}
                  onClick={() => handlePlayerAction('call')}
                  className="disabled:opacity-50 disabled:cursor-not-allowed bg-slate-800 hover:bg-green-600 text-white font-black py-2 md:py-4 rounded-lg md:rounded-xl shadow-lg text-[10px] md:text-sm border-b-2 md:border-b-4 border-slate-900 transition-colors"
                >
                  <div className="flex flex-col items-center">
                    <span className="uppercase leading-none">Call</span>
                    <span className="text-[8px] md:text-xs leading-none mt-0.5">${activeUser ? currentBet - activeUser.currentBet : 0}</span>
                  </div>
                </button>
              )}
              <button
                disabled={currentTurn !== 0}
                onClick={() => handlePlayerAction('raise', betValue)}
                className="disabled:opacity-50 disabled:cursor-not-allowed bg-primary hover:bg-blue-600 text-white font-black py-2 md:py-4 rounded-lg md:rounded-xl shadow-lg uppercase text-[10px] md:text-sm border-b-2 md:border-b-4 border-blue-800 transition-colors"
              >
                Raise
              </button>
            </div>
          </div>
        )}
      </footer>
    </div>
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
    'top': '-top-8 md:-top-12 left-1/2 -translate-x-1/2',
    'top-left': 'top-2 md:top-4 left-[5%] md:left-[15%]',
    'top-right': 'top-2 md:top-4 right-[5%] md:right-[15%]',
    'mid-left': 'top-[15%] md:top-1/2 -translate-y-1/2 -left-6 md:-left-12',
    'mid-right': 'top-[15%] md:top-1/2 -translate-y-1/2 -right-6 md:-right-12',
    'bottom-left': 'bottom-2 md:bottom-12 left-[5%] md:left-[15%]',
    'bottom-right': 'bottom-2 md:bottom-12 right-[5%] md:right-[15%]',
  };

  return (
    <div className={`absolute ${positions[position]} flex flex-col items-center gap-1 md:gap-2 z-10 transition-all duration-500 scale-75 md:scale-100`}>
      <div className={`relative size-16 md:size-24 rounded-full border-2 md:border-4 ${active ? 'border-amber-400 ring-4 md:ring-8 ring-amber-400/20 scale-110' : 'border-slate-800'} bg-slate-700 overflow-hidden ${inactive ? 'grayscale opacity-50' : ''} transition-all duration-300 shadow-xl`}>
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
          <ChipStack amount={balance} size="sm" />
          <p className={`text-sm font-black ${inactive ? 'text-slate-600' : 'text-gold'}`}>{balance}</p>
        </div>
      </div>

      {/* Dealer Button */}
      {dealer && (
        <div className="absolute -right-6 top-0 bg-white text-black font-black size-6 rounded-full flex items-center justify-center text-xs border-2 border-gold shadow-lg transition-all animate-in fade-in zoom-in">D</div>
      )}

      {/* Current Bet Chips */}
      {currentBet > 0 && (
        <div className="absolute -bottom-16 flex flex-col items-center animate-bounce-short z-20">
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
    <div className={`w-14 h-20 md:w-20 md:h-28 bg-white rounded-lg md:rounded-xl border-2 border-primary flex flex-col p-1 md:p-2 items-center justify-between shadow-2xl transform transition-transform hover:-translate-y-2 cursor-pointer ${rotate} ${getSuitColor(suit)}`}>
      <span className="text-lg md:text-2xl font-black self-start leading-none tracking-tighter">{value}{getSuitSymbol(suit)}</span>
      <span className="text-2xl md:text-4xl">{getSuitSymbol(suit)}</span>
      <span className="text-lg md:text-2xl font-black self-end leading-none tracking-tighter rotate-180">{value}{getSuitSymbol(suit)}</span>
    </div>
  );
};

export default GameTable;
