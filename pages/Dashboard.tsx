import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { useGame, RANKS } from '../contexts/GameContext';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { user: gameUser, activeGames, getRank, getNextRank, getRankProgress, canClaimDailyBonus, claimDailyBonus } = useGame();
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState<'1W' | '1M' | '1Y'>('1M');
  const [chartData, setChartData] = useState<any[]>([]);
  const [claimingBonus, setClaimingBonus] = useState(false);
  const [bonusMessage, setBonusMessage] = useState('');

  const stats = gameUser.stats;
  const winRate = stats.hands_played > 0 ? Math.round((stats.hands_won / stats.hands_played) * 100) : 0;

  useEffect(() => {
    const days = timeframe === '1W' ? 7 : timeframe === '1M' ? 30 : 365;
    const history: any[] = [];
    const baseChips = gameUser?.chips || 0;

    for (let i = days; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const variation = i === 0 ? 0 : (Math.random() - 0.45) * (baseChips * 0.05);
      history.push({
        date: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        chips: Math.max(0, Math.floor(baseChips + variation * (days - i) / days))
      });
    }
    history[history.length - 1].chips = baseChips;
    setChartData(history);
  }, [gameUser?.chips, timeframe]);

  const handleClaimBonus = async () => {
    setClaimingBonus(true);
    try {
      const result = await claimDailyBonus();
      setBonusMessage(result.message);
      setTimeout(() => setBonusMessage(''), 5000);
    } catch (e) {
      setBonusMessage('Something went wrong. Try again later.');
    }
    setClaimingBonus(false);
  };

  const currentRank = getRank();
  const nextRank = getNextRank();
  const progress = getRankProgress();

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Dashboard</h2>
          <p className="text-slate-400 text-sm">Welcome back, <span className="text-primary font-bold">{gameUser.name}</span></p>
        </div>
        <div className="flex gap-2">
          {['1W', '1M', '1Y'].map(tf => (
            <button key={tf} onClick={() => setTimeframe(tf as any)} className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase ${timeframe === tf ? 'bg-primary text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}>{tf}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* Rank + XP Card */}
        <div className="col-span-12 md:col-span-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-5 border border-white/5">
          <div className="flex items-center gap-4 mb-4">
            <div className="size-14 rounded-full flex items-center justify-center text-3xl" style={{ background: `${currentRank.color}20`, border: `2px solid ${currentRank.color}` }}>
              {currentRank.icon}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Current Rank</p>
              <p className="text-xl font-black text-white">{currentRank.name}</p>
              <p className="text-xs text-slate-400">Level {gameUser.level} • {gameUser.xp.toLocaleString()} XP</p>
            </div>
          </div>
          {nextRank && (
            <div>
              <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider mb-1">
                <span className="text-slate-500">Progress to {nextRank.name}</span>
                <span className="text-primary">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${currentRank.color}, ${nextRank.color})` }} />
              </div>
              <p className="text-[9px] text-slate-500 mt-1">{(nextRank.xpRequired - gameUser.xp).toLocaleString()} XP to go</p>
            </div>
          )}
          {!nextRank && <p className="text-gold text-xs font-bold mt-2">🏆 Maximum Rank Achieved!</p>}
        </div>

        {/* Quick Stats Grid */}
        <div className="col-span-12 md:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Chip Balance', value: gameUser.chips.toLocaleString(), icon: 'toll', color: 'text-gold', prefix: '' },
            { label: 'Win Rate', value: `${winRate}%`, icon: 'trending_up', color: winRate >= 50 ? 'text-emerald-400' : 'text-red-400' },
            { label: 'Hands Played', value: stats.hands_played.toLocaleString(), icon: 'playing_cards', color: 'text-white' },
            { label: 'Hands Won', value: stats.hands_won.toLocaleString(), icon: 'emoji_events', color: 'text-primary' },
            { label: 'Biggest Pot', value: stats.biggest_pot.toLocaleString(), icon: 'diamond', color: 'text-gold' },
            { label: 'Best Streak', value: `${stats.win_streak}`, icon: 'local_fire_department', color: 'text-orange-400' },
            { label: 'Chips Won', value: stats.total_chips_won.toLocaleString(), icon: 'arrow_upward', color: 'text-emerald-400' },
            { label: 'Chips Lost', value: stats.total_chips_lost.toLocaleString(), icon: 'arrow_downward', color: 'text-red-400' },
          ].map((stat, i) => (
            <div key={i} className="bg-surface rounded-xl p-4 border border-border-dark hover:border-primary/30 transition-colors group">
              <div className="flex items-center gap-2 mb-2">
                <span className={`material-symbols-outlined text-base ${stat.color} opacity-60 group-hover:opacity-100 transition`}>{stat.icon}</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{stat.label}</span>
              </div>
              <p className={`text-lg font-black ${stat.color}`}>{stat.prefix || ''}{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Chip History Chart */}
        <div className="col-span-12 lg:col-span-8 bg-surface border border-border-dark rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-white mb-4">Chip Balance History</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="chipGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFD700" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FFD700" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '12px' }} formatter={(v: any) => [v.toLocaleString() + ' chips', 'Balance']} />
                <Area type="monotone" dataKey="chips" stroke="#FFD700" fill="url(#chipGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-4">
          {/* Daily Bonus Card */}
          <div className="bg-gradient-to-br from-amber-600/20 to-amber-800/20 rounded-xl p-5 border border-amber-500/20 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-amber-400">redeem</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">Daily Bonus</span>
            </div>
            {bonusMessage ? (
              <p className="text-white text-sm font-bold mb-3">{bonusMessage}</p>
            ) : (
              <p className="text-amber-100 text-xs mb-3 opacity-80">
                {canClaimDailyBonus()
                  ? `Claim your free chips! Streak: Day ${(stats.login_streak || 0) + 1}`
                  : 'Already claimed today. Come back tomorrow!'}
              </p>
            )}
            <button
              onClick={handleClaimBonus}
              disabled={!canClaimDailyBonus() || claimingBonus}
              className={`w-full py-2.5 rounded-xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${canClaimDailyBonus()
                  ? 'bg-amber-500 hover:bg-amber-400 text-black active:scale-95 shadow-lg'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }`}
            >
              <span className="material-symbols-outlined text-sm">{claimingBonus ? 'hourglass_empty' : 'redeem'}</span>
              {claimingBonus ? 'Claiming...' : canClaimDailyBonus() ? 'Claim Bonus' : 'Claimed ✓'}
            </button>
          </div>

          {/* Play / Return to Table */}
          {activeGames.length > 0 ? (
            <div className="bg-gradient-to-br from-amber-600 to-amber-800 rounded-xl p-5 border border-amber-400/20 relative overflow-hidden group">
              <div className="flex items-center gap-2 mb-2">
                <div className="size-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-amber-200 text-[9px] font-black uppercase tracking-widest">Game in Progress</span>
              </div>
              <h3 className="text-lg font-black text-white mb-1 uppercase italic tracking-tighter">Active Hand!</h3>
              <button onClick={() => navigate('/table/main_table')} className="w-full bg-white text-amber-700 py-2.5 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-amber-50 transition-all active:scale-95 flex items-center justify-center gap-2 mt-3">
                <span className="material-symbols-outlined">arrow_back</span>
                Return to Table
              </button>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-primary to-blue-700 rounded-xl p-5 border border-white/10 relative overflow-hidden group">
              <h3 className="text-lg font-black text-white mb-1 uppercase italic tracking-tighter">Ready to Play?</h3>
              <p className="text-blue-100 text-xs mb-3 opacity-80">Join the table and test your skills.</p>
              <button onClick={() => navigate('/table/main_table')} className="w-full bg-white text-primary py-2.5 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-blue-50 transition-all active:scale-95 flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">play_arrow</span>
                Play Now
              </button>
            </div>
          )}

          {/* Ranking Tiers */}
          <div className="bg-surface border border-border-dark rounded-xl p-5">
            <h3 className="text-sm font-black text-white mb-3 uppercase tracking-wider">Ranking Tiers</h3>
            <div className="space-y-2">
              {RANKS.map(rank => {
                const isCurrent = rank.name === currentRank.name;
                const isAchieved = gameUser.xp >= rank.xpRequired;
                return (
                  <div key={rank.name} className={`flex items-center gap-3 p-2 rounded-lg ${isCurrent ? 'bg-primary/10 ring-1 ring-primary/30' : ''}`}>
                    <span className="text-base">{rank.icon}</span>
                    <span className={`text-xs font-bold flex-1 ${isAchieved ? 'text-white' : 'text-slate-600'}`}>{rank.name}</span>
                    <span className="text-[9px] font-mono text-slate-500">{rank.xpRequired.toLocaleString()} XP</span>
                    {isCurrent && <span className="text-[8px] font-black text-primary uppercase">Current</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
