import React from 'react';
import { useSimulation } from '../../contexts/SimulationContext';

const AdminOverview: React.FC = () => {
    const { stats } = useSimulation();

    const kpis = [
        { label: 'Platform Revenue (Real Rake)', value: `$${stats.realRake.toLocaleString()}`, icon: 'payments', color: 'text-emerald-400', trend: 'Humans Only' },
        { label: 'Total Bots', value: stats.totalBots.toLocaleString(), icon: 'smart_toy', color: 'text-blue-400', trend: 'Active' },
        { label: 'Active Tables', value: stats.runningTournaments, icon: 'casino', color: 'text-primary', trend: 'Live' },
        { label: 'Tournaments Finished', value: stats.finishedTournaments, icon: 'check_circle', color: 'text-gold', trend: 'Total' },
    ];

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpis.map((kpi, i) => (
                    <div key={i} className="bg-surface border border-border-dark p-6 rounded-2xl shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-xl bg-background/50 ${kpi.color}`}>
                                <span className="material-symbols-outlined text-2xl">{kpi.icon}</span>
                            </div>
                            <span className="text-xs font-bold text-poker-green bg-poker-green/10 px-2 py-1 rounded-full">{kpi.trend}</span>
                        </div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{kpi.label}</p>
                        <h3 className="text-2xl font-black text-white">{kpi.value}</h3>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Platform Activity Chart placeholder */}
                <div className="bg-surface border border-border-dark p-6 rounded-2xl min-h-[300px] flex flex-col">
                    <h3 className="text-lg font-bold text-white mb-6">Platform Traffic (24h)</h3>
                    <div className="flex-1 flex items-end justify-between gap-1">
                        {Array.from({ length: 24 }).map((_, i) => (
                            <div
                                key={i}
                                className="w-full bg-primary/20 rounded-t-sm hover:bg-primary transition-colors cursor-help"
                                style={{ height: `${Math.random() * 80 + 10}%` }}
                                title={`Hour ${i}: ${Math.floor(Math.random() * 500 + 100)} active`}
                            />
                        ))}
                    </div>
                </div>

                {/* Recent Transactions placeholder */}
                <div className="bg-surface border border-border-dark p-6 rounded-2xl flex flex-col">
                    <h3 className="text-lg font-bold text-white mb-6">Recent System Events</h3>
                    <div className="space-y-4">
                        {[
                            { event: 'New User Registration', user: 'joao_poker', time: '2m ago', icon: 'person_add', color: 'text-blue-400' },
                            { event: 'Withdrawal Requested', user: 'expert_pro', time: '15m ago', icon: 'outbound', color: 'text-orange-400' },
                            { event: 'Large Deposit Alert', user: 'whale_player', time: '1h ago', icon: 'warning', color: 'text-gold' },
                            { event: 'Tournament Concluded', user: 'The Big $50', time: '2h ago', icon: 'emoji_events', color: 'text-emerald-400' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-4 bg-background/30 p-3 rounded-xl border border-white/5">
                                <span className={`material-symbols-outlined ${item.color}`}>{item.icon}</span>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-white leading-none">{item.event}</p>
                                    <p className="text-xs text-slate-500 mt-1">{item.user}</p>
                                </div>
                                <span className="text-[10px] text-slate-600 font-bold uppercase">{item.time}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminOverview;
