import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';

const GameTable: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, updateBalance } = useGame();

  const [betValue, setBetValue] = useState(450);
  const [pot, setPot] = useState(1250);
  const [lastAction, setLastAction] = useState<string>('');

  const handleAction = (action: string) => {
    if (action === 'fold') {
      setLastAction('Folded');
      // Logic for fold
    } else if (action === 'call') {
      const callAmount = 100; // Simplified
      updateBalance(-callAmount);
      setPot(prev => prev + callAmount);
      setLastAction(`Called $${callAmount}`);
    } else if (action === 'raise') {
      if (user.balance >= betValue) {
        updateBalance(-betValue);
        setPot(prev => prev + betValue);
        setLastAction(`Raised to $${betValue}`);
      } else {
        alert("Insufficient funds!");
      }
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

            <div className="flex gap-3">
              <div className="w-14 h-20 bg-white rounded-lg border-2 border-slate-200 flex flex-col p-1.5 items-center justify-between text-red-600 shadow-xl scale-110">
                <span className="text-lg font-black self-start leading-none tracking-tighter">A♦</span>
                <span className="material-symbols-outlined text-3xl">diamond</span>
              </div>
              <div className="w-14 h-20 bg-white rounded-lg border-2 border-slate-200 flex flex-col p-1.5 items-center justify-between text-slate-900 shadow-xl scale-110">
                <span className="text-lg font-black self-start leading-none tracking-tighter">K♠</span>
                <span className="material-symbols-outlined text-3xl">playing_cards</span>
              </div>
              <div className="w-14 h-20 bg-white rounded-lg border-2 border-slate-200 flex flex-col p-1.5 items-center justify-between text-slate-900 shadow-xl scale-110">
                <span className="text-lg font-black self-start leading-none tracking-tighter">10♣</span>
                <span className="material-symbols-outlined text-3xl">groups</span>
              </div>
              <div className="w-14 h-20 bg-slate-100/10 border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-white/20">help</span>
              </div>
              <div className="w-14 h-20 bg-slate-100/10 border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-white/20">help</span>
              </div>
            </div>
          </div>

          {/* Players Seats */}
          <PlayerSeat position="top" name="Alex G." balance="$4,230" active />
          <PlayerSeat position="top-left" name="Sarah L." balance="$2,800" />
          <PlayerSeat position="mid-left" name="Mike P." balance="$12,450" dealer />
          <PlayerSeat position="mid-right" name="Chris T." balance="$5,100" />
          <PlayerSeat position="top-right" name="Elena R." balance="Sitting Out" inactive />
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
              <p><span className="text-primary font-bold">Mike P.:</span> Nice hand Alex!</p>
              <p><span className="text-red-400 font-bold">Daniel K.:</span> I was so close...</p>
              <p className="text-slate-500 italic">Dealer: Hand #29481 started.</p>
              {lastAction && <p className="text-gold font-bold italic">You: {lastAction}</p>}
            </div>
            <div className="p-3 bg-slate-900/50">
              <input className="w-full bg-slate-800 border-none rounded-lg text-xs py-2 px-3 focus:ring-1 focus:ring-primary" placeholder="Diga algo..." />
            </div>
          </div>
        </div>

        <div className="col-span-6 flex flex-col items-center gap-4">
          <div className="flex gap-4">
            <HeroCard suit="spades" value="J" color="black" rotate="-rotate-6" />
            <HeroCard suit="diamond" value="J" color="red" rotate="rotate-6" />
          </div>
          <div className="bg-primary/10 border-2 border-primary backdrop-blur-md px-10 py-3 rounded-xl flex flex-col items-center shadow-lg shadow-primary/20">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">SUA VEZ</span>
            <span className="text-2xl font-black text-white">${user.balance.toLocaleString()}</span>
          </div>
        </div>

        <div className="col-span-3 space-y-4">
          <div className="bg-background/80 backdrop-blur-md p-4 rounded-xl border border-slate-700 space-y-4">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
              <span>MIN: $20</span>
              <span className="text-primary text-sm font-mono">${betValue}</span>
              <span>MAX: ${(user.balance).toLocaleString()}</span>
            </div>
            <input
              type="range" min="20" max={user.balance} value={betValue}
              onChange={(e) => setBetValue(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-full appearance-none accent-primary cursor-pointer"
            />
            <div className="grid grid-cols-4 gap-2">
              <button onClick={() => setBetValue(Math.floor(pot / 2))} className="bg-slate-800 hover:bg-slate-700 text-[10px] font-bold py-1.5 rounded transition">1/2 POT</button>
              <button onClick={() => setBetValue(Math.floor(pot * 0.75))} className="bg-slate-800 hover:bg-slate-700 text-[10px] font-bold py-1.5 rounded transition">3/4 POT</button>
              <button onClick={() => setBetValue(pot)} className="bg-slate-800 hover:bg-slate-700 text-[10px] font-bold py-1.5 rounded transition">POT</button>
              <button onClick={() => setBetValue(user.balance)} className="bg-slate-800 hover:bg-slate-700 text-[10px] font-bold py-1.5 rounded transition">ALL-IN</button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button onClick={() => handleAction('fold')} className="bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-xl shadow-lg uppercase text-sm">Fold</button>
            <button onClick={() => handleAction('call')} className="bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-xl shadow-lg uppercase text-sm border-b-4 border-slate-900">Call</button>
            <button onClick={() => handleAction('raise')} className="bg-primary hover:bg-blue-600 text-white font-black py-4 rounded-xl shadow-lg uppercase text-sm border-b-4 border-blue-800">Raise</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

const PlayerSeat = ({ position, name, balance, active, inactive, dealer }: any) => {
  const positions: any = {
    'top': '-top-12 left-1/2 -translate-x-1/2',
    'top-left': 'top-4 left-[15%]',
    'top-right': 'top-4 right-[15%]',
    'mid-left': 'top-1/2 -translate-y-1/2 -left-12',
    'mid-right': 'top-1/2 -translate-y-1/2 -right-12',
  };

  return (
    <div className={`absolute ${positions[position]} flex flex-col items-center gap-2 z-10`}>
      <div className={`size-16 rounded-full border-4 ${active ? 'border-primary ring-4 ring-primary/20' : 'border-slate-800'} bg-slate-700 overflow-hidden ${inactive ? 'grayscale' : ''}`}>
        <img className="w-full h-full object-cover" src={`https://picsum.photos/seed/${name}/100/100`} />
      </div>
      <div className={`bg-background/90 px-3 py-1 rounded-md text-center border ${inactive ? 'border-slate-800' : 'border-slate-700'} min-w-[80px]`}>
        <p className={`text-[10px] font-bold ${inactive ? 'text-slate-600' : 'text-slate-400'} truncate`}>{name}</p>
        <p className={`text-xs font-bold ${inactive ? 'text-slate-600' : 'text-white'}`}>{balance}</p>
      </div>
      {dealer && (
        <div className="absolute -right-8 top-1/2 -translate-y-1/2 bg-gold text-black font-black size-6 rounded-full flex items-center justify-center text-[10px] border-2 border-slate-900">D</div>
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
