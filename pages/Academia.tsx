
import React, { useState } from 'react';

const Academia: React.FC = () => {
  const [activeModule, setActiveModule] = useState(4);

  return (
    <div className="p-8 max-w-[1440px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-widest">
            <span>Courses</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-primary">Advanced Bluffing</span>
          </nav>
          <h1 className="text-3xl font-black tracking-tight text-white font-display">
            Advanced Bluffing: Range Merging
          </h1>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 rounded-lg bg-surface text-sm font-bold border border-border-dark hover:bg-white/5 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">bookmark</span> Save
          </button>
          <button className="px-5 py-2.5 rounded-lg bg-primary text-background font-black text-sm hover:brightness-110 flex items-center gap-2">
            COMPLETE MODULE <span className="material-symbols-outlined text-lg">check_circle</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <div className="relative group aspect-video bg-black rounded-xl overflow-hidden ring-1 ring-white/10 shadow-2xl">
            <img 
              src="https://picsum.photos/seed/pokervideo/1280/720" 
              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-all duration-700" 
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <button className="size-20 bg-primary rounded-full flex items-center justify-center text-background shadow-xl hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-5xl fill-1">play_arrow</span>
              </button>
            </div>
            <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/90 to-transparent">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-xs font-mono text-white">12:45 / 24:30</span>
                <div className="flex-1 h-1.5 bg-white/20 rounded-full relative overflow-hidden">
                  <div className="absolute inset-y-0 left-0 w-1/2 bg-primary rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface p-8 rounded-xl border border-border-dark">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold flex items-center gap-2 text-white font-display">
                <span className="material-symbols-outlined text-primary">psychology</span> Challenge Zone
              </h3>
              <span className="text-[10px] font-bold text-slate-500 bg-background px-3 py-1 rounded-full uppercase tracking-widest">Question 4 of 12</span>
            </div>
            <p className="text-lg font-medium mb-8 text-slate-300">
              The board is <span className="font-mono text-rose-500 font-bold">A♥ J♦ 8♠ 2♣</span>. You're in the hijack with <span className="font-mono text-primary font-bold">K♦ Q♦</span>. Opponent checks. What is the optimal sizing for a range-merging bluff?
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <QuizOption label="A" text="Check back to realize equity" />
              <QuizOption label="B" text="Bet 33% Pot (Small Sizing)" correct />
              <QuizOption label="C" text="Bet 75% Pot (Polarized)" />
              <QuizOption label="D" text="Overbet (1.5x Pot)" />
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-surface rounded-xl border border-border-dark overflow-hidden flex flex-col h-[calc(100vh-200px)] sticky top-24">
            <div className="p-6 border-b border-border-dark">
              <h3 className="font-bold text-lg text-white mb-4">Course Content</h3>
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span className="text-slate-500 uppercase">Progress</span>
                <span className="text-primary">34% Complete</span>
              </div>
              <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                <div className="h-full bg-primary w-1/3"></div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
              <ModuleItem title="Module 1: Foundations" completed />
              <ModuleItem title="Module 4: Advanced Play" active>
                <LessonItem number={1} title="Polarization Concepts" duration="14:20" completed />
                <LessonItem number={2} title="Range Merging Bluffs" duration="NOW PLAYING" active />
                <LessonItem number={3} title="3-Bet Pot Dynamics" duration="22:15" locked />
                <LessonItem number={4} title="Check-Raise Theory" duration="18:40" locked />
              </ModuleItem>
              <ModuleItem title="Module 5: Final Exam" locked />
            </div>
            <div className="p-4 bg-background/50 border-t border-border-dark">
              <button className="w-full py-3 bg-primary text-background font-black text-sm rounded-lg uppercase tracking-widest shadow-lg hover:-translate-y-0.5 transition-all">
                Upgrade to PRO
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const QuizOption = ({ label, text, correct }: any) => (
  <button className={`p-4 text-left rounded-xl border transition-all flex items-center gap-3 ${
    correct 
      ? 'bg-primary/10 border-primary text-white shadow-lg shadow-primary/5' 
      : 'bg-background/50 border-border-dark text-slate-400 hover:border-slate-600'
  }`}>
    <span className={`size-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
      correct ? 'bg-primary text-background' : 'border border-slate-600'
    }`}>{label}</span>
    <span className="font-medium text-sm">{text}</span>
    {correct && <span className="material-symbols-outlined ml-auto text-primary text-lg">check_circle</span>}
  </button>
);

const ModuleItem = ({ title, completed, active, locked, children }: any) => (
  <div className="mb-2">
    <div className={`flex items-center justify-between p-4 rounded-lg transition-all ${
      active ? 'bg-surface border border-border-dark' : 'hover:bg-white/5 opacity-60'
    }`}>
      <span className={`text-xs font-bold uppercase ${active ? 'text-primary' : 'text-slate-300'}`}>{title}</span>
      <span className="material-symbols-outlined text-slate-500 text-lg">
        {completed ? 'check_circle' : locked ? 'lock' : active ? 'expand_less' : 'expand_more'}
      </span>
    </div>
    {active && children && <div className="space-y-1 mt-1 px-1">{children}</div>}
  </div>
);

const LessonItem = ({ number, title, duration, active, completed, locked }: any) => (
  <div className={`flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer ${
    active ? 'bg-primary/10 border-l-4 border-primary' : 'hover:bg-white/5'
  } ${locked ? 'opacity-40' : ''}`}>
    <div className={`size-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
      active ? 'bg-primary text-background' : 'border border-slate-600 text-slate-500'
    }`}>{number}</div>
    <div className="flex-1 min-w-0">
      <p className={`text-sm font-bold truncate ${active ? 'text-primary' : 'text-slate-300'}`}>{title}</p>
      <p className={`text-[9px] uppercase font-bold tracking-widest mt-0.5 ${active ? 'text-primary/70' : 'text-slate-500'}`}>{duration}</p>
    </div>
    {completed && <span className="material-symbols-outlined text-primary text-lg">check_circle</span>}
    {locked && <span className="material-symbols-outlined text-slate-600 text-lg">lock</span>}
  </div>
);

export default Academia;
