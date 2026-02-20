import React from 'react';

const AdminFinances: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-surface border border-border-dark p-6 rounded-2xl">
                    <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Total Chip Sales</p>
                    <h3 className="text-2xl font-black text-white">$12,450.50</h3>
                </div>
                <div className="bg-surface border border-border-dark p-6 rounded-2xl">
                    <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Daily Bonuses Claimed</p>
                    <h3 className="text-2xl font-black text-gold">450,000 🪙</h3>
                </div>
                <div className="bg-surface border border-border-dark p-6 rounded-2xl">
                    <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">House Rake (Chips)</p>
                    <h3 className="text-2xl font-black text-emerald-400">85,200 🪙</h3>
                </div>
            </div>

            <div className="bg-surface border border-border-dark rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/5">
                    <h3 className="text-lg font-bold text-white">Recent Economy Transactions</h3>
                </div>
                <div className="divide-y divide-white/5">
                    {[
                        { type: 'Purchase', user: 'pro_poker', amount: '$9.99', chips: '100,000', time: '5m ago' },
                        { type: 'Daily Bonus', user: 'casual_jim', amount: 'N/A', chips: '1,000', time: '12m ago' },
                        { type: 'Reward', user: 'quest_master', amount: 'N/A', chips: '500', time: '25m ago' },
                        { type: 'Purchase', user: 'whale_donk', amount: '$24.99', chips: '500,000', time: '1h ago' },
                    ].map((tx, i) => (
                        <div key={i} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-lg ${tx.type === 'Purchase' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                    <span className="material-symbols-outlined text-sm">{tx.type === 'Purchase' ? 'shopping_cart' : 'redeem'}</span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">{tx.user}</p>
                                    <p className="text-[10px] text-slate-500 uppercase">{tx.type}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-black text-gold">+{tx.chips} 🪙</p>
                                {tx.amount !== 'N/A' && <p className="text-[10px] text-emerald-400 font-bold">{tx.amount}</p>}
                                <p className="text-[10px] text-slate-500">{tx.time}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminFinances;
