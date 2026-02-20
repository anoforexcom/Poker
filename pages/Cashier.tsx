import React, { useState } from 'react';
import { useGame, DAILY_BONUS_BASE, RANKS } from '../contexts/GameContext';
import { useNotification } from '../contexts/NotificationContext';

const CHIP_PACKS = [
  { id: 1, chips: 5000, price: '$0.99', label: 'Starter Pack', icon: '🪙', popular: false },
  { id: 2, chips: 25000, price: '$3.99', label: 'Value Pack', icon: '💰', popular: true },
  { id: 3, chips: 100000, price: '$9.99', label: 'Pro Pack', icon: '💎', popular: false },
  { id: 4, chips: 500000, price: '$24.99', label: 'VIP Pack', icon: '👑', popular: false },
];

const Cashier: React.FC = () => {
  const { user, addChips, transactions, canClaimDailyBonus, claimDailyBonus, getRank, getNextRank, getRankProgress } = useGame();
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState<'shop' | 'bonus' | 'history'>('shop');
  const [purchasing, setPurchasing] = useState<number | null>(null);
  const [claimingBonus, setClaimingBonus] = useState(false);

  const handlePurchase = async (pack: typeof CHIP_PACKS[0]) => {
    setPurchasing(pack.id);
    // Simulate purchase delay
    await new Promise(r => setTimeout(r, 1500));
    await addChips(pack.chips, 'chip_purchase', `Purchased ${pack.label}`);
    showNotification(`🎉 ${pack.chips.toLocaleString()} chips added to your balance!`, 'success');
    setPurchasing(null);
  };

  const handleClaimBonus = async () => {
    setClaimingBonus(true);
    try {
      const result = await claimDailyBonus();
      showNotification(result.message, result.success ? 'success' : 'info');
    } catch (e) {
      showNotification('Failed to claim bonus. Try again.', 'error');
    }
    setClaimingBonus(false);
  };

  const currentRank = getRank();
  const nextRank = getNextRank();
  const progress = getRankProgress();

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Chip Shop</h2>
          <p className="text-slate-400 text-sm">Get more chips to keep playing!</p>
        </div>
        <div className="flex items-center gap-3 bg-surface rounded-xl px-4 py-3 border border-border-dark">
          <span className="material-symbols-outlined text-gold text-xl">toll</span>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Your Chips</p>
            <p className="text-xl font-black text-gold">{user.chips.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface rounded-xl p-1 border border-border-dark w-fit">
        {([
          { key: 'shop', label: 'Buy Chips', icon: 'storefront' },
          { key: 'bonus', label: 'Free Chips', icon: 'redeem' },
          { key: 'history', label: 'History', icon: 'receipt_long' },
        ] as const).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab.key ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}`}>
            <span className="material-symbols-outlined text-sm">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Shop Tab */}
      {activeTab === 'shop' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CHIP_PACKS.map(pack => (
              <div key={pack.id} className={`relative bg-surface border rounded-2xl p-6 transition-all hover:border-gold/50 group ${pack.popular ? 'border-gold/30 ring-1 ring-gold/10' : 'border-border-dark'}`}>
                {pack.popular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gold text-black px-3 py-0.5 rounded-full text-[9px] font-black uppercase">Most Popular</div>
                )}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{pack.icon}</span>
                    <div>
                      <h3 className="text-white font-bold">{pack.label}</h3>
                      <p className="text-gold font-black text-lg">{pack.chips.toLocaleString()} chips</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handlePurchase(pack)}
                  disabled={purchasing !== null}
                  className={`w-full py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${purchasing === pack.id
                      ? 'bg-slate-700 text-slate-400'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black active:scale-95 shadow-lg'
                    }`}
                >
                  {purchasing === pack.id ? (
                    <>
                      <span className="material-symbols-outlined text-sm animate-spin">hourglass_empty</span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">shopping_cart</span>
                      Buy for {pack.price}
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-xl p-5 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-purple-400">workspace_premium</span>
              <h3 className="text-white font-bold">VIP Pass</h3>
              <span className="text-[9px] font-black bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded-full uppercase">Coming Soon</span>
            </div>
            <p className="text-slate-400 text-xs">Monthly subscription for exclusive card backs, table themes, double XP weekends, and bonus chips.</p>
          </div>
        </div>
      )}

      {/* Free Chips Tab */}
      {activeTab === 'bonus' && (
        <div className="space-y-4">
          {/* Daily Bonus */}
          <div className="bg-gradient-to-br from-amber-600/20 to-amber-800/20 rounded-2xl p-6 border border-amber-500/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-14 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-amber-400 text-2xl">redeem</span>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Daily Bonus</h3>
                <p className="text-amber-200 text-xs">Claim free chips every 24 hours. Streak increases your bonus!</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-black/20 rounded-xl p-3 text-center">
                <p className="text-[9px] font-black uppercase text-slate-500">Base Bonus</p>
                <p className="text-gold font-black text-lg">{DAILY_BONUS_BASE.toLocaleString()}</p>
              </div>
              <div className="bg-black/20 rounded-xl p-3 text-center">
                <p className="text-[9px] font-black uppercase text-slate-500">Rank Multiplier</p>
                <p className="text-gold font-black text-lg">x{currentRank.bonusMultiplier}</p>
              </div>
            </div>
            <button
              onClick={handleClaimBonus}
              disabled={!canClaimDailyBonus() || claimingBonus}
              className={`w-full py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${canClaimDailyBonus()
                  ? 'bg-amber-500 hover:bg-amber-400 text-black active:scale-95 shadow-lg'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }`}
            >
              <span className="material-symbols-outlined text-sm">{claimingBonus ? 'hourglass_empty' : 'redeem'}</span>
              {claimingBonus ? 'Claiming...' : canClaimDailyBonus() ? 'Claim Daily Bonus' : 'Already Claimed Today ✓'}
            </button>
          </div>

          {/* Rank Bonus Info */}
          <div className="bg-surface rounded-xl p-5 border border-border-dark">
            <h3 className="text-white font-bold mb-3">Rank Bonus Multipliers</h3>
            <p className="text-slate-400 text-xs mb-4">Higher ranks earn bigger daily bonuses!</p>
            <div className="space-y-2">
              {RANKS.map(rank => (
                <div key={rank.name} className={`flex items-center gap-3 p-2.5 rounded-lg ${rank.name === currentRank.name ? 'bg-primary/10 ring-1 ring-primary/30' : ''}`}>
                  <span className="text-base">{rank.icon}</span>
                  <span className={`text-sm font-bold flex-1 ${rank.name === currentRank.name ? 'text-white' : 'text-slate-500'}`}>{rank.name}</span>
                  <span className="text-gold font-bold text-sm">x{rank.bonusMultiplier}</span>
                  <span className="text-slate-500 text-xs">{Math.floor(DAILY_BONUS_BASE * rank.bonusMultiplier).toLocaleString()} / day</span>
                  {rank.name === currentRank.name && <span className="text-[8px] font-black text-primary uppercase">Current</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-surface border border-border-dark rounded-xl overflow-hidden">
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-4xl text-slate-600 mb-2">receipt_long</span>
              <p className="text-slate-500 text-sm">No transactions yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border-dark/50">
              {transactions.slice(0, 20).map(tx => (
                <div key={tx.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/2 transition-colors">
                  <div className={`size-10 rounded-xl flex items-center justify-center ${tx.amount > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                    <span className="material-symbols-outlined text-lg">
                      {tx.type === 'daily_bonus' ? 'redeem' : tx.type === 'chip_purchase' ? 'shopping_cart' : tx.type === 'reward' ? 'emoji_events' : tx.amount > 0 ? 'arrow_upward' : 'arrow_downward'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-bold text-sm">{tx.description || tx.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                    <p className="text-slate-500 text-[10px]">{new Date(tx.created_at).toLocaleDateString()} • {new Date(tx.created_at).toLocaleTimeString()}</p>
                  </div>
                  <p className={`font-black text-sm ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Cashier;
