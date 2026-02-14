import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';

const AdminGames: React.FC = () => {
    const [tournaments, setTournaments] = useState<any[]>([]);

    const fetchGames = async () => {
        const { data } = await supabase
            .from('tournaments')
            .select('*')
            .neq('status', 'finished')
            .order('scheduled_start_time', { ascending: true });

        if (data) setTournaments(data);
    };

    useEffect(() => {
        fetchGames();
    }, []);

    const updateStatus = async (id: string, status: string) => {
        await supabase.from('tournaments').update({ status }).eq('id', id);
        fetchGames();
    };

    const deleteTournament = async (id: string) => {
        if (confirm('Are you sure you want to delete this tournament?')) {
            await supabase.from('tournaments').delete().eq('id', id);
            fetchGames();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Active Tournaments Control</h3>
                <button className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg shadow-primary/20">
                    + Schedule New
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {tournaments.map(t => (
                    <div key={t.id} className="bg-surface border border-border-dark p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 hover:border-primary/30 transition-all">
                        <div className="flex-1 flex items-center gap-4">
                            <div className={`size-12 rounded-xl flex items-center justify-center ${t.type === 'tournament' ? 'bg-gold/10 text-gold' : 'bg-primary/10 text-primary'
                                }`}>
                                <span className="material-symbols-outlined">{t.type === 'tournament' ? 'emoji_events' : 'casino'}</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-white">{t.name}</h4>
                                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">
                                    {t.type} • Buy-in: ${t.buy_in} • {t.players_count} Players
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${t.status === 'registering' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                    t.status === 'running' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                        'bg-slate-500/10 text-slate-500 border-slate-500/20'
                                }`}>
                                {t.status}
                            </div>
                            <div className="h-4 w-px bg-white/10 mx-2" />
                            <div className="flex items-center gap-2">
                                {t.status === 'registering' && (
                                    <button
                                        onClick={() => updateStatus(t.id, 'running')}
                                        className="p-2 text-slate-400 hover:text-poker-green hover:bg-white/5 rounded-lg transition-all"
                                        title="Force Start"
                                    >
                                        <span className="material-symbols-outlined text-sm">play_arrow</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => updateStatus(t.id, 'finished')}
                                    className="p-2 text-slate-400 hover:text-orange-500 hover:bg-white/5 rounded-lg transition-all"
                                    title="Finish"
                                >
                                    <span className="material-symbols-outlined text-sm">stop</span>
                                </button>
                                <button
                                    onClick={() => deleteTournament(t.id)}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-white/5 rounded-lg transition-all"
                                    title="Delete"
                                >
                                    <span className="material-symbols-outlined text-sm">delete</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminGames;
