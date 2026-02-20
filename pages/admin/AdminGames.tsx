import React from 'react';

const AdminGames: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-surface border border-border-dark p-6 rounded-2xl">
                    <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Active Players</p>
                    <h3 className="text-2xl font-black text-white">1,204</h3>
                </div>
                <div className="bg-surface border border-border-dark p-6 rounded-2xl">
                    <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Open Tables</p>
                    <h3 className="text-2xl font-black text-primary">24</h3>
                </div>
                <div className="bg-surface border border-border-dark p-6 rounded-2xl">
                    <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Avg. Pot Size</p>
                    <h3 className="text-2xl font-black text-gold">12,500 🪙</h3>
                </div>
            </div>

            <div className="bg-surface border border-border-dark rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">Live Table Management</h3>
                    <button className="px-4 py-2 bg-primary text-white rounded-lg font-bold text-sm">Create Table</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-background/50 border-b border-white/5">
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Table Name</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Stakes</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Players</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Type</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {[
                                { name: 'Diamond Heights', stakes: '1k/2k', players: '8/9', type: 'High Roller' },
                                { name: 'Bronze Garden', stakes: '10/20', players: '5/9', type: 'Casual' },
                                { name: 'Silver Streak', stakes: '100/200', players: '9/9', type: 'Intermediate' },
                                { name: 'Platinum Plaza', stakes: '500/1k', players: '2/9', type: 'Pro' },
                            ].map((table, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 text-sm font-bold text-white">{table.name}</td>
                                    <td className="px-6 py-4 text-sm font-mono text-gold">{table.stakes}</td>
                                    <td className="px-6 py-4 text-sm text-slate-300">{table.players}</td>
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] font-black uppercase px-2 py-1 bg-primary/10 text-primary border border-primary/20 rounded">
                                            {table.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-slate-400 hover:text-white p-1">
                                            <span className="material-symbols-outlined text-sm">settings</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminGames;
