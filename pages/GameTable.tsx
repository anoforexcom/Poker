import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import { usePokerGame } from '../hooks/usePokerGame';

const GameTable: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, updateBalance } = useGame();

  const {
    players,
    communityCards,
    pot,
    phase,
    currentTurn,
    startNewHand,
    handlePlayerAction,
    winner
  } = usePokerGame(user.balance, updateBalance);

  // Restored Game Logic
  const [betValue, setBetValue] = useState(20);
  const activeUser = players.find(p => p.isHuman);

  // Start game loop
  React.useEffect(() => {
    if (players.every(p => p.hand.length === 0)) startNewHand();
  }, []);

  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ sender: string, text: string, type?: 'system' | 'user' }[]>([
    { sender: 'System', text: `Welcome to Table #${id}!`, type: 'system' }
  ]);
  const [showSettings, setShowSettings] = useState(false);

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    setChatHistory(prev => [...prev, { sender: 'You', text: chatMessage, type: 'user' }]);
    setChatMessage('');

    // Simulate bot response occasionally
    if (Math.random() > 0.7) {
      setTimeout(() => {
        const botNames = players.filter(p => !p.isHuman).map(p => p.name);
        const randomBot = botNames[Math.floor(Math.random() * botNames.length)];
        const responses = ['Nice move!', 'I fold.', 'Thinking...', 'Unlucky!', 'Next time.'];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        setChatHistory(prev => [...prev, { sender: randomBot, text: randomResponse }]);
      }, 1000 + Math.random() * 2000);
    }
  };

  return (
    <div className="relative flex flex-col h-full bg-slate-900 overflow-hidden">
      {/* Table Header Overlay */}
      <div className="absolute top-6 left-8 z-20 pointer-events-none">
        <div className="bg-background/60 backdrop-blur-md p-4 rounded-xl border border-white/5">
          <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Table Diamond #{id}</h3>
          <p className="text-white text-lg font-bold">NL Hold'em <span className="text-primary text-sm ml-2">$10/$20</span></p>
        </div>
      </div>

      <div className="absolute top-6 right-8 z-20 flex gap-4">
        <button
          onClick={() => navigate('/')}
          className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg text-xs font-bold transition-all border border-white/10 flex items-center gap-2 text-white"
        >
          <span className="material-symbols-outlined text-sm">logout</span> LOBBY
        </button>
      </div>

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
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="poker-table relative w-full max-w-5xl aspect-[2/1] bg-emerald-900 border-[16px] border-[#3a2a1a] flex flex-col items-center justify-center shadow-2xl">

          {/* Table Center: Pot & Cards */}
          <div className="flex flex-col items-center gap-6">
            <div className="bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 flex flex-col items-center">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Pote Total</span>
              <span className="text-2xl font-black text-white">${pot.toLocaleString()}</span>
            </div>

            <div className="flex gap-3 h-28 items-center">
              {communityCards.map((card, i) => (
                <HeroCard key={i} suit={card.suit} value={card.rank} />
              ))}
              {Array.from({ length: 5 - communityCards.length }).map((_, i) => (
                <div key={`empty-${i}`} className="w-20 h-28 bg-slate-100/10 border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-white/20">help</span>
                </div>
              ))}
            </div>

            {winner && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/90 p-6 rounded-2xl z-50 text-center border-2 border-gold shadow-2xl animate-fade-in-up">
                <p className="text-gold font-bold text-xl uppercase tracking-widest mb-2">Winner</p>
                <p className="text-white text-3xl font-black mb-4">{winner.name}</p>
                <div className="flex gap-2 justify-center mb-6">
                  {winner.hand.map((card, i) => (
                    <HeroCard key={i} suit={card.suit} value={card.rank} />
                  ))}
                </div>
                <button onClick={startNewHand} className="bg-primary hover:bg-primary-light px-8 py-3 rounded-xl font-bold text-white uppercase tracking-wider shadow-lg transform transition hover:scale-105">
                  Next Hand
                </button>
              </div>
            )}
          </div>

          {/* Players Seats */}
          {/* Players Seats */}
          {players.map((player, index) => {
            if (player.isHuman) return null; // Render user separately
            const posMap = ['mid-right', 'top-right', 'top', 'top-left'];
            // Map index 1->mid-right (0), 2->top-right (1)...
            const pos = posMap[index - 1] || 'top';

            return (
              <PlayerSeat
                key={player.id}
                position={pos}
                name={player.name}
                balance={`$${player.balance}`}
                active={index === currentTurn}
                inactive={player.isFolded}
                dealer={player.isDealer}
                currentBet={player.currentBet}
              />
            );
          })}
        </div>
      </div>

      <footer className="p-8 grid grid-cols-12 items-end gap-8 bg-gradient-to-t from-background to-transparent">
        <div className="col-span-3">
          <div className="bg-background/80 backdrop-blur-lg border border-slate-700 rounded-xl overflow-hidden flex flex-col h-40 shadow-lg">
            <div className="p-3 border-b border-slate-700 flex justify-between cursor-pointer hover:bg-white/5 transition" onClick={() => setShowSettings(true)}>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Chat da Mesa</span>
              <span className="material-symbols-outlined text-slate-500 text-sm hover:text-white transition">settings</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1 text-[11px] scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              <p className="text-slate-500 italic border-l-2 border-primary pl-2 mb-2">Phase: {phase}</p>
              {chatHistory.map((msg, idx) => (
                <p key={idx} className={`${msg.type === 'system' ? 'text-yellow-500 italic' : msg.sender === 'You' ? 'text-primary font-bold' : 'text-slate-300'}`}>
                  <span className="opacity-50 mr-1 text-[9px]">{msg.sender}:</span> {msg.text}
                </p>
              ))}
              {activeUser?.isFolded && <p className="text-red-500 font-bold border-l-2 border-red-500 pl-2">You Folded.</p>}
            </div>
            <div className="p-2 bg-slate-900/50">
              <input
                className="w-full bg-slate-800 border-none rounded-lg text-xs py-2 px-3 focus:ring-1 focus:ring-primary text-white placeholder-slate-500"
                placeholder="Type & Enter..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
            </div>
          </div>
        </div>

        <div className="col-span-6 flex flex-col items-center gap-4">
          {/* Player Cards with Avatar */}
          <div className="flex items-center gap-6">
            {/* User Avatar */}
            <div className="flex flex-col items-center gap-2">
              <div className={`relative size-20 rounded-full border-4 ${currentTurn === 0 ? 'border-gold ring-4 ring-gold/30 animate-pulse' : 'border-primary'} bg-slate-700 overflow-hidden shadow-2xl transition-all duration-300`}>
                <img
                  className="w-full h-full object-cover"
                  src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
                  alt={user?.name || 'You'}
                />
              </div>
              <div className="bg-background/90 backdrop-blur-sm px-3 py-1 rounded-lg border-2 border-primary">
                <p className="text-xs font-bold text-white">{user?.name || 'You'}</p>
              </div>
            </div>

            {/* Player Cards */}
            <div className="flex gap-4">
              {activeUser?.hand.map((card, i) => (
                <HeroCard key={i} suit={card.suit} value={card.rank} rotate={i === 0 ? '-rotate-6' : 'rotate-6'} />
              ))}
              {(!activeUser?.hand.length) && <div className="text-slate-500 font-bold">Waiting...</div>}
            </div>
          </div>

          {/* Player Balance and Turn Indicator */}
          <div className={`relative bg-primary/10 border-2 ${currentTurn === 0 ? 'border-gold animate-pulse' : 'border-primary'} backdrop-blur-md px-10 py-3 rounded-xl flex flex-col items-center shadow-lg shadow-primary/20`}>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">{currentTurn === 0 ? 'SUA VEZ' : `VEZ DE ${players[currentTurn]?.name}`}</span>

            {/* Chip Stack Display */}
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1">
                <div className="size-5 rounded-full bg-red-500 border-2 border-white shadow-sm"></div>
                <div className="size-5 rounded-full bg-blue-500 border-2 border-white shadow-sm"></div>
                <div className="size-5 rounded-full bg-black border-2 border-white shadow-sm"></div>
              </div>
              <span className="text-2xl font-black text-white">${activeUser?.balance.toLocaleString()}</span>
            </div>

            {/* Human Player Current Bet Chips */}
            {(activeUser?.currentBet || 0) > 0 && (
              <div className="absolute -top-10 flex flex-col items-center animate-bounce-short">
                <div className="flex -space-x-1">
                  <div className="size-6 rounded-full bg-red-500 border-2 border-white shadow-sm"></div>
                  <div className="size-6 rounded-full bg-blue-500 border-2 border-white shadow-sm"></div>
                  <div className="size-6 rounded-full bg-black border-2 border-white shadow-sm"></div>
                </div>
                <span className="bg-black/80 text-white text-xs font-bold px-2 rounded mt-0.5 border border-white/10 shadow-lg">${activeUser?.currentBet}</span>
              </div>
            )}
          </div>
        </div>

        <div className="col-span-3 space-y-4">
          <div className="bg-background/80 backdrop-blur-md p-4 rounded-xl border border-slate-700 space-y-4">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
              <span>MIN: $20</span>
              <span className="text-primary text-sm font-mono">${betValue}</span>
              <span>MAX: ${(activeUser?.balance || 0).toLocaleString()}</span>
            </div>
            <input
              type="range" min="20" max={activeUser?.balance || 100} value={betValue}
              onChange={(e) => setBetValue(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-full appearance-none accent-primary cursor-pointer"
            />
            <div className="grid grid-cols-4 gap-2">
              <button onClick={() => setBetValue(Math.floor(pot / 2))} className="bg-slate-800 hover:bg-slate-700 text-[10px] font-bold py-1.5 rounded transition">1/2 POT</button>
              <button onClick={() => setBetValue(Math.floor(pot * 0.75))} className="bg-slate-800 hover:bg-slate-700 text-[10px] font-bold py-1.5 rounded transition">3/4 POT</button>
              <button onClick={() => setBetValue(pot)} className="bg-slate-800 hover:bg-slate-700 text-[10px] font-bold py-1.5 rounded transition">POT</button>
              <button onClick={() => setBetValue(activeUser?.balance || 0)} className="bg-slate-800 hover:bg-slate-700 text-[10px] font-bold py-1.5 rounded transition">ALL-IN</button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button disabled={currentTurn !== 0} onClick={() => handlePlayerAction('fold')} className="disabled:opacity-50 disabled:cursor-not-allowed bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-xl shadow-lg uppercase text-sm">Fold</button>
            <button disabled={currentTurn !== 0} onClick={() => handlePlayerAction('call')} className="disabled:opacity-50 disabled:cursor-not-allowed bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-xl shadow-lg uppercase text-sm border-b-4 border-slate-900">Check/Call</button>
            <button disabled={currentTurn !== 0} onClick={() => handlePlayerAction('raise', betValue)} className="disabled:opacity-50 disabled:cursor-not-allowed bg-primary hover:bg-blue-600 text-white font-black py-4 rounded-xl shadow-lg uppercase text-sm border-b-4 border-blue-800">Raise</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

const PlayerSeat = ({ position, name, balance, active, inactive, dealer, currentBet }: any) => {
  const positions: any = {
    'top': '-top-12 left-1/2 -translate-x-1/2',
    'top-left': 'top-4 left-[15%]',
    'top-right': 'top-4 right-[15%]',
    'mid-left': 'top-1/2 -translate-y-1/2 -left-12',
    'mid-right': 'top-1/2 -translate-y-1/2 -right-12',
  };

  return (
    <div className={`absolute ${positions[position]} flex flex-col items-center gap-2 z-10 transition-all duration-500`}>
      <div className={`relative size-20 rounded-full border-4 ${active ? 'border-primary ring-4 ring-primary/20 scale-110' : 'border-slate-800'} bg-slate-700 overflow-hidden ${inactive ? 'grayscale opacity-50' : ''} transition-all duration-300 shadow-xl`}>
        <img className="w-full h-full object-cover" src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`} alt={name} />
      </div>

      {/* Player Info with Stack */}
      <div className={`bg-background/95 backdrop-blur-sm px-4 py-2 rounded-lg text-center border-2 ${inactive ? 'border-slate-800' : active ? 'border-primary' : 'border-slate-700'} min-w-[100px] shadow-lg`}>
        <p className={`text-xs font-bold ${inactive ? 'text-slate-600' : 'text-white'} truncate mb-1`}>{name}</p>

        {/* Chip Stack Display */}
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <div className="flex -space-x-1">
            <div className="size-4 rounded-full bg-red-500 border-2 border-white shadow-sm"></div>
            <div className="size-4 rounded-full bg-blue-500 border-2 border-white shadow-sm"></div>
            <div className="size-4 rounded-full bg-black border-2 border-white shadow-sm"></div>
          </div>
          <p className={`text-sm font-black ${inactive ? 'text-slate-600' : 'text-gold'}`}>{balance}</p>
        </div>
      </div>

      {/* Dealer Button */}
      {dealer && (
        <div className="absolute -right-6 top-0 bg-white text-black font-black size-6 rounded-full flex items-center justify-center text-xs border-2 border-gold shadow-lg">D</div>
      )}

      {/* Current Bet Chips */}
      {currentBet > 0 && (
        <div className="absolute -bottom-12 flex flex-col items-center animate-bounce-short">
          <div className="flex -space-x-1.5">
            <div className="size-5 rounded-full bg-red-500 border-2 border-white shadow-md"></div>
            <div className="size-5 rounded-full bg-blue-500 border-2 border-white shadow-md"></div>
            <div className="size-5 rounded-full bg-black border-2 border-white shadow-md"></div>
          </div>
          <span className="bg-black/90 text-white text-xs font-bold px-2 py-0.5 rounded mt-1 border border-gold/50 shadow-lg">${currentBet}</span>
        </div>
      )}
    </div>
  );
};

const HeroCard = ({ suit, value, rotate }: any) => {
  const getSuitColor = (s: string) => {
    switch (s) {
      case 'hearts': return 'text-red-600';
      case 'diamonds': return 'text-blue-600'; // Blue for Diamonds
      case 'clubs': return 'text-green-600'; // Green for Clubs
      case 'spades': return 'text-slate-900'; // Black for Spades
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
    <div className={`w-20 h-28 bg-white rounded-xl border-2 border-primary flex flex-col p-2 items-center justify-between shadow-2xl transform transition-transform hover:-translate-y-2 cursor-pointer ${rotate} ${getSuitColor(suit)}`}>
      <span className="text-2xl font-black self-start leading-none tracking-tighter">{value}{getSuitSymbol(suit)}</span>
      <span className="text-4xl">{getSuitSymbol(suit)}</span>
      <span className="text-2xl font-black self-end leading-none tracking-tighter rotate-180">{value}{getSuitSymbol(suit)}</span>
    </div>
  );
};

export default GameTable;
