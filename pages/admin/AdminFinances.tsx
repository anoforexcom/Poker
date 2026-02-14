import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';

const AdminFinances: React.FC = () => {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTransactions = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('transactions')
            .select('*, profiles(name, balance)')
            .order('created_at', { ascending: false });

        if (data) setTransactions(data);
        setLoading(false);
    };

    const handleApprove = async (tx: any) => {
        const { error } = await supabase
            .from('transactions')
            .update({ status: 'completed' })
            .eq('id', tx.id);

        if (!error) {
            alert('Withdrawal approved successfully');
            fetchTransactions();
        }
    };

    const handleReject = async (tx: any) => {
        // Refund the user
        const newBalance = (tx.profiles?.balance || 0) + tx.amount;

        // Use a transaction or sequential updates
        const { error: profileError } = await supabase
            .from('profiles')
            .update({ balance: newBalance })
            .eq('id', tx.user_id);

        if (!profileError) {
            await supabase
                .from('transactions')
                .update({ status: 'rejected' })
                .eq('id', tx.id);

            alert('Withdrawal rejected and funds refunded.');
            fetchTransactions();
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-surface border border-border-dark p-6 rounded-2xl">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Deposits</p>
                    <h3 className="text-2xl font-black text-poker-green">$458,920</h3>
                </div>
                <div className="bg-surface border border-border-dark p-6 rounded-2xl">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Withdrawals</p>
                    <h3 className="text-2xl font-black text-red-500">$124,150</h3>
                </div>
                <div className="bg-surface border border-border-dark p-6 rounded-2xl border-primary/20">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Net Platform Growth</p>
                    <h3 className="text-2xl font-black text-primary">+$334,770</h3>
                </div>
            </div>

            <div className="bg-surface border border-border-dark rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">Global Audit Log</h3>
                    <button onClick={fetchTransactions} className="text-primary hover:text-blue-300">
                        <span className="material-symbols-outlined">refresh</span>
                    </button>
                </div>
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-background/30 text-slate-500">
                            <th className="px-6 py-4 font-black uppercase text-xs">User</th>
                            <th className="px-6 py-4 font-black uppercase text-xs">Type</th>
                            <th className="px-6 py-4 font-black uppercase text-xs">Amount</th>
                            <th className="px-6 py-4 font-black uppercase text-xs">Method</th>
                            <th className="px-6 py-4 font-black uppercase text-xs">Date</th>
                            <th className="px-6 py-4 font-black uppercase text-xs text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {transactions.map(tx => (
                            <tr key={tx.id} className="hover:bg-white/5">
                                <td className="px-6 py-4 font-bold text-white">{tx.profiles?.name || 'Unknown'}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${tx.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                                        }`}>
                                        {tx.type}
                                    </span>
                                </td>
                                <td className={`px-6 py-4 font-mono font-bold ${tx.type === 'deposit' ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {tx.type === 'deposit' ? '+' : '-'}${tx.amount.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-slate-400">{tx.method}</td>
                                <td className="px-6 py-4 text-slate-500 text-xs">
                                    {new Date(tx.created_at).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {tx.status === 'pending' ? (
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleApprove(tx)}
                                                className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 rounded text-[10px] font-black uppercase transition-all"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleReject(tx)}
                                                className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-1 rounded text-[10px] font-black uppercase transition-all"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    ) : (
                                        <div className={`flex items-center justify-end gap-1 font-bold text-[10px] uppercase ${tx.status === 'completed' ? 'text-emerald-400' : 'text-slate-500'
                                            }`}>
                                            <span className="material-symbols-outlined text-sm">
                                                {tx.status === 'completed' ? 'check_circle' : 'cancel'}
                                            </span>
                                            {tx.status}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminFinances;
