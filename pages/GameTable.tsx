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

  const [betValue, setBetValue] = useState(20);

  // Start game loop
  React.useEffect(() => {
    if (players.every(p => p.hand.length === 0)) startNewHand();
  }, []);

  const activeUser = players.find(p => p.isHuman);

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
          className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg text-xs font-bold transition-all border border-white/10 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">logout</span> LOBBY
        </button>
      </div>

      {/* The Poker Table Rendering */}
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="poker-table relative w-full max-w-5xl aspect-[2/1] bg-emerald-900 border-[16px] border-[#3a2a1a] flex flex-col items-center justify-center">

          {/* Table Center: Pot & Cards */}
          <div className="flex flex-col items-center gap-6">
            <div className="bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 flex flex-col items-center">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Pote Total</span>
              <span className="text-2xl font-black text-white">${pot.toLocaleString()}</span>
            </div>

            <div className="flex gap-3 h-28 items-center">
              {communityCards.map((card, i) => (
                <HeroCard key={i} suit={card.suit} value={card.rank} color={['hearts', 'diamonds'].includes(card.suit) ? 'red' : 'black'} />
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
                    <HeroCard key={i} suit={card.suit} value={card.rank} color={['hearts', 'diamonds'].includes(card.suit) ? 'red' : 'black'} />
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

      {/* Hero Footer Controls */}
      <footer className="p-8 grid grid-cols-12 items-end gap-8 bg-gradient-to-t from-background to-transparent">
        <div className="col-span-3">
          <div className="bg-background/80 backdrop-blur-lg border border-slate-700 rounded-xl overflow-hidden flex flex-col h-40">
            <div className="p-3 border-b border-slate-700 flex justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Chat da Mesa</span>
              <span className="material-symbols-outlined text-slate-500 text-sm">settings</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 text-[11px]">
              <p className="text-slate-500 italic">Phase: {phase}</p>
              {activeUser?.isFolded && <p className="text-red-500 font-bold">You Folded.</p>}
            </div>
            <div className="p-3 bg-slate-900/50">
              <input className="w-full bg-slate-800 border-none rounded-lg text-xs py-2 px-3 focus:ring-1 focus:ring-primary" placeholder="Diga algo..." />
            </div>
          </div>
        </div>

        <div className="col-span-6 flex flex-col items-center gap-4">
          <div className="flex gap-4">
            {activeUser?.hand.map((card, i) => (
              <HeroCard key={i} suit={card.suit} value={card.rank} color={['hearts', 'diamonds'].includes(card.suit) ? 'red' : 'black'} rotate={i === 0 ? '-rotate-6' : 'rotate-6'} />
            ))}
            {(!activeUser?.hand.length) && <div className="text-slate-500 font-bold">Waiting...</div>}
          </div>
          <div className={`relative bg-primary/10 border-2 ${currentTurn === 0 ? 'border-gold animate-pulse' : 'border-primary'} backdrop-blur-md px-10 py-3 rounded-xl flex flex-col items-center shadow-lg shadow-primary/20`}>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">{currentTurn === 0 ? 'SUA VEZ' : `VEZ DE ${players[currentTurn]?.name}`}</span>
            <span className="text-2xl font-black text-white">${activeUser?.balance.toLocaleString()}</span>

            {/* Human Player Chips */}
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
      <div className={`relative size-16 rounded-full border-4 ${active ? 'border-primary ring-4 ring-primary/20 scale-110' : 'border-slate-800'} bg-slate-700 overflow-hidden ${inactive ? 'grayscale opacity-50' : ''} transition-all duration-300`}>
        <img className="w-full h-full object-cover" src={`https://picsum.photos/seed/${name}/100/100`} />
      </div>
      <div className={`bg-background/90 px-3 py-1 rounded-md text-center border ${inactive ? 'border-slate-800' : 'border-slate-700'} min-w-[80px]`}>
        <p className={`text-[10px] font-bold ${inactive ? 'text-slate-600' : 'text-slate-400'} truncate`}>{name}</p>
        <p className={`text-xs font-bold ${inactive ? 'text-slate-600' : 'text-white'}`}>{balance}</p>
      </div>

      {/* Dealer Button */}
      {dealer && (
        <div className="absolute -right-6 top-0 bg-white text-black font-black size-5 rounded-full flex items-center justify-center text-[10px] border-2 border-slate-300 shadow-md">D</div>
      )}

      {/* Chips Representation - Current Bet */}
      {currentBet > 0 && (
        <div className="absolute -bottom-8 flex flex-col items-center animate-bounce-short">
          <div className="flex -space-x-1">
            <div className="size-4 rounded-full bg-red-500 border border-white shadow-sm"></div>
            <div className="size-4 rounded-full bg-blue-500 border border-white shadow-sm"></div>
            <div className="size-4 rounded-full bg-black border border-white shadow-sm"></div>
          </div>
          <span className="bg-black/80 text-white text-[10px] font-bold px-1.5 rounded mt-0.5 border border-white/10">${currentBet}</span>
        </div>
      )}
    </div>
  );
};

const HeroCard = ({ suit, value, color, rotate }: any) => (
  <div className={`w-20 h-28 bg-white rounded-xl border-2 border-primary flex flex-col p-2 items-center justify-between shadow-2xl transform transition-transform hover:-translate-y-2 cursor-pointer ${rotate} ${color === 'red' ? 'text-red-600' : 'text-slate-900'}`}>
    <span className="text-2xl font-black self-start leading-none tracking-tighter">{value}{suit === 'diamond' ? '♦' : '♠'}</span>
    <span className="material-symbols-outlined text-5xl">{suit === 'diamond' ? 'diamond' : 'playing_cards'}</span>
    <span className="text-2xl font-black self-end leading-none tracking-tighter rotate-180">{value}{suit === 'diamond' ? '♦' : '♠'}</span>
  </div>
);

export default GameTable;
