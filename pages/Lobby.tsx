
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PokerTable } from '../types';

const MOCK_TABLES: PokerTable[] = [
  { id: '1', name: 'The Royal Flush', gameType: 'NL Hold\'em', stakes: '$1.00 / $2.00', players: 6, maxPlayers: 9, avgPot: 42.50, status: 'active' },
  { id: '2', name: 'Diamond Sanctuary', gameType: 'NL Hold\'em', stakes: '$25.00 / $50.00', players: 8, maxPlayers: 9, avgPot: 1840.00, status: 'active' },
  { id: '3', name: 'Full House Hub', gameType: 'PLO 4-Card', stakes: '$0.50 / $1.00', players: 2, maxPlayers: 6, avgPot: 12.10, status: 'active' },
  { id: '4', name: 'High Noon Showdown', gameType: 'Short Deck', stakes: '$5.00 / $10.00', players: 9, maxPlayers: 9, avgPot: 340.25, status: 'full' },
  { id: '5', name: 'River Kings', gameType: 'NL Hold\'em', stakes: '$1.00 / $2.00', players: 5, maxPlayers: 9, avgPot: 98.00, status: 'active' },
];

const Lobby: React.FC = () => {
  const [filter, setFilter] = useState('ALL');
  const navigate = useNavigate();

  return (
    <div className="flex">
      <div className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight font-display">Game Lobby</h2>
            <p className="text-slate-400 mt-1">Select your table and start playing.</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-poker-green/10 text-poker-green text-[10px] font-bold px-3 py-1.5 rounded border border-poker-green/20">842 TABLES ACTIVE</div>
            <div className="bg-primary/10 text-primary text-[10px] font-bold px-3 py-1.5 rounded border border-primary/20">4,102 PLAYERS ONLINE</div>
          </div>
        </div>

        <div className="bg-surface/30 rounded-xl border border-border-dark overflow-hidden">
          <div className="p-4 flex items-center gap-4 bg-surface/10 border-b border-border-dark">
            <div className="flex bg-surface rounded-lg p-1 border border-border-dark">
              {['ALL', 'MICRO', 'LOW', 'MID', 'HIGH'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                    filter === f ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Game:</label>
              <select className="bg-surface border-border-dark text-slate-300 text-xs rounded-lg px-3 py-1 focus:ring-primary outline-none">
                <option>No Limit Hold'em</option>
                <option>Pot Limit Omaha</option>
              </select>
            </div>
            <div className="ml-auto relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-lg">search</span>
              <input 
                className="bg-surface border-border-dark text-xs rounded-lg pl-9 pr-4 py-1.5 w-48 focus:ring-primary outline-none placeholder:text-slate-600"
                placeholder="Find table..."
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-border-dark">
                  <th className="py-4 px-6">Table Name</th>
                  <th className="py-4 px-6">Game Type</th>
                  <th className="py-4 px-6">Stakes</th>
                  <th className="py-4 px-6">Players</th>
                  <th className="py-4 px-6">Avg Pot</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark">
                {MOCK_TABLES.map((table) => (
                  <tr key={table.id} className="hover:bg-primary/5 transition-all group">
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`size-2 rounded-full ${table.status === 'full' ? 'bg-red-500' : 'bg-poker-green shadow-[0_0_8px_rgba(34,197,94,0.5)]'}`}></div>
                        <span className="text-sm font-semibold text-white">{table.name}</span>
                        {table.avgPot > 1000 && <span className="material-symbols-outlined text-gold text-lg">workspace_premium</span>}
                      </div>
                    </td>
                    <td className="py-5 px-6 text-xs font-medium text-slate-400">{table.gameType}</td>
                    <td className="py-5 px-6 text-sm font-bold text-poker-green">{table.stakes}</td>
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${table.status === 'full' ? 'bg-red-500' : 'bg-primary'}`} style={{ width: `${(table.players/table.maxPlayers)*100}%` }}></div>
                        </div>
                        <span className="text-xs font-mono text-slate-300">{table.players}/{table.maxPlayers}</span>
                      </div>
                    </td>
                    <td className="py-5 px-6 text-sm font-mono text-slate-300">${table.avgPot.toLocaleString()}</td>
                    <td className="py-5 px-6 text-right">
                      <button 
                        onClick={() => navigate(`/table/${table.id}`)}
                        className={`px-6 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        table.status === 'full' 
                          ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed' 
                          : 'bg-primary/20 hover:bg-primary text-primary hover:text-white border-primary/30'
                      }`}>
                        {table.status === 'full' ? 'WAITLIST' : 'JOIN'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <aside className="w-80 border-l border-border-dark p-6 space-y-8 hidden xl:block bg-surface/10 h-screen">
        <div>
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Promotions</h3>
          <div className="rounded-xl overflow-hidden relative group cursor-pointer shadow-xl aspect-video border border-border-dark">
            <img src="https://picsum.photos/seed/pokerpromo/400/225" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-80"></div>
            <div className="absolute bottom-4 left-4">
              <p className="text-[10px] font-bold text-gold uppercase">Special Event</p>
              <p className="text-sm font-bold text-white">Sunday Million $1M GTD</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Friends Online (3)</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between group cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-all">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img src={`https://picsum.photos/seed/friend${i}/40/40`} className="size-10 rounded-full border border-border-dark" />
                    <div className="absolute bottom-0 right-0 size-3 bg-poker-green rounded-full border-2 border-surface"></div>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Player_{i*13}</p>
                    <p className="text-[10px] text-slate-500 italic">In Table: River Kings</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-primary opacity-0 group-hover:opacity-100 transition-opacity">chat</span>
              </div>
            ))}
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
                <span className="text-slate-400">Win 10 pots</span>
                <span className="text-white font-mono">7/10</span>
              </div>
              <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                <div className="h-full bg-gold" style={{ width: '70%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Lobby;
