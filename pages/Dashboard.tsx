import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState<'1W' | '1M' | '1Y'>('1M');
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const generateHistory = () => {
      const baseBalance = user?.balance || 10000;
      const points = timeframe === '1W' ? 7 : timeframe === '1M' ? 30 : 12;
      const history = [];
      const now = new Date();

      for (let i = points; i >= 0; i--) {
        const date = new Date(now);
        if (timeframe === '1Y') {
          date.setMonth(now.getMonth() - i);
        } else {
          date.setDate(now.getDate() - i);
        }

        history.push({
          name: date.toLocaleDateString(undefined, { month: 'short', day: timeframe === '1Y' ? undefined : 'numeric' }),
          bankroll: Math.floor(baseBalance * (0.8 + Math.random() * 0.4))
        });
      }
      history[history.length - 1].bankroll = baseBalance;
      setChartData(history);
    };

    generateHistory();
  }, [user?.balance, timeframe]);

  return (
    <div className="p-4 md:p-8 max-w-[1440px] mx-auto grid grid-cols-12 gap-4 md:gap-8">
      <div className="col-span-12">
        <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight font-display mb-2">Performance Dashboard</h2>
        <p className="text-sm text-slate-400">Track your progress and analyze your gameplay.</p>
      </div>

      <div className="col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <KPIBox
          title="Current Balance"
          value={`$${user?.balance.toLocaleString()}`}
          trend="+12.5%"
          trendType="positive"
        />
        <KPIBox
          title="Hands Played"
          value="45,802"
          trend="Active"
          trendType="neutral"
        />
        <KPIBox
          title="Win Rate (bb/100)"
          value="8.42"
          trend="+0.4%"
          trendType="positive"
        />
        <KPIBox
          title="Tournament Rank"
          value={user?.rank || '#1,204'}
          trend="14 spots"
          trendType="positive"
        />
      </div>

      <div className="col-span-12 lg:col-span-8 bg-surface border border-border-dark rounded-xl p-4 md:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-lg font-bold text-white">Bankroll Growth</h3>
            <p className="text-xs text-slate-500">Performance over the last {timeframe === '1W' ? 'week' : timeframe === '1M' ? '30 days' : 'year'}</p>
          </div>
          <div className="flex gap-2 bg-background p-1 rounded-lg w-fit">
            {(['1W', '1M', '1Y'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${timeframe === t
                  ? 'bg-surface shadow-sm text-white'
                  : 'text-slate-400 hover:text-white'
                  }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[250px] md:h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorBankroll" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#137fec" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#137fec" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3a47" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a242d', border: '1px solid #2d3a47', borderRadius: '8px' }}
                itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="bankroll" stroke="#137fec" strokeWidth={3} fillOpacity={1} fill="url(#colorBankroll)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-4 space-y-6">
        <div className="bg-surface border border-border-dark rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-white mb-6">Learning Progress</h3>
          <div className="space-y-6">
            <ProgressItem title="GTO Mastery: Pre-Flop" progress={85} color="bg-primary" />
            <ProgressItem title="Mental Game & Tilt Control" progress={42} color="bg-purple-500" />
            <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 mt-6">
              <h4 className="text-sm font-bold text-primary mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">lightbulb</span>
                Daily Study Goal
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">You're only 15 minutes away from your daily goal! Reviewing 10 more hands will improve your stats.</p>
              <button
                onClick={() => navigate('/academia')}
                className="mt-4 w-full bg-primary text-white py-2 rounded-lg text-xs font-bold hover:bg-primary/90"
              >
                Start Review
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const KPIBox = ({ title, value, trend, trendType }: any) => (
  <div className="p-5 rounded-xl bg-surface border border-border-dark shadow-sm">
    <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">{title}</p>
    <p className={`text-2xl font-black mt-2 ${trendType === 'positive' ? 'text-poker-green' : trendType === 'negative' ? 'text-rose-500' : 'text-white'}`}>
      {value}
    </p>
    <div className={`flex items-center gap-1 mt-2 text-[10px] font-bold uppercase tracking-wider ${trendType === 'positive' ? 'text-poker-green' : 'text-slate-400'}`}>
      <span className="material-symbols-outlined text-sm">{trendType === 'positive' ? 'trending_up' : trendType === 'negative' ? 'trending_down' : 'sync'}</span>
      {trend}
    </div>
  </div>
);

const ProgressItem = ({ title, progress, color }: any) => (
  <div>
    <div className="flex justify-between text-sm font-semibold mb-2">
      <span className="text-slate-300">{title}</span>
      <span className="text-white">{progress}%</span>
    </div>
    <div className="w-full bg-background h-2 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${progress}%` }}></div>
    </div>
  </div>
);

export default Dashboard;
