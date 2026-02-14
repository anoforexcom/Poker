import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { useNotification } from '../contexts/NotificationContext';

const Cashier: React.FC = () => {
  const { user, transactions, deposit, withdraw } = useGame();
  const { showAlert } = useNotification();
  const [amount, setAmount] = useState<string>('');
  const [method, setMethod] = useState<string>('Visa');
  const [isProcessing, setIsProcessing] = useState(false);

  const presets = [10, 50, 100, 500, 1000];

  const handleDeposit = async () => {
    const val = parseFloat(amount);
    if (!isNaN(val) && val > 0) {
      setIsProcessing(true);
      // Simulate network delay for realism
      await new Promise(resolve => setTimeout(resolve, 1500));
      await deposit(val, method);
      setIsProcessing(false);
      setAmount('');
      await showAlert(`Deposited $${val.toLocaleString()} via ${method} successfully!`, 'success', { title: 'Transaction Complete' });
    }
  };

  const handleWithdraw = async () => {
    const val = parseFloat(amount);
    if (!isNaN(val) && val > 0) {
      setIsProcessing(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      try {
        await withdraw(val, method);
        setIsProcessing(false);
        setAmount('');
        await showAlert(`Withdrawn $${val.toLocaleString()} to ${method} successfully!`, 'success', { title: 'Transaction Complete' });
      } catch (err: any) {
        setIsProcessing(false);
        await showAlert('Insufficient funds for this withdrawal.', 'error', { title: 'Transaction Failed' });
      }
    }
  };

  return (
    <div className="p-8 max-w-[1440px] mx-auto space-y-10">
      <div>
        <h1 className="text-4xl font-black text-white font-display tracking-tight mb-2">Cashier & Management</h1>
        <p className="text-slate-400">Manage your funds and track your transactions securely.</p>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-surface p-8 rounded-2xl border border-border-dark shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <span className="text-slate-500 text-sm font-medium uppercase tracking-widest">Total Balance</span>
              <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
            </div>
            <div className="mb-8">
              <p className="text-white text-5xl font-black tracking-tight font-display">${user.balance.toLocaleString()}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="size-2 rounded-full bg-poker-green animate-pulse"></span>
                <p className="text-poker-green text-sm font-bold uppercase tracking-wider">Verified Secure</p>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-border-dark">
              <div className="flex flex-wrap gap-2 mb-4">
                {presets.map(p => (
                  <button
                    key={p}
                    onClick={() => setAmount(p.toString())}
                    className="px-3 py-1.5 rounded-lg bg-background border border-border-dark text-white text-xs font-bold hover:border-primary transition-colors"
                  >
                    +${p}
                  </button>
                ))}
              </div>

              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount..."
                className="w-full bg-background border border-border-dark rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-all appearance-none"
              />

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleDeposit}
                  disabled={isProcessing}
                  className="bg-primary text-background font-black py-4 rounded-xl hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/10 transition-all active:scale-95"
                >
                  <span className={`material-symbols-outlined ${isProcessing ? 'animate-spin' : ''}`}>{isProcessing ? 'sync' : 'add_circle'}</span>
                  {isProcessing ? 'PROCESSING...' : 'DEPOSIT'}
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={isProcessing}
                  className="bg-surface border border-border-dark text-white font-black py-4 rounded-xl hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <span className={`material-symbols-outlined ${isProcessing ? 'animate-spin' : ''}`}>{isProcessing ? 'sync' : 'payments'}</span>
                  {isProcessing ? 'PROCESSING...' : 'WITHDRAW'}
                </button>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="mt-6 pt-6 border-t border-border-dark">
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3">Select Method</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'Visa', label: 'VISA', color: 'bg-white text-blue-600' },
                  { id: 'Mastercard', label: 'MC', color: 'bg-gradient-to-r from-red-600 to-orange-500 text-white' },
                  { id: 'Bitcoin', label: '₿ BTC', color: 'bg-orange-500 text-white' },
                  { id: 'Ethereum', label: '◆ ETH', color: 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' },
                  { id: 'USDT', label: '₮ USDT', color: 'bg-green-600 text-white' },
                  { id: 'PayPal', label: 'PP', color: 'bg-blue-600 text-white' }
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`px-2 py-2 rounded flex items-center justify-center text-[10px] font-black transition-all ${method === m.id ? 'ring-2 ring-primary scale-105' : 'opacity-60 grayscale hover:grayscale-0 hover:opacity-100'} ${m.color}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 bg-surface p-8 rounded-2xl border border-border-dark shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white font-display">Recent Activity</h3>
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest bg-background px-3 py-1 rounded-full border border-border-dark">Real-Time Sync</span>
          </div>
          <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
            {transactions.length > 0 ? (
              transactions.map(t => (
                <TransactionItem
                  key={t.id}
                  type={t.type}
                  method={t.method}
                  amount={`${t.type === 'deposit' ? '+' : '-'}$${t.amount.toLocaleString()}`}
                  date={new Date(t.created_at).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  status={t.status}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500 border-2 border-dashed border-border-dark rounded-2xl">
                <span className="material-symbols-outlined text-4xl mb-3">history</span>
                <p className="font-bold">No transactions found</p>
                <p className="text-xs">Your financial activity will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const TransactionItem = ({ type, method, amount, date, status }: any) => (
  <div className="p-4 bg-background/50 border border-border-dark rounded-xl flex items-center justify-between group hover:bg-white/5 transition-all">
    <div className="flex items-center gap-4">
      <div className={`size-10 rounded-full flex items-center justify-center ${type === 'deposit' ? 'bg-poker-green/20 text-poker-green' : 'bg-rose-500/20 text-rose-500'
        }`}>
        <span className="material-symbols-outlined text-lg">{type === 'deposit' ? 'add_circle' : 'remove_circle'}</span>
      </div>
      <div>
        <p className="text-sm font-bold text-white">{type === 'deposit' ? 'Deposit' : 'Withdrawal'} via {method}</p>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{date}</p>
      </div>
    </div>
    <div className="text-right">
      <p className={`text-sm font-black ${type === 'deposit' ? 'text-poker-green' : 'text-white'}`}>{amount}</p>
      <div className="flex items-center gap-1.5 justify-end mt-1">
        <span className={`size-1.5 rounded-full ${status === 'completed' ? 'bg-poker-green' : 'bg-gold animate-pulse'}`}></span>
        <span className={`text-[9px] font-black uppercase tracking-widest ${status === 'completed' ? 'text-poker-green' : 'text-gold'}`}>{status}</span>
      </div>
    </div>
  </div>
);

export default Cashier;
