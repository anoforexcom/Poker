import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';

const AdminUsers: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setUsers(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const updateBalance = async (userId: string, currentBalance: number, amount: number) => {
        const newBalance = currentBalance + amount;
        const { error } = await supabase.from('profiles').update({ balance: newBalance }).eq('id', userId);
        if (!error) fetchUsers();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-surface border border-border-dark p-4 rounded-xl">
                <div className="relative w-full md:w-96">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">search</span>
                    <input
                        type="text"
                        placeholder="Search by name or ID..."
                        className="w-full bg-background border border-border-dark rounded-lg py-2 pl-10 pr-4 text-white focus:ring-1 focus:ring-primary outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={fetchUsers}
                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg font-bold text-sm hover:bg-primary/20 transition-all"
                >
                    <span className="material-symbols-outlined text-sm">refresh</span> Refresh
                </button>
            </div>

            <div className="bg-surface border border-border-dark rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-background/50 border-b border-white/5">
                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">User</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Balance</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Rank</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-6 py-8"><div className="h-4 bg-white/5 rounded w-32"></div></td>
                                    <td className="px-6 py-8"><div className="h-4 bg-white/5 rounded w-20"></div></td>
                                    <td className="px-6 py-8"><div className="h-4 bg-white/5 rounded w-16"></div></td>
                                    <td className="px-6 py-8"><div className="h-4 bg-white/5 rounded w-24 ml-auto"></div></td>
                                </tr>
                            ))
                        ) : filteredUsers.map(user => (
                            <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <img src={user.avatar_url} className="size-10 rounded-full border border-primary/20" alt="" />
                                        <div>
                                            <p className="text-sm font-bold text-white">{user.name}</p>
                                            <p className="text-[10px] text-slate-500 font-mono">{user.id}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-sm font-mono font-bold text-gold">${user.balance.toLocaleString()}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-[10px] font-black uppercase px-2 py-1 bg-surface border border-white/10 rounded-md text-slate-400">
                                        {user.rank}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => updateBalance(user.id, user.balance, 1000)}
                                            className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded text-[10px] font-black hover:bg-emerald-500/20"
                                            title="Add $1,000"
                                        >
                                            +$1k
                                        </button>
                                        <button
                                            onClick={() => updateBalance(user.id, user.balance, -1000)}
                                            className="px-3 py-1 bg-red-500/10 text-red-500 rounded text-[10px] font-black hover:bg-red-500/20"
                                            title="Remove $1,000"
                                        >
                                            -$1k
                                        </button>
                                        <button className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg">
                                            <span className="material-symbols-outlined text-sm">edit</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminUsers;
