import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveWorld } from '../contexts/LiveWorldContext';

const Lobby: React.FC = () => {
  const { onlinePlayers, activeTables, tournaments } = useLiveWorld();
  const [filter, setFilter] = useState('ALL');
  const navigate = useNavigate();

  const filteredTournaments = tournaments.filter(t => {
    if (filter === 'ALL') return true;
    if (filter === 'MICRO') return t.buyIn < 5;
    if (filter === 'LOW') return t.buyIn >= 5 && t.buyIn < 20;
    if (filter === 'MID') return t.buyIn >= 20 && t.buyIn < 100;
    if (filter === 'HIGH') return t.buyIn >= 100;
    return true;
  });

  const getFilterCount = (f: string) => {
    if (f === 'ALL') return tournaments.length;
    if (f === 'MICRO') return tournaments.filter(t => t.buyIn < 5).length;
    if (f === 'LOW') return tournaments.filter(t => t.buyIn >= 5 && t.buyIn < 20).length;
    if (f === 'MID') return tournaments.filter(t => t.buyIn >= 20 && t.buyIn < 100).length;
    if (f === 'HIGH') return tournaments.filter(t => t.buyIn >= 100).length;
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

  return (
    <div className="flex h-full">
      <div className="flex-1 p-4 md:p-8 overflow-y-auto custom-scrollbar">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight font-display">Tournament Lobby</h2>
            <p className="text-slate-400 mt-1">Join the action. Big prizes, live drama.</p>
          </div>
          <div className="flex flex-wrap gap-2 md:gap-4">
            <div className="bg-poker-green/10 text-poker-green text-[10px] font-bold px-3 py-1.5 rounded border border-poker-green/20 flex items-center gap-2">
              <span className="size-2 bg-poker-green rounded-full animate-pulse"></span>
              {tournaments.length.toLocaleString()} <span className="hidden sm:inline">TOURNAMENTS</span> ACTIVE
            </div>
            <div className="bg-primary/10 text-primary text-[10px] font-bold px-3 py-1.5 rounded border border-primary/20 flex items-center gap-2">
              <span className="size-2 bg-primary rounded-full animate-pulse"></span>
              {onlinePlayers.toLocaleString()} <span className="hidden sm:inline">PLAYERS</span> ONLINE
            </div>
          </div>
        </div>

        <div className="bg-surface/30 rounded-xl border border-border-dark overflow-hidden">
          {/* Filters */}
          <div className="p-4 flex flex-col md:flex-row items-center gap-4 bg-surface/10 border-b border-border-dark">
            <div className="flex bg-surface rounded-lg p-1 border border-border-dark w-full md:w-auto overflow-x-auto">
              {['ALL', 'MICRO', 'LOW', 'MID', 'HIGH'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 whitespace-nowrap ${filter === f ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'
                    }`}
                >
                  {f} <span className={`text-[10px] opacity-70 ${filter === f ? 'text-white' : 'text-slate-500'}`}>({getFilterCount(f)})</span>
                </button>
              ))}
            </div>
            <div className="w-full md:ml-auto md:w-auto relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-lg">search</span>
              <input
                className="bg-surface border-border-dark text-xs rounded-lg pl-9 pr-4 py-1.5 w-full md:w-48 focus:ring-primary outline-none placeholder:text-slate-600 text-white"
                placeholder="Find tournament..."
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead>
                <tr className="text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-border-dark">
                  <th className="py-4 px-6">Tournament</th>
                  <th className="py-4 px-6">State</th>
                  <th className="py-4 px-6">Buy-in</th>
                  <th className="py-4 px-6">Players</th>
                  <th className="py-4 px-6">Prize Pool</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark">
                {tournaments.map((t) => (
                  <tr key={t.id} className="hover:bg-primary/5 transition-all group">
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`size-1.5 rounded-full ${t.status === 'Running' ? 'bg-blue-500' : 'bg-slate-600'}`}></div>
                        <div>
                          <span className="text-sm font-bold text-white block truncate max-w-[150px]">{t.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{t.id.split('-')[1]}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <span className={`text-xs font-black uppercase tracking-wider ${getStatusColor(t.status)}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-5 px-6 text-sm font-bold text-white">${t.buyIn.toFixed(2)}</td>
                    <td className="py-5 px-6">
                      <div className="flex flex-col gap-1 w-24">
                        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                          <span>{t.players}</span>
                          <span>{t.maxPlayers}</span>
                        </div>
                        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${t.status === 'Running' ? 'bg-blue-500' : 'bg-poker-green'}`}
                            style={{ width: `${(t.players / t.maxPlayers) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-6 text-sm font-mono text-gold font-bold">${t.prizePool.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className="py-5 px-6 text-right">
                      <button
                        onClick={() => navigate(`/tournament/${t.id}`)}
                        disabled={t.status === 'Finished'}
                        className={`w-full py-2 rounded-lg font-black text-xs transition-all shadow-lg hover:brightness-110 flex items-center justify-center gap-2 ${t.status === 'Registering' || t.status === 'Late Reg' ? 'bg-poker-green text-white shadow-poker-green/20' :
                          t.status === 'Running' ? 'bg-blue-600 text-white shadow-blue-600/20' :
                            'bg-slate-700 text-slate-400 cursor-not-allowed'
                          }`}
                      >
                        {t.status === 'Running' || t.status === 'Final Table' ? 'OBSERVE' : t.status === 'Finished' ? 'ENDED' : 'REGISTER'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <aside className="w-80 border-l border-border-dark p-6 space-y-8 hidden xl:block bg-surface/10 overflow-y-auto">
        <div>
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Featured Event</h3>
          <div className="rounded-xl overflow-hidden relative group cursor-pointer shadow-xl aspect-video border border-border-dark">
            <img src="https://picsum.photos/seed/pokerpromo/400/225" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
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

        <div>
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Global Chat</h3>
          <div className="bg-background/50 border border-border-dark rounded-xl p-3 h-64 overflow-y-auto custom-scrollbar space-y-3">
            <p className="text-[11px] text-slate-400"><span className="text-primary font-bold">PokerKing99:</span> Who is playing the Turbo?</p>
            <p className="text-[11px] text-slate-400"><span className="text-gold font-bold">Admin:</span> Server maintenance in 4 hours.</p>
            <p className="text-[11px] text-slate-400"><span className="text-white font-bold">RiverRat:</span> This RNG is rigged!</p>
            {activeTables > 850 && <p className="text-[10px] text-poker-green italic text-center my-2">-- High Traffic Alert --</p>}
          </div>
        </div>

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
      </aside>
    </div>
  );
};

export default Lobby;
