import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { useNotification } from '../contexts/NotificationContext';

const Cashier: React.FC = () => {
  const { user, deposit, withdraw } = useGame();
  const { showAlert } = useNotification();
  const [amount, setAmount] = useState<string>('');

  const handleDeposit = async () => {
    const val = parseFloat(amount);
    if (!isNaN(val) && val > 0) {
      await deposit(val);
      setAmount('');
      await showAlert(`Deposited $${val.toLocaleString()} successfully!`, 'success', { title: 'Transaction Complete' });
    }
  };

  const handleWithdraw = async () => {
    const val = parseFloat(amount);
    if (!isNaN(val) && val > 0) {
      try {
        await withdraw(val);
        setAmount('');
        await showAlert(`Withdrawn $${val.toLocaleString()} successfully!`, 'success', { title: 'Transaction Complete' });
      } catch (err: any) {
        // Erro de saldo insuficiente já gera um alert no Context, mas podemos tratar aqui se necessário
        console.error('Withdrawal failed');
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
              <span className="material-symbols-outlined text-primary">lock</span>
            </div>
            <div className="mb-8">
              <p className="text-white text-5xl font-black tracking-tight font-display">${user.balance.toLocaleString()}</p>
              <p className="text-poker-green text-sm font-bold mt-2">+5.2% this month</p>
            </div>
            <div className="space-y-4 pt-6 border-t border-border-dark">
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Available</span>
                <span className="text-white font-bold">${(user.balance * 0.8).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">In-Play</span>
                <span className="text-white font-bold">${(user.balance * 0.2).toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount..."
                className="w-full bg-background border border-border-dark rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
              />
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleDeposit}
                  className="bg-primary text-background font-black py-4 rounded-xl hover:brightness-110 flex items-center justify-center gap-2 shadow-lg shadow-primary/10 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined">add_circle</span> DEPOSIT
                </button>
                <button
                  onClick={handleWithdraw}
                  className="bg-surface border border-border-dark text-white font-black py-4 rounded-xl hover:bg-white/5 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined">payments</span> WITHDRAW
                </button>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="mt-6 pt-6 border-t border-border-dark">
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3">Payment Methods</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white px-2 py-1.5 rounded flex items-center justify-center">
                  <span className="text-blue-600 font-black text-xs">VISA</span>
                </div>
                <div className="bg-gradient-to-r from-red-600 to-orange-500 px-2 py-1.5 rounded flex items-center justify-center">
                  <span className="text-white font-black text-xs">MC</span>
                </div>
                <div className="bg-orange-500 px-2 py-1.5 rounded flex items-center justify-center gap-1">
                  <span className="text-white font-black text-xs">₿ BTC</span>
                </div>
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-2 py-1.5 rounded flex items-center justify-center gap-1">
                  <span className="text-white font-black text-xs">◆ ETH</span>
                </div>
                <div className="bg-green-600 px-2 py-1.5 rounded flex items-center justify-center gap-1">
                  <span className="text-white font-black text-xs">₮ USDT</span>
                </div>
                <div className="bg-blue-600 px-2 py-1.5 rounded flex items-center justify-center">
                  <span className="text-white font-black text-xs">PayPal</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 bg-surface p-8 rounded-2xl border border-border-dark shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white font-display">Recent Activity</h3>
            <button className="text-primary text-xs font-bold hover:underline uppercase tracking-widest">View All</button>
          </div>
          <div className="space-y-4">
            <TransactionItem type="withdraw" method="Pix" amount="-$450.00" date="Today, 14:20" status="pending" />
            <TransactionItem type="deposit" method="USDT" amount="+$1,200.00" date="Yesterday, 10:15" status="completed" />
            <TransactionItem type="deposit" method="Visa" amount="+$2,000.00" date="Oct 12, 19:45" status="completed" />
            <TransactionItem type="withdraw" method="Neteller" amount="-$150.00" date="Oct 10, 08:30" status="completed" />
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
